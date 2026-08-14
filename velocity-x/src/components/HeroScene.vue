<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'
import { useThreeScene } from '../composables/useThreeScene.js'
import { useHeroScrollJourney } from '../composables/useScrollAnimation.js'
import MarketHUD from './MarketHUD.vue'

const emit = defineEmits(['intro-complete'])

const heroRoot = ref(null)
const canvas = ref(null)
const blackout = ref(null)
const introLogo = ref(null)
const scrollHint = ref(null)

const activeRegion = ref(null)
const scrollProgress = ref(0)
const introDone = ref(false)

const { manager } = useThreeScene(canvas, {
  regionChangeCallback: (region) => {
    activeRegion.value = region
  },
})

const SECTIONS = [
  { range: [0, 0.1], eyebrow: 'Global Financial Network', title: 'VELOCITY', body: 'A living financial intelligence machine, built from thousands of market signals.' },
  { range: [0.14, 0.3], eyebrow: 'Section 01 — Descent', title: 'Entering the Network', body: 'The camera moves past the surface of the globe, into the current of global capital.' },
  { range: [0.34, 0.52], eyebrow: 'Section 02 — Signal Field', title: 'Financial Data Particles', body: 'Every particle is a signal — a trade, a rate, a movement in the world’s markets.' },
  { range: [0.56, 0.76], eyebrow: 'Section 03 — The Core', title: 'Market Core', body: 'At the center of VELOCITY sits a single intelligence, reading the pulse of global markets.' },
  { range: [0.8, 1], eyebrow: 'Section 04 — Arrival', title: 'The Terminal Awaits', body: 'The network resolves into a professional trading terminal.' },
]

function inRange(p, [a, b]) {
  return p >= a && p <= b
}
function sectionOpacity(range) {
  return inRange(scrollProgress.value, range) ? 1 : 0
}

const journey = useHeroScrollJourney(heroRoot, {
  lengthVh: 440,
  onProgress: (p) => {
    scrollProgress.value = p
    manager.value?.setScrollProgress(p)
  },
})

// ---------- pointer + touch → SceneManager ----------
function ndcFromClient(clientX, clientY) {
  return [(clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1]
}
function onPointerMove(e) {
  if (!manager.value) return
  const [x, y] = ndcFromClient(e.clientX, e.clientY)
  manager.value.setPointerNDC(x, y)
}
function onPointerDown(e) {
  if (!manager.value) return
  const [x, y] = ndcFromClient(e.clientX, e.clientY)
  manager.value.startDrag(x, y)
}
function onPointerUp() {
  manager.value?.endDrag()
}
function onPointerLeave() {
  manager.value?.clearPointer()
}

let pinchDist = null
function touchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.hypot(dx, dy)
}
function onTouchStart(e) {
  if (e.touches.length === 1) {
    const t = e.touches[0]
    const [x, y] = ndcFromClient(t.clientX, t.clientY)
    manager.value?.setPointerNDC(x, y)
    manager.value?.startDrag(x, y)
  } else if (e.touches.length === 2) {
    pinchDist = touchDist(e.touches)
  }
}
function onTouchMove(e) {
  if (e.touches.length === 1) {
    const t = e.touches[0]
    const [x, y] = ndcFromClient(t.clientX, t.clientY)
    manager.value?.setPointerNDC(x, y)
  } else if (e.touches.length === 2) {
    const d = touchDist(e.touches)
    if (pinchDist != null) manager.value?.setPinchDelta((d - pinchDist) * 0.0025)
    pinchDist = d
  }
}
function onTouchEnd(e) {
  if (e.touches.length === 0) {
    manager.value?.endDrag()
    pinchDist = null
  }
}

function runIntro() {
  document.documentElement.classList.add('velocity-lock')
  const introState = { p: 0 }

  const tl = gsap.timeline({
    onComplete: () => {
      document.documentElement.classList.remove('velocity-lock')
      introDone.value = true
      journey.init()
      // the hero's pin spacer just changed total document height; every
      // other section's scroll-triggers (created earlier, on mount) were
      // measured against the pre-pin layout and are now stale.
      requestAnimationFrame(() => journey.refresh())
      emit('intro-complete')
    },
  })

  tl.to(blackout.value, { opacity: 0, duration: 1.3, delay: 0.55, ease: 'power2.out' })
  tl.to(
    introState,
    {
      p: 1,
      duration: 3.6,
      ease: 'power2.inOut',
      onUpdate: () => manager.value?.setIntroProgress(introState.p),
    },
    '<0.1'
  )
  tl.fromTo(
    introLogo.value,
    { opacity: 0, letterSpacing: '0.7em' },
    { opacity: 1, letterSpacing: '0.34em', duration: 1.2, ease: 'power2.out' },
    '-=1.3'
  )
  tl.to(scrollHint.value, { opacity: 1, duration: 0.8 }, '-=0.3')
  tl.to(introLogo.value, { opacity: 0, duration: 0.9, ease: 'power2.in' }, '+=0.9')
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerup', onPointerUp)
  document.addEventListener('mouseleave', onPointerLeave)
  canvas.value?.addEventListener('pointerdown', onPointerDown)
  canvas.value?.addEventListener('touchstart', onTouchStart, { passive: true })
  canvas.value?.addEventListener('touchmove', onTouchMove, { passive: true })
  canvas.value?.addEventListener('touchend', onTouchEnd, { passive: true })

  requestAnimationFrame(() => requestAnimationFrame(runIntro))
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('velocity-lock')
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  document.removeEventListener('mouseleave', onPointerLeave)
  canvas.value?.removeEventListener('pointerdown', onPointerDown)
  journey.destroy()
})
</script>

<template>
  <section id="top" ref="heroRoot" class="hero-root">
    <canvas ref="canvas" class="hero-canvas" data-cursor="hover"></canvas>

    <div class="hero-vignette" aria-hidden="true"></div>
    <div class="hero-grid fine-grid" aria-hidden="true"></div>

    <MarketHUD :region="activeRegion" />

    <div ref="blackout" class="hero-blackout" aria-hidden="true"></div>

    <div ref="introLogo" class="hero-intro-logo" aria-hidden="true">
      <span>VELOCITY</span>
    </div>

    <div class="hero-copy section-pad">
      <transition-group name="copy-fade">
        <div v-for="(s, i) in SECTIONS" v-show="sectionOpacity(s.range) === 1" :key="i" class="hero-copy__block">
          <p class="eyebrow">{{ s.eyebrow }}</p>
          <h2 class="display-l hero-copy__title">{{ s.title }}</h2>
          <p class="hero-copy__body">{{ s.body }}</p>
        </div>
      </transition-group>
    </div>

    <div ref="scrollHint" class="hero-scroll-hint" :class="{ hide: scrollProgress > 0.02 }">
      <span class="hero-scroll-hint__line"></span>
      <span>Scroll</span>
    </div>
  </section>
</template>

<style scoped>
.hero-root {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(ellipse at 50% 40%, #0b0b12 0%, var(--void) 68%);
}

.hero-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.hero-vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0, 0, 0, 0.75) 100%);
}

.hero-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  mask-image: radial-gradient(ellipse at 50% 50%, black 0%, transparent 70%);
}

.hero-blackout {
  position: absolute;
  inset: 0;
  background: var(--void);
  z-index: 50;
  pointer-events: none;
}

.hero-intro-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 40;
  font-family: var(--font-display);
  font-size: clamp(2rem, 6vw, 4rem);
  font-weight: 300;
  color: var(--gold-champagne);
  opacity: 0;
  pointer-events: none;
  white-space: nowrap;
}

.hero-copy {
  position: absolute;
  bottom: clamp(64px, 12vh, 140px);
  left: 0;
  z-index: 30;
  max-width: 620px;
  pointer-events: none;
}

.hero-copy__block {
  position: absolute;
  bottom: 0;
  left: clamp(20px, 5vw, 88px);
}

.hero-copy__title {
  margin-bottom: 14px;
}

.hero-copy__body {
  max-width: 460px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-2);
  font-weight: 300;
}

.copy-fade-enter-active, .copy-fade-leave-active {
  transition: opacity 0.9s var(--ease-out), transform 0.9s var(--ease-out);
}
.copy-fade-enter-from, .copy-fade-leave-to {
  opacity: 0;
  transform: translateY(14px);
}

.hero-scroll-hint {
  position: absolute;
  bottom: 40px;
  right: clamp(20px, 5vw, 88px);
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ink-3);
  opacity: 0;
  transition: opacity 0.6s var(--ease-out);
}
.hero-scroll-hint.hide { opacity: 0 !important; }
.hero-scroll-hint__line {
  width: 1px;
  height: 34px;
  background: linear-gradient(to bottom, var(--gold), transparent);
}

@media (max-width: 720px) {
  .hero-copy__body { display: none; }
}
</style>
