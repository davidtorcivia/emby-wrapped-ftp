<script lang="ts">
    import { onMount } from "svelte";
    import {
        UNICODE,
        getViewingPersonality,
        formatHour,
        formatDay,
    } from "$lib/utils/format";
    import type { UserStats } from "$lib/server/stats";
    import ShareButton from "../ui/ShareButton.svelte";

    export let stats: UserStats;

    let visible = false;
    let phase = 0; // 0=hidden, 1=icon, 2=title, 3=tagline, 4=details

    onMount(() => {
        setTimeout(() => {
            visible = true;
            startNarrative();
        }, 100);
    });

    function startNarrative() {
        const timeline = [
            { phase: 1, delay: 0 }, // Icon appears
            { phase: 2, delay: 400 }, // Title
            { phase: 3, delay: 900 }, // Tagline
            { phase: 4, delay: 1500 }, // Details
        ];

        timeline.forEach(({ phase: p, delay }) => {
            setTimeout(() => {
                phase = p;
            }, delay);
        });
    }

    // Pass all relevant stats for more accurate personality matching
    $: personality = getViewingPersonality({
        isNightOwl: stats.isNightOwl,
        isEarlyBird: stats.isEarlyBird,
        isWeekendWarrior: stats.isWeekendWarrior,
        peakHour: stats.peakHour,
        bingeCount: stats.bingeCount,
        totalMinutes: stats.totalMinutes,
        primaryGenre: stats.primaryGenre,
        primaryGenrePercentage: stats.primaryGenrePercentage,
        secondaryGenre: stats.secondaryGenre,
        genreDiversity: stats.genreDiversity,
        movieToTvRatio: stats.movieToTvRatio,
    });

    $: peakHour = formatHour(stats.peakHour);
    $: peakDay = formatDay(stats.peakDay);
</script>

<div class="card-base" class:visible id="personality-card">
    <div class="share-container">
        <ShareButton
            targetId="personality-card"
            fileName="emby-wrapped-personality.png"
        />
    </div>

    <div class="card-content">
        <!-- Central Icon (now uses personality emoji) -->
        <div class="icon-section" class:show={phase >= 1}>
            <div class="icon-ring">
                <span class="main-icon">{personality.unicode}</span>
            </div>
        </div>

        <!-- Title -->
        <div class="title-section" class:show={phase >= 2}>
            <h2 class="personality-title font-display">{personality.label}</h2>
        </div>

        <!-- Tagline -->
        <div class="tagline-section" class:show={phase >= 3}>
            <p class="tagline">"{personality.tagline}"</p>
        </div>

        <!-- Peak Details -->
        <div class="details-section" class:show={phase >= 4}>
            <div class="detail-row">
                <span class="detail-label">Peak Hour</span>
                <span class="detail-value font-mono">{peakHour}</span>
            </div>
            <div class="detail-divider">{UNICODE.diamond}</div>
            <div class="detail-row">
                <span class="detail-label">Favorite Day</span>
                <span class="detail-value font-mono">{peakDay}</span>
            </div>
        </div>
    </div>
</div>

<style>
    .card-base {
        position: relative;
        width: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 2rem 1.5rem;
        opacity: 0;
        transition: opacity 0.4s ease;
    }

    .card-base.visible {
        opacity: 1;
    }

    .share-container {
        position: absolute;
        top: 1.5rem;
        right: 1.5rem;
        z-index: 50;
    }

    :global(.snapshot-mode) .share-container {
        display: none !important;
    }

    .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        width: 100%;
        max-width: 340px;
    }

    /* Icon Section */
    .icon-section {
        opacity: 0;
        transform: scale(0.5);
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .icon-section.show {
        opacity: 1;
        transform: scale(1);
    }

    .icon-ring {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: linear-gradient(
            135deg,
            rgba(124, 58, 237, 0.2),
            rgba(29, 185, 84, 0.2)
        );
        border: 2px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
            0 0 60px rgba(124, 58, 237, 0.3),
            inset 0 0 30px rgba(29, 185, 84, 0.1);
        animation: pulse-glow 3s ease-in-out infinite;
    }

    @keyframes pulse-glow {
        0%,
        100% {
            box-shadow:
                0 0 60px rgba(124, 58, 237, 0.3),
                inset 0 0 30px rgba(29, 185, 84, 0.1);
        }
        50% {
            box-shadow:
                0 0 80px rgba(124, 58, 237, 0.4),
                inset 0 0 40px rgba(29, 185, 84, 0.2);
        }
    }

    .main-icon {
        font-size: 3.5rem;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    }

    /* Title Section */
    .title-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .title-section.show {
        opacity: 1;
        transform: translateY(0);
    }

    .personality-title {
        font-size: 2rem;
        font-weight: 800;
        color: white;
        margin: 0;
        text-align: center;
        background: linear-gradient(135deg, #ffffff 0%, #a78bfa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    /* Tagline Section */
    .tagline-section {
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.5s ease;
    }

    .tagline-section.show {
        opacity: 1;
        transform: translateY(0);
    }

    .tagline {
        font-size: 1rem;
        font-style: italic;
        color: rgba(255, 255, 255, 0.6);
        text-align: center;
        margin: 0;
        padding: 0 1rem;
        line-height: 1.5;
    }

    /* Details Section */
    .details-section {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        padding: 1rem 1.5rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s ease;
    }

    .details-section.show {
        opacity: 1;
        transform: translateY(0);
    }

    .detail-row {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }

    .detail-label {
        font-size: 0.625rem;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .detail-value {
        font-size: 1rem;
        font-weight: 600;
        color: white;
    }

    .detail-divider {
        font-family: "JetBrains Mono", monospace;
        color: rgba(255, 255, 255, 0.2);
        font-size: 0.75rem;
    }
</style>
