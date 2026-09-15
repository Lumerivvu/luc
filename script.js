const isTouchDevice = matchMedia("(hover: none) and (pointer: coarse)").matches;

const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: !isTouchDevice,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
});

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;

  if (typeof lenis !== "undefined") {
    lenis.scrollTo(target, { lock: true, onComplete: () => lenis.resize() });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

const revealTargets = document.querySelectorAll(
  ".about .content, .philosophy .container, .tools .heading-wrap, .tools-grid, .stats, .work .heading-wrap, .work-list, .contact-block .container"
);

revealTargets.forEach(el => {
  el.style.opacity = 0;
  el.style.transform = "translateY(24px)";
  el.style.transition = "opacity .8s ease, transform .8s ease";
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.style.opacity = 1;
    entry.target.style.transform = "translateY(0)";
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => revealObserver.observe(el));

let cursorEl = null;
let cursorMouseX = 0;
let cursorMouseY = 0;
let cursorCurrentX = 0;
let cursorCurrentY = 0;
let cursorHasMoved = false;

if (!isTouchDevice) {
  cursorEl = document.querySelector(".cursor");

  document.addEventListener("mousemove", (e) => {
    cursorMouseX = e.clientX;
    cursorMouseY = e.clientY;
    if (!cursorHasMoved) {
      cursorCurrentX = cursorMouseX;
      cursorCurrentY = cursorMouseY;
      cursorHasMoved = true;
    }
  }, { passive: true });

  document.addEventListener("mouseover", (e) => {
    if (e.target.closest("a, button")) {
      cursorEl.style.width = "28px";
      cursorEl.style.height = "28px";
      cursorEl.style.borderColor = "#ff0055";
    }
  }, { passive: true });

  document.addEventListener("mouseout", (e) => {
    if (e.target.closest("a, button") && !e.relatedTarget?.closest("a, button")) {
      cursorEl.style.width = "18px";
      cursorEl.style.height = "18px";
      cursorEl.style.borderColor = "rgba(255,255,255,.6)";
    }
  }, { passive: true });
}

function updateCursor() {
  if (!cursorEl || !cursorHasMoved) return;
  cursorCurrentX += (cursorMouseX - cursorCurrentX) * 0.25;
  cursorCurrentY += (cursorMouseY - cursorCurrentY) * 0.25;
  cursorEl.style.transform = `translate(${cursorCurrentX}px, ${cursorCurrentY}px) translate(-50%, -50%)`;
}

const watermarks = document.querySelectorAll(".watermark");
const PARALLAX_MAX_OFFSET = 120;
let lastParallaxScroll = -1;

function updateParallax() {
  const scroll = window.scrollY;
  if (scroll === lastParallaxScroll) return;
  lastParallaxScroll = scroll;

  watermarks.forEach((wm, index) => {
    const speed = 0.08 + index * 0.04;
    const offset = Math.max(-PARALLAX_MAX_OFFSET, Math.min(PARALLAX_MAX_OFFSET, scroll * speed));
    wm.style.transform = `translate3d(-50%, ${offset}px, 0)`;
  });
}

function raf(time) {
  lenis.raf(time);
  updateCursor();
  updateParallax();
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => lenis.resize(), 150);
});

function animateNumber(el) {
  const text = el.textContent;
  const target = parseInt(text);
  if (isNaN(target)) return;

  const suffix = text.replace(/[0-9]/g, "");
  const duration = 1200;
  const step = target / (duration / 16);
  let current = 0;

  function update() {
    current += step;
    if (current >= target) {
      el.textContent = target + suffix;
      return;
    }
    el.textContent = Math.floor(current) + suffix;
    requestAnimationFrame(update);
  }

  update();
}

const stats = document.querySelectorAll(".stat");
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const orderedStats = [...stats].sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top || rectA.left - rectB.left;
    });

    orderedStats.forEach((stat, index) => {
      setTimeout(() => stat.classList.add("show"), index * 180);
      animateNumber(stat.querySelector(".num"));
    });

    statsObserver.disconnect();
  });
}, { threshold: 0.2, rootMargin: "0px 0px -10% 0px" });

statsObserver.observe(document.querySelector(".stats"));

const dockNav = document.getElementById("dockNav");
const dockLinks = document.querySelectorAll(".dock-link");
const heroSection = document.getElementById("hero");
const navSections = ["hero", "about", "philosophy", "tools", "work", "contact"]
  .map(id => document.getElementById(id))
  .filter(Boolean);

const dockVisibilityObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => dockNav.classList.toggle("visible", !entry.isIntersecting));
}, { threshold: 0, rootMargin: "-40% 0px -40% 0px" });

if (heroSection) dockVisibilityObserver.observe(heroSection);

const activeSectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    dockLinks.forEach(link => link.classList.toggle("active", link.dataset.section === id));
  });
}, { threshold: 0, rootMargin: "-45% 0px -45% 0px" });

navSections.forEach(section => activeSectionObserver.observe(section));

dockLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    scrollToSection(link.dataset.section);
  });
});

const KEY_HOLD_DURATION = 450;
const RING_CIRCUMFERENCE = 2 * Math.PI * 20;

const keySectionMap = {
  "1": { id: "hero", label: "Home" },
  "2": { id: "about", label: "About" },
  "3": { id: "philosophy", label: "Philosophy" },
  "4": { id: "tools", label: "Tools" },
  "5": { id: "work", label: "Work" },
  "6": { id: "contact", label: "Contact" },
};

const keyHint = document.getElementById("keyHint");
const keyHintRing = document.getElementById("keyHintRing");
const keyHintNum = document.getElementById("keyHintNum");
const keyHintLabel = document.getElementById("keyHintLabel");

let activeHoldKey = null;
let holdTimeoutId = null;

function isTypingContext() {
  const el = document.activeElement;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
}

function showKeyHint(key, sectionInfo) {
  keyHintNum.textContent = key;
  keyHintLabel.textContent = `Hold to jump to ${sectionInfo.label}`;

  keyHintRing.style.transition = "none";
  keyHintRing.style.strokeDashoffset = RING_CIRCUMFERENCE;
  void keyHintRing.getBoundingClientRect();
  keyHintRing.style.transition = `stroke-dashoffset ${KEY_HOLD_DURATION}ms linear`;
  keyHintRing.style.strokeDashoffset = "0";

  keyHint.classList.add("visible");
}

function hideKeyHint() {
  keyHint.classList.remove("visible");
  keyHintRing.style.transition = "none";
  keyHintRing.style.strokeDashoffset = RING_CIRCUMFERENCE;
}

window.addEventListener("keydown", (e) => {
  if (e.repeat || isTypingContext()) return;

  const sectionInfo = keySectionMap[e.key];
  if (!sectionInfo || activeHoldKey) return;

  activeHoldKey = e.key;
  showKeyHint(e.key, sectionInfo);

  holdTimeoutId = setTimeout(() => {
    scrollToSection(sectionInfo.id);
    hideKeyHint();
    activeHoldKey = null;
  }, KEY_HOLD_DURATION);
});

window.addEventListener("keyup", (e) => {
  if (e.key !== activeHoldKey) return;
  clearTimeout(holdTimeoutId);
  hideKeyHint();
  activeHoldKey = null;
});

window.addEventListener("blur", () => {
  if (!activeHoldKey) return;
  clearTimeout(holdTimeoutId);
  hideKeyHint();
  activeHoldKey = null;
});

const contactOverlay = document.getElementById("contactOverlay");
const contactForm = document.getElementById("contactForm");
const contactSubmit = document.getElementById("contactSubmit");
const contactStatus = document.getElementById("contactStatus");

function openContactModal() {
  contactOverlay.classList.add("visible");
  lenis.stop();
  document.getElementById("cf-name")?.focus();
}

function closeContactModal() {
  contactOverlay.classList.remove("visible");
  lenis.start();
}

document.getElementById("contact-btn").addEventListener("click", openContactModal);
document.getElementById("contactClose").addEventListener("click", closeContactModal);

contactOverlay.addEventListener("click", (e) => {
  if (e.target === contactOverlay) closeContactModal();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && contactOverlay.classList.contains("visible")) closeContactModal();
});

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  contactSubmit.disabled = true;
  contactSubmit.textContent = "Sending...";
  contactStatus.textContent = "";
  contactStatus.className = "form-status";

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(contactForm),
    });

    if (!response.ok) throw new Error("Request failed");

    contactStatus.textContent = "Message sent — thank you!";
    contactStatus.classList.add("success");
    contactForm.reset();
    setTimeout(closeContactModal, 1800);
  } catch (err) {
    contactStatus.textContent = "Something went wrong. Please email me directly.";
    contactStatus.classList.add("error");
  } finally {
    contactSubmit.disabled = false;
    contactSubmit.textContent = "Send message";
  }
});

window.addEventListener("load", () => {
  document.body.classList.add("loaded");

  const btn = document.querySelector(".btn-contact");
  btn.addEventListener("animationend", () => {
    btn.style.animation = "";
  });
});