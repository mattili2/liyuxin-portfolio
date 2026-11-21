const pdfCanvases = [...document.querySelectorAll("canvas[data-pdf]")];
pdfCanvases.forEach((canvas, index) => {
  const pdfPath = canvas.dataset.pdf?.split("?")[0] || "";
  const imagePath = pdfPath.replace(/-pdf\/([^/]+)\.pdf$/, "-preview/$1.png");
  const image = document.createElement("img");
  image.className = "page-image";
  image.src = imagePath;
  image.alt = canvas.parentElement?.getAttribute("aria-label") || `项目页面 ${index + 1}`;
  image.decoding = "async";
  image.loading = index < 2 ? "eager" : "lazy";
  if (index === 0) image.fetchPriority = "high";
  canvas.replaceWith(image);
});
const canvases = [];
const pages = [...document.querySelectorAll(".pdf-page")];
const deck = document.querySelector(".pdf-deck");
const documents = new Map();
const renderedCanvases = new WeakSet();
const renderJobs = new WeakMap();
const renderQueue = [];
let activeRenderCount = 0;
const progressFill = document.querySelector(".project-progress-fill");
let resizeTimer;
let scrollFrame;
const landscapePrompt = document.querySelector(".landscape-prompt");
const isAmbientReader = document.body.classList.contains("ambient-reader");
const isPhoneProject = navigator.userAgentData?.mobile === true ||
  /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent) ||
  (window.matchMedia("(pointer: coarse) and (hover: none)").matches && Math.min(screen.width, screen.height) <= 600);
document.documentElement.classList.toggle("phone-project", isPhoneProject);
if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
document.body.scrollTop = 0;

canvases.forEach((canvas) => {
  const pdfPath = canvas.dataset.pdf?.split("?")[0];
  if (!pdfPath) return;
  const previewPath = pdfPath.replace(/-pdf\/([^/]+)\.pdf$/, "-preview/$1.jpg");
  if (previewPath === pdfPath) return;
  canvas.parentElement.style.setProperty("--page-preview", `url('${previewPath}')`);
  canvas.parentElement.dataset.preview = previewPath;
  canvas.parentElement.classList.add("has-page-preview");
});

function waitForPagePreview(page) {
  const previewPath = page?.dataset.preview;
  if (!previewPath) return Promise.resolve();
  return new Promise((resolve) => {
    const image = new Image();
    const finish = () => resolve();
    const timeout = window.setTimeout(finish, 3000);
    image.addEventListener("load", () => {
      window.clearTimeout(timeout);
      finish();
    }, { once: true });
    image.addEventListener("error", () => {
      window.clearTimeout(timeout);
      finish();
    }, { once: true });
    image.src = previewPath;
  });
}

function updateMobileLandscape(showHint = true) {
  const isCompactProject = isPhoneProject || window.matchMedia("(max-width: 900px)").matches;
  document.documentElement.classList.toggle("compact-project", isCompactProject);
  if (!showHint) return;
  document.body.classList.remove("portrait-hint-visible");
  landscapePrompt?.setAttribute("aria-hidden", "true");
  if (!isCompactProject || localStorage.getItem("portfolio-hide-landscape-prompt") === "1") return;
  document.body.classList.add("portrait-hint-visible");
  landscapePrompt?.setAttribute("aria-hidden", "false");
}


function updateEndSpacing() {
  if (isAmbientReader) {
    const pageHeight = pages[0]?.offsetHeight || 0;
    const isMobileReader = isPhoneProject || document.documentElement.classList.contains("compact-project");
    if (isMobileReader) {
      const header = document.querySelector(".project-header");
      const footer = document.querySelector(".project-footer");
      const headerHeight = Math.ceil(header?.getBoundingClientRect().height || 64);
      const footerHeight = Math.ceil(footer?.getBoundingClientRect().height || 52);
      document.body.classList.remove("reader-centered");
      document.body.classList.add("reader-flow");
      deck.style.setProperty("--reader-edge-space", "0px");
      deck.style.setProperty("--reader-page-gap", "0px");
      deck.style.paddingTop = `${headerHeight}px`;
      deck.style.paddingBottom = `${footerHeight}px`;
      return;
    }
    const visiblePageCount = pageHeight ? document.body.clientHeight / pageHeight : 1;
    const shouldCenterPages = visiblePageCount <= 1.2;
    const readerModeChanged = document.body.classList.contains("reader-centered") !== shouldCenterPages;
    document.body.classList.toggle("reader-centered", shouldCenterPages);
    document.body.classList.toggle("reader-flow", !shouldCenterPages);
    if (shouldCenterPages) {
      const edgeSpace = Math.max(0, Math.round((document.body.clientHeight - pageHeight) / 2));
      deck.style.setProperty("--reader-edge-space", `${edgeSpace}px`);
      deck.style.setProperty("--reader-page-gap", `${edgeSpace * 2}px`);
    } else {
      deck.style.setProperty("--reader-edge-space", "0px");
      deck.style.setProperty("--reader-page-gap", "0px");
      if (readerModeChanged) document.body.classList.remove("reader-ui-idle");
    }
    if (readerModeChanged) window.dispatchEvent(new CustomEvent("reader-layout-change"));
    return;
  }
  if (document.documentElement.classList.contains("compact-project")) {
    const header = document.querySelector(".project-header");
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const headerHeight = isPortrait
      ? Math.ceil(header?.getBoundingClientRect().height || 0)
      : 0;
    deck.style.paddingTop = `${headerHeight}px`;
    deck.style.paddingBottom = isPortrait
      ? `max(64px, env(safe-area-inset-bottom))`
      : "0px";
    return;
  }
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
  if (document.documentElement.classList.contains("compact-project")) {
    const maxScroll = Math.max(1, document.body.scrollHeight - document.body.clientHeight);
    progress = document.body.scrollTop / maxScroll;
  } else if (isStackedDesktop) {
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
  if (!document.documentElement.classList.contains("compact-project") && !isAmbientReader) {
    updateEdgeMirrors(canvas, pixelRatio);
  } else {
    canvas.parentElement.querySelectorAll(".page-halo, .edge-mirror, .corner-mirror").forEach((element) => element.remove());
  }

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
  renderedCanvases.add(canvas);
}

function pumpRenderQueue() {
  const concurrency = isPhoneProject ? 1 : 2;
  renderQueue.sort((a, b) => b.priority - a.priority);
  while (activeRenderCount < concurrency && renderQueue.length) {
    const job = renderQueue.shift();
    if (job.started) continue;
    job.started = true;
    activeRenderCount += 1;
    renderCanvas(job.canvas)
      .then(job.resolve, job.reject)
      .finally(() => {
        activeRenderCount -= 1;
        renderJobs.delete(job.canvas);
        pumpRenderQueue();
      });
  }
}

function ensureCanvasRendered(canvas, priority = 0) {
  if (!canvas || renderedCanvases.has(canvas)) return Promise.resolve();
  const existingJob = renderJobs.get(canvas);
  if (existingJob) {
    existingJob.priority = Math.max(existingJob.priority, priority);
    pumpRenderQueue();
    return existingJob.promise;
  }
  let resolveJob;
  let rejectJob;
  const promise = new Promise((resolve, reject) => {
    resolveJob = resolve;
    rejectJob = reject;
  });
  const job = { canvas, priority, promise, resolve: resolveJob, reject: rejectJob, started: false };
  renderJobs.set(canvas, job);
  renderQueue.push(job);
  pumpRenderQueue();
  return promise;
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
  await Promise.all(canvases.filter(canvas => renderedCanvases.has(canvas)).map(renderCanvas));
  updateEndSpacing();
}

function renderRemainingOnDemand(canvasesToObserve) {
  if (!("IntersectionObserver" in window)) {
    Promise.all(canvasesToObserve.map((canvas) => ensureCanvasRendered(canvas, 800))).then(() => {
      updateEndSpacing();
      updateActivePage();
    });
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const canvas = entry.target;
      observer.unobserve(canvas);
      ensureCanvasRendered(canvas, 1000).then(() => {
        updateEndSpacing();
        updateActivePage();
      });
    });
  }, { rootMargin: isPhoneProject ? "35% 0px" : "75% 0px" });
  canvasesToObserve.forEach(canvas => observer.observe(canvas));
}

async function initialRender() {
  if (!pages.length) {
    window.finishProjectLoading?.();
    return;
  }

  try {
    const firstCanvas = pages[0].querySelector("canvas[data-pdf]");
    let loadingFinished = false;
    if (firstCanvas) {
      await waitForPagePreview(firstCanvas.parentElement);
      updateEndSpacing();
      updateActivePage();
      window.finishProjectLoading?.();
      loadingFinished = true;
    } else {
      const firstPageImages = [...pages[0].querySelectorAll("img")];
      await Promise.all(firstPageImages.map((image) => image.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          })));
    }
    updateEndSpacing();
    updateActivePage();
    if (!loadingFinished) window.finishProjectLoading?.();
    const remainingCanvases = firstCanvas ? canvases.filter((canvas) => canvas !== firstCanvas) : canvases;
    renderRemainingOnDemand(remainingCanvases);
    ensureCanvasRendered(firstCanvas, 2000).then(() => {
      updateEndSpacing();
      updateActivePage();
    }).catch(() => {});
  } catch (error) {
    window.finishProjectLoading?.();
    throw error;
  }
}

initialRender();

if (isAmbientReader) {
  let readerUiIdleTimer = 0;
  let readerAutoHideEnabled = true;
  const updateFirstPageMenuOffset = (controlsVisible) => {
    deck.style.setProperty("--reader-menu-offset", "0px");
    deck.style.setProperty("--reader-first-page-scale", "1");
    document.body.classList.toggle("reader-menu-visible-at-top", Boolean(controlsVisible));
  };
  const showReaderUi = () => {
    window.clearTimeout(readerUiIdleTimer);
    document.body.classList.remove("reader-ui-idle");
    updateFirstPageMenuOffset(true);
    if (!readerAutoHideEnabled || !document.body.classList.contains("reader-centered")) return;
    readerUiIdleTimer = window.setTimeout(() => {
      document.body.classList.add("reader-ui-idle");
    }, 2200);
  };
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "touch" && event.clientY <= 120) showReaderUi();
  }, { passive: true });
  deck.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    if (window.getSelection()?.toString().trim()) return;
    if (document.body.classList.contains("reader-ui-idle")) {
      readerAutoHideEnabled = false;
      window.clearTimeout(readerUiIdleTimer);
      document.body.classList.remove("reader-ui-idle");
      updateFirstPageMenuOffset(true);
      return;
    }
    readerAutoHideEnabled = false;
    window.clearTimeout(readerUiIdleTimer);
    document.body.classList.add("reader-ui-idle");
    updateFirstPageMenuOffset(false);
  });
  window.addEventListener("keydown", showReaderUi);
  window.addEventListener("reader-layout-change", showReaderUi);
  document.body.addEventListener("scroll", () => {
    if (document.body.scrollTop <= 2) {
      updateFirstPageMenuOffset(!document.body.classList.contains("reader-ui-idle"));
    }
  }, { passive: true });
  showReaderUi();
}

updateMobileLandscape(false);
window.addEventListener("project-loading-complete", () => updateMobileLandscape(true));
window.addEventListener("orientationchange", () => updateMobileLandscape(document.body.classList.contains("project-ready")));

document.body.addEventListener("scroll", () => {
  window.cancelAnimationFrame(scrollFrame);
  scrollFrame = window.requestAnimationFrame(updateActivePage);
}, { passive: true });

window.addEventListener("resize", () => {
  updateMobileLandscape(false);
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
window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-leaving");
  document.body.scrollTop = 0;
});
