<script lang="ts">
	import { onMount, createEventDispatcher } from "svelte";
	import ProgressDots from "$lib/components/ui/ProgressDots.svelte";
	import { UNICODE } from "$lib/utils/format";

	export let totalCards: number;
	export let onCardChange: ((index: number) => void) | undefined = undefined;

	const dispatch = createEventDispatcher<{ cardChange: { index: number } }>();

	let currentCard = 0;
	let isTransitioning = false;
	let containerEl: HTMLDivElement;

	// Touch handling
	let touchStartY = 0;
	let touchStartX = 0;

	function goToCard(index: number) {
		if (isTransitioning || index < 0 || index >= totalCards) return;
		if (index === currentCard) return;

		isTransitioning = true;
		currentCard = index;
		if (onCardChange) onCardChange(index);
		dispatch("cardChange", { index });

		setTimeout(() => {
			isTransitioning = false;
		}, 500);
	}

	function nextCard() {
		goToCard(currentCard + 1);
	}

	function prevCard() {
		goToCard(currentCard - 1);
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case "ArrowRight":
			case "ArrowDown":
			case " ":
				event.preventDefault();
				nextCard();
				break;
			case "ArrowLeft":
			case "ArrowUp":
				event.preventDefault();
				prevCard();
				break;
		}
	}

	function handleTouchStart(event: TouchEvent) {
		touchStartY = event.touches[0].clientY;
		touchStartX = event.touches[0].clientX;
	}

	function handleTouchEnd(event: TouchEvent) {
		const touchEndY = event.changedTouches[0].clientY;
		const touchEndX = event.changedTouches[0].clientX;

		const diffY = touchStartY - touchEndY;
		const diffX = touchStartX - touchEndX;

		// Minimum swipe distance
		const minSwipe = 50;

		// Prioritize vertical swipes
		if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minSwipe) {
			if (diffY > 0) {
				nextCard();
			} else {
				prevCard();
			}
		}
	}

	function handleClick(event: MouseEvent) {
		// Ignore clicks on buttons or interactive elements
		if ((event.target as HTMLElement).closest("button, a, input")) return;

		const rect = containerEl.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const width = rect.width;

		// Click on right 60% goes forward, left 40% goes back
		if (clickX > width * 0.4) {
			nextCard();
		} else {
			prevCard();
		}
	}

	onMount(() => {
		// Focus for keyboard navigation
		containerEl?.focus();
		// Dispatch initial card event to trigger animations
		dispatch("cardChange", { index: 0 });
	});
</script>

<div
	class="card-stack"
	bind:this={containerEl}
	tabindex="0"
	role="region"
	aria-label="Wrapped story cards"
	on:keydown={handleKeydown}
	on:touchstart={handleTouchStart}
	on:touchend={handleTouchEnd}
	on:click={handleClick}
>
	<!-- Cards -->
	<div class="cards-container">
		{#each Array(totalCards) as _, i}
			<div
				class="card-wrapper"
				class:active={i === currentCard}
				class:prev={i < currentCard}
				class:next={i > currentCard}
			>
				<slot
					currentIndex={currentCard}
					cardIndex={i}
					isActive={i === currentCard}
				/>
			</div>
		{/each}
	</div>

	<!-- Navigation overlay -->
	<div class="nav-overlay">
		<!-- Progress dots -->
		<div class="progress-container">
			<ProgressDots total={totalCards} current={currentCard} />
		</div>

		<!-- Navigation hints -->
		<div class="nav-hints">
			{#if currentCard > 0}
				<button
					class="nav-btn prev"
					on:click|stopPropagation={prevCard}
				>
					<span>{UNICODE.triangleUp}</span>
				</button>
			{/if}
			{#if currentCard < totalCards - 1}
				<button
					class="nav-btn next"
					on:click|stopPropagation={nextCard}
				>
					<span>{UNICODE.triangleDown}</span>
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.card-stack {
		position: relative;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
		outline: none;
		background: #0a0a0a;
	}

	.cards-container {
		position: relative;
		width: 100%;
		height: 100%;
		perspective: 1200px;
	}

	.card-wrapper {
		position: absolute;
		inset: 0;
		opacity: 0;
		/* Default state (hidden) */
		transform: scale(0.9) translateY(20px);
		filter: blur(10px);
		pointer-events: none;
		transition:
			opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1),
			transform 0.8s cubic-bezier(0.19, 1, 0.22, 1),
			filter 0.8s cubic-bezier(0.19, 1, 0.22, 1);
		z-index: 1;
		will-change: transform, opacity, filter;
	}

	.card-wrapper.active {
		opacity: 1;
		transform: scale(1) translateY(0);
		filter: blur(0);
		pointer-events: auto;
		z-index: 10;
	}

	.card-wrapper.prev {
		opacity: 0;
		transform: scale(1.1) translateY(-50px);
		filter: blur(20px);
		z-index: 5;
	}

	.card-wrapper.next {
		/* Adjusted for coming from below */
		opacity: 0;
		transform: scale(0.95) translateY(50px);
		filter: blur(10px);
		z-index: 5;
	}

	.nav-overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 100;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 1.5rem;
	}

	.progress-container {
		display: flex;
		justify-content: center;
		pointer-events: auto;
	}

	.nav-hints {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: rgba(20, 20, 20, 0.9);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		color: rgba(255, 255, 255, 0.7);
		font-family: "JetBrains Mono", monospace;
		font-size: 1.25rem;
		cursor: pointer;
		pointer-events: auto;
		transition: all 0.2s ease;
	}

	.nav-btn:hover {
		background: rgba(29, 185, 84, 0.2);
		border-color: rgba(29, 185, 84, 0.3);
		color: #1db954;
	}

	/* Mobile: position at bottom inline with audio controls */
	@media (max-width: 767px) {
		.nav-hints {
			position: fixed;
			bottom: 1.5rem;
			left: 50%;
			transform: translateX(-50%);
			z-index: 1000;
			margin: 0;
		}

		.nav-btn {
			width: 36px;
			height: 36px;
			opacity: 0.6;
		}

		.nav-btn:active {
			opacity: 1;
		}
	}

	/* Desktop: show side navigation areas */
	@media (min-width: 768px) {
		.nav-btn {
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
		}

		.nav-btn.prev {
			left: 2rem;
		}

		.nav-btn.next {
			right: 2rem;
		}

		.nav-hints {
			position: static;
			margin: 0;
		}
	}
</style>
