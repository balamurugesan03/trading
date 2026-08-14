import * as THREE from 'three'
import gsap from 'gsap'
import { coreVertexShader, coreFragmentShader } from './shaders/core.glsl.js'

/**
 * PortfolioField — assets as physical objects on tilted 3D orbits around a
 * glowing portfolio core. Mirrors the SceneManager interface (resize/start/
 * stop/dispose) so it shares the useThreeScene composable.
 */
export class PortfolioField {
  constructor(canvas, { assets = [], onSelect, onHover, tier = 'desktop' } = {}) {
    this.canvas = canvas
    this.assets = assets
    this.onSelect = onSelect || (() => {})
    this.onHover = onHover || (() => {})
    this.selectedId = null
    this.hoveredId = null

    this._pointer = new THREE.Vector2(9999, 9999)
    this._parallax = new THREE.Vector2()
    this._raf = null
    this._clock = new THREE.Clock()
    this._raycaster = new THREE.Raycaster()

    this._init(tier)
  }

  _init(tier) {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this._pixelRatio = Math.min(window.devicePixelRatio || 1, tier === 'mobile' ? 1.4 : 2)
    this.renderer.setPixelRatio(this._pixelRatio)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
    this.cameraBase = new THREE.Vector3(0, 2.4, 8.4)
    this.camera.position.copy(this.cameraBase)
    this.camera.lookAt(0, 0, 0)

    this._buildCore()
    this._buildOrbits()
    this._buildDust()
  }

  _buildCore() {
    const geo = new THREE.IcosahedronGeometry(0.62, 3)
    this.coreUniforms = {
      uColor: { value: new THREE.Color('#c9a24b') },
      uColorHot: { value: new THREE.Color('#fff2cf') },
      uTime: { value: 0 },
      uEnergy: { value: 0.3 },
    }
    const mat = new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: this.coreUniforms,
      transparent: true,
    })
    this.core = new THREE.Mesh(geo, mat)
    this.scene.add(this.core)

    this.coreRings = new THREE.Group()
    ;[
      { r: 0.95, x: 0.5, y: 0.1 },
      { r: 1.15, x: -0.7, y: 0.6 },
    ].forEach(({ r, x, y }) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.006, 8, 96)
      const ringMat = new THREE.MeshBasicMaterial({
        color: '#e8c874',
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.set(x, y, 0)
      this.coreRings.add(ring)
    })
    this.scene.add(this.coreRings)
  }

  _buildOrbits() {
    const maxRadius = Math.max(...this.assets.map((a) => a.radius))
    this.entries = this.assets.map((asset, i) => {
      const radius = 1.5 + (asset.radius / maxRadius) * 2.6
      const tiltX = (i / this.assets.length) * 0.7 - 0.35 + (i % 2 === 0 ? 0.18 : -0.18)
      const tiltZ = ((i * 37) % 60) * (Math.PI / 180) - 0.5

      const pivot = new THREE.Group()
      pivot.rotation.set(tiltX, 0, tiltZ)
      this.scene.add(pivot)

      const ringPts = []
      for (let s = 0; s <= 96; s++) {
        const a = (s / 96) * Math.PI * 2
        ringPts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts)
      const ringMat = new THREE.LineBasicMaterial({
        color: asset.color,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
      })
      pivot.add(new THREE.LineLoop(ringGeo, ringMat))

      const orbiter = new THREE.Group()
      pivot.add(orbiter)

      const markerGeo = new THREE.OctahedronGeometry(0.16, 0)
      const markerMat = new THREE.MeshBasicMaterial({
        color: asset.color,
        transparent: true,
        opacity: 0.95,
      })
      const marker = new THREE.Mesh(markerGeo, markerMat)
      marker.position.set(radius, 0, 0)
      marker.userData.assetId = asset.id
      orbiter.add(marker)

      const haloGeo = new THREE.RingGeometry(0.22, 0.26, 32)
      const haloMat = new THREE.MeshBasicMaterial({
        color: asset.color,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const halo = new THREE.Mesh(haloGeo, haloMat)
      marker.add(halo)

      return {
        asset,
        radius,
        angle: (i / this.assets.length) * Math.PI * 2,
        speed: asset.speed,
        pivot,
        orbiter,
        marker,
        markerMat,
        halo,
        scale: 1,
        targetScale: 1,
      }
    })

    this._markerMeshes = this.entries.map((e) => e.marker)
  }

  _buildDust() {
    const count = 240
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: '#8f8265',
      size: 0.018,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.dust = new THREE.Points(geo, mat)
    this.scene.add(this.dust)
  }

  // ---------- interaction ----------
  setPointerNDC(x, y) {
    this._pointer.set(x, y)
    this._parallax.set(x, y)
    this._raycastHover()
  }
  clearPointer() {
    this._pointer.set(9999, 9999)
    if (this.hoveredId !== null) {
      this.hoveredId = null
      this.onHover(null)
    }
  }

  _raycastHover() {
    if (this._pointer.x > 100) return
    this._raycaster.setFromCamera(this._pointer, this.camera)
    const hits = this._raycaster.intersectObjects(this._markerMeshes)
    const id = hits.length ? hits[0].object.userData.assetId : null
    if (id !== this.hoveredId) {
      this.hoveredId = id
      this.onHover(id)
      this.entries.forEach((e) => {
        if (e.asset.id === this.selectedId) return
        e.targetScale = e.asset.id === id ? 1.3 : 1
      })
    }
  }

  handleClick() {
    if (this.hoveredId) {
      this.setSelected(this.selectedId === this.hoveredId ? null : this.hoveredId)
      this.onSelect(this.selectedId)
    }
  }

  setSelected(id) {
    this.selectedId = id
    this.entries.forEach((e) => {
      const isSel = e.asset.id === id
      const dim = id !== null && !isSel
      e.targetScale = isSel ? 1.9 : 1
      gsap.to(e.markerMat, { opacity: dim ? 0.25 : 0.95, duration: 0.5, ease: 'power2.out' })
      gsap.to(e.halo.material, { opacity: dim ? 0.08 : 0.35, duration: 0.5, ease: 'power2.out' })
    })
    gsap.to(this.coreUniforms.uEnergy, { value: id ? 0.9 : 0.3, duration: 0.6, ease: 'power2.out' })
  }

  /** Screen-space anchors for DOM label overlays, refreshed by the caller each frame. */
  getLabelAnchors() {
    return this.entries.map((e) => ({
      id: e.asset.id,
      label: e.asset.label,
      world: e.marker.getWorldPosition(new THREE.Vector3()),
    }))
  }

  resize(width, height) {
    this.camera.aspect = width / Math.max(height, 1)
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height, false)
  }

  start() {
    this._clock.start()
    const loop = () => {
      const dt = Math.min(this._clock.getDelta(), 0.05)
      const elapsed = this._clock.getElapsedTime()

      this.entries.forEach((e) => {
        e.orbiter.rotation.y = e.angle + elapsed * e.speed
        e.scale = THREE.MathUtils.damp(e.scale, e.targetScale, 4, dt)
        e.marker.scale.setScalar(e.scale)
        e.marker.rotation.y += dt * 0.8
        e.marker.rotation.x += dt * 0.4
      })

      this.core.rotation.y += 0.12 * dt
      this.core.rotation.x += 0.04 * dt
      this.coreUniforms.uTime.value = elapsed
      this.coreRings.rotation.y += 0.05 * dt
      this.coreRings.rotation.z += 0.03 * dt
      this.dust.rotation.y += 0.0004 * dt * 60

      const targetX = this.cameraBase.x + this._parallax.x * 0.9
      const targetY = this.cameraBase.y + this._parallax.y * 0.5
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 3, dt)
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetY, 3, dt)
      this.camera.lookAt(0, 0, 0)

      this.renderer.render(this.scene, this.camera)
      this._raf = requestAnimationFrame(loop)
    }
    this._raf = requestAnimationFrame(loop)
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf)
  }

  dispose() {
    this.stop()
    this.core.geometry.dispose()
    this.core.material.dispose()
    this.coreRings.children.forEach((r) => {
      r.geometry.dispose()
      r.material.dispose()
    })
    this.entries.forEach((e) => {
      e.marker.geometry.dispose()
      e.markerMat.dispose()
      e.halo.geometry.dispose()
      e.halo.material.dispose()
      e.pivot.children.forEach((child) => {
        if (child.isLineLoop) {
          child.geometry.dispose()
          child.material.dispose()
        }
      })
    })
    this.dust.geometry.dispose()
    this.dust.material.dispose()
    this.renderer.dispose()
  }
}
