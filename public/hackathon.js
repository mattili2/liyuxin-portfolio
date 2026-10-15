const pages = [...document.querySelectorAll(".pdf-page")];
const deck = document.querySelector(".pdf-deck");
const progressFill = document.querySelector(".project-progress-fill");
let scrollFrame;
let landscapePromptTimer;
const isPhoneProject = navigator.userAgentData?.mobile === true ||
  /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent) ||
  (window.matchMedia("(pointer: coarse) and (hover: none)").matches && Math.min(screen.width, screen.height) <= 600);
document.documentElement.classList.toggle("phone-project", isPhoneProject);

function updateMobileLandscape(showHint = true) {
  const isCompactProject = isPhoneProject || window.matchMedia("(max-width: 900px)").matches;
  document.documentElement.classList.toggle("compact-project", isCompactProject);
  if (!showHint) return;
  window.clearTimeout(landscapePromptTimer);
  document.body.classList.remove("portrait-hint-visible");
  if (!isCompactProject || localStorage.getItem("portfolio-hide-landscape-prompt") === "1") return;
  document.body.classList.add("portrait-hint-visible");
  landscapePromptTimer = window.setTimeout(() => {
    document.body.classList.remove("portrait-hint-visible");
  }, 1500);
}


function updateEndSpacing() {
  if (document.documentElement.classList.contains("compact-project")) {
    const header = document.querySelector(".project-header");
    const headerHeight = window.matchMedia("(orientation: portrait)").matches
      ? Math.ceil(header?.getBoundingClientRect().height || 0)
      : 0;
    deck.style.paddingTop = `${headerHeight}px`;
    deck.style.paddingBottom = "0px";
    return;
  }
  const lastPage = pages.at(-1);
  if (!lastPage) return;
  const centerSpace = Math.max(0, (document.body.clientHeight - lastPage.getBoundingClientRect().height) / 2);
  deck.style.paddingTop = `${centerSpace}px`;
  deck.style.paddingBottom = `${centerSpace}px`;
}

function updateEdgeMirrors(image) {
  const page = image.parentElement;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const sampleWidth = Math.max(1, Math.round(68 * pixelRatio));
  const sampleHeight = Math.max(1, Math.round(68 * pixelRatio));
  const outputHeight = Math.max(1, Math.round(image.clientHeight * pixelRatio));
  const sourceWidth = Math.max(1, Math.round(68 * image.naturalWidth / image.clientWidth));
  const sourceHeight = Math.max(1, Math.round(68 * image.naturalHeight / image.clientHeight));
  const bandCount = 20;

  ["left", "right"].forEach(side => {
    let wrapper = page.querySelector(`.edge-mirror.${side}`);
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = `edge-mirror ${side}`;
      wrapper.append(document.createElement("canvas"));
      page.append(wrapper);
    }

    const mirror = wrapper.querySelector("canvas");
    mirror.width = sampleWidth;
    mirror.height = outputHeight;
    const sourceX = side === "left" ? 0 : image.naturalWidth - sourceWidth;
    const sharp = document.createElement("canvas");
    sharp.width = sampleWidth;
    sharp.height = outputHeight;
    const sharpContext = sharp.getContext("2d");
    sharpContext.translate(sampleWidth, 0);
    sharpContext.scale(-1, 1);
    sharpContext.drawImage(image, sourceX, 0, sourceWidth, image.naturalHeight, 0, 0, sampleWidth, outputHeight);

    const output = mirror.getContext("2d");
    output.clearRect(0, 0, sampleWidth, outputHeight);
    const blurred = document.createElement("canvas");
    blurred.width = sampleWidth;
    blurred.height = outputHeight;
    const blurredContext = blurred.getContext("2d");

    for (let band = 0; band < bandCount; band += 1) {
      const start = Math.floor((band / bandCount) * sampleWidth);
      const end = Math.ceil(((band + 1) / bandCount) * sampleWidth);
      const center = (start + end) / 2;
      const distance = side === "left" ? 1 - center / sampleWidth : center / sampleWidth;
      const blurRadius = Math.pow(distance, 1.35) * 16 * pixelRatio;
      blurredContext.clearRect(0, 0, sampleWidth, outputHeight);
      blurredContext.filter = `blur(${blurRadius}px)`;
      blurredContext.drawImage(sharp, 0, 0);
      output.drawImage(blurred, start, 0, end - start, outputHeight, start, 0, end - start, outputHeight);
      blurredContext.filter = "none";
    }
  });

  ["top", "bottom"].forEach(side => {
    let wrapper = page.querySelector(`.edge-mirror.${side}`);
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = `edge-mirror ${side}`;
      wrapper.append(document.createElement("canvas"));
      page.append(wrapper);
    }

    const mirror = wrapper.querySelector("canvas");
    mirror.width = Math.max(1, Math.round(image.clientWidth * pixelRatio));
    mirror.height = sampleHeight;
    const sourceY = side === "top" ? 0 : image.naturalHeight - sourceHeight;
    const sharp = document.createElement("canvas");
    sharp.width = mirror.width;
    sharp.height = sampleHeight;
    const sharpContext = sharp.getContext("2d");
    sharpContext.translate(0, sampleHeight);
    sharpContext.scale(1, -1);
    sharpContext.drawImage(image, 0, sourceY, image.naturalWidth, sourceHeight, 0, 0, mirror.width, sampleHeight);

    const output = mirror.getContext("2d");
    output.clearRect(0, 0, mirror.width, sampleHeight);
    const blurred = document.createElement("canvas");
    blurred.width = mirror.width;
    blurred.height = sampleHeight;
    const blurredContext = blurred.getContext("2d");

    for (let band = 0; band < bandCount; band += 1) {
      const start = Math.floor((band / bandCount) * sampleHeight);
      const end = Math.ceil(((band + 1) / bandCount) * sampleHeight);
      const center = (start + end) / 2;
      const distance = side === "top" ? 1 - center / sampleHeight : center / sampleHeight;
      const blurRadius = Math.pow(distance, 1.35) * 16 * pixelRatio;
      blurredContext.clearRect(0, 0, mirror.width, sampleHeight);
      blurredContext.filter = `blur(${blurRadius}px)`;
      blurredContext.drawImage(sharp, 0, 0);
      output.drawImage(blurred, 0, start, mirror.width, end - start, 0, start, mirror.width, end - start);
      blurredContext.filter = "none";
    }
  });

  ["top-left", "top-right", "bottom-left", "bottom-right"].forEach(corner => {
    let wrapper = page.querySelector(`.corner-mirror.${corner}`);
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = `corner-mirror ${corner}`;
      wrapper.append(document.createElement("canvas"));
      page.append(wrapper);
    }
    const mirror = wrapper.querySelector("canvas");
    mirror.width = sampleWidth;
    mirror.height = sampleHeight;
    const sourceX = corner.endsWith("left") ? 0 : image.naturalWidth - sourceWidth;
    const sourceY = corner.startsWith("top") ? 0 : image.naturalHeight - sourceHeight;
    const output = mirror.getContext("2d");
    output.clearRect(0, 0, sampleWidth, sampleHeight);
    output.filter = `blur(${10 * pixelRatio}px)`;
    output.translate(sampleWidth, sampleHeight);
    output.scale(-1, -1);
    output.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sampleWidth, sampleHeight);
    output.setTransform(1, 0, 0, 1, 0, 0);
    output.filter = "none";
  });
}

function updatePageHalo(image) {
  const page = image.parentElement;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const padding = Math.max(1, Math.round(68 * pixelRatio));
  const width = Math.max(1, Math.round(image.clientWidth * pixelRatio));
  const height = Math.max(1, Math.round(image.clientHeight * pixelRatio));
  const sourcePaddingX = Math.max(1, Math.round(68 * image.naturalWidth / image.clientWidth));
  const sourcePaddingY = Math.max(1, Math.round(68 * image.naturalHeight / image.clientHeight));
  const bandCount = 20;
  let halo = page.querySelector("canvas.page-halo");
  if (!halo) {
    halo = document.createElement("canvas");
    halo.className = "page-halo";
    page.prepend(halo);
  }
  page.querySelectorAll(".edge-mirror, .corner-mirror").forEach(element => element.remove());
  halo.width = width + padding * 2;
  halo.height = height + padding * 2;

  const sharp = document.createElement("canvas");
  sharp.width = halo.width;
  sharp.height = halo.height;
  const context = sharp.getContext("2d");
  const drawTile = (sx, sy, sw, sh, dx, dy, dw, dh, flipX = false, flipY = false) => {
    context.save();
    context.translate(dx + (flipX ? dw : 0), dy + (flipY ? dh : 0));
    context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    context.drawImage(image, sx, sy, sw, sh, 0, 0, dw, dh);
    context.restore();
  };
  drawTile(0, 0, image.naturalWidth, image.naturalHeight, padding, padding, width, height);
  drawTile(0, 0, sourcePaddingX, image.naturalHeight, 0, padding, padding, height, true, false);
  drawTile(image.naturalWidth - sourcePaddingX, 0, sourcePaddingX, image.naturalHeight, padding + width, padding, padding, height, true, false);
  drawTile(0, 0, image.naturalWidth, sourcePaddingY, padding, 0, width, padding, false, true);
  drawTile(0, image.naturalHeight - sourcePaddingY, image.naturalWidth, sourcePaddingY, padding, padding + height, width, padding, false, true);
  drawTile(0, 0, sourcePaddingX, sourcePaddingY, 0, 0, padding, padding, true, true);
  drawTile(image.naturalWidth - sourcePaddingX, 0, sourcePaddingX, sourcePaddingY, padding + width, 0, padding, padding, true, true);
  drawTile(0, image.naturalHeight - sourcePaddingY, sourcePaddingX, sourcePaddingY, 0, padding + height, padding, padding, true, true);
  drawTile(image.naturalWidth - sourcePaddingX, image.naturalHeight - sourcePaddingY, sourcePaddingX, sourcePaddingY, padding + width, padding + height, padding, padding, true, true);

  const output = halo.getContext("2d");
  output.clearRect(0, 0, halo.width, halo.height);
  for (let band = 0; band < bandCount; band += 1) {
    const start = band / bandCount * padding;
    const end = (band + 1) / bandCount * padding;
    const distance = (start + end) / 2 / padding;
    output.save();
    output.beginPath();
    output.rect(padding - end, padding - end, width + end * 2, height + end * 2);
    output.rect(padding - start, padding - start, width + start * 2, height + start * 2);
    output.clip("evenodd");
    output.filter = `blur(${Math.pow(distance, 1.35) * 36 * pixelRatio}px)`;
    output.drawImage(sharp, 0, 0);
    output.restore();
  }
}

function renderMirrors() {
  if (document.documentElement.classList.contains("compact-project")) {
    document.querySelectorAll(".page-halo, .edge-mirror, .corner-mirror").forEach(element => element.remove());
    return;
  }
  document.querySelectorAll(".static-page > img").forEach(image => {
    if (image.complete && image.naturalWidth) updatePageHalo(image);
    else image.addEventListener("load", () => updatePageHalo(image), { once: true });
  });
}

function updateVisiblePages() {
  const viewportHeight = document.body.clientHeight;
  pages.forEach(page => {
    const bounds = page.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(bounds.bottom, viewportHeight) - Math.max(bounds.top, 0));
    page.style.setProperty("--visibility-ratio", Math.min(1, visibleHeight / bounds.height).toFixed(4));
  });
  const isStackedDesktop = !isPhoneProject && window.matchMedia("(max-aspect-ratio: 1 / 1)").matches;
  let progress;
  if (isStackedDesktop) {
    const progressStart = pages[1]?.offsetTop || 0;
    const maxScroll = Math.max(progressStart + 1, document.body.scrollHeight - document.body.clientHeight);
    progress = (document.body.scrollTop - progressStart) / (maxScroll - progressStart);
  } else {
    const centerSpace = Number.parseFloat(deck.style.paddingTop) || 0;
    const finalPageStart = Math.max(1, (pages.at(-1)?.offsetTop || 1) - centerSpace);
    progress = document.body.scrollTop / Math.max(1, finalPageStart);
  }
  progress = Math.max(0, Math.min(1, progress));
  progressFill.style.setProperty("--project-progress", progress.toFixed(4));
}
document.body.addEventListener("scroll", () => {
  window.cancelAnimationFrame(scrollFrame);
  scrollFrame = window.requestAnimationFrame(updateVisiblePages);
}, { passive: true });
window.addEventListener("resize", () => {
  updateMobileLandscape(false);
  updateEndSpacing();
  updateVisiblePages();
  renderMirrors();
});
updateMobileLandscape(false);
updateEndSpacing();
updateVisiblePages();
renderMirrors();
const firstProjectImage = document.querySelector(".static-page > img");
if (!firstProjectImage || (firstProjectImage.complete && firstProjectImage.naturalWidth)) {
  window.finishProjectLoading?.();
} else {
  firstProjectImage.addEventListener("load", () => window.finishProjectLoading?.(), { once: true });
  firstProjectImage.addEventListener("error", () => window.finishProjectLoading?.(), { once: true });
}
window.addEventListener("project-loading-complete", () => updateMobileLandscape(true));
window.addEventListener("orientationchange", () => updateMobileLandscape(document.body.classList.contains("project-ready")));
const menu = document.querySelector(".project-menu-overlay");
const menuToggle = document.querySelector(".project-menu-toggle");
function closeMenu() {
  menu.classList.remove("open");
  menu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("project-menu-open");
}
menuToggle.addEventListener("click", () => {
  if (menuToggle.getAttribute("aria-expanded") === "true") {
    closeMenu();
    return;
  }
  menu.hidden = false;
  menu.classList.add("open");
  menuToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("project-menu-open");
});
menu.querySelector(".project-menu-close").addEventListener("click", closeMenu);

document.querySelectorAll('a[href^="./"]').forEach(link => {
  link.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeMenu();
    const destination = link.href;
    if (CSS.supports("view-transition-name: none") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.href = destination;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.location.href = destination;
      return;
    }
    document.body.classList.add("page-leaving");
    window.setTimeout(() => { window.location.href = destination; }, 320);
  });
});
window.addEventListener("pageshow", () => document.body.classList.remove("page-leaving"));
