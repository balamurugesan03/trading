// Point these at your deployed app/API before going live.
const APP_LOGIN_URL = 'http://localhost:5173/login';
const APP_REGISTER_URL = 'http://localhost:5173/register';
const API_BASE_URL = 'http://localhost:5000/api';

document.querySelectorAll('[data-login-link]').forEach((el) => (el.href = APP_LOGIN_URL));
document.querySelectorAll('[data-register-link]').forEach((el) => (el.href = APP_REGISTER_URL));
document.getElementById('year').textContent = new Date().getFullYear();

gsap.registerPlugin(ScrollTrigger);

// ---------- 3D coin edge geometry ----------
// Builds the beveled rim of each .coin3d as a ring of thin rotated slices, forming a
// true cylinder (front face + back face + edge) so the coin has real depth as it spins,
// instead of a flat circle faking rotation.
// The coin's faces are discs facing the camera (normal along Z), spinning around a
// vertical Y axis — like a coin twirled between two fingers, not a can standing on end.
// Each rim slice must therefore have its OWN normal pointing radially outward (in the
// XY plane) with its "height" running tangentially and its "width" running along Z
// (the coin's thickness) — that's what rotateZ(angle) rotateY(90deg) translateZ(radius)
// produces. (rotateY(angle) translateZ(radius) alone builds a cylinder standing on its
// end, which is the wrong orientation and pokes slices straight out at the camera.)
document.querySelectorAll('.coin3d-edge').forEach((edge) => {
  const radius = parseFloat(edge.dataset.radius) || 26;
  const thickness = parseFloat(edge.dataset.thickness) || 9;
  const count = parseInt(edge.dataset.slices, 10) || 18;
  const segLength = (2 * Math.PI * radius) / count + 0.8;

  for (let i = 0; i < count; i++) {
    const angle = (360 / count) * i;
    const slice = document.createElement('span');
    slice.style.width = `${thickness}px`;
    slice.style.height = `${segLength}px`;
    slice.style.marginLeft = `${-thickness / 2}px`;
    slice.style.marginTop = `${-segLength / 2}px`;
    slice.style.transform = `rotateZ(${angle}deg) rotateY(90deg) translateZ(${radius}px)`;
    edge.appendChild(slice);
  }
});

// ---------- Loader ----------
window.addEventListener('load', () => {
  gsap.to('#loader', {
    opacity: 0,
    duration: 0.5,
    delay: 0.2,
    onComplete: () => document.getElementById('loader').remove(),
  });
});

// ---------- Nav (glass + hide on scroll down / show on scroll up) ----------
const nav = document.getElementById('nav');
ScrollTrigger.create({
  start: 'top -60',
  onUpdate: (self) => {
    nav.classList.toggle('scrolled', self.scroll() > 60);
    if (!nav.classList.contains('open')) {
      const goingDown = self.direction === 1;
      nav.classList.toggle('nav-hidden', goingDown && self.scroll() > 220);
    }
  },
});

const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach((a) =>
  a.addEventListener('click', () => nav.classList.remove('open'))
);

// ---------- Hero entrance (fade + scale 0.8→1 + y 80→0 + blur 20px→0, Power4/Expo, 1.2s) ----------
gsap.set('.hero-title .w', { yPercent: 120, opacity: 0 });
gsap.set('.reveal-hero', { y: 80, scale: 0.8, opacity: 0, filter: 'blur(20px)' });

const heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } });

heroTl
  .to('.hero-title .w', { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.03, ease: 'power4.out' })
  .to('.reveal-hero', { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.12 }, '-=0.5')
  .to('.chart-line', { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, '-=0.7')
  .to('.panel-bars span', { scaleY: 1, duration: 0.7, stagger: 0.06, ease: 'back.out(1.7)' }, '-=1')
  .to('.float-card-1', { opacity: 1, duration: 0.6 }, '-=0.5')
  .to('.float-card-2', { opacity: 1, duration: 0.6 }, '-=0.4')
  .to(['.coin', '.cube', '.orbit-ring'], { opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, '-=0.6');

// Floating idle motion for stat cards
gsap.to('.float-card-1', { y: '+=10', duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
gsap.to('.float-card-2', { y: '-=10', duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.3 });

// Infinite floating drift for coins/cubes (the 3D spin itself is a CSS animation on
// the nested .coin3d/.cube3d — keeping it off this GSAP tween avoids the two fighting
// over the same transform).
document.querySelectorAll('.coin').forEach((el, i) => {
  gsap.to(el, {
    y: `+=${14 + i * 4}`, x: `+=${(i % 2 === 0 ? 1 : -1) * (8 + i * 3)}`,
    duration: 6 + i * 1.4, repeat: -1, yoyo: true, ease: 'sine.inOut',
  });
});
document.querySelectorAll('.cube').forEach((el, i) => {
  gsap.to(el, {
    y: `+=${10 + i * 5}`,
    duration: 8 + i * 2, repeat: -1, yoyo: true, ease: 'sine.inOut',
  });
});
gsap.to('.orbit-ring', { rotate: 360, duration: 40, repeat: -1, ease: 'none' });

// ---------- Scroll reveals ----------
gsap.set('.reveal', { y: 40, scale: 0.96, filter: 'blur(6px)' });
gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    duration: 1,
    ease: 'power4.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

// Staggered grid children
function staggerGrid(selector) {
  document.querySelectorAll(selector).forEach((grid) => {
    const items = grid.children;
    gsap.set(items, { opacity: 0, y: 36 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power4.out',
      scrollTrigger: { trigger: grid, start: 'top 85%' },
    });
  });
}
staggerGrid('.steps');
staggerGrid('.features-grid');
loadPackages();

// ---------- Live packages (admin-managed, from the trading platform API) ----------
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function formatUsd(amount) {
  return Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

async function loadPackages() {
  const grid = document.getElementById('packagesGrid');
  try {
    const res = await fetch(`${API_BASE_URL}/packages/public`);
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const data = await res.json();
    const packages = data.packages || [];
    if (!packages.length) throw new Error('No active packages returned');

    const desc = document.getElementById('packagesDesc');
    if (desc) {
      desc.textContent =
        'Live packages configured by our team. Every package includes full dashboard access, daily ROI tracking, and referral eligibility.';
    }

    grid.innerHTML = packages
      .map(
        (pkg) => `
      <div class="package-card">
        <span class="package-name">${escapeHtml(pkg.name)}</span>
        <div class="package-range">$${formatUsd(pkg.minAmount)} <span>–</span> $${formatUsd(pkg.maxAmount)}</div>
        <p class="package-desc">${escapeHtml(pkg.description) || 'A curated investment tier with daily ROI and referral eligibility.'}</p>
        <ul class="package-features">
          <li>Daily ROI accrual</li>
          <li>Dashboard &amp; wallet access</li>
          <li>Referral income eligible</li>
        </ul>
        <a href="${APP_REGISTER_URL}" class="btn btn-outline btn-block">Get Started</a>
      </div>`
      )
      .join('');
  } catch (err) {
    // Backend unreachable or no active packages yet — keep the static sample cards already in the HTML.
  } finally {
    staggerGrid('.packages-grid');
  }
}

// Referral level cards
gsap.set('.level-card', { opacity: 0, scale: 0.85 });
gsap.to('.level-card', {
  opacity: 1,
  scale: 1,
  duration: 0.6,
  stagger: 0.15,
  ease: 'back.out(1.6)',
  scrollTrigger: { trigger: '.referral-visual', start: 'top 80%' },
});
gsap.to('.level-card', { y: '+=8', duration: 2.8, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.3, from: 'random' } });
gsap.fromTo(
  '.level-lines path',
  { opacity: 0 },
  {
    opacity: 0.5,
    duration: 1,
    stagger: 0.15,
    scrollTrigger: { trigger: '.referral-visual', start: 'top 75%' },
  }
);

// ---------- Counters ----------
document.querySelectorAll('[data-counter]').forEach((el) => {
  const target = parseFloat(el.getAttribute('data-counter'));
  const prefix = el.getAttribute('data-prefix') || '';
  const suffix = el.getAttribute('data-suffix') || '';
  const counter = { val: 0 };

  ScrollTrigger.create({
    trigger: el,
    start: 'top 90%',
    once: true,
    onEnter: () => {
      gsap.to(counter, {
        val: target,
        duration: 1.8,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = prefix + Math.floor(counter.val).toLocaleString('en-US') + suffix;
        },
      });
    },
  });
});

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-item').forEach((item) => {
  const q = item.querySelector('.faq-q');
  const a = item.querySelector('.faq-a');

  q.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item.open').forEach((openItem) => {
      if (openItem !== item) {
        openItem.classList.remove('open');
        gsap.to(openItem.querySelector('.faq-a'), { height: 0, duration: 0.35, ease: 'power2.inOut' });
      }
    });

    if (isOpen) {
      item.classList.remove('open');
      gsap.to(a, { height: 0, duration: 0.35, ease: 'power2.inOut' });
    } else {
      item.classList.add('open');
      gsap.set(a, { height: 'auto' });
      const full = a.offsetHeight;
      gsap.fromTo(a, { height: 0 }, { height: full, duration: 0.4, ease: 'power2.inOut' });
    }
  });
});

// ---------- Testimonial carousel ----------
const track = document.getElementById('testiTrack');
const dotsWrap = document.getElementById('testiDots');
const slides = track.children.length;
let current = 0;

for (let i = 0; i < slides; i++) {
  const dot = document.createElement('button');
  if (i === 0) dot.classList.add('active');
  dot.addEventListener('click', () => goTo(i));
  dotsWrap.appendChild(dot);
}

function goTo(index) {
  current = (index + slides) % slides;
  gsap.to(track, { xPercent: -100 * current, duration: 0.6, ease: 'power3.inOut' });
  [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === current));
}

let autoplay = setInterval(() => goTo(current + 1), 5500);
[track, dotsWrap].forEach((el) =>
  el.addEventListener('mouseenter', () => clearInterval(autoplay))
);
[track, dotsWrap].forEach((el) =>
  el.addEventListener('mouseleave', () => (autoplay = setInterval(() => goTo(current + 1), 5500)))
);

// ---------- Hero visual parallax + mouse-tracked coin/cube drift ----------
const heroVisual = document.querySelector('.hero-visual');
const finePointer = window.matchMedia('(pointer: fine)').matches;
if (heroVisual && finePointer) {
  heroVisual.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to('.panel-main', { rotateY: x * 6, rotateX: -y * 6, duration: 0.6, ease: 'power2.out', transformPerspective: 800 });
    gsap.to('.coin', { x: (i) => x * (18 + i * 6), y: (i) => y * (18 + i * 6), duration: 0.8, ease: 'power2.out' });
  });
  heroVisual.addEventListener('mouseleave', () => {
    gsap.to('.panel-main', { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power2.out' });
  });
}

// ---------- Cursor glow (desktop only) ----------
const cursorGlow = document.getElementById('cursorGlow');
if (cursorGlow && finePointer) {
  const glowX = gsap.quickTo(cursorGlow, 'x', { duration: 0.5, ease: 'power3.out' });
  const glowY = gsap.quickTo(cursorGlow, 'y', { duration: 0.5, ease: 'power3.out' });
  window.addEventListener('mousemove', (e) => {
    cursorGlow.classList.add('active');
    glowX(e.clientX);
    glowY(e.clientY);
  });
  document.addEventListener('mouseleave', () => cursorGlow.classList.remove('active'));
}

// ---------- Magnetic buttons ----------
if (finePointer) {
  document.querySelectorAll('.btn').forEach((btn) => {
    const btnX = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
    const btnY = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btnX(x * 0.25);
      btnY(y * 0.35);
    });
    btn.addEventListener('mouseleave', () => { btnX(0); btnY(0); });
  });
}

// ---------- Interactive 3D tilt cards ----------
if (finePointer) {
  document.querySelectorAll('.feature-card, .package-card, .step, .testimonial-card').forEach((card) => {
    card.style.transformPerspective = '900px';
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, { rotateY: x * 8, rotateX: -y * 8, duration: 0.4, ease: 'power2.out' });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.5, ease: 'power2.out' });
    });
  });
}

// ---------- Footer reveal (fade upward + line draw) ----------
const footer = document.querySelector('.footer');
if (footer) {
  gsap.set('.footer-grid, .footer-bottom', { opacity: 0, y: 40 });
  ScrollTrigger.create({
    trigger: footer,
    start: 'top 90%',
    once: true,
    onEnter: () => {
      footer.classList.add('line-drawn');
      gsap.to('.footer-grid, .footer-bottom', { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power4.out' });
    },
  });
}

// ---------- Background particles ----------
(function initParticles() {
  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let width, height;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(70, Math.floor((width * height) / 22000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 77, 109, 0.55)';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(255, 45, 85, ${0.12 * (1 - dist / 120)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    if (!reduceMotion) requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  tick();

  // gentle scroll-linked parallax drift
  gsap.to(canvas, {
    yPercent: 8,
    ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1 },
  });
})();
