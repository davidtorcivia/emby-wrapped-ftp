<script lang="ts">
    import html2canvas from "html2canvas";
    import { UNICODE } from "$lib/utils/format";

    export let targetId: string;
    export let fileName: string = "emby-wrapped-2025.png";
    export let label: string = "Share";

    let isGenerating = false;

    async function captureAndShare() {
        const element = document.getElementById(targetId);
        if (!element || isGenerating) return;

        isGenerating = true;

        try {
            // Capture with html2canvas
            const canvas = await html2canvas(element, {
                backgroundColor: "#0a0a0a",
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById(targetId);
                    if (clonedElement) {
                        clonedElement.classList.add("snapshot-mode");
                        clonedElement.style.opacity = "1";
                        clonedElement.style.transform = "none";
                    }
                },
            });

            const image = canvas.toDataURL("image/png");

            // Try to share, otherwise download
            if (navigator.share) {
                const blob = await (await fetch(image)).blob();
                const file = new File([blob], fileName, { type: "image/png" });

                if (
                    navigator.canShare &&
                    navigator.canShare({ files: [file] })
                ) {
                    await navigator.share({
                        files: [file],
                        title: "My Emby Wrapped 2025",
                        text: "Check out my year in Review!",
                    });
                } else {
                    downloadImage(image);
                }
            } else {
                downloadImage(image);
            }
        } catch (err) {
            console.error("Sharing failed:", err);
            // Fallback: just download
            try {
                const canvas = await html2canvas(element, {
                    backgroundColor: "#0a0a0a",
                    scale: 2,
                    useCORS: true,
                    logging: false,
                });
                downloadImage(canvas.toDataURL("image/png"));
            } catch {
                alert("Could not generate image. Please try again.");
            }
        } finally {
            isGenerating = false;
        }
    }

    function downloadImage(dataUrl: string) {
        const link = document.createElement("a");
        link.download = fileName;
        link.href = dataUrl;
        link.click();
    }
</script>

<button
    class="share-btn"
    on:click|stopPropagation={captureAndShare}
    disabled={isGenerating}
    aria-label="Share this card"
>
    <span class="icon">{isGenerating ? UNICODE.dots : "↗"}</span>
    <span class="label">{isGenerating ? "..." : label}</span>
</button>

<style>
    .share-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 999px;
        color: rgba(255, 255, 255, 0.9);
        font-family: inherit;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        backdrop-filter: blur(8px);
        z-index: 50;
    }

    /* Icon-only on mobile */
    @media (max-width: 600px) {
        .share-btn {
            width: 36px;
            height: 36px;
            padding: 0;
            border-radius: 50%;
        }

        .label {
            display: none;
        }
    }

    .share-btn:hover:not(:disabled) {
        background: rgba(29, 185, 84, 0.3);
        border-color: rgba(29, 185, 84, 0.5);
        transform: scale(1.05);
    }

    .share-btn:active:not(:disabled) {
        transform: scale(0.98);
    }

    .share-btn:disabled {
        opacity: 0.7;
        cursor: wait;
    }

    .icon {
        font-size: 1rem;
        line-height: 1;
    }

    .label {
        line-height: 1;
    }
</style>
