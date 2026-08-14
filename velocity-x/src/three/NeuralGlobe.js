import * as THREE from 'three'
import gsap from 'gsap'
import { fibonacciSphere } from './geo.js'
import { particleVertexShader, particleFragmentShader } from './shaders/particle.glsl.js'
import { atmosphereVertexShader, atmosphereFragmentShader } from './shaders/atmosphere.glsl.js'

const GOLD_DIM = new THREE.Color('#6b5a2c')
const GOLD_BRIGHT = new THREE.Color('#f0dfa9')

/**
 * NeuralGlobe — the signature object of VELOCITY.
 * A particle-built sphere that assembles from scattered points, reacts to a
 * cursor gravitational field, and can be dragged with physical inertia
 * ("VELOCITY FIELD" interaction).
 */
export class NeuralGlobe {
  constructor({ radius = 4.6, count = 6200 } = {}) {
    this.radius = radius
    this.count = count
    this.group = new THREE.Group()

    this.angularVelocity = new THREE.Vector2(0.00035, 0.00012) // yaw, pitch idle drift
    this.dragKick = new THREE.Vector3()
    this._pulseActive = false
    this._pulseObj = { phase: -1 }

    this._buildParticles()
    this._buildAtmosphere()
    this._buildOrbitRings()
  }

  _buildParticles() {
    const n = this.count
    const targets = fibonacciSphere(n, this.radius)
    const positions = new Float32Array(n * 3)
    const scatter = new Float32Array(n * 3)
    const randoms = new Float32Array(n * 3)
    const energy = new Float32Array(n)

    const tmp = new THREE.Vector3()
    for (let i = 0; i < n; i++) {
      const t = targets[i]
      positions[i * 3] = t.x
      positions[i * 3 + 1] = t.y
      positions[i * 3 + 2] = t.z

      // scatter origin: far random direction, so particles fly inward on assembly
      tmp.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
      const scatterR = this.radius * (2.4 + Math.random() * 3.2)
      scatter[i * 3] = tmp.x * scatterR
      scatter[i * 3 + 1] = tmp.y * scatterR
      scatter[i * 3 + 2] = tmp.z * scatterR

      randoms[i * 3] = Math.random() // assembly delay
      randoms[i * 3 + 1] = Math.random() // drag-kick weight
      randoms[i * 3 + 2] = Math.random() * Math.PI * 2 // phase

      energy[i] = 0.35 + Math.random() * 0.65
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aTarget', new THREE.BufferAttribute(positions.slice(), 3))
    geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3))
    geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 3))
    geometry.setAttribute('aEnergy', new THREE.BufferAttribute(energy, 1))

    this.uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uSize: { value: 1.15 },
      uCursor: { value: new THREE.Vector3(9999, 9999, 9999) },
      uCursorRadius: { value: 1.6 },
      uCursorStrength: { value: 0.55 },
      uDragVelocity: { value: new THREE.Vector3() },
      uPulsePhase: { value: -1 },
      uPulseWidth: { value: 2.2 },
      uColorDim: { value: GOLD_DIM },
      uColorBright: { value: GOLD_BRIGHT },
      uOpacity: { value: 0.92 },
    }

    const material = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.points = new THREE.Points(geometry, material)
    this.group.add(this.points)
  }

  _buildAtmosphere() {
    // slightly larger than the particle shell, FrontSide only — fresnel
    // falls to ~0 at the disc center and rises only at the grazing limb,
    // reading as a thin rim of haze rather than a filled glowing disc.
    const geo = new THREE.SphereGeometry(this.radius * 1.05, 48, 48)
    this.atmosphereUniforms = {
      uColor: { value: new THREE.Color('#c9a24b') },
      uIntensity: { value: 0.22 },
      uProgress: { value: 0 },
    }
    const mat = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: this.atmosphereUniforms,
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    this.atmosphere = new THREE.Mesh(geo, mat)
    this.group.add(this.atmosphere)
  }

  _buildOrbitRings() {
    this.orbitRings = new THREE.Group()
    const tilts = [
      { r: 1.32, tiltX: 0.35, tiltZ: 0.1 },
      { r: 1.48, tiltX: -0.5, tiltZ: 0.4 },
      { r: 1.6, tiltX: 0.15, tiltZ: -0.6 },
    ]
    tilts.forEach(({ r, tiltX, tiltZ }, i) => {
      const points = []
      const segs = 128
      for (let i2 = 0; i2 <= segs; i2++) {
        const a = (i2 / segs) * Math.PI * 2
        points.push(new THREE.Vector3(Math.cos(a) * this.radius * r, 0, Math.sin(a) * this.radius * r))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const mat = new THREE.LineBasicMaterial({
        color: '#c9a24b',
        transparent: true,
        opacity: 0.08 + i * 0.02,
        blending: THREE.AdditiveBlending,
      })
      const line = new THREE.LineLoop(geo, mat)
      line.rotation.x = tiltX
      line.rotation.z = tiltZ
      this.orbitRings.add(line)
    })
    this.group.add(this.orbitRings)
  }

  setProgress(p) {
    this.uniforms.uProgress.value = p
    this.atmosphereUniforms.uProgress.value = p
  }

  setCursorWorld(vec3, { radius, strength } = {}) {
    this.uniforms.uCursor.value.copy(vec3)
    if (radius !== undefined) this.uniforms.uCursorRadius.value = radius
    if (strength !== undefined) this.uniforms.uCursorStrength.value = strength
  }

  clearCursor() {
    this.uniforms.uCursor.value.set(9999, 9999, 9999)
  }

  /** Called continuously while dragging: deltaX/deltaY in normalized screen units. */
  applyDrag(deltaX, deltaY) {
    this.group.rotation.y += deltaX * 2.4
    this.group.rotation.x = THREE.MathUtils.clamp(this.group.rotation.x + deltaY * 2.4, -1.1, 1.1)

    this.angularVelocity.x = deltaX * 2.4
    this.angularVelocity.y = deltaY * 2.4

    // kick nearby particles along drag direction — reads as a stretch/trail
    gsap.killTweensOf(this.dragKick)
    this.dragKick.set(deltaX * 6, -deltaY * 6, 0)
    this.uniforms.uDragVelocity.value.copy(this.dragKick)
    gsap.to(this.uniforms.uDragVelocity.value, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.9,
      ease: 'power3.out',
    })
  }

  /** Called on pointer release: momentum decay + gold shockwave. */
  release() {
    gsap.to(this.angularVelocity, {
      x: 0,
      y: 0,
      duration: 1.8,
      ease: 'power2.out',
    })
    this.triggerShockwave()
  }

  triggerShockwave() {
    this._pulseObj.phase = 0
    gsap.killTweensOf(this._pulseObj)
    gsap.to(this._pulseObj, {
      phase: 9,
      duration: 1.4,
      ease: 'power1.out',
      onUpdate: () => {
        this.uniforms.uPulsePhase.value = this._pulseObj.phase
      },
      onComplete: () => {
        this.uniforms.uPulsePhase.value = -1
      },
    })
  }

  update(dt, elapsed) {
    this.uniforms.uTime.value = elapsed

    // idle rotation + momentum from drag
    this.group.rotation.y += this.angularVelocity.x * 0.06 + 0.00028 * dt * 60
    this.group.rotation.x += this.angularVelocity.y * 0.06
    this.group.rotation.x = THREE.MathUtils.clamp(this.group.rotation.x, -1.1, 1.1)

    // idle angular velocity relaxes toward a gentle constant drift, not zero
    this.angularVelocity.x = THREE.MathUtils.damp(this.angularVelocity.x, 0, 2.4, dt)
    this.angularVelocity.y = THREE.MathUtils.damp(this.angularVelocity.y, 0, 2.4, dt)

    this.orbitRings.rotation.y += 0.00018 * dt * 60
  }

  setPixelRatio(pr) {
    this.uniforms.uPixelRatio.value = pr
  }

  dispose() {
    this.points.geometry.dispose()
    this.points.material.dispose()
    this.atmosphere.geometry.dispose()
    this.atmosphere.material.dispose()
    this.orbitRings.children.forEach((l) => {
      l.geometry.dispose()
      l.material.dispose()
    })
  }
}
