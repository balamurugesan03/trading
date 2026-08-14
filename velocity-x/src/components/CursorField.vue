<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useMouseField } from '../composables/useMouseField.js'

const pointer = useMouseField()
const dot = ref(null)
const ring = ref(null)

let ringX = -9999
let ringY = -9999
let fieldScale = 1
let targetFieldScale = 1
let raf = null

function loop() {
  // ring trails the dot with spring-like lag — the "gravitational field" feel
  ringX += (pointer.x - ringX) * 0.16
  ringY += (pointer.y - ringY) * 0.16
  fieldScale += (targetFieldScale - fieldScale) * 0.14

  if (dot.value) {
    dot.value.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`
  }
  if (ring.value) {
    ring.value.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${fieldScale})`
  }
  raf = requestAnimationFrame(loop)
}

function onOver(e) {
  const interactive = e.target.closest('[data-cursor="hover"]')
  targetFieldScale = interactive ? 2.1 : 1
}

function onDown() {
  targetFieldScale = 0.75
}
function onUp() {
  targetFieldScale = 1
}

onMounted(() => {
  if (!pointer.isFine) return
  raf = requestAnimationFrame(loop)
  window.addEventListener('pointerover', onOver)
  window.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
})

onBeforeUnmount(() => {
  if (raf) cancelAnimationFrame(raf)
  window.removeEventListener('pointerover', onOver)
  window.removeEventListener('pointerdown', onDown)
  window.removeEventListener('pointerup', onUp)
})
</script>

<template>
  <div v-if="pointer.isFine" class="cursor-field" aria-hidden="true">
    <div ref="ring" class="cursor-field__ring"></div>
    <div ref="dot" class="cursor-field__dot"></div>
  </div>
</template>

<style scoped>
.cursor-field {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.cursor-field__dot {
  position: fixed;
  top: 0;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--gold-bright);
  box-shadow: 0 0 8px 1px var(--gold-glow);
  will-change: transform;
}

.cursor-field__ring {
  position: fixed;
  top: 0;
  left: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid var(--glass-border-strong);
  will-change: transform;
  transition: border-color 0.3s var(--ease-out);
}
</style>
