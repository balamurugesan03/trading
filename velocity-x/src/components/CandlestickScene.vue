<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useThreeScene } from '../composables/useThreeScene.js'
import { CandleField } from '../three/CandleField.js'
import { detectQualityTier } from '../three/SceneManager.js'
import { generateCandles } from '../data/marketData.js'
import SectionTransition from './SectionTransition.vue'

const canvas = ref(null)
const wrap = ref(null)
const hoverIndex = ref(-1)
const tooltipPos = ref({ x: 0, y: 0 })
const labels = ref([])

const candles = generateCandles(64, 118000, 21)

const { manager } = useThreeScene(
  canvas,
  {
    candles,
    tier: detectQualityTier(),
    onHover: (idx) => {
      hoverIndex.value = idx
    },
  },
  CandleField
)

function onMove(e) {
  if (!manager.value || !wrap.value) return
  const rect = wrap.value.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  manager.value.setPointerNDC(x, y)
  tooltipPos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top }
}
function onLeave() {
  manager.value?.clearPointer()
}

let labelRaf = null
function updateLabels() {
  if (manager.value && wrap.value) {
    const rect = wrap.value.getBoundingClientRect()
    labels.value = manager.value.priceLabels.map((l) => {
      const p = l.local.clone().project(manager.value.camera)
      return {
        type: l.type,
        price: l.price,
        x: (p.x * 0.5 + 0.5) * rect.width,
        y: (-p.y * 0.5 + 0.5) * rect.height,
        visible: p.z < 1,
      }
    })
  }
  labelRaf = requestAnimationFrame(updateLabels)
}

onMounted(() => {
  labelRaf = requestAnimationFrame(updateLabels)
})
onBeforeUnmount(() => {
  if (labelRaf) cancelAnimationFrame(labelRaf)
})
</script>

<template>
  <section id="analytics" class="candlescape section-pad">
    <SectionTransition eyebrow="Analytics">
      <h2 class="display-l candlescape__title">Financial Landscape</h2>
      <p class="candlescape__body">Sixty-four hours of price action, rendered as terrain. Move your cursor across the range.</p>
    </SectionTransition>

    <div ref="wrap" class="candlescape__frame glass" @mousemove="onMove" @mouseleave="onLeave">
      <canvas ref="canvas" class="candlescape__canvas"></canvas>

      <div
        v-for="(l, i) in labels"
        v-show="l.visible"
        :key="i"
        class="candlescape__label"
        :class="l.type.toLowerCase()"
        :style="{ transform: `translate(${l.x}px, ${l.y}px)` }"
      >
        <span class="candlescape__label-tag">{{ l.type }}</span>
        <span class="mono-num">{{ l.price.toFixed(1) }}</span>
      </div>

      <div v-if="hoverIndex > -1 && candles[hoverIndex]" class="candlescape__tooltip" :style="{ left: tooltipPos.x + 16 + 'px', top: tooltipPos.y + 'px' }">
        <p class="candlescape__tooltip-row"><span>O</span><span class="mono-num">{{ candles[hoverIndex].o.toFixed(1) }}</span></p>
        <p class="candlescape__tooltip-row"><span>H</span><span class="mono-num">{{ candles[hoverIndex].h.toFixed(1) }}</span></p>
        <p class="candlescape__tooltip-row"><span>L</span><span class="mono-num">{{ candles[hoverIndex].l.toFixed(1) }}</span></p>
        <p class="candlescape__tooltip-row"><span>C</span><span class="mono-num">{{ candles[hoverIndex].c.toFixed(1) }}</span></p>
        <p class="candlescape__tooltip-row"><span>Vol</span><span class="mono-num">{{ candles[hoverIndex].v.toFixed(0) }}</span></p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.candlescape {
  padding-block: 120px;
}
.candlescape__title { margin-bottom: 14px; }
.candlescape__body {
  max-width: 480px;
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 40px;
}

.candlescape__frame {
  position: relative;
  height: 62vh;
  min-height: 420px;
  overflow: hidden;
}
.candlescape__canvas { width: 100%; height: 100%; }

.candlescape__label {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  font-size: 10px;
  background: var(--glass-fill-strong);
  border: 1px solid var(--glass-border);
  pointer-events: none;
  white-space: nowrap;
}
.candlescape__label-tag {
  letter-spacing: 0.14em;
  color: var(--ink-3);
}
.candlescape__label.high { color: var(--up); }
.candlescape__label.low { color: var(--down); }

.candlescape__tooltip {
  position: absolute;
  z-index: 20;
  padding: 12px 14px;
  background: var(--glass-fill-strong);
  border: 1px solid var(--glass-border-strong);
  pointer-events: none;
  font-size: 11px;
  min-width: 120px;
}
.candlescape__tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  color: var(--ink-2);
  padding: 2px 0;
}
</style>
