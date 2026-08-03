// =======================
// DEVICE DETECTION
// =======================

const isTouchDevice = matchMedia("(hover: none) and (pointer: coarse)").matches;

// =======================
// CONTACT BUTTON SCROLL
// =======================

document.getElementById('contact-btn').addEventListener('click', function () {
  document.getElementById('contact').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});

// =======================
// REVEAL ON SCROLL
// =======================

const revealTargets = document.querySelectorAll(
  '.about .content, .philosophy .container, .tools .heading-wrap, .tools-grid, .stats, .contact-block .container'
);

revealTargets.forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .8s ease, transform .8s ease';
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = 1;
      entry.target.style.transform = 'translateY(0)';
      io.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15
});

revealTargets.forEach(el => io.observe(el));

// =======================
// CUSTOM CURSOR
// =======================

if (!isTouchDevice) {
  const cursor = document.querySelector(".cursor");

  let mouseX = 0;
  let mouseY = 0;

  let currentX = 0;
  let currentY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    currentX += (mouseX - currentX) * 0.15;
    currentY += (mouseY - currentY) * 0.15;

    cursor.style.transform =
      `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;

    requestAnimationFrame(animateCursor);
  }

  animateCursor();

  const hoverItems = document.querySelectorAll("a, button");

  hoverItems.forEach(item => {
    item.addEventListener("mouseenter", () => {
      cursor.style.width = "28px";
      cursor.style.height = "28px";
      cursor.style.borderColor = "#ff0055";
    });

    item.addEventListener("mouseleave", () => {
      cursor.style.width = "18px";
      cursor.style.height = "18px";
      cursor.style.borderColor = "rgba(255,255,255,.6)";
    });
  });
}

// =======================
// SMOOTH SCROLL (LENIS)
// =======================

const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: !isTouchDevice,
  wheelMultiplier: 1,
  touchMultiplier: 1.5,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// =======================
// STATS ANIMATION
// =======================

const stats = document.querySelectorAll(".stat");

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    // Animate in the order the stats actually appear on screen, not raw
    // DOM order — the mobile layout reorders them with CSS `order`, so
    // sorting by position keeps the cascade reading top-to-bottom there
    // too, same as it already reads left-to-right/diagonal on desktop.
    const orderedStats = [...stats].sort((a, b) => {
      const rectA = a.getBoundingClientRect();
      const rectB = b.getBoundingClientRect();
      return rectA.top - rectB.top || rectA.left - rectB.left;
    });

    orderedStats.forEach((stat, index) => {
      setTimeout(() => {
        stat.classList.add("show");
      }, index * 180);

      const num = stat.querySelector(".num");
      animateNumber(num);
    });

    statsObserver.disconnect();
  });
}, {
  threshold: 0.2,
  rootMargin: "0px 0px -10% 0px"
});

statsObserver.observe(document.querySelector(".stats"));

function animateNumber(el) {
  const text = el.textContent;
  const target = parseInt(text);

  if (isNaN(target)) return;

  const suffix = text.replace(/[0-9]/g, '');

  let current = 0;
  const duration = 1200;
  const step = target / (duration / 16);

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

// =======================
// WATERMARK PARALLAX
// =======================

const watermarks = document.querySelectorAll(".watermark");

let parallaxTicking = false;

function updateParallax() {
  const scroll = window.scrollY;

  watermarks.forEach((wm, index) => {
    // скорость для каждого слоя
    const speed = 0.08 + index * 0.04;

    wm.style.transform =
      `translate3d(-50%, ${scroll * speed}px, 0)`;
  });

  parallaxTicking = false;
}

window.addEventListener("scroll", () => {
  if (!parallaxTicking) {
    requestAnimationFrame(updateParallax);
    parallaxTicking = true;
  }
}, { passive: true });

// =======================
// PAGE LOAD
// =======================

window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});