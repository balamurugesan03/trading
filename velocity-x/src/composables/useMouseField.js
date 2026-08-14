import { reactive } from 'vue'

/**
 * Shared pointer state — a single set of window listeners feeding every
 * component that needs cursor position (custom cursor, HeroScene raycasting,
 * magnetic buttons). Avoids duplicate listeners across the tree.
 */
const state = reactive({
  x: -9999,
  y: -9999,
  ndcX: 9999,
  ndcY: 9999,
  isDown: false,
  isFine: true,
  targetEl: null,
})

let initialized = false

function updateFromEvent(e) {
  state.x = e.clientX
  state.y = e.clientY
  state.ndcX = (e.clientX / window.innerWidth) * 2 - 1
  state.ndcY = -(e.clientY / window.innerHeight) * 2 + 1
  state.targetEl = e.target
}

function init() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  state.isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (state.isFine) document.documentElement.classList.add('has-custom-cursor')

  window.addEventListener('pointermove', updateFromEvent, { passive: true })
  window.addEventListener('pointerdown', () => {
    state.isDown = true
  })
  window.addEventListener('pointerup', () => {
    state.isDown = false
  })
  window.addEventListener('pointerleave', () => {
    state.x = -9999
    state.y = -9999
    state.ndcX = 9999
    state.ndcY = 9999
  })
}

export function useMouseField() {
  init()
  return state
}
