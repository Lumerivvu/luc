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
  const dict = translations[currentLang] || translations.en;
  const navKey = sectionIdToNavKey[sectionInfo.id];
  const sectionLabel = (navKey && dict[navKey] !== undefined) ? dict[navKey] : sectionInfo.label;
  const template = dict.hold_to_jump || "Hold to jump to {section}";
  keyHintLabel.textContent = template.replace("{section}", sectionLabel);

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

  const dict = translations[currentLang] || translations.en;

  contactSubmit.disabled = true;
  contactSubmit.textContent = dict.status_sending;
  contactStatus.textContent = "";
  contactStatus.className = "form-status";

  try {
    const response = await fetch(contactForm.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(contactForm),
    });

    if (!response.ok) throw new Error("Request failed");

    contactStatus.textContent = dict.status_success;
    contactStatus.classList.add("success");
    contactForm.reset();
    setTimeout(closeContactModal, 1800);
  } catch (err) {
    contactStatus.textContent = dict.status_error;
    contactStatus.classList.add("error");
  } finally {
    contactSubmit.disabled = false;
    contactSubmit.textContent = dict.btn_send;
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

/* ============ Localization (EN / UK) ============ */

const translations = {
  en: {
    badge_available: "Available for new projects",
    hero_title_pre: "Design That",
    hero_title_pink: "Works.",
    subtitle_role: "UI/UX & Web Designer",
    subtitle_desc: "I design interfaces that people enjoy using.",
    btn_contact: "Contact me",
    aria_contact: "Contact me",

    about_title_pre: "About",
    about_title_pink: "Me.",
    about_text: "I'm a UI/UX & Web Designer passionate about creating intuitive, functional, and visually engaging digital products. I transform ideas into user-centered experiences through research, wireframing, interface design, prototyping, and front-end development.",
    stat_years: "Years Experience",
    stat_satisfaction: "Client Satisfaction",
    stat_projects: "Completed Projects",
    stat_screens: "UI Screens Designed",

    phil_left_pink: "Design ",
    phil_left_rest: "Philosophy",
    phil_right_line1: "Functional",
    phil_right_line2: "Design",
    phil_text_left: "Great design is more than aesthetics. I believe every interface should combine clarity, usability, and visual consistency, where every element has a purpose and every decision improves the overall user experience.",
    phil_text_right: "Every successful digital product starts with understanding the people who will use it. I believe that great user experiences are built through research, empathy, and thoughtful problem-solving.",

    tools_title: "Tools.",
    figma_item1: "Wireframing",
    figma_item2: "Responsive Design",
    figma_item3: "Developer Handoff",
    html_item1: "Semantic Markup",
    html_item2: "Accessibility",
    html_item3: "SEO Structure",
    js_item1: "DOM Manipulation",
    js_item2: "API Integration",
    js_item3: "Interactive UI",
    css_item1: "Responsive Layouts",
    css_item2: "Flexbox",
    css_item3: "Grid",
    ai_item1: "Vector Graphics",
    ai_item2: "Typography",
    ai_item3: "Logos",

    reviews_title_pre: "Client",
    reviews_title_pink: "Reviews.",

    work_title_pre: "Selected",
    work_title_pink: "Work.",
    work_subtitle: "A selection of websites and digital products focused on clarity, usability and modern visual design.",
    work_tag1: "UI/UX · Landing Page",
    work_tag2: "Mobile App · UI/UX",
    work_tag3: "Web Design · Branding",
    work_tag4: "Web Design · Marketing",

    faq_title_pre: "Frequently",
    faq_title_pink: "Asked.",
    faq_q1: "What's your usual process?",
    faq_a1: "Discovery call, then research and wireframes, followed by high-fidelity UI design in Figma, a revision round, and a clean handoff with specs and assets — or a full front-end build if that's part of the scope.",
    faq_q2: "How long does a typical project take?",
    faq_a2: "A landing page usually takes 1–2 weeks. A full product design or multi-screen app can take 3–6 weeks depending on scope and revision rounds.",
    faq_q3: "Do you work with clients outside Ukraine?",
    faq_a3: "Yes — most of my clients are remote. We can communicate over email or Telegram and jump on a video call to align on any timezone.",
    faq_q4: "Do you also build the front-end, or just design?",
    faq_a4: "Both. I design in Figma and can also hand-code the front-end in HTML, CSS and JavaScript, so the final build matches the design pixel for pixel.",
    faq_q5: "How do we get started?",
    faq_a5: "Send a message through the contact form or email with a short brief of your project and goals, and I'll reply with next steps and a rough estimate.",

    contact_title_pre: "Let's",
    contact_title_pink: "Talk.",
    label_phone: "Phone",
    label_email: "Email",
    label_behance: "Behance",
    copied_text: "Copied!",
    aria_copy_phone: "Copy phone number",
    aria_copy_email: "Copy email address",

    footer_text: "© 2026 Lukomskiy — UI/UX & Web Designer",

    nav_home: "Home",
    nav_about: "About",
    nav_philosophy: "Philosophy",
    nav_tools: "Tools",
    nav_reviews: "Reviews",
    nav_work: "Work",
    nav_faq: "FAQ",
    nav_contact: "Contact",
    hold_to_jump: "Hold to jump to {section}",

    aria_to_top: "Back to top",
    aria_close: "Close",
    aria_theme_toggle: "Toggle light and dark theme",
    aria_lang_toggle: "Switch to Ukrainian",
    aria_reviews_prev: "Previous reviews",
    aria_reviews_next: "Next reviews",

    modal_title: "Let's work together.",
    modal_subtitle: "Tell me a bit about your project and I'll get back to you shortly.",
    label_name: "Name",
    label_project_type: "Project type",
    label_project_goal: "Project goal",
    ph_name: "Your name",
    ph_message: "What are you looking to build?",
    opt_uiux: "UI/UX Design",
    opt_webdesign: "Web Design",
    opt_branding: "Branding",
    opt_other: "Other",
    btn_send: "Send message",
    status_sending: "Sending...",
    status_success: "Message sent — thank you!",
    status_error: "Something went wrong. Please email me directly.",
  },

  uk: {
    badge_available: "Готовий до нових проєктів",
    hero_title_pre: "Дизайн, який",
    hero_title_pink: "працює.",
    subtitle_role: "UI/UX та Web дизайнер",
    subtitle_desc: "Я створюю інтерфейси, якими приємно користуватися.",
    btn_contact: "Зв'язатися",
    aria_contact: "Зв'язатися зі мною",

    about_title_pre: "Про",
    about_title_pink: "мене.",
    about_text: "Я UI/UX та Web дизайнер, який захоплюється створенням інтуїтивно зрозумілих, функціональних і візуально привабливих цифрових продуктів. Я перетворюю ідеї на орієнтований на користувача досвід через дослідження, вайрфреймінг, дизайн інтерфейсів, прототипування та front-end розробку.",
    stat_years: "Років досвіду",
    stat_satisfaction: "Задоволеність клієнтів",
    stat_projects: "Завершених проєктів",
    stat_screens: "Розроблених UI-екранів",

    phil_left_pink: "Дизайн ",
    phil_left_rest: "філософія",
    phil_right_line1: "Функціональний",
    phil_right_line2: "дизайн",
    phil_text_left: "Гарний дизайн — це більше, ніж естетика. Я вважаю, що кожен інтерфейс повинен поєднувати ясність, зручність використання та візуальну послідовність, де кожен елемент має мету, а кожне рішення покращує загальний досвід користувача.",
    phil_text_right: "Кожен успішний цифровий продукт починається з розуміння людей, які будуть ним користуватися. Я вважаю, що чудовий користувацький досвід будується через дослідження, емпатію та вдумливе вирішення проблем.",

    tools_title: "Інструменти.",
    figma_item1: "Вайрфреймінг",
    figma_item2: "Адаптивний дизайн",
    figma_item3: "Передача розробникам",
    html_item1: "Семантична розмітка",
    html_item2: "Доступність",
    html_item3: "SEO-структура",
    js_item1: "Робота з DOM",
    js_item2: "Інтеграція API",
    js_item3: "Інтерактивний UI",
    css_item1: "Адаптивна верстка",
    css_item2: "Flexbox",
    css_item3: "Grid",
    ai_item1: "Векторна графіка",
    ai_item2: "Типографіка",
    ai_item3: "Логотипи",

    reviews_title_pre: "Відгуки",
    reviews_title_pink: "клієнтів.",

    work_title_pre: "Вибрані",
    work_title_pink: "роботи.",
    work_subtitle: "Добірка вебсайтів та цифрових продуктів, орієнтованих на ясність, зручність використання та сучасний візуальний дизайн.",
    work_tag1: "UI/UX · Лендінг",
    work_tag2: "Мобільний застосунок · UI/UX",
    work_tag3: "Веб-дизайн · Брендинг",
    work_tag4: "Веб-дизайн · Маркетинг",

    faq_title_pre: "Часті",
    faq_title_pink: "запитання.",
    faq_q1: "Який ваш звичайний процес роботи?",
    faq_a1: "Спочатку вступний дзвінок, потім дослідження та вайрфрейми, далі детальний UI-дизайн у Figma, раунд правок і чітка передача зі специфікаціями та ассетами — або повна front-end розробка, якщо це входить у обсяг робіт.",
    faq_q2: "Скільки часу займає типовий проєкт?",
    faq_a2: "Лендінг зазвичай займає 1–2 тижні. Повний дизайн продукту або багатоекранний застосунок може зайняти 3–6 тижнів залежно від обсягу та кількості раундів правок.",
    faq_q3: "Ви працюєте з клієнтами за межами України?",
    faq_a3: "Так — більшість моїх клієнтів працюють віддалено. Ми можемо спілкуватися електронною поштою або в Telegram і організувати відеодзвінок у будь-якому часовому поясі.",
    faq_q4: "Ви також верстаєте front-end, чи лише проєктуєте дизайн?",
    faq_a4: "І те, і інше. Я проєктую дизайн у Figma, а також можу власноруч зверстати front-end на HTML, CSS та JavaScript, тож фінальний результат точно відповідає дизайну пікселем у піксель.",
    faq_q5: "З чого почати співпрацю?",
    faq_a5: "Напишіть мені через контактну форму або на пошту короткий бриф вашого проєкту і цілей, і я відповім з наступними кроками та орієнтовною оцінкою.",

    contact_title_pre: "Давайте",
    contact_title_pink: "поговоримо.",
    label_phone: "Телефон",
    label_email: "Пошта",
    label_behance: "Behance",
    copied_text: "Скопійовано!",
    aria_copy_phone: "Скопіювати номер телефону",
    aria_copy_email: "Скопіювати електронну адресу",

    footer_text: "© 2026 Lukomskiy — UI/UX та Web дизайнер",

    nav_home: "Головна",
    nav_about: "Про мене",
    nav_philosophy: "Філософія",
    nav_tools: "Інструменти",
    nav_reviews: "Відгуки",
    nav_work: "Роботи",
    nav_faq: "Питання",
    nav_contact: "Контакти",
    hold_to_jump: "Утримуйте, щоб перейти до: {section}",

    aria_to_top: "Нагору",
    aria_close: "Закрити",
    aria_theme_toggle: "Перемкнути світлу і темну тему",
    aria_lang_toggle: "Перемкнути на англійську",
    aria_reviews_prev: "Попередні відгуки",
    aria_reviews_next: "Наступні відгуки",

    modal_title: "Працюймо разом.",
    modal_subtitle: "Розкажіть трохи про свій проєкт, і я незабаром з вами зв'яжуся.",
    label_name: "Ім'я",
    label_project_type: "Тип проєкту",
    label_project_goal: "Мета проєкту",
    ph_name: "Ваше ім'я",
    ph_message: "Що б ви хотіли створити?",
    opt_uiux: "UI/UX дизайн",
    opt_webdesign: "Веб-дизайн",
    opt_branding: "Брендинг",
    opt_other: "Інше",
    btn_send: "Надіслати повідомлення",
    status_sending: "Надсилання...",
    status_success: "Повідомлення надіслано — дякую!",
    status_error: "Щось пішло не так. Будь ласка, напишіть мені на пошту напряму.",
  },
};

const sectionIdToNavKey = {
  hero: "nav_home",
  about: "nav_about",
  philosophy: "nav_philosophy",
  tools: "nav_tools",
  reviews: "nav_reviews",
  work: "nav_work",
  faq: "nav_faq",
  contact: "nav_contact",
};

const langToggle = document.getElementById("langToggle");
let currentLang = "en";

function applyTranslations(lang) {
  const dict = translations[lang] || translations.en;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (dict[key] !== undefined) el.textContent = dict[key];
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key] !== undefined) el.setAttribute("placeholder", dict[key]);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria");
    if (dict[key] !== undefined) el.setAttribute("aria-label", dict[key]);
  });

  if (langToggle) langToggle.textContent = lang === "uk" ? "EN" : "UA";
  document.documentElement.setAttribute("lang", lang === "uk" ? "uk" : "en");
}

function setLang(lang) {
  currentLang = lang === "uk" ? "uk" : "en";
  applyTranslations(currentLang);
  try {
    localStorage.setItem("lang", currentLang);
  } catch (err) {}
}

if (langToggle) {
  langToggle.addEventListener("click", () => {
    setLang(currentLang === "uk" ? "en" : "uk");
  });
}

(function initLang() {
  let savedLang = null;
  try {
    savedLang = localStorage.getItem("lang");
  } catch (err) {}
  setLang(savedLang === "uk" ? "uk" : "en");
})();

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