const projects = [
  {
    title: "热点搜索下的 AI 结果优化",
    category: "知乎社区产品设计",
    description: "通过摘要页内展开与内容发现前置，支持用户快速了解事件，并继续探索相关内容。",
    date: "2026.09",
    mediaType: "image",
    media: "assets/ai-search-cover.png?v=20261013-1",
    page: "ai-search.html",
  },
  {
    title: "搜索双列预制词设计",
    category: "知乎社区产品设计",
    description: "通过双预置词展示与搜索入口调整，增加热门、长尾及个性化搜索词的曝光，让有限的入口承载更多内容。",
    date: "2026.09",
    mediaType: "image",
    media: "assets/zhihu-cover-2.png?v=20261013-1",
    page: "zhihu-search.html",
  },
  {
    title: "黑客松视觉设计",
    category: "知乎运营设计",
    description: "围绕黑客松的协作与创新氛围，设计活动主视觉，并延展至海报、现场展架等物料，建立统一的视觉表达。",
    date: "2026.09",
    mediaType: "image",
    media: "assets/hackathon-cover.png?v=20261010-1",
    page: "hackathon.html",
  },
  {
    title: "AgentMore交互优化方案",
    category: "智谱清言交互设计",
    description: "暂无",
    date: "",
    mediaType: "placeholder",
  },
  {
    title: "MonoLOG：通过对话记录专注",
    category: "Vibe Coding/ 电脑端App设计",
    description: "MonoLOG（独白）是一款对话式记录工具，将专注记录融入自然对话，结合 AI 数字陪伴与监督，让整个过程更加自然、低负担、易坚持。",
    date: "2026.03, 2026.07",
    mediaType: "image",
    media: "assets/monolog.png",
  },
  {
    title: "Whale TV OS 体验优化",
    category: "电视操作系统 UX 设计",
    description: "此项目为在 Whale TV 实习中的工作整理。在本项目中，我主要负责线上和线下两部分的用户测试与分析，并基于研究结果梳理核心痛点，完成交互设计的优化与迭代。",
    date: "2025.02 - 2025.06",
    mediaType: "image",
    media: "assets/whale-tv-cover.png?v=20261013-1",
    page: "whale-tv.html",
  },
  {
    title: "Platte 调色·盘",
    category: "App设计/ 行为设计",
    description: "Platte 调色·盘是一款以「在餐盘上调色」为核心概念，通过颜色引导、周期饮食规划和轻社交陪伴，帮助独居年轻人逐步养成健康、多样饮食习惯的 App。",
    date: "2026.05 - 2026.07",
    mediaType: "image",
    media: "assets/platte-cover.png?v=20261013-3",
    page: "platte.html",
  },
  {
    title: "Ignitcube",
    category: "装置设计/ 产品设计",
    description: "IgnitCube 是一个以“火种资源”为概念的互动灯光装置。作品以火种的有限性、传递性与合作共享为核心，通过人与人之间共同传递光源，引发人们对资源珍惜与共享的思考，同时鼓励公共空间中的合作、交流与互动。",
    date: "2024.09",
    mediaType: "video",
    media: "assets/ignitcube.mp4",
  },
  {
    title: "Traces",
    category: "产品设计",
    description: "Traces 是一款为短期居住者设计的记忆盒子，用于珍藏那些无法带走却值得留存的珍贵物品与回忆。",
    date: "2025.09 - 2025.12",
    mediaType: "video",
    media: "assets/traces.mp4",
  },
];

const projectParam = new URLSearchParams(window.location.search).get("project");
const requestedProject = projectParam === null ? NaN : Number(projectParam);
const storedProject = Number(sessionStorage.getItem("portfolio-active-project"));
sessionStorage.removeItem("portfolio-active-project");
const returnProject = Number.isInteger(storedProject) ? storedProject : requestedProject;
let activeProject = Number.isInteger(returnProject) && returnProject >= 0 && returnProject < projects.length
  ? returnProject
  : 0;
let activeView = "selected";
const carouselDuration = 560;
const carouselEasing = "cubic-bezier(.4, 0, .2, 1)";

const gallery = document.querySelector("#gallery");
const dots = document.querySelector(".project-dots");
const mobileMenu = document.querySelector(".mobile-menu-overlay");
const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
let paperHover = null;

function openMobileMenu() {
  mobileMenu.hidden = false;
  mobileMenu.classList.add("open");
  mobileMenuToggle.setAttribute("aria-expanded", "true");
  mobileMenuToggle.setAttribute("aria-label", "关闭导航菜单");
  document.body.classList.add("mobile-menu-open");
}

function closeMobileMenu() {
  mobileMenu.classList.remove("open");
  mobileMenu.hidden = true;
  mobileMenuToggle.setAttribute("aria-expanded", "false");
  mobileMenuToggle.setAttribute("aria-label", "打开导航菜单");
  document.body.classList.remove("mobile-menu-open");
}

function mediaContentMarkup(project) {
  if (project.mediaType === "video") {
    return `<video src="${project.media}" aria-label="${project.title}" autoplay muted loop playsinline preload="metadata"></video>`;
  }
  if (project.mediaType === "placeholder") {
    return `<div class="project-placeholder" role="img" aria-label="${project.title}"></div>`;
  }
  return `<img src="${project.media}" alt="${project.title}">`;
}

function mediaMarkup(project) {
  return `<div class="media">${mediaContentMarkup(project)}</div>`;
}

gallery.innerHTML = `<div class="gallery-grid">${projects.map((project, index) => `
  <button class="gallery-card" type="button" data-project="${index}" aria-label="查看 ${project.title}">
    ${mediaMarkup(project)}
    <span class="gallery-copy">
      <span class="project-title">${project.title}</span>
      <span class="project-category">${project.category}</span>
      <span>${project.date}</span>
    </span>
  </button>`).join("")}</div>`;

dots.innerHTML = projects.map((_, index) => `<button class="project-dot${index === 0 ? " active" : ""}" type="button" data-project="${index}" aria-label="查看项目 ${index + 1}"></button>`).join("");

function renderProject() {
  const project = projects[activeProject];
  const previousProject = projects[(activeProject - 1 + projects.length) % projects.length];
  const nextProject = projects[(activeProject + 1) % projects.length];
  document.querySelector(".featured-media").innerHTML = mediaContentMarkup(project);
  document.querySelector(".project-arrow-left").innerHTML = mediaContentMarkup(previousProject);
  document.querySelector(".project-arrow-right").innerHTML = mediaContentMarkup(nextProject);
  document.querySelector(".selected-page .project-title").textContent = project.title;
  document.querySelector(".selected-page .project-category").textContent = project.category;
  document.querySelector(".project-description").textContent = project.description;
  document.querySelector(".project-date").textContent = project.date;
  document.querySelectorAll(".project-dot").forEach((dot, index) => dot.classList.toggle("active", index === activeProject));
  paperHover?.refresh();
  window.requestAnimationFrame(alignSideCards);
}

function alignSideCards() {
  const page = document.querySelector(".selected-page");
  if (!page.classList.contains("active") && !page.classList.contains("transition-selected")) return;
  const mediaRect = document.querySelector(".featured-media").getBoundingClientRect();
  const pageRect = page.getBoundingClientRect();
  const alignedBottom = pageRect.bottom - mediaRect.bottom;
  document.querySelectorAll(".selected-page > .project-arrow").forEach(card => {
    card.style.top = "auto";
    card.style.bottom = `${alignedBottom}px`;
  });
}

async function changeProject(direction) {
  const page = document.querySelector(".selected-page");
  if (page.classList.contains("is-transitioning")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    activeProject = (activeProject + direction + projects.length) % projects.length;
    renderProject();
    return;
  }
  if (window.matchMedia("(max-width: 900px)").matches) {
    const project = page.querySelector(".featured-project");
    page.classList.add("is-transitioning");
    const fadeOut = project.animate([
      { opacity: 1 },
      { opacity: 0 },
    ], { duration: 160, easing: "ease-out", fill: "forwards" });
    await fadeOut.finished;
    activeProject = (activeProject + direction + projects.length) % projects.length;
    renderProject();
    fadeOut.cancel();
    const fadeIn = project.animate([
      { opacity: 0 },
      { opacity: 1 },
    ], { duration: 260, easing: "cubic-bezier(.22, 1, .36, 1)" });
    await fadeIn.finished;
    page.classList.remove("is-transitioning");
    return;
  }

  const source = document.querySelector(direction > 0 ? ".project-arrow-right" : ".project-arrow-left");
  const destination = document.querySelector(direction > 0 ? ".project-arrow-left" : ".project-arrow-right");
  const media = document.querySelector(".featured-media");
  const sourceRect = source.getBoundingClientRect();
  const mediaRect = media.getBoundingClientRect();
  const destinationRect = destination.getBoundingClientRect();
  const sideWidth = sourceRect.height * 16 / 9;
  const outgoingScale = sideWidth / mediaRect.width;
  const sourceFullLeft = direction > 0 ? sourceRect.left : sourceRect.right - sideWidth;
  const destinationFullLeft = direction > 0 ? destinationRect.right - sideWidth : destinationRect.left;
  const incomingFlyer = document.createElement("div");
  const outgoingFlyer = document.createElement("div");
  const replenisher = source.cloneNode(true);

  incomingFlyer.className = "carousel-flyer";
  outgoingFlyer.className = "carousel-flyer";
  incomingFlyer.innerHTML = `${source.innerHTML}<span class="flyer-wash"></span>`;
  outgoingFlyer.innerHTML = `${media.innerHTML}<span class="flyer-wash"></span>`;
  Object.assign(incomingFlyer.style, {
    left: `${sourceFullLeft}px`,
    top: `${sourceRect.top}px`,
    width: `${sideWidth}px`,
    height: `${sourceRect.height}px`,
  });
  Object.assign(outgoingFlyer.style, {
    left: `${mediaRect.left}px`,
    top: `${mediaRect.top}px`,
    width: `${mediaRect.width}px`,
    height: `${mediaRect.height}px`,
    background: "rgb(217, 217, 217)",
  });
  const replenisherStartX = direction > 0
    ? sourceRect.left + sourceRect.width + 40
    : sourceRect.left - sourceRect.width - 40;
  replenisher.setAttribute("aria-hidden", "true");
  const replenishingProject = projects[(activeProject + direction * 2 + projects.length) % projects.length];
  replenisher.innerHTML = mediaContentMarkup(replenishingProject);
  replenisher.tabIndex = -1;
  Object.assign(replenisher.style, {
    position: "fixed",
    zIndex: "20",
    left: `${replenisherStartX}px`,
    right: "auto",
    top: `${sourceRect.top}px`,
    bottom: "auto",
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    opacity: "1",
    transform: "none",
    pointerEvents: "none",
  });
  document.body.append(incomingFlyer, outgoingFlyer, replenisher);
  page.classList.add("is-transitioning");
  source.style.opacity = "0";
  destination.style.opacity = "0";
  media.style.opacity = "0";

  const duration = carouselDuration;
  const easing = carouselEasing;
  const nextProject = (activeProject + direction + projects.length) % projects.length;
  const title = document.querySelector(".selected-page .project-title");
  const date = document.querySelector(".selected-page .project-date");
  const category = document.querySelector(".selected-page .project-category");
  const description = document.querySelector(".project-description");
  const projectTextElements = [title, category, description, date];

  const fadingOut = projectTextElements.map(element => element.animate([
    { opacity: 1 },
    { opacity: 0 },
  ], { duration: 220, easing: "ease-out", fill: "forwards" }));

  const incoming = incomingFlyer.animate([
    { transform: "translate3d(0, 0, 0) scale(1)" },
    { transform: `translate3d(${mediaRect.left - sourceFullLeft}px, ${mediaRect.top - sourceRect.top}px, 0) scale(${mediaRect.width / sideWidth})` },
  ], { duration, easing, fill: "forwards" });

  const outgoing = outgoingFlyer.animate([
    { transform: "translate3d(0, 0, 0) scale(1)" },
    { transform: `translate3d(${destinationFullLeft - mediaRect.left}px, ${destinationRect.top - mediaRect.top}px, 0) scale(${outgoingScale})` },
  ], { duration, easing, fill: "forwards" });
  const incomingWash = incomingFlyer.querySelector(".flyer-wash").animate([
    { opacity: .72 },
    { opacity: 0 },
  ], { duration: duration * .58, easing: "ease-out", fill: "forwards" });
  const outgoingWash = outgoingFlyer.querySelector(".flyer-wash").animate([
    { opacity: 0 },
    { opacity: .72 },
  ], { duration, easing, fill: "forwards" });

  const replenishing = replenisher.animate([
    { transform: "translateX(0)" },
    { transform: `translateX(${sourceRect.left - replenisherStartX}px)` },
  ], { duration, easing, fill: "forwards" });

  window.setTimeout(() => {
    activeProject = nextProject;
    renderProject();
    fadingOut.forEach(animation => animation.cancel());
    projectTextElements.forEach(element => element.animate([
      { opacity: 0 },
      { opacity: 1 },
    ], { duration: 300, easing: "ease-out" }));
  }, duration * .4);

  await Promise.all([incoming.finished, outgoing.finished, replenishing.finished, incomingWash.finished, outgoingWash.finished]);
  media.style.opacity = "";
  source.style.opacity = "";
  destination.style.opacity = "";
  await new Promise(resolve => window.requestAnimationFrame(resolve));
  incomingFlyer.remove();
  outgoingFlyer.remove();
  replenisher.remove();
  page.classList.remove("is-transitioning");
}

async function showGridWithTransition() {
  const page = document.querySelector(".selected-page");
  if (page.classList.contains("is-transitioning")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setView("gallery");
    return;
  }

  const media = document.querySelector(".featured-media");
  const copy = document.querySelector(".featured-copy");
  const arrows = [...document.querySelectorAll(".project-arrow")];
  const galleryPage = document.querySelector(".gallery-page");
  const galleryCards = [...galleryPage.querySelectorAll(".gallery-card")];
  updateViewControls("gallery");
  galleryPage.classList.add("transition-grid");
  galleryCards.forEach(card => { card.style.opacity = "0"; });

  const sourceRect = media.getBoundingClientRect();
  const target = galleryPage.querySelectorAll(".gallery-card .media")[activeProject];
  target.style.opacity = "0";
  const targetRect = target.getBoundingClientRect();
  const flyer = document.createElement("div");
  flyer.className = "carousel-flyer";
  flyer.innerHTML = media.innerHTML;
  Object.assign(flyer.style, {
    left: `${sourceRect.left}px`,
    top: `${sourceRect.top}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    background: "rgb(217, 217, 217)",
  });
  document.body.appendChild(flyer);
  page.classList.add("is-transitioning");
  media.style.opacity = "0";

  const sideAnimations = arrows.map(arrow => arrow.animate([
    { opacity: 1 },
    { opacity: 0 },
  ], { duration: 220, easing: "ease-out", fill: "forwards" }));
  const copyAnimation = copy.animate([
    { opacity: 1 },
    { opacity: 0 },
  ], { duration: 260, easing: "ease-out", fill: "forwards" });
  const dotsFade = dots.animate([
    { opacity: 1 },
    { opacity: 0 },
  ], { duration: 260, easing: "ease-out", fill: "forwards" });
  const cardAnimation = flyer.animate([
    { transform: "translate(0, 0) scale(1)" },
    { transform: `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px) scale(${targetRect.width / sourceRect.width})` },
  ], { duration: carouselDuration, easing: carouselEasing, fill: "forwards" });
  const cardReveals = galleryCards.map(card => card.animate([
      { opacity: 0 },
      { opacity: 1 },
    ], { duration: 260, easing: "ease-out", fill: "forwards" }));
  await cardAnimation.finished;
  setView("gallery");
  galleryPage.classList.remove("transition-grid");
  galleryCards.forEach(card => { card.style.opacity = ""; });
  target.style.opacity = "";
  cardReveals.forEach(animation => animation.cancel());
  await new Promise(resolve => window.requestAnimationFrame(resolve));
  flyer.remove();
  media.style.opacity = "";
  copyAnimation.cancel();
  dotsFade.cancel();
  sideAnimations.forEach(animation => animation.cancel());
  page.classList.remove("is-transitioning");
}

async function showSelectedWithTransition(projectIndex = activeProject) {
  if (activeView !== "gallery") {
    setView("selected");
    return;
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    activeProject = projectIndex;
    renderProject();
    setView("selected");
    return;
  }

  activeProject = projectIndex;
  renderProject();
  updateViewControls("selected");
  const selectedPage = document.querySelector(".selected-page");
  const galleryPage = document.querySelector(".gallery-page");
  const galleryCards = [...galleryPage.querySelectorAll(".gallery-card")];
  const sourceMedia = galleryCards[activeProject].querySelector(".media");
  const targetMedia = document.querySelector(".featured-media");
  const copy = document.querySelector(".featured-copy");
  const arrows = [...document.querySelectorAll(".project-arrow")];

  selectedPage.classList.add("transition-selected", "is-transitioning");
  targetMedia.style.opacity = "0";
  copy.style.opacity = "0";
  arrows.forEach(arrow => { arrow.style.opacity = "0"; });
  dots.style.display = "flex";
  dots.style.opacity = "0";

  const sourceRect = sourceMedia.getBoundingClientRect();
  const targetRect = targetMedia.getBoundingClientRect();
  const flyer = document.createElement("div");
  flyer.className = "carousel-flyer";
  flyer.innerHTML = sourceMedia.innerHTML;
  Object.assign(flyer.style, {
    left: `${sourceRect.left}px`,
    top: `${sourceRect.top}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
    background: "rgb(217, 217, 217)",
  });
  document.body.appendChild(flyer);
  sourceMedia.style.opacity = "0";

  const gridFades = galleryCards.map(card => card.animate([
    { opacity: 1 },
    { opacity: 0 },
  ], { duration: 260, easing: "ease-out", fill: "forwards" }));
  const detailReveal = [copy, ...arrows].map(element => element.animate([
    { opacity: 0 },
    { opacity: 1 },
  ], { duration: 260, easing: "ease-out", fill: "forwards" }));
  const dotsReveal = dots.animate([
    { opacity: 0 },
    { opacity: 1 },
  ], { duration: 260, easing: "ease-out", fill: "forwards" });
  const cardAnimation = flyer.animate([
    { transform: "translate(0, 0) scale(1)" },
    { transform: `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px) scale(${targetRect.width / sourceRect.width})` },
  ], { duration: carouselDuration, easing: carouselEasing, fill: "forwards" });

  await cardAnimation.finished;
  setView("selected");
  selectedPage.classList.remove("transition-selected");
  targetMedia.style.opacity = "";
  copy.style.opacity = "";
  arrows.forEach(arrow => { arrow.style.opacity = ""; });
  sourceMedia.style.opacity = "";
  dots.style.opacity = "";
  dotsReveal.cancel();
  detailReveal.forEach(animation => animation.cancel());
  gridFades.forEach(animation => animation.cancel());
  await new Promise(resolve => window.requestAnimationFrame(resolve));
  flyer.remove();
  selectedPage.classList.remove("is-transitioning");
}

function updateViewControls(view) {
  document.querySelectorAll(".nav-link").forEach(link => {
    const selectedWorksView = view === "selected" || view === "gallery";
    const isActive = link.dataset.view === "selected" ? selectedWorksView : link.dataset.view === view;
    link.classList.toggle("active", isActive);
  });
  document.querySelector(".list-view").classList.toggle("active", view !== "gallery");
  document.querySelector(".grid-view").classList.toggle("active", view === "gallery");
}

function setView(view) {
  activeView = view;
  document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === view));
  updateViewControls(view);
  dots.style.display = view === "selected" ? "flex" : "none";
  const viewHash = `#${view}`;
  if (window.location.hash !== viewHash) window.history.replaceState(null, "", viewHash);
  if (view === "selected") window.requestAnimationFrame(alignSideCards);
}

function setViewWithFade(view) {
  setView(view);
  const page = document.getElementById(view);
  if (!page || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  page.animate([
    { opacity: 0 },
    { opacity: 1 },
  ], {
    duration: 480,
    easing: "cubic-bezier(.22, 1, .36, 1)",
  });
}

function navigateWithFade(url) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.location.href = url;
    return;
  }
  document.body.classList.add("page-leaving");
  window.setTimeout(() => { window.location.href = url; }, 320);
}

function navigateToProject(url) {
  if (CSS.supports("view-transition-name: none") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.location.href = url;
    return;
  }
  navigateWithFade(url);
}

document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
  closeMobileMenu();
  if (button.classList.contains("grid-view") && activeView === "selected") {
    showGridWithTransition();
    return;
  }
  if (button.classList.contains("list-view") && activeView === "gallery") {
    showSelectedWithTransition();
    return;
  }
  const isNavigation = button.classList.contains("nav-link")
    || button.classList.contains("brand")
    || button.closest(".mobile-nav");
  if (isNavigation) {
    setViewWithFade(button.dataset.view);
    return;
  }
  setView(button.dataset.view);
}));
mobileMenuToggle.addEventListener("click", () => {
  if (mobileMenuToggle.getAttribute("aria-expanded") === "true") {
    closeMobileMenu();
    return;
  }
  openMobileMenu();
});
document.querySelector(".mobile-menu-close").addEventListener("click", closeMobileMenu);
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !mobileMenu.hidden) closeMobileMenu();
});
document.querySelector(".project-arrow-left").addEventListener("click", () => changeProject(-1));
document.querySelector(".project-arrow-right").addEventListener("click", () => changeProject(1));

const featuredMedia = document.querySelector(".featured-media");
const selectedPage = document.querySelector(".selected-page");

class PaperHover {
  constructor(element) {
    this.element = element;
    this.enabled = window.matchMedia("(min-width: 901px) and (min-aspect-ratio: 1 / 1) and (hover: hover) and (prefers-reduced-motion: no-preference)");
    this.pointer = { x: 0, y: 0 };
    this.target = { x: 0, y: 0 };
    this.strength = 0;
    this.targetStrength = 0;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "paper-canvas";
    this.element.appendChild(this.canvas);
    this.gl = this.canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!this.gl) return;
    this.initProgram();
    this.initMesh(32, 18);
    this.texture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.element);
    this.enabled.addEventListener("change", () => this.refresh());
    this.resize();
    this.refresh();
    this.frame = requestAnimationFrame(time => this.render(time));
  }

  shader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    return shader;
  }

  initProgram() {
    const vertex = this.shader(this.gl.VERTEX_SHADER, `
      attribute vec2 aPosition;
      attribute vec2 aUv;
      uniform vec2 uPointer;
      uniform float uStrength;
      uniform float uAspect;
      varying vec2 vUv;
      varying float vLight;
      void main() {
        vec2 p = aPosition * 0.912;
        vec2 cursor = vec2(uPointer.x, -uPointer.y);
        vec2 delta = p - cursor;
        delta.x *= uAspect;
        float distanceToCursor = length(delta);
        float localLift = exp(-distanceToCursor * distanceToCursor * 2.35);
        float edge = pow(max(abs(p.x), abs(p.y)), 3.0);
        float diagonal = p.x * uPointer.x - p.y * uPointer.y;
        float z = uStrength * (0.105 * localLift + 0.035 * edge + 0.025 * diagonal);
        float bend = uStrength * (0.034 * localLift + 0.012 * edge + 0.008 * diagonal);
        p += vec2(uPointer.x, -uPointer.y) * localLift * uStrength * 0.022;
        p += p * bend;
        p.y += uStrength * 0.020 * (1.0 - p.x * p.x) * uPointer.x;
        p.x -= uStrength * 0.010 * (1.0 - p.y * p.y) * uPointer.y;
        vUv = aUv;
        vLight = 1.0 + uStrength * (0.045 * localLift + 0.012 * diagonal);
        gl_Position = vec4(p, z, 1.0);
      }
    `);
    const fragment = this.shader(this.gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D uTexture;
      varying vec2 vUv;
      varying float vLight;
      void main() {
        vec4 color = texture2D(uTexture, clamp(vUv, vec2(0.0015), vec2(0.9985)));
        gl_FragColor = vec4(color.rgb * vLight, color.a);
      }
    `);
    this.program = this.gl.createProgram();
    this.gl.attachShader(this.program, vertex);
    this.gl.attachShader(this.program, fragment);
    this.gl.linkProgram(this.program);
    this.gl.useProgram(this.program);
    this.locations = {
      position: this.gl.getAttribLocation(this.program, "aPosition"),
      uv: this.gl.getAttribLocation(this.program, "aUv"),
      pointer: this.gl.getUniformLocation(this.program, "uPointer"),
      strength: this.gl.getUniformLocation(this.program, "uStrength"),
      aspect: this.gl.getUniformLocation(this.program, "uAspect"),
    };
  }

  initMesh(columns, rows) {
    const vertices = [];
    const indices = [];
    for (let y = 0; y <= rows; y += 1) {
      for (let x = 0; x <= columns; x += 1) {
        const u = x / columns;
        const v = y / rows;
        vertices.push(u * 2 - 1, 1 - v * 2, u, v);
      }
    }
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const a = y * (columns + 1) + x;
        const b = a + 1;
        const c = a + columns + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    const vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.gl.enableVertexAttribArray(this.locations.position);
    this.gl.vertexAttribPointer(this.locations.position, 2, this.gl.FLOAT, false, 16, 0);
    this.gl.enableVertexAttribArray(this.locations.uv);
    this.gl.vertexAttribPointer(this.locations.uv, 2, this.gl.FLOAT, false, 16, 8);
    const indexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
    this.indexCount = indices.length;
  }

  resize() {
    if (!this.gl) return;
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  refresh() {
    if (!this.gl) return;
    if (this.canvas.parentElement !== this.element) this.element.appendChild(this.canvas);
    this.element.classList.remove("paper-ready");
    this.source = this.element.querySelector("img, video");
    if (!this.enabled.matches || !this.source) {
      this.canvas.hidden = true;
      return;
    }
    this.canvas.hidden = false;
    const ready = () => {
      if (this.source && this.enabled.matches) {
        this.uploadTexture();
        this.element.classList.add("paper-ready");
      }
    };
    if (this.source instanceof HTMLImageElement) {
      if (this.source.complete && this.source.naturalWidth) ready();
      else this.source.addEventListener("load", ready, { once: true });
    } else if (this.source.readyState >= 2) ready();
    else this.source.addEventListener("loadeddata", ready, { once: true });
  }

  uploadTexture() {
    if (!this.source) return;
    try {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.source);
    } catch (_) {
      this.element.classList.remove("paper-ready");
    }
  }

  setPointer(x, y, active = true) {
    this.target.x = Math.max(-1, Math.min(1, x));
    this.target.y = Math.max(-1, Math.min(1, y));
    this.targetStrength = active && this.enabled.matches ? 1 : 0;
  }

  reset() {
    this.target.x = 0;
    this.target.y = 0;
    this.targetStrength = 0;
  }

  render() {
    if (this.gl && !this.canvas.hidden) {
      this.pointer.x += (this.target.x - this.pointer.x) * .085;
      this.pointer.y += (this.target.y - this.pointer.y) * .085;
      this.strength += (this.targetStrength - this.strength) * (this.targetStrength ? .075 : .055);
      if (this.source instanceof HTMLVideoElement && this.source.readyState >= 2) this.uploadTexture();
      this.resize();
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.useProgram(this.program);
      this.gl.uniform2f(this.locations.pointer, this.pointer.x, this.pointer.y);
      this.gl.uniform1f(this.locations.strength, this.strength);
      this.gl.uniform1f(this.locations.aspect, this.canvas.width / this.canvas.height);
      this.gl.drawElements(this.gl.TRIANGLES, this.indexCount, this.gl.UNSIGNED_SHORT, 0);
    }
    this.frame = requestAnimationFrame(() => this.render());
  }
}

paperHover = new PaperHover(featuredMedia);
let dragState = null;
let suppressFeaturedClick = false;
let trackpadDelta = 0;
let trackpadResetTimer;
let trackpadLocked = false;

selectedPage.addEventListener("wheel", event => {
  if (activeView !== "selected" || selectedPage.classList.contains("is-transitioning") || trackpadLocked) return;
  const horizontalDelta = Math.abs(event.deltaX) >= Math.abs(event.deltaY)
    ? event.deltaX
    : (event.shiftKey ? event.deltaY : 0);
  if (Math.abs(horizontalDelta) < 1) return;

  event.preventDefault();
  trackpadDelta += horizontalDelta;
  window.clearTimeout(trackpadResetTimer);
  trackpadResetTimer = window.setTimeout(() => { trackpadDelta = 0; }, 140);

  if (Math.abs(trackpadDelta) < 48) return;
  const direction = trackpadDelta > 0 ? 1 : -1;
  trackpadDelta = 0;
  trackpadLocked = true;
  changeProject(direction);
  window.setTimeout(() => { trackpadLocked = false; }, carouselDuration + 180);
}, { passive: false });

featuredMedia.addEventListener("pointerdown", event => {
  if (activeView !== "selected" || selectedPage.classList.contains("is-transitioning")) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;

  dragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastTime: performance.now(),
    velocityX: 0,
    horizontal: null,
  };
  featuredMedia.setPointerCapture(event.pointerId);
  paperHover?.reset();
  featuredMedia.classList.add("is-dragging");
  featuredMedia.style.transition = "none";
});

featuredMedia.addEventListener("pointermove", event => {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;

  if (dragState.horizontal === null && Math.hypot(deltaX, deltaY) > 6) {
    dragState.horizontal = Math.abs(deltaX) > Math.abs(deltaY);
  }
  if (!dragState.horizontal) return;

  event.preventDefault();
  const now = performance.now();
  const elapsed = Math.max(1, now - dragState.lastTime);
  dragState.velocityX = (event.clientX - dragState.lastX) / elapsed;
  dragState.lastX = event.clientX;
  dragState.lastTime = now;

  const resistedX = Math.sign(deltaX) * Math.min(Math.abs(deltaX) * .72, 120);
  featuredMedia.style.transform = `translateX(${resistedX}px)`;
});

function finishFeaturedDrag(event) {
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const state = dragState;
  dragState = null;
  const deltaX = event.clientX - state.startX;
  const shouldSwitch = state.horizontal && (Math.abs(deltaX) >= 54 || Math.abs(state.velocityX) >= .5);
  const direction = deltaX < 0 ? 1 : -1;
  suppressFeaturedClick = Boolean(state.horizontal && Math.abs(deltaX) > 6);
  window.setTimeout(() => { suppressFeaturedClick = false; }, 0);

  if (featuredMedia.hasPointerCapture(event.pointerId)) featuredMedia.releasePointerCapture(event.pointerId);
  featuredMedia.classList.remove("is-dragging");
  featuredMedia.style.transition = `transform ${shouldSwitch ? 90 : 240}ms cubic-bezier(.22, 1, .36, 1)`;
  featuredMedia.style.transform = "translateX(0)";

  window.setTimeout(() => {
    featuredMedia.style.transition = "";
    featuredMedia.style.transform = "";
    if (shouldSwitch) changeProject(direction);
  }, shouldSwitch ? 90 : 240);
}

featuredMedia.addEventListener("pointerup", finishFeaturedDrag);
featuredMedia.addEventListener("pointercancel", finishFeaturedDrag);
featuredMedia.addEventListener("click", () => {
  if (suppressFeaturedClick) return;
  const projectPage = projects[activeProject].page;
  if (activeView === "selected" && projectPage) {
    sessionStorage.setItem("portfolio-active-project", String(activeProject));
    navigateToProject(projectPage);
  }
});

featuredMedia.addEventListener("pointermove", event => {
  if (dragState || !window.matchMedia("(min-width: 901px) and (min-aspect-ratio: 1 / 1) and (hover: hover)").matches) return;
  const bounds = featuredMedia.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  paperHover?.setPointer(x * 2, y * 2);
  featuredMedia.style.transform = `translate3d(${x * 4}px, ${y * 3}px, 0) scale(1.004)`;
});

featuredMedia.addEventListener("pointerleave", () => {
  if (!dragState) {
    paperHover?.reset();
    featuredMedia.style.transform = "";
  }
});

document.addEventListener("click", event => {
  const trigger = event.target.closest("[data-project]");
  if (!trigger) return;
  activeProject = Number(trigger.dataset.project);
  renderProject();
  if (trigger.classList.contains("gallery-card")) {
    showSelectedWithTransition(activeProject);
  }
});

document.addEventListener("keydown", event => {
  if (activeView !== "selected") return;
  if (event.key === "ArrowLeft") document.querySelector(".project-arrow-left").click();
  if (event.key === "ArrowRight") document.querySelector(".project-arrow-right").click();
});

const requestedView = window.location.hash.slice(1);
const initialView = ["selected", "gallery", "about"].includes(requestedView) ? requestedView : "selected";
if (initialView !== "selected") setView(initialView);
renderProject();
window.addEventListener("resize", alignSideCards);
window.addEventListener("pageshow", () => {
  document.body.classList.remove("page-leaving");
});
