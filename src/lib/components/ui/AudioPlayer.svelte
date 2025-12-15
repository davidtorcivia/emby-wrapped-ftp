<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { UNICODE } from "$lib/utils/format";

	export let autoPlay: boolean = true;
	export let volume: number = 0.3;

	let audio: HTMLAudioElement;
	let isPlaying = false;
	let isMuted = false;
	let hasInteracted = false;
	let showPrompt = true;
	let currentTrack = "";
	let musicTracks: string[] = [];

	async function fetchTracks() {
		try {
			const res = await fetch("/api/music");
			if (res.ok) {
				const data = await res.json();
				if (data.tracks && data.tracks.length > 0) {
					musicTracks = data.tracks;
					return true;
				}
			}
		} catch (e) {
			console.error("Failed to load music list", e);
		}

		// No fallback - if API fails, no music
		return false;
	}

	function selectRandomTrack(): string {
		if (musicTracks.length === 0) return "";
		const idx = Math.floor(Math.random() * musicTracks.length);
		return musicTracks[idx];
	}

	onMount(async () => {
		await fetchTracks();
		currentTrack = selectRandomTrack();

		if (!currentTrack) return;

		audio = new Audio(currentTrack);
		audio.loop = true;
		audio.volume = volume;

		// Handle audio errors (missing file) - try another track
		audio.addEventListener("error", () => {
			const newTrack = selectRandomTrack();
			if (newTrack !== currentTrack && newTrack) {
				currentTrack = newTrack;
				audio.src = currentTrack;
				if (isPlaying) {
					audio.play().catch(() => {});
				}
			}
		});

		// Try to autoplay (may fail due to browser policy)
		if (autoPlay) {
			tryAutoplay();
		}

		// Listen for first user interaction to enable audio
		// Use touchend (not touchstart) for mobile - touchstart doesn't satisfy
		// browser autoplay policies since the gesture isn't complete
		const events = ["click", "touchend", "keydown"];

		const cleanupListeners = () => {
			events.forEach((event) => {
				document.removeEventListener(event, handleInteraction);
			});
		};

		const handleInteraction = () => {
			// Prevent double-firing (touchend + click can both fire on mobile)
			if (hasInteracted) return;
			hasInteracted = true;
			showPrompt = false;
			cleanupListeners();

			// Initialize audio context if needed or just play
			if (!isPlaying && autoPlay && audio) {
				play();
			}
		};

		events.forEach((event) => {
			document.addEventListener(event, handleInteraction);
		});
	});

	onDestroy(() => {
		if (audio) {
			audio.pause();
			audio.src = "";
		}
	});

	async function tryAutoplay() {
		if (!audio) return;
		try {
			await audio.play();
			isPlaying = true;
			showPrompt = false;
			hasInteracted = true;
		} catch (e) {
			// Autoplay blocked - will wait for user interaction
			console.log("Autoplay blocked, waiting for user interaction");
		}
	}

	function play() {
		if (!audio) return;
		audio
			.play()
			.then(() => {
				isPlaying = true;
			})
			.catch((e) => {
				console.warn("Failed to play audio:", e);
			});
	}

	function pause() {
		if (!audio) return;
		audio.pause();
		isPlaying = false;
	}

	function toggleMute() {
		if (!audio) return;
		isMuted = !isMuted;
		audio.muted = isMuted;
	}
	function nextTrack() {
		if (!audio) return;
		const newTrack = selectRandomTrack();
		if (newTrack) {
			currentTrack = newTrack;
			audio.src = currentTrack;
			// Ensure we keep playing if we were already playing
			if (autoPlay || isPlaying) {
				play();
			}
		}
	}
</script>

{#if musicTracks.length > 0 && showPrompt && !hasInteracted}
	<div class="audio-prompt">
		<div class="prompt-content">
			<span class="icon">{UNICODE.music}</span>
			<span class="text">Tap anywhere to enable audio</span>
		</div>
	</div>
{/if}

{#if musicTracks.length > 0}
	<div class="audio-controls" class:visible={hasInteracted}>
		<button
			class="control-btn"
			on:click={toggleMute}
			aria-label={isMuted ? "Unmute" : "Mute"}
		>
			{#if isMuted}
				<!-- Speaker X (Muted) -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M11 5L6 9H2v6h4l5 4V5z" />
					<line x1="23" y1="9" x2="17" y2="15" />
					<line x1="17" y1="9" x2="23" y2="15" />
				</svg>
			{:else}
				<!-- Speaker Wave (Volume) -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"
					></polygon>
					<path
						d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"
					></path>
				</svg>
			{/if}
		</button>

		<button
			class="control-btn"
			on:click={nextTrack}
			aria-label="Skip Track"
		>
			<!-- Skip Forward Icon -->
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polygon points="5 4 15 12 5 20 5 4"></polygon>
				<line x1="19" y1="5" x2="19" y2="19"></line>
			</svg>
		</button>
	</div>
{/if}

<style>
	.audio-controls {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 1000;
		display: flex;
		align-items: center;
		gap: 1.5rem; /* Increased gap */
		padding: 0.75rem 1.25rem;
		background: rgba(20, 20, 20, 0.9);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 100px; /* Fully rounded capsule */
		color: white;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
		transition: all 0.2s ease;
	}

	/* More subtle on mobile */
	@media (max-width: 768px) {
		.audio-controls {
			opacity: 0.6;
			background: rgba(20, 20, 20, 0.7);
			padding: 0.5rem 1rem;
		}

		.audio-controls:hover,
		.audio-controls:active {
			opacity: 1;
		}
	}

	.control-btn {
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		padding: 0.5rem; /* Touch target size */
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		border-radius: 50%;
	}

	.control-btn:hover {
		color: white;
		background: rgba(255, 255, 255, 0.1);
		transform: scale(1.1);
	}

	.audio-prompt {
		position: fixed;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 999;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		background: rgba(29, 185, 84, 0.9);
		border-radius: 20px;
		color: white;
		font-size: 0.875rem;
		font-weight: 500;
		animation:
			fadeInUp 0.5s ease,
			fadeOut 0.5s ease 3s forwards;
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	@keyframes fadeOut {
		to {
			opacity: 0;
		}
	}
</style>
