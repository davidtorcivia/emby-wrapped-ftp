<script lang="ts">
	import { onMount } from "svelte";
	import { UNICODE, formatDuration } from "$lib/utils/format";
	import ShareButton from "../ui/ShareButton.svelte";
	import type { TopItem } from "$lib/server/stats";

	export let items: TopItem[];
	export let title: string;
	export let type: "movies" | "shows";
	export let totalCount: number = 0;

	let visible = false;
	let phase = 0;
	let imageErrors: Set<string> = new Set();
	let usingFallback: Set<string> = new Set();

	onMount(() => {
		setTimeout(() => {
			visible = true;
			startReveal();
		}, 100);
	});

	function startReveal() {
		// Phase 1: Title
		// Phase 2: #1 Hero
		// Phase 3: #2 & #3
		// Phase 4: #4 & #5
		// Phase 5: Stats
		const timeline = [
			{ phase: 1, delay: 0 },
			{ phase: 2, delay: 600 },
			{ phase: 3, delay: 1200 },
			{ phase: 4, delay: 1800 },
			{ phase: 5, delay: 2400 },
		];

		timeline.forEach(({ phase: p, delay }) => {
			setTimeout(() => {
				phase = p;
			}, delay);
		});
	}

	$: topFive = items.slice(0, 5);
	$: displayCount = totalCount > 0 ? totalCount : items.length;

	function getGradientFromName(name: string): string {
		let hash = 0;
		for (let i = 0; i < name.length; i++) {
			hash = name.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue1 = Math.abs(hash % 360);
		const hue2 = (hue1 + 40) % 360;
		return `linear-gradient(135deg, hsl(${hue1}, 60%, 30%) 0%, hsl(${hue2}, 50%, 20%) 100%)`;
	}

	function handleImageError(item: TopItem) {
		if (!usingFallback.has(item.id)) {
			usingFallback = new Set([...usingFallback, item.id]);
		} else {
			imageErrors = new Set([...imageErrors, item.id]);
		}
	}

	function getImageUrl(item: TopItem): string {
		let url = item.imageUrl;
		if (usingFallback.has(item.id)) {
			if (item.tmdbImageUrl && item.imageUrl !== item.tmdbImageUrl) {
				url = item.imageUrl; // Retry/fallback logic (kept simple for now)
			}
		}
		if (item.tmdbImageUrl) {
			url = item.tmdbImageUrl;
		} else {
			url = item.imageUrl;
		}

		// Use our local proxy to cache the image and fix CORS
		return `/api/proxy-image?url=${encodeURIComponent(url)}`;
	}
</script>

<div class="card-base {type}" class:visible id="top5-card">
	<!-- Floating Particles Background -->
	<div class="bg-particles">
		{#each Array(6) as _, i}
			<div
				class="particle"
				style="--x: {Math.random() * 100}%; --y: {Math.random() *
					100}%; --delay: -{Math.random() * 5}s; --duration: {15 +
					Math.random() * 10}s"
			></div>
		{/each}
	</div>

	{#if visible}
		<div class="share-container">
			<ShareButton
				targetId="top5-card"
				fileName="emby-wrapped-top5-{type}.png"
			/>
		</div>
	{/if}

	<div class="content">
		<!-- Title Section -->
		<div class="header-section" class:show={phase >= 1}>
			<div class="overline">
				<span class="unicode">{UNICODE.diamond}</span>
				<span>TOP {type === "movies" ? "FILMS" : "SERIES"}</span>
				<span class="unicode">{UNICODE.diamond}</span>
			</div>
			<h2 class="main-title font-display">{title}</h2>
		</div>

		<div class="posters-grid">
			<!-- Rank #1 Hero -->
			{#if topFive[0]}
				{@const item = topFive[0]}
				<div class="hero-item" class:show={phase >= 2}>
					<div class="hero-rank">1</div>
					<div class="hero-poster-wrap">
						{#if !imageErrors.has(item.id)}
							<img
								src={getImageUrl(item)}
								alt={item.name}
								class="hero-poster"
								on:error={() => handleImageError(item)}
							/>
						{:else}
							<div
								class="poster-fallback"
								style="background: {getGradientFromName(
									item.name,
								)}"
							>
								<span class="fallback-letter"
									>{item.name.charAt(0)}</span
								>
							</div>
						{/if}
						<div class="hero-glow"></div>
					</div>
					<div class="hero-info">
						<div class="hero-title font-display">{item.name}</div>
						<div class="hero-stats font-mono">
							{Math.round(item.minutes / 60)} hours
						</div>
					</div>
				</div>
			{/if}

			<!-- Grid for #2 - #5 -->
			<div class="secondary-grid">
				{#each topFive.slice(1) as item, i}
					{@const rank = i + 2}
					<!-- Rows animate in pairs: 2&3 (idx 0&1), 4&5 (idx 2&3) -->
					{@const showPhase = rank <= 3 ? 3 : 4}
					<div
						class="grid-item"
						class:show={phase >= showPhase}
						style="transition-delay: {(i % 2) * 100}ms"
					>
						<div class="rank-badge">#{rank}</div>
						<div class="grid-poster-wrap">
							{#if !imageErrors.has(item.id)}
								<img
									src={getImageUrl(item)}
									alt={item.name}
									class="grid-poster"
									on:error={() => handleImageError(item)}
								/>
							{:else}
								<div
									class="poster-fallback"
									style="background: {getGradientFromName(
										item.name,
									)}"
								></div>
							{/if}
						</div>
						<div class="grid-title">{item.name}</div>
						<div class="grid-stats font-mono">
							{Math.round(item.minutes / 60)}h
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Footer Stats -->
		<div class="total-stats" class:show={phase >= 5}>
			<div class="stat-line"></div>
			<div class="stat-content">
				<span class="stat-number font-mono">{displayCount}</span>
				<span class="stat-label">total {type} watched</span>
			</div>
			<div class="stat-line"></div>
		</div>
	</div>
</div>

<style>
	.card-base {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 2rem 1rem;
		opacity: 0;
		transition: opacity 0.4s ease;
		overflow: hidden;
	}

	/* More compact on mobile to prevent overflow */
	@media (max-width: 600px) {
		.card-base {
			padding: 2.5rem 0.75rem 4.5rem;
			justify-content: center;
		}

		.content {
			transform: scale(0.92);
			transform-origin: center center;
		}
	}

	.card-base.visible {
		opacity: 1;
	}

	/* Background Particles */
	.bg-particles {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}

	.particle {
		position: absolute;
		width: 200px;
		height: 200px;
		background: radial-gradient(
			circle,
			rgba(29, 185, 84, 0.15) 0%,
			transparent 70%
		);
		border-radius: 50%;
		top: var(--y);
		left: var(--x);
		animation: float var(--duration) ease-in-out infinite alternate;
		animation-delay: var(--delay);
		opacity: 0;
	}

	.card-base.visible .particle {
		opacity: 0.6;
		transition: opacity 2s ease;
	}

	@keyframes float {
		0% {
			transform: translate(0, 0) scale(1);
		}
		100% {
			transform: translate(30px, -30px) scale(1.1);
		}
	}

	.content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: 500px;
		gap: 1.5rem;
		margin: 0 auto;
	}

	/* Header */
	.header-section {
		text-align: center;
		opacity: 0;
		transform: translateY(-20px);
		transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
		z-index: 10;
		margin-bottom: 0.5rem;
	}

	.header-section.show {
		opacity: 1;
		transform: translateY(0);
	}

	.overline {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		font-family: "JetBrains Mono", monospace;
		font-size: 0.75rem;
		color: #1db954;
		letter-spacing: 0.2em;
		margin-bottom: 0.5rem;
	}

	.unicode {
		font-size: 0.6em;
		opacity: 0.7;
	}

	.main-title {
		font-size: clamp(2rem, 8vw, 3rem);
		font-weight: 800;
		line-height: 0.9;
		margin: 0;
		background: linear-gradient(
			180deg,
			white 0%,
			rgba(255, 255, 255, 0.7) 100%
		);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		text-transform: uppercase;
		letter-spacing: -0.02em;
	}

	/* Posters Layout */
	.posters-grid {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		gap: 1.5rem;
		position: relative;
	}

	/* Hero (#1) */
	.hero-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		opacity: 0;
		transform: scale(1.1) translateY(20px);
		filter: blur(8px);
		transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
		z-index: 5;
	}

	.hero-item.show {
		opacity: 1;
		transform: scale(1) translateY(0);
		filter: blur(0);
	}

	.hero-rank {
		position: absolute;
		top: -40px;
		left: -20px;
		font-family: "Space Grotesk", sans-serif;
		font-weight: 800;
		font-size: 8rem;
		color: rgba(255, 255, 255, 0.05);
		line-height: 1;
		pointer-events: none;
		z-index: -1;
	}

	.hero-poster-wrap {
		width: 220px; /* Much larger hero */
		aspect-ratio: 2/3;
		border-radius: 16px;
		position: relative;
		box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.6);
		transition: transform 0.3s ease;
	}

	.hero-poster {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 16px;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.hero-glow {
		position: absolute;
		inset: -30px;
		background: radial-gradient(
			circle,
			rgba(29, 185, 84, 0.5) 0%,
			transparent 70%
		);
		z-index: -1;
		border-radius: 50%;
		opacity: 0.7;
		animation: pulse 3s infinite alternate;
	}

	.hero-info {
		margin-top: 1.25rem;
		text-align: center;
	}

	.hero-title {
		font-size: 1.5rem;
		font-weight: 800;
		margin-bottom: 0.5rem;
		color: white;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	}

	.hero-stats {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.6);
		letter-spacing: 0.05em;
	}

	/* Secondary Grid (#2 - #5) */
	.secondary-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		justify-items: center; /* Center items in their tracks */
		gap: 1.5rem;
		width: 100%;
		max-width: 800px; /* Constrain width so items don't get massive */
		padding-top: 2rem;
		border-top: 1px solid rgba(255, 255, 255, 0.05);
	}

	/* Mobile tweak: smaller hero, 2x2 grid, tighter spacing */
	@media (max-width: 600px) {
		.hero-poster-wrap {
			width: 120px; /* Even smaller hero on mobile */
		}

		.hero-title {
			font-size: 1.125rem;
		}

		.hero-info {
			margin-top: 0.5rem;
		}

		.hero-stats {
			font-size: 0.8rem;
		}

		.main-title {
			font-size: 1.35rem;
		}

		.header-section {
			margin-bottom: 0.25rem;
		}

		.posters-grid {
			gap: 0.5rem;
		}

		.secondary-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 0.5rem;
			max-width: 240px;
			padding-top: 0.75rem;
		}
	}

	.grid-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
		opacity: 0;
		transform: translateY(15px);
		transition: all 0.6s ease;
		width: 120px; /* Fixed small width for secondary items */
	}

	/* Mobile grid item sizing */
	@media (max-width: 600px) {
		.grid-item {
			width: 100%;
			max-width: 90px;
		}

		.grid-title {
			font-size: 0.55rem;
		}

		.grid-stats {
			font-size: 0.5rem;
		}
	}

	.grid-item.show {
		opacity: 1;
		transform: translateY(0);
	}

	.grid-poster-wrap {
		width: 100%;
		aspect-ratio: 2/3;
		border-radius: 8px;
		margin-bottom: 0.5rem;
		position: relative;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.grid-poster {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.rank-badge {
		position: absolute;
		top: -6px;
		left: -6px;
		background: #0a0a0a;
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-family: "JetBrains Mono", monospace;
		font-size: 0.625rem;
		font-weight: 700;
		padding: 2px 5px;
		border-radius: 4px;
		z-index: 2;
	}

	.grid-title {
		font-size: 0.625rem;
		font-weight: 600;
		text-align: center;
		color: rgba(255, 255, 255, 0.8);
		line-height: 1.2;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		max-width: 100%;
	}

	.grid-stats {
		font-size: 0.6rem;
		color: rgba(255, 255, 255, 0.4);
		margin-top: 2px;
	}

	/* Footer Stats */
	.total-stats {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
		opacity: 0;
		transform: scaleX(0.9);
		transition: all 0.8s ease;
	}

	.total-stats.show {
		opacity: 1;
		transform: scaleX(1);
	}

	.stat-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 255, 255, 0.2),
			transparent
		);
	}

	.stat-content {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-number {
		font-size: 1.25rem;
		font-weight: 700;
		color: white;
	}

	.stat-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.total-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		opacity: 0.7;
	}

	.share-container {
		position: absolute;
		top: 1.5rem;
		right: 1.5rem;
		z-index: 50;
		animation: fade-in 0.5s ease 2s backwards;
	}

	/* Fallbacks */
	.poster-fallback {
		width: 100%;
		height: 100%;
		border-radius: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.fallback-letter {
		font-size: 2rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.3);
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
			opacity: 0.4;
		}
		100% {
			transform: scale(1.1);
			opacity: 0.7;
		}
	}

	/* Snapshot Overrides (html2canvas fixes) */
	:global(.snapshot-mode) .share-container {
		display: none !important;
	}

	:global(.snapshot-mode) .main-title,
	:global(.snapshot-mode) .hero-rank,
	:global(.snapshot-mode) .number {
		background: none !important;
		-webkit-text-fill-color: initial !important;
		color: white !important;
		text-shadow: none !important;
	}

	:global(.snapshot-mode) .hero-rank {
		color: rgba(255, 255, 255, 0.1) !important;
	}
</style>
