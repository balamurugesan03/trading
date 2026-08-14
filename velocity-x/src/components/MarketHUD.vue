<script setup>
import { computed } from 'vue'

const props = defineProps({
  region: { type: Object, default: null },
})

const flowBlocks = computed(() => {
  if (!props.region) return ''
  const total = 14
  const filled = Math.round(props.region.flow * total)
  return { filled, total }
})
</script>

<template>
  <Transition name="hud">
    <div v-if="region" class="hud" aria-live="polite">
      <div class="hud__frame">
        <p class="hud__eyebrow">Global Market</p>
        <h3 class="hud__title">{{ region.label }}</h3>

        <ul class="hud__rows">
          <li v-for="idx in region.indices" :key="idx.label" class="hud__row">
            <span class="hud__label">{{ idx.label }}</span>
            <span class="hud__value mono-num" :class="idx.change >= 0 ? 'text-up' : 'text-down'">
              {{ idx.change >= 0 ? '+' : '' }}{{ idx.change.toFixed(2) }}%
            </span>
          </li>
        </ul>

        <div class="hud__flow">
          <span class="hud__flow-label">Market Flow</span>
          <div class="hud__flow-bar">
            <span
              v-for="n in flowBlocks.total"
              :key="n"
              class="hud__flow-block"
              :class="{ filled: n <= flowBlocks.filled }"
            />
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.hud {
  position: fixed;
  top: 130px;
  right: clamp(16px, 4vw, 64px);
  z-index: 120;
  width: min(280px, 82vw);
  pointer-events: none;
}

.hud__frame {
  position: relative;
  padding: 22px 24px 20px;
  background: var(--glass-fill-strong);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid var(--glass-border-strong);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%);
}

.hud__frame::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 22px;
  height: 1px;
  background: var(--gold-bright);
}
.hud__frame::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 22px;
  background: var(--gold-bright);
}

.hud__eyebrow {
  font-size: 10px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 6px;
}

.hud__title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 400;
  color: var(--gold-champagne);
  margin-bottom: 16px;
}

.hud__rows {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-bottom: 18px;
}

.hud__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: 12px;
  border-bottom: 1px solid var(--hairline);
  padding-bottom: 8px;
}

.hud__label {
  color: var(--ink-2);
  letter-spacing: 0.04em;
}
.hud__value {
  font-size: 13px;
}

.hud__flow-label {
  display: block;
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 8px;
}

.hud__flow-bar {
  display: flex;
  gap: 3px;
}

.hud__flow-block {
  width: 8px;
  height: 4px;
  background: var(--hairline);
}
.hud__flow-block.filled {
  background: linear-gradient(90deg, var(--gold-dim), var(--gold-bright));
}

.hud-enter-active { transition: opacity 0.5s var(--ease-out), transform 0.5s var(--ease-out); }
.hud-leave-active { transition: opacity 0.35s var(--ease-out), transform 0.35s var(--ease-out); }
.hud-enter-from, .hud-leave-to {
  opacity: 0;
  transform: translateY(-8px) skewY(-1deg);
}

@media (max-width: 720px) {
  .hud { top: auto; bottom: 96px; right: 16px; }
}
</style>
