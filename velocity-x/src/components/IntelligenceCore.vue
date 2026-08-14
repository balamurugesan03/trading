<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMarketData } from '../composables/useMarketData.js'
import SectionTransition from './SectionTransition.vue'

const { intelligence } = useMarketData()

const RINGS = [
  { key: 'sentiment', label: 'Market Sentiment' },
  { key: 'momentum', label: 'Momentum' },
  { key: 'liquidity', label: 'Liquidity' },
  { key: 'risk', label: 'Risk' },
]

const CIRCUMFERENCE = 2 * Math.PI * 42

function dashOffset(value) {
  return CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE
}

const signalUp = computed(() => intelligence.signal === 'BUY')

// ---------- ambient neural-network canvas ----------
const netCanvas = ref(null)
let netRaf = null
let nodes = []

function initNet(w, h) {
  const count = w < 700 ? 26 : 46
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
  }))
}

function drawNet() {
  const canvas = netCanvas.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  if (canvas.width !== rect.width * dpr) {
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    initNet(rect.width, rect.height)
  }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, rect.width, rect.height)

  nodes.forEach((n) => {
    n.x += n.vx
    n.y += n.vy
    if (n.x < 0 || n.x > rect.width) n.vx *= -1
    if (n.y < 0 || n.y > rect.height) n.vy *= -1
  })

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i]
      const b = nodes[j]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d < 130) {
        ctx.strokeStyle = `rgba(201,162,75,${(1 - d / 130) * 0.22})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
  }
  nodes.forEach((n) => {
    ctx.fillStyle = 'rgba(232,200,116,0.55)'
    ctx.beginPath()
    ctx.arc(n.x, n.y, 1.4, 0, Math.PI * 2)
    ctx.fill()
  })

  netRaf = requestAnimationFrame(drawNet)
}

// ---------- waveform ----------
const waveCanvas = ref(null)
let waveRaf = null
let waveT = 0

function drawWave() {
  const canvas = waveCanvas.value
  if (canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    waveT += 0.02
    const amp = (intelligence.momentum / 100) * (rect.height * 0.32)
    ctx.strokeStyle = '#e8c874'
    ctx.lineWidth = 1.3
    ctx.beginPath()
    for (let x = 0; x <= rect.width; x += 4) {
      const y = rect.height / 2 + Math.sin(x * 0.045 + waveT) * amp * Math.sin(x * 0.008 + waveT * 0.5)
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  waveRaf = requestAnimationFrame(drawWave)
}

onMounted(() => {
  netRaf = requestAnimationFrame(drawNet)
  waveRaf = requestAnimationFrame(drawWave)
})
onBeforeUnmount(() => {
  if (netRaf) cancelAnimationFrame(netRaf)
  if (waveRaf) cancelAnimationFrame(waveRaf)
})
</script>

<template>
  <section id="intelligence" class="intel section-pad">
    <canvas ref="netCanvas" class="intel__net" aria-hidden="true"></canvas>

    <SectionTransition eyebrow="Velocity Intelligence">
      <h2 class="display-l intel__title">Market Intelligence</h2>
      <p class="intel__body">A continuous read on sentiment, momentum, liquidity and risk — synthesized across every connected market.</p>
    </SectionTransition>

    <div class="intel__grid">
      <div v-for="r in RINGS" :key="r.key" class="ring-card glass">
        <svg viewBox="0 0 100 100" class="ring-card__svg">
          <circle cx="50" cy="50" r="42" class="ring-card__track" />
          <circle
            cx="50"
            cy="50"
            r="42"
            class="ring-card__value"
            :style="{ strokeDasharray: 2 * Math.PI * 42, strokeDashoffset: dashOffset(intelligence[r.key]) }"
          />
        </svg>
        <div class="ring-card__readout">
          <span class="ring-card__number mono-num">{{ intelligence[r.key] }}%</span>
          <span class="ring-card__label">{{ r.label }}</span>
        </div>
      </div>

      <div class="signal-card glass">
        <span class="signal-card__label">Signal</span>
        <span class="signal-card__dot" :class="signalUp ? 'up' : 'down'"></span>
        <span class="signal-card__value" :class="signalUp ? 'text-up' : 'text-down'">{{ intelligence.signal }}</span>
      </div>
    </div>

    <div class="intel__wave glass">
      <span class="intel__wave-label">Momentum Waveform</span>
      <canvas ref="waveCanvas" class="intel__wave-canvas"></canvas>
    </div>
  </section>
</template>

<style scoped>
.intel {
  position: relative;
  padding-block: 140px;
  overflow: hidden;
}
.intel__net {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.5;
}
.intel__title { margin-bottom: 14px; position: relative; }
.intel__body {
  position: relative;
  max-width: 500px;
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 56px;
}

.intel__grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.ring-card {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.ring-card__svg { width: 96px; height: 96px; transform: rotate(-90deg); }
.ring-card__track { fill: none; stroke: var(--hairline); stroke-width: 5; }
.ring-card__value {
  fill: none;
  stroke: var(--gold-bright);
  stroke-width: 5;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s var(--ease-out);
}
.ring-card__readout { text-align: center; }
.ring-card__number { display: block; font-size: 18px; color: var(--ink-0); }
.ring-card__label { font-size: 10px; letter-spacing: 0.1em; color: var(--ink-3); text-transform: uppercase; }

.signal-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 16px;
}
.signal-card__label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3); }
.signal-card__dot { width: 10px; height: 10px; border-radius: 50%; }
.signal-card__dot.up { background: var(--up); box-shadow: 0 0 12px 2px rgba(88,201,143,0.5); }
.signal-card__dot.down { background: var(--down); box-shadow: 0 0 12px 2px rgba(217,105,95,0.5); }
.signal-card__value { font-family: var(--font-display); font-size: 20px; letter-spacing: 0.06em; }

.intel__wave {
  position: relative;
  padding: 20px 24px;
  height: 140px;
}
.intel__wave-label {
  position: absolute;
  top: 16px;
  left: 24px;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
}
.intel__wave-canvas { width: 100%; height: 100%; }

@media (max-width: 900px) {
  .intel__grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 560px) {
  .intel__grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
