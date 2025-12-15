
import type { RequestHandler } from './$types';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { env } from '$env/dynamic/private';

// Use /tmp for cache to work with read-only filesystem in Docker
const CACHE_DIR = process.env.NODE_ENV === 'production' ? '/tmp/image-cache' : '.cache/images';

// Allowed domains for image proxying (security)
const ALLOWED_DOMAINS = [
    'image.tmdb.org',
    'www.themoviedb.org',
    // Emby server domain will be added dynamically
];

function isAllowedUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        const hostname = url.hostname.toLowerCase();

        // Check static whitelist
        if (ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d))) {
            return true;
        }

        // Check if it's the configured Emby server
        if (env.EMBY_URL) {
            const embyHost = new URL(env.EMBY_URL).hostname.toLowerCase();
            if (hostname === embyHost) {
                return true;
            }
        }

        // Allow local network addresses (192.168.x.x, 10.x.x.x, localhost)
        if (hostname === 'localhost' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            hostname.startsWith('172.16.') ||
            hostname.startsWith('172.17.') ||
            hostname.startsWith('172.18.') ||
            hostname.startsWith('172.19.') ||
            hostname.startsWith('172.2') ||
            hostname.startsWith('172.30.') ||
            hostname.startsWith('172.31.')) {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}

// Ensure cache directory exists
try {
    if (!existsSync(CACHE_DIR)) {
        mkdirSync(CACHE_DIR, { recursive: true });
    }
} catch (e) {
    console.warn('Could not create image cache directory:', e);
}

function getCacheKey(url: string): string {
    return createHash('md5').update(url).digest('hex');
}

function getCachePath(key: string): string {
    return join(CACHE_DIR, key);
}

export const GET: RequestHandler = async ({ url, fetch }) => {
    const imageUrl = url.searchParams.get('url');

    if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    // Security: validate URL is from allowed domain
    if (!isAllowedUrl(imageUrl)) {
        return new Response('Forbidden: URL not in allowed domains', { status: 403 });
    }

    const cacheKey = getCacheKey(imageUrl);
    const cachePath = getCachePath(cacheKey);
    const metaPath = cachePath + '.meta';

    // Check disk cache first
    if (existsSync(cachePath) && existsSync(metaPath)) {
        try {
            const imageBuffer = readFileSync(cachePath);
            const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));

            return new Response(imageBuffer, {
                status: 200,
                headers: {
                    'Content-Type': meta.contentType || 'image/jpeg',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    'Access-Control-Allow-Origin': '*',
                    'X-Cache': 'HIT'
                }
            });
        } catch (e) {
            // Cache read failed, fall through to fetch
        }
    }

    try {
        const response = await fetch(imageUrl);

        if (!response.ok) {
            return new Response('Failed to fetch image', { status: response.status });
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const buffer = Buffer.from(await response.arrayBuffer());

        // Write to disk cache
        try {
            writeFileSync(cachePath, buffer);
            writeFileSync(metaPath, JSON.stringify({ contentType, url: imageUrl }));
        } catch (e) {
            console.error('Failed to write to cache:', e);
        }

        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
                'X-Cache': 'MISS'
            }
        });
    } catch (e) {
        return new Response('Failed to fetch image', { status: 500 });
    }
};
