const isTouchDevice = matchMedia("(hover: none) and (pointer: coarse)").matches;

const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: !isTouchDevice,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
});

/* ============ Opening / preloader ============ */

const preloaderEl = document.getElementById("preloader");
const preloaderActive = !!preloaderEl && document.documentElement.classList.contains("preloading");
let pageLoaded = document.readyState === "complete";

function startHeroIntro() {
  if (document.body.classList.contains("loaded")) return;
  document.body.classList.add("loaded");

  const btn = document.querySelector(".btn-contact");
  if (btn) {
    btn.addEventListener("animationend", () => {
      btn.style.animation = "";
    });
  }
}

function runPreloader() {
  const numEl = document.getElementById("preloaderNum");
  const barEl = document.getElementById("preloaderBar");
  const DURATION = 1600;   // counter length, ms
  const MAX_WAIT = 5000;   // don't wait for slow assets longer than this
  const startTime = performance.now();
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  let cleaned = false;

  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    preloaderEl.remove();
    document.documentElement.classList.remove("preloading");
    lenis.start();
    lenis.resize();
  }

  function finish() {
    setTimeout(() => {
      preloaderEl.classList.add("exit");
      setTimeout(startHeroIntro, 450);
      preloaderEl.addEventListener("transitionend", (e) => {
        if (e.target === preloaderEl && e.propertyName === "transform") cleanup();
      });
      setTimeout(cleanup, 1600);
    }, 300);
  }

  function tick(now) {
    const elapsed = now - startTime;
    let shown = easeOut(Math.min(elapsed / DURATION, 1));
    if (!pageLoaded && elapsed < MAX_WAIT) shown = Math.min(shown, 0.94);

    numEl.textContent = String(Math.round(shown * 100)).padStart(2, "0");
    barEl.style.transform = `scaleX(${shown})`;

    if (shown >= 1) {
      finish();
      return;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

if (preloaderActive) {
  lenis.stop();
  window.scrollTo(0, 0);
  runPreloader();
} else if (preloaderEl) {
  preloaderEl.remove();
}

function scrollToSection(id) {
  if (document.documentElement.classList.contains("preloading")) return;
  const target = document.getElementById(id);
  if (!target) return;

  if (typeof lenis !== "undefined") {
    lenis.scrollTo(target, { lock: true, onComplete: () => lenis.resize() });
  } else {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

const revealTargets = document.querySelectorAll(
  ".about .content, .philosophy .container, .tools .heading-wrap, .tools-grid, .stats, .reviews .heading-wrap, .reviews-track, .work .heading-wrap, .work-list, .faq .heading-wrap, .faq-list, .contact-block .container"
);

const prefersReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

revealTargets.forEach(el => {
  el.style.opacity = 0;
  el.style.transformOrigin = "center bottom";
  el.style.transform = prefersReducedMotion
    ? "translateY(24px)"
    : "perspective(1200px) rotateX(14deg) translateY(50px) scale(.94)";
  el.style.transition = prefersReducedMotion
    ? "opacity .8s ease, transform .8s ease"
    : "opacity 1s cubic-bezier(.2,.8,.2,1), transform 1s cubic-bezier(.2,.8,.2,1)";
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.style.opacity = 1;
    entry.target.style.transform = prefersReducedMotion
      ? "translateY(0)"
      : "perspective(1200px) rotateX(0deg) translateY(0) scale(1)";
    entry.target.querySelectorAll(".split-heading").forEach(playSplitHeading);
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

/* ============ Text effects: heading word reveal + scroll-filled paragraphs ============ */

function wrapWords(root, build) {
  const words = [];

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
          } else {
            const el = build(part, words.length);
            words.push(el);
            frag.appendChild(el);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };

  walk(root);
  return words;
}

function playSplitHeading(heading) {
  if (heading.classList.contains("split-in")) return;
  heading.classList.add("split-in");
  const count = heading.querySelectorAll(".split-word").length;
  setTimeout(() => heading.classList.add("split-done"), 900 + count * 70 + 200);
}

const fillParagraphs = [];

if (!prefersReducedMotion) {
  document.querySelectorAll("main h2").forEach((heading) => {
    wrapWords(heading, (word, i) => {
      const outer = document.createElement("span");
      outer.className = "split-word";
      const inner = document.createElement("span");
      inner.textContent = word;
      inner.style.setProperty("--i", i);
      outer.appendChild(inner);
      return outer;
    });
    heading.classList.add("split-heading");
  });

  document.querySelectorAll(".about .content > p, .phil-texts p").forEach((p) => {
    const words = wrapWords(p, (word) => {
      const el = document.createElement("span");
      el.className = "fill-word";
      el.textContent = word;
      return el;
    });
    fillParagraphs.push({ el: p, words, lit: 0 });
  });
}

let lastFillScroll = -1;

function updateTextFill(force) {
  if (!fillParagraphs.length) return;
  const scroll = window.scrollY;
  if (!force && scroll === lastFillScroll) return;
  lastFillScroll = scroll;

  const vh = window.innerHeight;

  fillParagraphs.forEach((item) => {
    const rect = item.el.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > vh + 200) {
      // far off-screen: keep the state that matches the scroll direction
      const target = rect.bottom < 0 ? item.words.length : 0;
      if (item.lit !== target) {
        item.words.forEach((w, i) => w.classList.toggle("lit", i < target));
        item.lit = target;
      }
      return;
    }

    const progress = Math.max(0, Math.min(1, (vh * 0.9 - rect.top) / (vh * 0.45 + rect.height)));
    const litCount = Math.round(progress * item.words.length);
    if (litCount === item.lit) return;

    item.words.forEach((w, i) => w.classList.toggle("lit", i < litCount));
    item.lit = litCount;
  });
}

function raf(time) {
  lenis.raf(time);
  updateCursor();
  updateParallax();
  updateTextFill();
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    lenis.resize();
    updateTextFill(true);
  }, 150);
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
const navSections = ["hero", "about", "philosophy", "tools", "reviews", "work", "faq", "contact"]
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
  "5": { id: "reviews", label: "Reviews" },
  "6": { id: "work", label: "Work" },
  "7": { id: "faq", label: "FAQ" },
  "8": { id: "contact", label: "Contact" },
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
  pageLoaded = true;
  if (!preloaderActive) startHeroIntro();
});

/* ============ Cursor spotlight glow ============ */

const spotlightEl = document.querySelector(".spotlight");

if (!isTouchDevice && !prefersReducedMotion && spotlightEl) {
  document.addEventListener("mousemove", (e) => {
    spotlightEl.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    spotlightEl.classList.add("active");
  }, { passive: true });

  document.addEventListener("mouseleave", () => {
    spotlightEl.classList.remove("active");
  });
}

/* ============ Hero 3D tilt (follows cursor) ============ */

const heroSectionEl = document.getElementById("hero");
const heroContentEl = heroSectionEl ? heroSectionEl.querySelector(".content") : null;

if (!isTouchDevice && !prefersReducedMotion && heroSectionEl && heroContentEl) {
  heroSectionEl.addEventListener("mousemove", (e) => {
    const rect = heroSectionEl.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateY = px * 10;
    const rotateX = -py * 8;
    heroContentEl.style.transition = "transform .1s linear";
    heroContentEl.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  }, { passive: true });

  heroSectionEl.addEventListener("mouseleave", () => {
    heroContentEl.style.transition = "transform .6s cubic-bezier(.2,.8,.2,1)";
    heroContentEl.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
  });
}

/* ============ Theme toggle ============ */

const themeToggle = document.getElementById("themeToggle");

function setTheme(theme) {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  try {
    localStorage.setItem("theme", theme);
  } catch (err) {}
}

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const isLight = document.documentElement.getAttribute("data-theme") === "light";
    setTheme(isLight ? "dark" : "light");
  });
}

/* ============ Reviews carousel arrows ============ */

const reviewsTrack = document.getElementById("reviewsTrack");
const reviewsPrev = document.getElementById("reviewsPrev");
const reviewsNext = document.getElementById("reviewsNext");

if (reviewsTrack && reviewsPrev && reviewsNext) {
  const getReviewScrollAmount = () => {
    const card = reviewsTrack.querySelector(".review-card");
    if (!card) return reviewsTrack.clientWidth;
    const gap = parseFloat(getComputedStyle(reviewsTrack).columnGap || 0) || 0;
    return card.getBoundingClientRect().width + gap;
  };

  const updateReviewsNav = () => {
    const maxScroll = reviewsTrack.scrollWidth - reviewsTrack.clientWidth - 1;
    const atStart = reviewsTrack.scrollLeft <= 0;
    const atEnd = maxScroll <= 0 || reviewsTrack.scrollLeft >= maxScroll;
    reviewsPrev.disabled = atStart;
    reviewsNext.disabled = atEnd;
    reviewsTrack.classList.toggle("at-start", atStart);
    reviewsTrack.classList.toggle("at-end", atEnd);
  };

  reviewsPrev.addEventListener("click", () => {
    reviewsTrack.scrollBy({ left: -getReviewScrollAmount(), behavior: "smooth" });
  });

  reviewsNext.addEventListener("click", () => {
    reviewsTrack.scrollBy({ left: getReviewScrollAmount(), behavior: "smooth" });
  });

  reviewsTrack.addEventListener("scroll", updateReviewsNav, { passive: true });
  window.addEventListener("resize", updateReviewsNav);
  window.addEventListener("load", updateReviewsNav);
  updateReviewsNav();
}

/* ============ FAQ accordion ============ */

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
  const question = item.querySelector(".faq-question");
  const answer = item.querySelector(".faq-answer");

  question.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");

    faqItems.forEach(other => {
      if (other === item) return;
      other.classList.remove("open");
      other.querySelector(".faq-question").setAttribute("aria-expanded", "false");
      other.querySelector(".faq-answer").style.maxHeight = null;
    });

    if (isOpen) {
      item.classList.remove("open");
      question.setAttribute("aria-expanded", "false");
      answer.style.maxHeight = null;
    } else {
      item.classList.add("open");
      question.setAttribute("aria-expanded", "true");
      answer.style.maxHeight = answer.scrollHeight + "px";
    }
  });
});

window.addEventListener("resize", () => {
  const openItem = document.querySelector(".faq-item.open");
  if (!openItem) return;
  const answer = openItem.querySelector(".faq-answer");
  answer.style.maxHeight = answer.scrollHeight + "px";
});

/* ============ Copy to clipboard (phone / email) ============ */

document.querySelectorAll(".copy-btn").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    const value = btn.dataset.copy;

    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      const temp = document.createElement("textarea");
      temp.value = value;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }

    btn.classList.add("copied");
    setTimeout(() => btn.classList.remove("copied"), 1600);
  });
});

/* ============ Back to top button ============ */

const toTopBtn = document.getElementById("toTopBtn");

if (toTopBtn) {
  window.addEventListener("scroll", () => {
    toTopBtn.classList.toggle("visible", window.scrollY > window.innerHeight * 0.8);
  }, { passive: true });

  toTopBtn.addEventListener("click", () => scrollToSection("hero"));
}

/* ============ 3D tilt on tool cards & work rows ============ */

if (!isTouchDevice && !prefersReducedMotion) {
  const tiltEls = document.querySelectorAll(".tool-group, .work-item, .review-card");

  tiltEls.forEach(el => {
    const isGentle = el.classList.contains("work-item") || el.classList.contains("review-card");

    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const rotateY = px * (isGentle ? 3 : 9);
      const rotateX = -py * (isGentle ? 3 : 9);
      const lift = isGentle ? "translateY(-3px)" : "translateY(-8px)";

      el.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${lift}`;
    }, { passive: true });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "";
    });
  });
}