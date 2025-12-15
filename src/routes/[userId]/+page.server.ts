import { error } from '@sveltejs/kit';
import { emby } from '$lib/server/emby';
import { tmdb } from '$lib/server/tmdb';
import { aggregateUserStats, type UserStats, type TopItem } from '$lib/server/stats';
import type { PageServerLoad } from './$types';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Use /tmp for cache in production (Docker read-only filesystem)
const STATS_CACHE_DIR = process.env.NODE_ENV === 'production' ? '/tmp/stats-cache' : '.cache/stats';
const STATS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Ensure cache directory exists
try {
    if (!existsSync(STATS_CACHE_DIR)) {
        mkdirSync(STATS_CACHE_DIR, { recursive: true });
    }
} catch (e) {
    console.warn('Could not create stats cache directory:', e);
}

interface CachedStats {
    stats: UserStats;
    timestamp: number;
}

function getCachedStats(userId: string): UserStats | null {
    const cachePath = join(STATS_CACHE_DIR, `${userId}.json`);
    if (!existsSync(cachePath)) return null;

    try {
        const cached: CachedStats = JSON.parse(readFileSync(cachePath, 'utf-8'));
        const age = Date.now() - cached.timestamp;

        if (age < STATS_CACHE_TTL_MS) {
            return cached.stats;
        }
    } catch {
        // Cache read failed
    }
    return null;
}

function setCachedStats(userId: string, stats: UserStats): void {
    const cachePath = join(STATS_CACHE_DIR, `${userId}.json`);
    try {
        const cached: CachedStats = { stats, timestamp: Date.now() };
        writeFileSync(cachePath, JSON.stringify(cached));
    } catch {
        // Cache write failed, continue without caching
    }
}

/**
 * Check if an ID looks like a valid Emby UUID (not a slug)
 */
function isValidEmbyId(id: string): boolean {
    return /^[0-9a-f]{32}$/i.test(id);
}

/**
 * Enhance images for top items - use TMDB when Emby ID is invalid
 */
async function enhanceTopItemImages(items: TopItem[], type: 'show' | 'movie'): Promise<TopItem[]> {
    const enhanced = await Promise.all(items.map(async (item) => {
        const hasValidEmbyId = isValidEmbyId(item.id) || (item.seriesId && isValidEmbyId(item.seriesId));

        if (!hasValidEmbyId) {
            try {
                const tmdbUrl = await tmdb.findPosterUrl(item.name, type === 'show' ? 'tv' : 'movie');
                if (tmdbUrl) {
                    return {
                        ...item,
                        imageUrl: tmdbUrl,
                        tmdbImageUrl: tmdbUrl
                    };
                }
            } catch {
                // TMDB lookup failed, keep original
            }
        } else {
            try {
                const tmdbUrl = await tmdb.findPosterUrl(item.name, type === 'show' ? 'tv' : 'movie');
                if (tmdbUrl) {
                    return {
                        ...item,
                        tmdbImageUrl: tmdbUrl
                    };
                }
            } catch {
                // Silently fail
            }
        }
        return item;
    }));

    return enhanced;
}

export const load: PageServerLoad = async ({ params }) => {
    const { userId } = params;

    try {
        const users = await emby.getUsers();
        const user = users.find(u => u.Id === userId);

        if (!user) {
            throw error(404, 'User not found');
        }

        // Check cache first
        let stats = getCachedStats(userId);

        if (!stats) {
            // Cache miss - compute stats
            stats = await aggregateUserStats(userId, user.Name, 2025);

            // Enhance images with TMDB fallbacks
            const [enhancedShows, enhancedMovies] = await Promise.all([
                enhanceTopItemImages(stats.topShows, 'show'),
                enhanceTopItemImages(stats.topMovies, 'movie')
            ]);

            stats = {
                ...stats,
                topShows: enhancedShows,
                topMovies: enhancedMovies
            };

            // Save to cache
            setCachedStats(userId, stats);
        }

        const rawUserImageUrl = user.PrimaryImageTag
            ? emby.getUserImageUrl(userId)
            : null;

        // Proxy the image to avoid Local Network Access browser restrictions
        const userImageUrl = rawUserImageUrl
            ? `/api/proxy-image?url=${encodeURIComponent(rawUserImageUrl)}`
            : null;

        return {
            stats,
            userImageUrl,
            serverName: 'Emby for the People'
        };
    } catch (e) {
        if ((e as { status?: number }).status === 404) {
            throw e;
        }

        throw error(500, 'Failed to load your wrapped data');
    }
};
