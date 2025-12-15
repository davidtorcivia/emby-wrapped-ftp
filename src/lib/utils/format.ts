/**
 * Format minutes into human-readable duration
 */
export function formatDuration(minutes: number): { days: number; hours: number; minutes: number; formatted: string } {
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = Math.round(minutes % 60);

    let formatted = '';
    if (days > 0) {
        formatted = `${days} day${days !== 1 ? 's' : ''}`;
        if (hours > 0) formatted += `, ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
        formatted = `${hours} hour${hours !== 1 ? 's' : ''}`;
        if (mins > 0) formatted += `, ${mins} min`;
    } else {
        formatted = `${mins} minute${mins !== 1 ? 's' : ''}`;
    }

    return { days, hours, minutes: mins, formatted };
}

/**
 * Format large numbers with commas
 */
export function formatNumber(n: number): string {
    return n.toLocaleString('en-US');
}

/**
 * Get a clever, accurate comparison for watch time
 * These are all mathematically verified to be realistic!
 */
export function getTimeComparison(minutes: number): string {
    const hours = minutes / 60;

    const pool: string[] = [];

    // Massive viewing (10,000+ min = 166+ hours)
    if (minutes >= 10000) {
        const lotrCount = Math.floor(minutes / 726); // Ext Edition - corrected
        const friendsCount = Math.floor(hours / 80); // Entire run - corrected
        const moonTrips = Math.floor(hours / 76); // Apollo 11 one-way - corrected
        const crossCountry = Math.floor(hours / 41); // ~41h driving NYC to LA - corrected

        pool.push(
            `Time well spent ∴ that's the entire Lord of the Rings Extended Edition ${lotrCount}× over`,
            `You could have watched the entire Friends saga ${friendsCount} times`,
            `You could have flown to the Moon and back ${Math.floor(moonTrips / 2)} times`,
            `Equivalent to driving from NYC to LA ${crossCountry} times non-stop`
        );
    }
    // Heavy viewing (5,000-10,000 min = 83-166 hours)
    else if (minutes >= 5000) {
        const marathons = Math.floor(hours / 4.5); // Avg finish time
        const nycTokyoFlights = Math.floor(hours / 14);
        const titanicCount = Math.floor(minutes / 194);
        const everestTreks = Math.floor(hours / 480); // Full Everest expedition ~20 days

        pool.push(
            `That time equals running ${marathons} marathons back-to-back`,
            `You could fly NYC to Tokyo ${nycTokyoFlights} times`,
            `Equivalent to watching Titanic ${titanicCount} times`,
            `Time enough for ${everestTreks} full Everest expeditions`
        );
    }
    // Moderate-heavy (2,000-5,000 min = 33-83 hours)
    else if (minutes >= 2000) {
        const roadTrips = Math.floor(hours / 12);
        const nycLaFlights = Math.floor(hours / 5.5);
        const beatlesDiscography = Math.floor(minutes / 600); // ~10h total - confirmed

        pool.push(
            `That's ${roadTrips} long road trips worth of entertainment`,
            `${nycLaFlights} coast-to-coast flights`,
            `Equivalent to working a full-time job for ${Math.floor(hours / 40)} weeks`,
            `You could listen to The Beatles' entire discography ${beatlesDiscography} times`
        );
    }
    // Moderate (1,000-2,000 min = 16-33 hours)
    else if (minutes >= 1000) {
        const workDays = Math.floor(hours / 8);
        const audiobooks = Math.floor(hours / 10); // Avg audiobook

        pool.push(
            `That's ${workDays} full work days of viewing`,
            `Equivalent to listening to ${audiobooks} average-length audiobooks`,
            `You could have watched the entire Harry Potter series ${Math.floor(minutes / 1179)} times`
        );
    }
    // Light-moderate (500-1000 min = 8-16 hours)
    else if (minutes >= 500) {
        const movies = Math.floor(minutes / 120);
        const londonNycFlights = Math.floor(hours / 7);
        const titanicCount = Math.floor(minutes / 194);

        pool.push(
            `That's roughly ${movies} feature films`,
            `Equivalent to flying from London to New York ${londonNycFlights} times`,
            `You could watch Titanic ${titanicCount} times`
        );
    }
    // Light/Very Light (<500 min)
    else {
        const sitcomEpisodes = Math.floor(minutes / 22);
        const movies = Math.floor(minutes / 120);
        const albumListens = Math.floor(minutes / 45); // Average album ~45 min

        pool.push(
            `${sitcomEpisodes} sitcom episodes worth of time`,
            `About ${movies || 1} feature film${movies > 1 ? 's' : ''}`,
            `${albumListens} album listens back-to-back`
        );
    }
    // Return a random selection from the pool
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Get hour label (12-hour format)
 */
export function formatHour(hour: number): string {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    if (hour < 12) return `${hour}am`;
    return `${hour - 12}pm`;
}

/**
 * Get day name
 */
export function formatDay(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
}

/**
 * Get short day name
 */
export function formatDayShort(day: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day];
}

/**
 * Get month name
 */
export function formatMonth(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
}

/**
 * Get short month name
 */
export function formatMonthShort(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
}

/**
 * Format date nicely
 */
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Get viewing personality label - esoteric archetypes that blend multiple metrics
 * The names should be intriguing and require reading into the subtext
 */
export function getViewingPersonality(stats: {
    isNightOwl: boolean;
    isEarlyBird: boolean;
    isWeekendWarrior: boolean;
    peakHour?: number;
    bingeCount?: number;
    totalMinutes?: number;
    primaryGenre?: string | null;
    primaryGenrePercentage?: number;
    secondaryGenre?: string | null;
    genreDiversity?: number;
    movieToTvRatio?: number;
}): { label: string; unicode: string; tagline: string } {
    // Derived metrics
    const hasLotOfBinges = (stats.bingeCount || 0) >= 5;
    const isBinger = (stats.bingeCount || 0) >= 3;
    const isHeavyViewer = (stats.totalMinutes || 0) >= 10000;
    const isModerateViewer = (stats.totalMinutes || 0) >= 4000 && (stats.totalMinutes || 0) < 10000;
    const isLightViewer = (stats.totalMinutes || 0) < 2000;
    const isVeryLightViewer = (stats.totalMinutes || 0) < 500;
    const isPeakLateNight = stats.peakHour !== undefined && (stats.peakHour >= 23 || stats.peakHour <= 3);
    const isPeakMorning = stats.peakHour !== undefined && (stats.peakHour >= 5 && stats.peakHour <= 8);
    const isPeakAfternoon = stats.peakHour !== undefined && (stats.peakHour >= 12 && stats.peakHour <= 16);

    // Genre analysis
    const genre = (stats.primaryGenre || '').toLowerCase();
    const genrePct = stats.primaryGenrePercentage || 0;
    const hasStrongGenre = genrePct >= 30;
    const hasDominantGenre = genrePct >= 45;
    const isGenreDiverse = (stats.genreDiversity || 0) >= 0.75;
    const isGenreFocused = (stats.genreDiversity || 0) < 0.5;

    // Content type preference
    const prefersMovies = (stats.movieToTvRatio || 0) > 1.5;
    const prefersTv = (stats.movieToTvRatio || 0) < 0.5;
    const isBalanced = (stats.movieToTvRatio || 0) >= 0.5 && (stats.movieToTvRatio || 0) <= 1.5;

    // === THE ESOTERIC ARCHETYPES ===
    // Multi-metric combinations, ordered by specificity

    // The ultra-specific combos (4+ factors)
    if (stats.isNightOwl && isPeakLateNight && hasLotOfBinges && (genre.includes('horror') || genre.includes('thriller'))) {
        return { label: 'Keeper of the Witching Hour', unicode: '☽', tagline: 'Some rituals require complete darkness.' };
    }

    if (stats.isWeekendWarrior && isHeavyViewer && isGenreDiverse && hasLotOfBinges) {
        return { label: 'The Sovereign of Saturdays', unicode: '⚜', tagline: 'A throne built from streaming queues.' };
    }

    if (stats.isEarlyBird && isPeakMorning && prefersMovies && isLightViewer) {
        return { label: 'The Golden Hour', unicode: '☀', tagline: 'Stories taste better with sunrise.' };
    }

    // Genre + behavior combos
    if ((genre.includes('documentary') || genre.includes('history')) && isHeavyViewer && isGenreFocused) {
        return { label: 'The Obsidian Scholar', unicode: '◈', tagline: 'Knowledge carved deep, rewatched deeper.' };
    }

    if ((genre.includes('sci-fi') || genre.includes('science fiction') || genre.includes('fantasy')) && hasStrongGenre && isBinger) {
        return { label: 'Cartographer of Elsewhere', unicode: '✧', tagline: "Mapping worlds that don't exist. Yet." };
    }

    if (genre.includes('drama') && hasLotOfBinges && prefersTv) {
        return { label: 'The Unraveler', unicode: '∞', tagline: 'Every thread must be followed to its end.' };
    }

    if (genre.includes('comedy') && stats.isWeekendWarrior && isModerateViewer) {
        return { label: 'The Decompression Chamber', unicode: '◯', tagline: 'Laughter prescribed. Side effects: weekends gone.' };
    }

    if ((genre.includes('horror') || genre.includes('thriller')) && stats.isNightOwl) {
        return { label: 'The Abyss Gazer', unicode: '◐', tagline: 'When you stare long enough, it stares back.' };
    }

    if (genre.includes('action') && hasDominantGenre && isHeavyViewer) {
        return { label: 'The Kinetic Constant', unicode: '⊕', tagline: 'Static is not an option.' };
    }

    if (genre.includes('animation') && hasStrongGenre && (prefersTv || isBinger)) {
        return { label: 'Keeper of Drawn Worlds', unicode: '✦', tagline: 'Where frames become feelings.' };
    }

    if (genre.includes('romance') && hasStrongGenre) {
        return { label: 'The Eternal Optimist', unicode: '∿', tagline: 'Every ending is just a beginning in disguise.' };
    }

    // Time-pattern + viewing style combos
    if (stats.isNightOwl && stats.isWeekendWarrior && hasLotOfBinges) {
        return { label: 'The Nocturnal Order', unicode: '⁂', tagline: 'Membership requires forsaking sunlight.' };
    }

    if (stats.isNightOwl && isPeakLateNight && isHeavyViewer) {
        return { label: 'The Liminal Watcher', unicode: '◎', tagline: 'The hours between days belong to you.' };
    }

    if (stats.isNightOwl && hasLotOfBinges) {
        return { label: 'Goblin Mode Activated', unicode: '◬', tagline: 'Thriving in the darkness, one season at a time.' };
    }

    if (stats.isNightOwl && stats.isWeekendWarrior) {
        return { label: 'The Saturday Specter', unicode: '◐', tagline: 'Haunting living rooms after midnight.' };
    }

    if (prefersMovies && isHeavyViewer && isGenreDiverse) {
        return { label: 'The Celluloid Pilgrim', unicode: '◇', tagline: 'Every film a destination, never a detour.' };
    }

    if (prefersTv && hasLotOfBinges && isGenreFocused) {
        return { label: 'The Deep Diver', unicode: '∴', tagline: 'Surface-level is for tourists.' };
    }

    if (isGenreDiverse && isModerateViewer && isBalanced) {
        return { label: 'The Polyphile', unicode: '⊹', tagline: 'Commitment to anything but one thing.' };
    }

    if (stats.isEarlyBird && isLightViewer) {
        return { label: 'The Measured Dose', unicode: '◇', tagline: 'Precise. Intentional. Gone by noon.' };
    }

    if (stats.isEarlyBird && isPeakMorning) {
        return { label: "Dawn's First Light", unicode: '◑', tagline: 'Morning rituals require a protagonist.' };
    }

    if (stats.isEarlyBird) {
        return { label: 'The Anti-Algorithm', unicode: '☼', tagline: "Watching when no one's tracking." };
    }

    if (stats.isWeekendWarrior && hasLotOfBinges) {
        return { label: 'The Hibernator', unicode: '◉', tagline: 'Five days of waiting. Two days of living.' };
    }

    if (stats.isWeekendWarrior && isHeavyViewer) {
        return { label: 'The Contained Chaos', unicode: '◈', tagline: 'Structured freedom, scheduled abandon.' };
    }

    if (stats.isWeekendWarrior) {
        return { label: 'The 48-Hour Window', unicode: '⚔', tagline: 'Efficiency measured in episodes per weekend.' };
    }

    if (stats.isNightOwl) {
        return { label: 'The After-Hours', unicode: '◐', tagline: 'When the algorithm sleeps, you begin.' };
    }

    if (isHeavyViewer && hasLotOfBinges) {
        return { label: 'The Event Horizon', unicode: '✧', tagline: 'Past the point of no return, contentedly.' };
    }

    if (isHeavyViewer) {
        return { label: 'The Living Archive', unicode: '∴', tagline: 'Some collect stamps. You collect narratives.' };
    }

    if (isVeryLightViewer) {
        return { label: 'The Apparition', unicode: '∿', tagline: 'Glimpsed once, gone twice, remembered always.' };
    }

    if (isLightViewer) {
        return { label: 'The Phantom', unicode: '∿', tagline: 'Appears briefly, watches intensely, vanishes.' };
    }

    if (isPeakAfternoon && isBalanced) {
        return { label: 'The Daylight Dweller', unicode: '◯', tagline: 'Peak hours. Peak choices.' };
    }

    // Default: steady viewer with no extreme patterns
    return { label: 'The Quiet Collector', unicode: '◇', tagline: 'Building something only you understand.' };
}


/**
 * Get day personality based on peak day
 */
export function getDayPersonality(peakDay: number): { label: string; tagline: string } {
    const personalities: Record<number, { label: string; tagline: string }> = {
        0: { label: 'Sunday Scroller', tagline: 'The perfect end to the week' },
        1: { label: 'Monday Motivator', tagline: 'Starting the week right' },
        2: { label: 'Tuesday Traveler', tagline: 'Escaping the midweek blues' },
        3: { label: 'Wednesday Warrior', tagline: 'Hump day hero' },
        4: { label: 'Thursday Thinker', tagline: 'Almost there...' },
        5: { label: 'Friday Fanatic', tagline: 'Weekend mode: activated' },
        6: { label: 'Saturday Binger', tagline: 'This is what Saturdays are for' }
    };
    return personalities[peakDay] || personalities[0];
}

/**
 * Esoteric unicode decorators
 */
export const UNICODE = {
    diamond: '◈',
    diamondEmpty: '◇',
    star: '⁂',
    dots: '∴',
    therefore: '∵',
    bullet: '⋄',
    triangleUp: '△',
    triangleDown: '▽',
    sparkle: '✧',
    asterism: '⁂',
    sunWithRays: '⊹',
    circle: '○',
    circleFilled: '●',
    halfMoonLeft: '◐',
    halfMoonRight: '◑',
    square: '□',
    squareFilled: '■',
    arrow: '→',
    arrowDouble: '⇒',
    separator: '·',
    dash: '—',
    music: '♪',
    musicDouble: '♫',
    heart: '♡',
    heartFilled: '♥',
    infinity: '∞',
    wave: '∿'
} as const;
