import * as THREE from 'three'

/**
 * AmbientField — a faint receding tech-grid + drifting gold dust, used as a
 * non-interactive depth layer behind 2D UI (the Trading Terminal). Purely
 * atmospheric: no raycasting, no pointer coupling, kept very low-opacity so
 * it never competes with panel readability.
 */
export class AmbientField {
  constructor(canvas, { tier = 'desktop' } = {}) {
    this.canvas = canvas
    this._raf = null
    this._clock = new THREE.Clock()

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this._pixelRatio = Math.min(window.devicePixelRatio || 1, tier === 'mobile' ? 1.2 : 1.6)
    this.renderer.setPixelRatio(this._pixelRatio)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 60)
    this.camera.position.set(0, 3.2, 7)
    this.camera.lookAt(0, -1, -4)

    this._buildGrid()
    this._buildDust(tier === 'mobile' ? 90 : 220)
  }

  _buildGrid() {
    const grid = new THREE.GridHelper(26, 26, '#c9a24b', '#8a7233')
    grid.position.y = -1.6
    grid.position.z = -3
    grid.material.transparent = true
    grid.material.opacity = 0.1
    grid.material.blending = THREE.AdditiveBlending
    grid.material.depthWrite = false
    this.grid = grid
    this.scene.add(grid)
  }

  _buildDust(count) {
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = Math.random() * 6 - 1
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: '#8f8265',
      size: 0.016,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.dust = new THREE.Points(geo, mat)
    this.scene.add(this.dust)
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
      this.grid.rotation.y += 0.008 * dt
      this.dust.rotation.y += 0.0015 * dt * 60
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
    this.grid.geometry.dispose()
    this.grid.material.dispose()
    this.dust.geometry.dispose()
    this.dust.material.dispose()
    this.renderer.dispose()
  }
}
