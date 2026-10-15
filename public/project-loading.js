const loader = document.querySelector(".project-loader");
const loadingStartedAt = performance.now();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let loadingFinished = false;
const cardAnimations = [];
const landscapePromptDismiss = document.querySelector(".landscape-prompt-dismiss");
const landscapePrompt = document.querySelector(".landscape-prompt");

const hideLandscapePrompt = () => {
  document.body.classList.remove("portrait-hint-visible");
  landscapePrompt?.setAttribute("aria-hidden", "true");
};

landscapePromptDismiss?.addEventListener("click", () => {
  localStorage.setItem("portfolio-hide-landscape-prompt", "1");
  hideLandscapePrompt();
});

landscapePrompt?.addEventListener("click", (event) => {
  if (event.target === landscapePrompt) hideLandscapePrompt();
});

document.addEventListener("pointerdown", (event) => {
  if (!document.body.classList.contains("portrait-hint-visible")) return;
  if (landscapePrompt?.contains(event.target)) return;
  hideLandscapePrompt();
});

// Match the selected staggered demo: straight moves, soft overshoot,
// and a later size change for each following card. No tile rotation.
if (loader && !reducedMotion) {
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const phase = (t, start, end) => Math.max(0, Math.min(1, (t - start) / (end - start)));
  loader.querySelectorAll(".project-loader-card").forEach((card, index) => {
    if (typeof card.animate !== "function") return;
    const frames = Array.from({ length: 177 }, (_, frame) => {
      const step = Math.floor(frame / 44) % 4;
      const time = (frame % 44) / 44;
      const lag = index * 0.055;
      const moveTime = phase(time, 0.05 + lag, 0.65 + lag);
      const sizeTime = phase(time, 0.19 + lag, 0.72 + lag);
      const move = 1 + 2.55 * (moveTime - 1) ** 3 + 1.55 * (moveTime - 1) ** 2;
      const sizeProgress = sizeTime * sizeTime * (3 - 2 * sizeTime);
      const small = step % 2 === 0 ? 1 - sizeProgress : sizeProgress;
      const size = 40 - 19 * small;
      const radius = 12 + 1.5 * small;
      const from = corners[(index + step) % 4];
      const to = corners[(index + step + 1) % 4];
      const x = (from[0] + (to[0] - from[0]) * move) * radius;
      const y = (from[1] + (to[1] - from[1]) * move) * radius;
      return {
        offset: frame / 176,
        width: `${size}px`,
        height: `${size}px`,
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
      };
    });
    const animation = card.animate(frames, { duration: 6160, iterations: Infinity, easing: "linear" });
    animation.playbackRate = 2;
    cardAnimations.push(animation);
  });
}

window.finishProjectLoading = () => {
  if (loadingFinished) return;
  loadingFinished = true;
  const minimumVisibleTime = reducedMotion ? 0 : 850;
  const remainingTime = Math.max(0, minimumVisibleTime - (performance.now() - loadingStartedAt));

  window.setTimeout(() => {
    document.body.classList.remove("project-loading");
    document.body.classList.add("project-ready");
    loader?.setAttribute("aria-hidden", "true");
    // Stop work once the existing fade-out has completed.
    window.setTimeout(() => {
      cardAnimations.forEach(animation => animation.cancel());
      window.dispatchEvent(new Event("project-loading-complete"));
    }, 280);
  }, remainingTime);
};

// Never leave the project inaccessible if an asset fails to load.
window.setTimeout(() => window.finishProjectLoading(), 12000);
