import * as THREE from 'three'
import gsap from 'gsap'
import { NeuralGlobe } from './NeuralGlobe.js'
import { DataStreams } from './DataStreams.js'
import { MarketNodes } from './MarketNodes.js'
import { MarketCore } from './MarketCore.js'
import { FinancialParticles } from './FinancialParticles.js'
import { REGIONS, STREAM_ROUTES } from '../data/marketData.js'

const CAMERA_PATH_POINTS = [
  new THREE.Vector3(0, 0.4, 13.5),
  new THREE.Vector3(3.2, 1.6, 9.2),
  new THREE.Vector3(1.6, 0.6, 5.4),
  new THREE.Vector3(0.5, 0.15, 2.1),
  new THREE.Vector3(0, 0, 0.75),
]
const CAMERA_CURVE = new THREE.CatmullRomCurve3(CAMERA_PATH_POINTS, false, 'catmullrom', 0.4)

const QUALITY_PRESETS = {
  desktop: { globeCount: 6200, streamPerRoute: 34, dust: 900, dpr: 2 },
  tablet: { globeCount: 3200, streamPerRoute: 20, dust: 500, dpr: 1.6 },
  mobile: { globeCount: 1500, streamPerRoute: 10, dust: 260, dpr: 1.4 },
}

export function detectQualityTier() {
  const w = window.innerWidth
  const cores = navigator.hardwareConcurrency || 4
  if (w < 720 || cores <= 4) return 'mobile'
  if (w < 1180) return 'tablet'
  return 'desktop'
}

export class SceneManager {
  constructor(canvas, { tier = detectQualityTier(), regionChangeCallback } = {}) {
    this.canvas = canvas
    this.tier = tier
    this.quality = QUALITY_PRESETS[tier]
    this.onRegionChange = regionChangeCallback || (() => {})
    this.activeRegionIndex = -1
    this.globeRadius = 4.6

    this._raf = null
    this._clock = new THREE.Clock()
    this._pointerNDC = new THREE.Vector2(9999, 9999)
    this._raycaster = new THREE.Raycaster()
    this._dragging = false
    this._lastPointer = new THREE.Vector2()

    this._scrollProgress = 0
    this._introProgress = 0
    this._nextPulseAt = 5 + Math.random() * 4

    this._init()
  }

  _init() {
    const { canvas } = this
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this._pixelRatio = Math.min(window.devicePixelRatio || 1, this.quality.dpr)
    this.renderer.setPixelRatio(this._pixelRatio)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    this.camera.position.copy(CAMERA_PATH_POINTS[0])

    this.globe = new NeuralGlobe({ radius: this.globeRadius, count: this.quality.globeCount })
    this.streams = new DataStreams({
      routes: STREAM_ROUTES,
      regions: REGIONS,
      radius: this.globeRadius,
      perRoute: this.quality.streamPerRoute,
    })
    this.nodes = new MarketNodes({ regions: REGIONS, radius: this.globeRadius })
    this.core = new MarketCore({ radius: 0.5 })
    this.dust = new FinancialParticles({ count: this.quality.dust })

    this.globe.group.add(this.streams.group)
    this.globe.group.add(this.nodes.group)
    this.globe.group.add(this.core.group)

    this.scene.add(this.globe.group)
    this.scene.add(this.dust.group)

    this.globe.setPixelRatio(this._pixelRatio)
    this.streams.setPixelRatio(this._pixelRatio)
  }

  // ---------- resize ----------
  resize(width, height) {
    this.camera.aspect = width / Math.max(height, 1)
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  // ---------- pointer / cursor field ----------
  setPointerNDC(x, y) {
    this._pointerNDC.set(x, y)
    if (this._dragging) {
      const dx = x - this._lastPointer.x
      const dy = y - this._lastPointer.y
      this.globe.applyDrag(dx, dy)
    }
    this._lastPointer.set(x, y)
  }

  startDrag(x, y) {
    this._dragging = true
    this._lastPointer.set(x, y)
    this.canvas.classList.add('velocity-field-active')
  }

  endDrag() {
    if (!this._dragging) return
    this._dragging = false
    this.globe.release()
    this.core.setEnergy(1)
    gsap.to(this.core, { energy: 0, duration: 1.6, ease: 'power2.out', onUpdate: () => this.core.setEnergy(this.core.energy) })
  }

  clearPointer() {
    this._pointerNDC.set(9999, 9999)
    this.globe.clearCursor()
    if (this.activeRegionIndex !== -1) {
      this.activeRegionIndex = -1
      this.nodes.setActiveRegion(-1)
      this.onRegionChange(null)
    }
  }

  _updatePointerField() {
    if (this._pointerNDC.x > 100) return

    this._raycaster.setFromCamera(this._pointerNDC, this.camera)
    const ray = this._raycaster.ray

    // cursor world point: intersect with a plane through the globe center,
    // facing the camera — used for the particle gravitational field.
    const camDir = this.camera.getWorldDirection(new THREE.Vector3())
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(camDir, this.globe.group.position)
    const planeHit = new THREE.Vector3()
    ray.intersectPlane(plane, planeHit)

    if (planeHit) {
      const inv = this.globe.group.matrixWorld.clone().invert()
      const local = planeHit.clone().applyMatrix4(inv)
      this.globe.setCursorWorld(local, { radius: 1.7, strength: this._dragging ? 0.9 : 0.55 })
    }

    // analytic ray-sphere test for region hover
    const R = this.globeRadius * 1.05
    const O = ray.origin
    const D = ray.direction
    const b = O.dot(D)
    const c = O.dot(O) - R * R
    const disc = b * b - c
    if (disc < 0) {
      if (this.activeRegionIndex !== -1) {
        this.activeRegionIndex = -1
        this.nodes.setActiveRegion(-1)
        this.onRegionChange(null)
      }
      return
    }
    const t = -b - Math.sqrt(disc)
    if (t < 0) return
    const worldHit = O.clone().addScaledVector(D, t)
    const inv = this.globe.group.matrixWorld.clone().invert()
    const localHit = worldHit.applyMatrix4(inv).normalize()

    let bestIdx = -1
    let bestDot = 0.955 // ~ cos(17deg) proximity threshold
    this.nodes.positions.forEach((p, i) => {
      const d = p.clone().normalize().dot(localHit)
      if (d > bestDot) {
        bestDot = d
        bestIdx = i
      }
    })

    if (bestIdx !== this.activeRegionIndex) {
      this.activeRegionIndex = bestIdx
      this.nodes.setActiveRegion(bestIdx)
      this.onRegionChange(bestIdx === -1 ? null : REGIONS[bestIdx])
    }
  }

  // ---------- intro & scroll ----------
  setIntroProgress(p) {
    this._introProgress = p
    this.globe.setProgress(p)
  }

  setScrollProgress(p) {
    this._scrollProgress = THREE.MathUtils.clamp(p, 0, 1)
  }

  /** Pinch-to-zoom nudges the camera along the same journey curve. */
  setPinchDelta(delta) {
    this._zoomNudge = THREE.MathUtils.clamp((this._zoomNudge ?? 0) + delta, -0.15, 0.15)
  }

  _applyCameraForFrame(dt) {
    this._zoomNudge = THREE.MathUtils.damp(this._zoomNudge ?? 0, 0, 3, dt)
    const t = THREE.MathUtils.clamp(this._scrollProgress + this._zoomNudge, 0, 1)

    const point = CAMERA_CURVE.getPointAt(t)
    this.camera.position.copy(point)
    this.camera.lookAt(0, 0, 0)

    const coreReveal = THREE.MathUtils.smoothstep(t, 0.55, 0.92)
    this.core.setReveal(coreReveal)

    const dustVisibility =
      THREE.MathUtils.smoothstep(t, 0.18, 0.5) * (1 - THREE.MathUtils.smoothstep(t, 0.85, 1))
    this.dust.setVisibility(dustVisibility)

    const fov = THREE.MathUtils.lerp(42, 58, THREE.MathUtils.smoothstep(t, 0.4, 0.85))
    this.camera.fov = fov
    this.camera.updateProjectionMatrix()
  }

  triggerMarketPulse() {
    this.globe.triggerShockwave()
    this.core.setEnergy(1)
    gsap.to(this.core, { energy: 0.15, duration: 2.2, ease: 'power2.out', onUpdate: () => this.core.setEnergy(this.core.energy) })
    gsap.fromTo(this.streams, { activityMultiplier: 1.8 }, { activityMultiplier: 1, duration: 3, ease: 'power2.out' })
  }

  // ---------- loop ----------
  start(onFrame) {
    this._clock.start()
    const loop = () => {
      const dt = Math.min(this._clock.getDelta(), 0.05)
      const elapsed = this._clock.getElapsedTime()

      this._updatePointerField()
      this._applyCameraForFrame(dt)
      this.globe.update(dt, elapsed)
      this.streams.update(dt, elapsed)
      this.nodes.update(dt, elapsed)
      this.core.update(dt, elapsed)
      this.dust.update(dt, elapsed)

      this._nextPulseAt -= dt
      if (this._nextPulseAt <= 0) {
        this.triggerMarketPulse()
        this._nextPulseAt = 6 + Math.random() * 6
      }

      this.renderer.render(this.scene, this.camera)
      if (onFrame) onFrame(elapsed)
      this._raf = requestAnimationFrame(loop)
    }
    this._raf = requestAnimationFrame(loop)
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf)
    this._raf = null
  }

  dispose() {
    this.stop()
    this.globe.dispose()
    this.streams.dispose()
    this.nodes.dispose()
    this.core.dispose()
    this.dust.dispose()
    this.renderer.dispose()
  }
}
