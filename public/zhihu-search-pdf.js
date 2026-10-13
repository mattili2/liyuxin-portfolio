import * as pdfjsLib from "./vendor/pdfjs/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdfjs/pdf.worker.min.mjs";

const canvases = [...document.querySelectorAll("canvas[data-pdf]")];
const pages = [...document.querySelectorAll(".pdf-page")];
const deck = document.querySelector(".pdf-deck");
const documents = new Map();
const progressFill = document.querySelector(".project-progress-fill");
let resizeTimer;
let scrollFrame;
let landscapePromptTimer;
const isPhoneProject = navigator.userAgentData?.mobile === true ||
  /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent) ||
  (window.matchMedia("(pointer: coarse) and (hover: none)").matches && Math.min(screen.width, screen.height) <= 600);
document.documentElement.classList.toggle("phone-project", isPhoneProject);

function updateMobileLandscape() {
  const shouldRotate = isPhoneProject && window.matchMedia("(orientation: portrait)").matches;
  window.clearTimeout(landscapePromptTimer);
  document.body.classList.remove("mobile-project-landscape");
  if (!shouldRotate) return;
  landscapePromptTimer = window.setTimeout(() => {
    document.body.classList.add("mobile-project-landscape");
    window.setTimeout(() => renderAll().then(updateActivePage), 320);
  }, 900);
}


function updateEndSpacing() {
  const lastPage = pages.at(-1);
  if (!lastPage) return;
  const centerSpace = Math.max(0, (document.body.clientHeight - lastPage.getBoundingClientRect().height) / 2);
  deck.style.paddingTop = `${centerSpace}px`;
  deck.style.paddingBottom = `${centerSpace}px`;
}

function updateActivePage() {
  const viewportHeight = document.body.clientHeight;
  pages.forEach((page) => {
    const bounds = page.getBoundingClientRect();
    const visibleHeight = Math.max(0, Math.min(bounds.bottom, viewportHeight) - Math.max(bounds.top, 0));
    const visibilityRatio = Math.min(1, visibleHeight / bounds.height);
    page.style.setProperty("--visibility-ratio", visibilityRatio.toFixed(4));
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

async function getPage(canvas) {
  const url = canvas.dataset.pdf;
  if (!documents.has(url)) documents.set(url, pdfjsLib.getDocument(url).promise);
  const pdf = await documents.get(url);
  return pdf.getPage(1);
}

async function renderCanvas(canvas) {
  const page = await getPage(canvas);
  const baseViewport = page.getViewport({ scale: 1 });
  const cssWidth = canvas.parentElement.clientWidth;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const cssViewport = page.getViewport({ scale: cssWidth / baseViewport.width });
  const renderViewport = page.getViewport({ scale: (cssWidth / baseViewport.width) * pixelRatio });
  canvas.parentElement.style.setProperty("--scale-factor", cssViewport.scale);
  canvas.width = Math.round(renderViewport.width);
  canvas.height = Math.round(renderViewport.height);
  await page.render({ canvasContext: canvas.getContext("2d"), viewport: renderViewport }).promise;
  updateEdgeMirrors(canvas, pixelRatio);

  let textLayerElement = canvas.parentElement.querySelector(".textLayer");
  if (!textLayerElement) {
    textLayerElement = document.createElement("div");
    textLayerElement.className = "textLayer";
    canvas.insertAdjacentElement("afterend", textLayerElement);
  }
  textLayerElement.replaceChildren();
  const textLayer = new pdfjsLib.TextLayer({
    textContentSource: page.streamTextContent({ includeMarkedContent: true }),
    container: textLayerElement,
    viewport: cssViewport,
  });
  await textLayer.render();
  textLayerElement.querySelectorAll("span").forEach((span) => {
    if (!span.textContent.trim()) span.classList.add("selection-spacer");
  });
}

function updateEdgeMirrors(canvas, pixelRatio) {
  const page = canvas.parentElement;
  const padding = Math.max(1, Math.round(68 * pixelRatio));
  const bandCount = 20;
  const width = canvas.width;
  const height = canvas.height;
  let halo = page.querySelector("canvas.page-halo");
  if (!halo) {
    halo = document.createElement("canvas");
    halo.className = "page-halo";
    page.prepend(halo);
  }
  page.querySelectorAll(".edge-mirror, .corner-mirror").forEach((element) => element.remove());
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
    context.drawImage(canvas, sx, sy, sw, sh, 0, 0, dw, dh);
    context.restore();
  };
  drawTile(0, 0, width, height, padding, padding, width, height);
  drawTile(0, 0, padding, height, 0, padding, padding, height, true, false);
  drawTile(width - padding, 0, padding, height, padding + width, padding, padding, height, true, false);
  drawTile(0, 0, width, padding, padding, 0, width, padding, false, true);
  drawTile(0, height - padding, width, padding, padding, padding + height, width, padding, false, true);
  drawTile(0, 0, padding, padding, 0, 0, padding, padding, true, true);
  drawTile(width - padding, 0, padding, padding, padding + width, 0, padding, padding, true, true);
  drawTile(0, height - padding, padding, padding, 0, padding + height, padding, padding, true, true);
  drawTile(width - padding, height - padding, padding, padding, padding + width, padding + height, padding, padding, true, true);

  const output = halo.getContext("2d");
  output.clearRect(0, 0, halo.width, halo.height);
  for (let band = 0; band < bandCount; band += 1) {
    const start = (band / bandCount) * padding;
    const end = ((band + 1) / bandCount) * padding;
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

async function renderAll() {
  await Promise.all(canvases.map(renderCanvas));
  updateEndSpacing();
}

async function initialRender() {
  if (!canvases.length) {
    window.finishProjectLoading?.();
    return;
  }

  try {
    await renderCanvas(canvases[0]);
    updateEndSpacing();
    updateActivePage();
    window.finishProjectLoading?.();
    await Promise.all(canvases.slice(1).map(renderCanvas));
    updateEndSpacing();
    updateActivePage();
  } catch (error) {
    window.finishProjectLoading?.();
    throw error;
  }
}

initialRender();
updateMobileLandscape();
window.addEventListener("orientationchange", updateMobileLandscape);

document.body.addEventListener("scroll", () => {
  window.cancelAnimationFrame(scrollFrame);
  scrollFrame = window.requestAnimationFrame(updateActivePage);
}, { passive: true });

window.addEventListener("resize", () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => renderAll().then(updateActivePage), 120);
});

const projectMenu = document.querySelector(".project-menu-overlay");
const projectMenuToggle = document.querySelector(".project-menu-toggle");
const closeProjectMenu = () => {
  projectMenu.classList.remove("open");
  projectMenu.hidden = true;
  projectMenuToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("project-menu-open");
};

projectMenuToggle.addEventListener("click", () => {
  if (projectMenuToggle.getAttribute("aria-expanded") === "true") {
    closeProjectMenu();
    return;
  }
  projectMenu.hidden = false;
  projectMenu.classList.add("open");
  projectMenuToggle.setAttribute("aria-expanded", "true");
  document.body.classList.add("project-menu-open");
});
projectMenu.querySelector(".project-menu-close").addEventListener("click", closeProjectMenu);
projectMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeProjectMenu));

document.querySelectorAll('a[href^="./"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    closeProjectMenu();
    const projectIndex = Number(document.body.dataset.projectIndex);
    if (Number.isInteger(projectIndex)) {
      sessionStorage.setItem("portfolio-active-project", String(projectIndex));
    }
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
