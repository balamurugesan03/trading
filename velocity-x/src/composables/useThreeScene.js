import { onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { SceneManager } from '../three/SceneManager.js'

/**
 * Owns a scene manager's lifecycle against a <canvas> ref: creation, resize
 * observation, RAF loop, and disposal. Kept free of Vue reactivity on the
 * Three.js internals themselves — only the manager instance is a ref.
 * Defaults to the hero SceneManager; pass ManagerClass to reuse this wiring
 * for other Three.js scenes (e.g. the 3D candlestick landscape).
 */
export function useThreeScene(canvasRef, options = {}, ManagerClass = SceneManager) {
  const manager = shallowRef(null)
  let resizeObserver = null

  const handleResize = () => {
    const el = canvasRef.value?.parentElement
    if (!manager.value || !el) return
    manager.value.resize(el.clientWidth, el.clientHeight)
  }

  onMounted(() => {
    if (!canvasRef.value) return
    manager.value = new ManagerClass(canvasRef.value, options)
    handleResize()
    manager.value.start()

    resizeObserver = new ResizeObserver(handleResize)
    if (canvasRef.value.parentElement) resizeObserver.observe(canvasRef.value.parentElement)
    window.addEventListener('resize', handleResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeObserver) resizeObserver.disconnect()
    manager.value?.dispose()
    manager.value = null
  })

  return { manager, handleResize }
}
