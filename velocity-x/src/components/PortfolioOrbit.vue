<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMarketData } from '../composables/useMarketData.js'
import { useThreeScene } from '../composables/useThreeScene.js'
import { PortfolioField } from '../three/PortfolioField.js'
import { detectQualityTier } from '../three/SceneManager.js'
import SectionTransition from './SectionTransition.vue'

const { portfolio } = useMarketData()

const canvas = ref(null)
const stage = ref(null)
const selectedId = ref(null)
const labels = ref([])

const totalValue = computed(() =>
  portfolio.reduce((sum, a) => sum + a.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
)
const selectedAsset = computed(() => portfolio.find((a) => a.id === selectedId.value) || null)

const { manager } = useThreeScene(
  canvas,
  {
    assets: portfolio,
    tier: detectQualityTier(),
    onSelect: (id) => {
      selectedId.value = id
    },
  },
  PortfolioField
)

function ndcFromEvent(e) {
  const rect = stage.value.getBoundingClientRect()
  return [((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1]
}
function onMove(e) {
  if (!manager.value || !stage.value) return
  const [x, y] = ndcFromEvent(e)
  manager.value.setPointerNDC(x, y)
}
function onLeave() {
  manager.value?.clearPointer()
}
function onClick() {
  manager.value?.handleClick()
}
function closeDetail() {
  selectedId.value = null
  manager.value?.setSelected(null)
}

let labelRaf = null
function updateLabels() {
  if (manager.value && stage.value) {
    const rect = stage.value.getBoundingClientRect()
    labels.value = manager.value.getLabelAnchors().map((a) => {
      const p = a.world.clone().project(manager.value.camera)
      return {
        id: a.id,
        label: a.label,
        x: (p.x * 0.5 + 0.5) * rect.width,
        y: (-p.y * 0.5 + 0.5) * rect.height,
        visible: p.z < 1,
        active: a.id === selectedId.value,
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
  <section id="portfolio" class="orbit section-pad">
    <SectionTransition eyebrow="Portfolio Orbit">
      <h2 class="display-l orbit__title">Portfolio Orbit</h2>
      <p class="orbit__body">Your holdings, in motion. Select an asset to bring it forward.</p>
    </SectionTransition>

    <div ref="stage" class="orbit__stage" @mousemove="onMove" @mouseleave="onLeave" @click="onClick">
      <canvas ref="canvas" class="orbit__canvas" data-cursor="hover"></canvas>

      <div class="orbit__core-label">
        <span class="orbit__core-eyebrow">Portfolio Value</span>
        <span class="orbit__core-value mono-num">${{ totalValue }}</span>
      </div>

      <div
        v-for="l in labels"
        v-show="l.visible"
        :key="l.id"
        class="orbit__tag"
        :class="{ active: l.active }"
        :style="{ transform: `translate(${l.x}px, ${l.y}px)` }"
      >
        {{ l.label }}
      </div>
    </div>

    <Transition name="detail-fade">
      <div v-if="selectedAsset" class="orbit__detail glass">
        <button class="orbit__detail-close" data-cursor="hover" @click="closeDetail">×</button>
        <p class="eyebrow">{{ selectedAsset.name }}</p>
        <h3 class="orbit__detail-value mono-num">{{ selectedAsset.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) }}</h3>
        <p class="mono-num" :class="selectedAsset.change >= 0 ? 'text-up' : 'text-down'">
          {{ selectedAsset.change >= 0 ? '+' : '' }}{{ selectedAsset.change.toFixed(2) }}% today
        </p>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.orbit {
  padding-block: 140px;
}
.orbit__title { margin-bottom: 14px; }
.orbit__body {
  max-width: 480px;
  color: var(--ink-2);
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 48px;
}

.orbit__stage {
  position: relative;
  height: 62vh;
  min-height: 440px;
  max-width: 900px;
  margin: 0 auto;
  cursor: none;
}
.orbit__canvas {
  width: 100%;
  height: 100%;
}

.orbit__core-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  pointer-events: none;
}
.orbit__core-eyebrow {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-1);
  text-shadow: 0 0 12px rgba(3, 3, 4, 0.95), 0 0 28px rgba(3, 3, 4, 0.9);
}
.orbit__core-value {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 3.4vw, 2.4rem);
  color: var(--gold-champagne);
  text-shadow: 0 0 16px rgba(3, 3, 4, 0.95), 0 0 36px rgba(3, 3, 4, 0.9), 0 0 60px rgba(3, 3, 4, 0.7);
}

.orbit__tag {
  position: absolute;
  top: 0;
  left: 0;
  padding: 3px 9px;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-1);
  background: var(--glass-fill-strong);
  border: 1px solid var(--glass-border);
  pointer-events: none;
  white-space: nowrap;
  transform-origin: center;
  margin-left: 14px;
  margin-top: -10px;
}
.orbit__tag.active {
  color: var(--gold-bright);
  border-color: var(--glass-border-strong);
}

.orbit__detail {
  position: relative;
  max-width: 320px;
  margin: -20px auto 0;
  padding: 24px 26px;
  text-align: center;
}
.orbit__detail-close {
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 18px;
  color: var(--ink-3);
}
.orbit__detail-value {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--ink-0);
  margin: 10px 0 6px;
}

.detail-fade-enter-active, .detail-fade-leave-active {
  transition: opacity 0.5s var(--ease-out), transform 0.5s var(--ease-out);
}
.detail-fade-enter-from, .detail-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
