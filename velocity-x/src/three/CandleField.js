import * as THREE from 'three'

const UP = new THREE.Color('#58c98f')
const DOWN = new THREE.Color('#d9695f')
const GOLD = new THREE.Color('#e8c874')

/**
 * CandleField — the optional 3D financial landscape: candles become
 * geometry, volume becomes terrain, and the camera drifts with the cursor.
 * Mirrors the SceneManager interface (resize/start/stop/dispose) so it can
 * share the useThreeScene composable.
 */
export class CandleField {
  constructor(canvas, { candles = [], onHover, tier = 'desktop' } = {}) {
    this.canvas = canvas
    this.candles = candles
    this.onHover = onHover || (() => {})
    this.spacing = 0.42
    this.hoverIndex = -1
    this._pointer = new THREE.Vector2(9999, 9999)
    this._parallax = new THREE.Vector2()
    this._raf = null
    this._clock = new THREE.Clock()

    this._init(tier)
  }

  _init(tier) {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this._pixelRatio = Math.min(window.devicePixelRatio || 1, tier === 'mobile' ? 1.4 : 2)
    this.renderer.setPixelRatio(this._pixelRatio)

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    this.cameraBase = new THREE.Vector3(0, 3.6, 10.5)
    this.camera.position.copy(this.cameraBase)
    this.camera.lookAt(0, 0.4, 0)

    this._raycaster = new THREE.Raycaster()
    this._buildLandscape()
    this._buildDust()
  }

  _buildLandscape() {
    const n = this.candles.length
    const prices = this.candles.flatMap((c) => [c.h, c.l])
    const max = Math.max(...prices)
    const min = Math.min(...prices)
    const range = max - min || 1
    const volMax = Math.max(...this.candles.map((c) => c.v))
    const heightScale = 4.2
    const offsetX = -((n - 1) * this.spacing) / 2

    const bodyGeo = new THREE.BoxGeometry(0.24, 1, 0.24)
    const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.6, emissiveIntensity: 0.4 })
    this.bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, n)
    this.bodies.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3)

    const wickGeo = new THREE.BoxGeometry(0.04, 1, 0.04)
    const wickMat = new THREE.MeshBasicMaterial({ color: '#cfcac0', transparent: true, opacity: 0.5 })
    this.wicks = new THREE.InstancedMesh(wickGeo, wickMat, n)

    const volGeo = new THREE.BoxGeometry(0.3, 1, 0.3)
    const volMat = new THREE.MeshBasicMaterial({ color: '#8a7233', transparent: true, opacity: 0.35 })
    this.volumes = new THREE.InstancedMesh(volGeo, volMat, n)

    const dummy = new THREE.Object3D()
    this._baseY = []
    this.candles.forEach((c, i) => {
      const x = offsetX + i * this.spacing
      const yLow = ((c.l - min) / range) * heightScale
      const yHigh = ((c.h - min) / range) * heightScale
      const yOpen = ((c.o - min) / range) * heightScale
      const yClose = ((c.c - min) / range) * heightScale
      const up = c.c >= c.o

      const bodyBottom = Math.min(yOpen, yClose)
      const bodyH = Math.max(0.05, Math.abs(yClose - yOpen))
      dummy.position.set(x, bodyBottom + bodyH / 2, 0)
      dummy.scale.set(1, bodyH, 1)
      dummy.updateMatrix()
      this.bodies.setMatrixAt(i, dummy.matrix)
      this.bodies.setColorAt(i, up ? UP : DOWN)

      const wickH = Math.max(0.05, yHigh - yLow)
      dummy.position.set(x, yLow + wickH / 2, 0)
      dummy.scale.set(1, wickH, 1)
      dummy.updateMatrix()
      this.wicks.setMatrixAt(i, dummy.matrix)

      const volH = Math.max(0.06, (c.v / volMax) * 1.4)
      dummy.position.set(x, volH / 2, 1.7)
      dummy.scale.set(1, volH, 1)
      dummy.updateMatrix()
      this.volumes.setMatrixAt(i, dummy.matrix)

      this._baseY.push(bodyBottom + bodyH / 2)
    })

    const highest = this.candles.reduce((a, b, i) => (b.h > this.candles[a].h ? i : a), 0)
    const lowest = this.candles.reduce((a, b, i) => (b.l < this.candles[a].l ? i : a), 0)
    this.priceLabels = [
      { type: 'HIGH', price: this.candles[highest].h, local: new THREE.Vector3(offsetX + highest * this.spacing, ((this.candles[highest].h - min) / range) * heightScale + 0.3, 0) },
      { type: 'LOW', price: this.candles[lowest].l, local: new THREE.Vector3(offsetX + lowest * this.spacing, ((this.candles[lowest].l - min) / range) * heightScale - 0.1, 0) },
    ]

    this.group = new THREE.Group()
    this.group.add(this.bodies, this.wicks, this.volumes)
    this.scene.add(this.group)

    const light = new THREE.DirectionalLight(0xf0dfa9, 1.4)
    light.position.set(3, 6, 4)
    const ambient = new THREE.AmbientLight(0x3a3226, 1.2)
    this.scene.add(light, ambient)

    this._n = n
    this._offsetX = offsetX
  }

  _buildDust() {
    const count = 260
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = Math.random() * 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: GOLD,
      size: 0.02,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.dust = new THREE.Points(geo, mat)
    this.scene.add(this.dust)
  }

  setPointerNDC(x, y) {
    this._pointer.set(x, y)
    this._parallax.set(x, y)
    this._raycastHover()
  }
  clearPointer() {
    this._pointer.set(9999, 9999)
    if (this.hoverIndex !== -1) {
      this.hoverIndex = -1
      this.onHover(-1)
    }
  }

  _raycastHover() {
    if (this._pointer.x > 100) return
    this._raycaster.setFromCamera(this._pointer, this.camera)
    const hits = this._raycaster.intersectObject(this.bodies)
    const idx = hits.length ? hits[0].instanceId : -1
    if (idx !== this.hoverIndex) {
      this.hoverIndex = idx
      this.onHover(idx)
    }
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

      const targetX = this.cameraBase.x + this._parallax.x * 1.1
      const targetY = this.cameraBase.y + this._parallax.y * 0.5
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetX, 3, dt)
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetY, 3, dt)
      this.camera.lookAt(0, 0.6, 0)

      this.dust.rotation.y += 0.0006 * dt * 60
      this.group.rotation.y = Math.sin(elapsed * 0.05) * 0.06

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
    this.bodies.geometry.dispose()
    this.bodies.material.dispose()
    this.wicks.geometry.dispose()
    this.wicks.material.dispose()
    this.volumes.geometry.dispose()
    this.volumes.material.dispose()
    this.dust.geometry.dispose()
    this.dust.material.dispose()
    this.renderer.dispose()
  }
}
