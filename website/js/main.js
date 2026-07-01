// Point these at your deployed app/API before going live.
const APP_LOGIN_URL = 'http://localhost:5173/login';
const APP_REGISTER_URL = 'http://localhost:5173/register';
const API_BASE_URL = 'http://localhost:5000/api';

document.querySelectorAll('[data-login-link]').forEach((el) => (el.href = APP_LOGIN_URL));
document.querySelectorAll('[data-register-link]').forEach((el) => (el.href = APP_REGISTER_URL));
document.getElementById('year').textContent = new Date().getFullYear();

gsap.registerPlugin(ScrollTrigger);

// ---------- Loader ----------
window.addEventListener('load', () => {
  gsap.to('#loader', {
    opacity: 0,
    duration: 0.5,
    delay: 0.2,
    onComplete: () => document.getElementById('loader').remove(),
  });
});

// ---------- Nav ----------
const nav = document.getElementById('nav');
ScrollTrigger.create({
  start: 'top -60',
  onUpdate: (self) => nav.classList.toggle('scrolled', self.scroll() > 60),
});

const navToggle = document.getElementById('navToggle');
navToggle.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach((a) =>
  a.addEventListener('click', () => nav.classList.remove('open'))
);

// ---------- Hero entrance ----------
gsap.set('.hero-title .w', { yPercent: 120, opacity: 0 });
gsap.set('.reveal-hero', { y: 24 });

const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

heroTl
  .to('.hero-title .w', { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.03 })
  .to('.reveal-hero', { opacity: 1, y: 0, duration: 0.8, stagger: 0.12 }, '-=0.5')
  .from('.panel-main', { opacity: 0, y: 40, scale: 0.96, duration: 1 }, '-=0.6')
  .to('.chart-line', { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, '-=0.7')
  .to('.panel-bars span', { scaleY: 1, duration: 0.7, stagger: 0.06, ease: 'back.out(1.7)' }, '-=1')
  .to('.float-card-1', { opacity: 1, duration: 0.6 }, '-=0.5')
  .to('.float-card-2', { opacity: 1, duration: 0.6 }, '-=0.4');

// Floating idle motion for stat cards
gsap.to('.float-card-1', { y: '+=10', duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
gsap.to('.float-card-2', { y: '-=10', duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 0.3 });

// ---------- Scroll reveals ----------
gsap.set('.reveal', { y: 30 });
gsap.utils.toArray('.reveal').forEach((el) => {
  gsap.to(el, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' },
  });
});

// Staggered grid children
function staggerGrid(selector) {
  document.querySelectorAll(selector).forEach((grid) => {
    const items = grid.children;
    gsap.set(items, { opacity: 0, y: 26 });
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power3.out',
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
          el.textContent = prefix + Math.floor(counter.val).toLocaleString() + suffix;
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

// ---------- Hero visual parallax ----------
const heroVisual = document.querySelector('.hero-visual');
if (heroVisual && window.matchMedia('(pointer: fine)').matches) {
  heroVisual.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to('.panel-main', { rotateY: x * 6, rotateX: -y * 6, duration: 0.6, ease: 'power2.out', transformPerspective: 800 });
  });
  heroVisual.addEventListener('mouseleave', () => {
    gsap.to('.panel-main', { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power2.out' });
  });
}
