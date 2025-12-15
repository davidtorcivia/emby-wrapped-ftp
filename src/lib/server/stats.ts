import { emby, type PlaybackActivity, type EmbyItem } from './emby';

export interface TopItem {
    id: string;
    name: string;
    imageUrl: string;
    tmdbImageUrl?: string;  // TMDB fallback
    minutes: number;
    count: number;
    // For shows
    episodes?: number;
    seriesId?: string;
}

export interface GenreStat {
    name: string;
    minutes: number;
    percentage: number;
}

export interface HeatmapData {
    hours: number[];   // 24 values (0-23)
    days: number[];    // 7 values (Sun-Sat)
    months: number[];  // 12 values (Jan-Dec)
}

export interface BingeSession {
    showName: string;
    showId: string;
    episodeCount: number;
    startTime: string;
    endTime: string;
    totalMinutes: number;
}

export interface MusicStats {
    totalMinutes: number;
    trackCount: number;
    topArtists: { name: string; minutes: number; count: number }[];
    topAlbums: { name: string; artist: string; minutes: number }[];
}

export interface UserStats {
    userId: string;
    username: string;
    year: number;
    generatedAt: string;

    // Time stats
    totalMinutes: number;
    totalDays: number;

    // Content counts
    moviesWatched: number;
    episodesWatched: number;
    uniqueShows: number;
    uniqueMovies: number;

    // Top content
    topMovies: TopItem[];
    topShows: TopItem[];
    topGenres: GenreStat[];
    totalGenresExplored: number;  // Total count before slicing to top 8

    // Temporal patterns
    heatmap: HeatmapData;
    peakHour: number;
    peakDay: number;
    peakMonth: number;

    // Viewing personality
    isNightOwl: boolean;   // Most viewing 9pm-3am
    isEarlyBird: boolean;  // Most viewing 5am-10am
    isWeekendWarrior: boolean; // Weekend > weekday viewing

    // Streaks and binges
    longestBinge: BingeSession | null;
    bingeCount: number;  // Number of 3+ episode sessions

    // First and last
    firstWatch: { id: string; name: string; date: string; type: string } | null;
    lastWatch: { id: string; name: string; date: string; type: string } | null;

    // Music (optional)
    music?: MusicStats;

    // Primary genre for personality (most watched)
    primaryGenre: string | null;
    primaryGenrePercentage: number;
    secondaryGenre: string | null;

    // Diversity and preference ratios
    genreDiversity: number;  // 0-1, higher = more diverse viewing
    movieToTvRatio: number;  // >1 = prefers movies, <1 = prefers TV
}

/**
 * Parse datetime from date + time strings
 */
function parseDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}`);
}

/**
 * Aggregate playback data into user stats
 */
export async function aggregateUserStats(userId: string, username: string, year: number = 2025): Promise<UserStats> {
    // Fetch user playback activity
    const allActivity = await emby.getUserPlaybackActivity(userId, 365);

    // Separate video and audio content
    const videoActivity = allActivity.filter(a => {
        if (!a.date.startsWith(String(year))) return false;
        const itemType = a.item_type.toLowerCase();
        // Exclude music and audio from video stats
        return itemType !== 'audio' && itemType !== 'musicvideo';
    });

    const audioActivity = allActivity.filter(a => {
        if (!a.date.startsWith(String(year))) return false;
        const itemType = a.item_type.toLowerCase();
        return itemType === 'audio';
    });

    // Calculate total time (duration is in seconds)
    const totalMinutes = Math.round(videoActivity.reduce((sum, a) => sum + parseInt(a.duration || '0', 10), 0) / 60);
    const totalDays = Math.round(totalMinutes / 1440 * 100) / 100;

    // Count by type
    const movies = videoActivity.filter(a => a.item_type.toLowerCase() === 'movie');
    const episodes = videoActivity.filter(a => a.item_type.toLowerCase() === 'episode');

    // Get unique items
    const uniqueMovieIds = new Set(movies.map(m => String(m.item_id)));
    const uniqueShowIds = new Set<string>();

    // Aggregate by item for top lists
    const movieStats = new Map<string, { minutes: number; count: number; name: string }>();
    const showStats = new Map<string, { minutes: number; count: number; name: string; episodes: Set<string>; seriesId?: string }>();
    const genreMinutes = new Map<string, number>();

    // Collect all unique item IDs we need to fetch details for
    const allItemIds = new Set<string>();
    videoActivity.forEach(a => allItemIds.add(String(a.item_id)));

    // Fetch item details for ALL items (for correct images)
    const itemDetails = new Map<string, EmbyItem>();
    const itemIdList = [...allItemIds];

    try {
        // Batch fetch items in chunks of 50
        for (let i = 0; i < Math.min(itemIdList.length, 200); i += 50) {
            const batch = itemIdList.slice(i, i + 50);
            const items = await emby.getItems(userId, batch);
            items.forEach(item => itemDetails.set(item.Id, item));
        }
    } catch (e) {
        console.warn('Failed to fetch item details:', e);
    }

    // Process each activity
    for (const activity of videoActivity) {
        const itemId = String(activity.item_id);
        const item = itemDetails.get(itemId);
        const minutes = parseInt(activity.duration || '0', 10) / 60;
        const itemType = activity.item_type.toLowerCase();

        if (itemType === 'movie') {
            const existing = movieStats.get(itemId) || { minutes: 0, count: 0, name: activity.item_name };
            existing.minutes += minutes;
            existing.count += 1;
            movieStats.set(itemId, existing);

            // Genres
            if (item?.Genres) {
                for (const genre of item.Genres) {
                    genreMinutes.set(genre, (genreMinutes.get(genre) || 0) + minutes);
                }
            }
        } else if (itemType === 'episode') {
            // Extract show name from "Show Name - sXXeXX - Episode Title" format
            const showName = activity.item_name.split(' - ')[0] || activity.item_name;
            const showId = item?.SeriesId || showName.toLowerCase().replace(/\s+/g, '_');
            uniqueShowIds.add(showId);

            const existing = showStats.get(showId) || {
                minutes: 0,
                count: 0,
                name: item?.SeriesName || showName,
                episodes: new Set(),
                seriesId: item?.SeriesId
            };
            existing.minutes += minutes;
            existing.count += 1;
            existing.episodes.add(itemId);
            // Update seriesId if we find it
            if (item?.SeriesId && !existing.seriesId) {
                existing.seriesId = item.SeriesId;
            }
            showStats.set(showId, existing);

            // Genres from show
            if (item?.Genres) {
                for (const genre of item.Genres) {
                    genreMinutes.set(genre, (genreMinutes.get(genre) || 0) + minutes);
                }
            }
        }
    }

    // Build top movies list - SORTED BY MINUTES (time watched), not play count
    const topMovies: TopItem[] = [...movieStats.entries()]
        .sort((a, b) => b[1].minutes - a[1].minutes)
        .slice(0, 10)
        .map(([id, stats]) => ({
            id,
            name: stats.name,
            imageUrl: emby.getImageUrl(id, 'Primary', 400),
            minutes: Math.round(stats.minutes),
            count: stats.count
        }));

    // Build top shows list - use SeriesId for image
    const topShows: TopItem[] = [...showStats.entries()]
        .sort((a, b) => b[1].minutes - a[1].minutes)
        .slice(0, 10)
        .map(([id, stats]) => {
            // Use the stored seriesId if available, otherwise try to find one
            let imageId = stats.seriesId;
            if (!imageId) {
                // Try to find a real series ID from item details
                const episodeWithSeriesId = [...itemDetails.values()].find(
                    item => (item.SeriesName === stats.name || item.SeriesId === id) && item.SeriesId
                );
                imageId = episodeWithSeriesId?.SeriesId || id;
            }

            return {
                id,
                name: stats.name,
                imageUrl: emby.getImageUrl(imageId, 'Primary', 400),
                minutes: Math.round(stats.minutes),
                count: stats.count,
                episodes: stats.episodes.size,
                seriesId: imageId
            };
        });

    // Build genre stats - show AT LEAST 5 genres (topGenres is for display, totalGenresExplored is for stats)
    const totalGenresExplored = genreMinutes.size;
    const totalGenreMinutes = [...genreMinutes.values()].reduce((a, b) => a + b, 0) || 1;
    const topGenres: GenreStat[] = [...genreMinutes.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, Math.max(5, Math.min(8, genreMinutes.size)))  // At least 5, up to 8
        .map(([name, minutes]) => ({
            name,
            minutes: Math.round(minutes),
            percentage: Math.round((minutes / totalGenreMinutes) * 100)
        }));

    // Calculate heatmaps
    const hours = new Array(24).fill(0);
    const days = new Array(7).fill(0);
    const months = new Array(12).fill(0);

    for (const activity of videoActivity) {
        const date = parseDateTime(activity.date, activity.time);
        const minutes = parseInt(activity.duration || '0', 10) / 60;

        hours[date.getHours()] += minutes;
        days[date.getDay()] += minutes;
        months[date.getMonth()] += minutes;
    }

    // Find peaks
    const peakHour = hours.indexOf(Math.max(...hours));
    const peakDay = days.indexOf(Math.max(...days));
    const peakMonth = months.indexOf(Math.max(...months));

    // Viewing personality
    const nightMinutes = hours.slice(21, 24).reduce((a, b) => a + b, 0) + hours.slice(0, 3).reduce((a, b) => a + b, 0);
    const morningMinutes = hours.slice(5, 10).reduce((a, b) => a + b, 0);
    const weekendMinutes = days[0] + days[6];
    const weekdayMinutes = days.slice(1, 6).reduce((a, b) => a + b, 0);

    const isNightOwl = totalMinutes > 0 && nightMinutes > totalMinutes * 0.3;
    const isEarlyBird = totalMinutes > 0 && morningMinutes > totalMinutes * 0.25;
    const isWeekendWarrior = weekdayMinutes > 0 && weekendMinutes > weekdayMinutes * (2 / 5) * 1.5;

    // FIXED: Detect binge sessions - group consecutive same-show episodes within reasonable time windows
    // A binge is 3+ UNIQUE episodes of the SAME show watched within a single day/session

    // First, group all episodes by date and show
    const episodesByDateAndShow = new Map<string, PlaybackActivity[]>();

    for (const ep of episodes) {
        const showName = ep.item_name.split(' - ')[0] || ep.item_name;
        const showId = showName.toLowerCase().replace(/\s+/g, '_');
        const dateKey = `${ep.date}|${showId}`;

        if (!episodesByDateAndShow.has(dateKey)) {
            episodesByDateAndShow.set(dateKey, []);
        }
        episodesByDateAndShow.get(dateKey)!.push(ep);
    }

    const bingeSessions: BingeSession[] = [];

    for (const [key, eps] of episodesByDateAndShow.entries()) {
        const showId = key.split('|')[1];
        const showName = eps[0].item_name.split(' - ')[0] || eps[0].item_name;

        // Get unique episodes by item_id (same episode watched multiple times doesn't count)
        const uniqueEpisodes = [...new Map(eps.map(e => [e.item_id, e])).values()];

        // Need at least 3 unique episodes to be a binge
        if (uniqueEpisodes.length < 3) continue;

        // Sort by time
        uniqueEpisodes.sort((a, b) => {
            const timeA = parseDateTime(a.date, a.time).getTime();
            const timeB = parseDateTime(b.date, b.time).getTime();
            return timeA - timeB;
        });

        // Calculate total duration
        const totalSeconds = uniqueEpisodes.reduce((sum, e) => sum + parseInt(e.duration || '0', 10), 0);
        const totalMinutes = Math.round(totalSeconds / 60);

        // Sanity check: average at least 10 minutes per episode (shortest episodes are ~10-15 min)
        const avgMinutesPerEp = totalMinutes / uniqueEpisodes.length;
        if (avgMinutesPerEp < 10) continue;

        const firstEp = uniqueEpisodes[0];
        const lastEp = uniqueEpisodes[uniqueEpisodes.length - 1];

        bingeSessions.push({
            showName,
            showId,
            episodeCount: uniqueEpisodes.length,
            startTime: `${firstEp.date}T${firstEp.time}`,
            endTime: `${lastEp.date}T${lastEp.time}`,
            totalMinutes
        });
    }

    // Find longest binge by episode count, with sanity check
    const longestBinge = bingeSessions.length > 0
        ? bingeSessions
            .filter(b => b.episodeCount <= 20)  // Max 20 episodes in one session (sanity cap)
            .sort((a, b) => b.episodeCount - a.episodeCount)[0] || null
        : null;

    // First and last watch
    const sortedActivity = [...videoActivity].sort((a, b) => {
        const dateA = parseDateTime(a.date, a.time);
        const dateB = parseDateTime(b.date, b.time);
        return dateA.getTime() - dateB.getTime();
    });

    const firstWatch = sortedActivity.length > 0 ? {
        id: String(sortedActivity[0].item_id),
        name: sortedActivity[0].item_name,
        date: sortedActivity[0].date,
        type: sortedActivity[0].item_type
    } : null;

    const lastWatch = sortedActivity.length > 0 ? {
        id: String(sortedActivity[sortedActivity.length - 1].item_id),
        name: sortedActivity[sortedActivity.length - 1].item_name,
        date: sortedActivity[sortedActivity.length - 1].date,
        type: sortedActivity[sortedActivity.length - 1].item_type
    } : null;

    // Process music stats if available
    let musicStats: MusicStats | undefined;
    if (audioActivity.length > 0) {
        const musicMinutes = Math.round(audioActivity.reduce((sum, a) => sum + parseInt(a.duration || '0', 10), 0) / 60);

        // Aggregate by artist (extracted from item name patterns)
        const artistMinutes = new Map<string, { minutes: number; count: number }>();

        for (const track of audioActivity) {
            // Try to extract artist from "Artist - Song" format
            const parts = track.item_name.split(' - ');
            const artist = parts.length > 1 ? parts[0] : 'Unknown Artist';
            const minutes = parseInt(track.duration || '0', 10) / 60;

            const existing = artistMinutes.get(artist) || { minutes: 0, count: 0 };
            existing.minutes += minutes;
            existing.count += 1;
            artistMinutes.set(artist, existing);
        }

        const topArtists = [...artistMinutes.entries()]
            .sort((a, b) => b[1].minutes - a[1].minutes)
            .slice(0, 5)
            .map(([name, stats]) => ({ name, minutes: Math.round(stats.minutes), count: stats.count }));

        musicStats = {
            totalMinutes: musicMinutes,
            trackCount: audioActivity.length,
            topArtists,
            topAlbums: [] // Would need more complex parsing
        };
    }

    return {
        userId,
        username,
        year,
        generatedAt: new Date().toISOString(),
        totalMinutes,
        totalDays,
        moviesWatched: uniqueMovieIds.size,
        episodesWatched: episodes.length,
        uniqueShows: uniqueShowIds.size,
        uniqueMovies: uniqueMovieIds.size,
        topMovies,
        topShows,
        topGenres,
        totalGenresExplored,
        heatmap: {
            hours: hours.map(h => Math.round(h)),
            days: days.map(d => Math.round(d)),
            months: months.map(m => Math.round(m))
        },
        peakHour,
        peakDay,
        peakMonth,
        isNightOwl,
        isEarlyBird,
        isWeekendWarrior,
        longestBinge,
        bingeCount: bingeSessions.length,
        firstWatch,
        lastWatch,
        music: musicStats,
        primaryGenre: topGenres.length > 0 ? topGenres[0].name : null,
        primaryGenrePercentage: topGenres.length > 0 ? topGenres[0].percentage : 0,
        secondaryGenre: topGenres.length > 1 ? topGenres[1].name : null,
        // Genre diversity: 1 - (concentration). High if viewing spread across many genres
        genreDiversity: topGenres.length > 0
            ? 1 - (topGenres.reduce((sum, g) => sum + Math.pow(g.percentage / 100, 2), 0))
            : 0,
        // Movie to TV ratio: minutes in movies vs episodes
        movieToTvRatio: episodes.length > 0
            ? (movies.reduce((sum, m) => sum + parseInt(m.duration || '0', 10), 0) / 60) /
            Math.max(1, episodes.reduce((sum, e) => sum + parseInt(e.duration || '0', 10), 0) / 60)
            : uniqueMovieIds.size > 0 ? 10 : 0  // Movie-only viewer
    };
}
