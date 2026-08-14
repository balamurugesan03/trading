import * as THREE from 'three'
import { coreVertexShader, coreFragmentShader } from './shaders/core.glsl.js'

/**
 * MarketCore — the hidden golden energy sphere at the center of the globe.
 * Rotating rings + a thin particle orbital shell. Scales/brightens in as the
 * scroll journey's camera travels toward it, and reacts to drag/interaction.
 */
export class MarketCore {
  constructor({ radius = 0.55 } = {}) {
    this.group = new THREE.Group()
    this.energy = 0

    const coreGeo = new THREE.IcosahedronGeometry(radius, 3)
    this.coreUniforms = {
      uColor: { value: new THREE.Color('#c9a24b') },
      uColorHot: { value: new THREE.Color('#fff2cf') },
      uTime: { value: 0 },
      uEnergy: { value: 0 },
    }
    const coreMat = new THREE.ShaderMaterial({
      vertexShader: coreVertexShader,
      fragmentShader: coreFragmentShader,
      uniforms: this.coreUniforms,
      transparent: true,
    })
    this.core = new THREE.Mesh(coreGeo, coreMat)
    this.group.add(this.core)

    this.rings = new THREE.Group()
    const ringSpecs = [
      { r: radius * 1.9, tiltX: 0.4, tiltY: 0.1, opacity: 0.55 },
      { r: radius * 2.4, tiltX: -0.7, tiltY: 0.6, opacity: 0.35 },
      { r: radius * 2.9, tiltX: 1.1, tiltY: -0.3, opacity: 0.22 },
    ]
    this._ringMeshes = ringSpecs.map(({ r, tiltX, tiltY, opacity }) => {
      const geo = new THREE.TorusGeometry(r, 0.004, 8, 96)
      const mat = new THREE.MeshBasicMaterial({
        color: '#e8c874',
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.rotation.x = tiltX
      mesh.rotation.y = tiltY
      this.rings.add(mesh)
      return mesh
    })
    this.group.add(this.rings)

    this._buildOrbitals(radius)

    this.group.scale.setScalar(0.001)
  }

  _buildOrbitals(radius) {
    const count = 240
    const positions = new Float32Array(count * 3)
    this._orbitalRadii = new Float32Array(count)
    this._orbitalAngles = new Float32Array(count)
    this._orbitalTilts = new Float32Array(count)
    this._orbitalSpeeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const r = radius * (1.6 + Math.random() * 1.8)
      const angle = Math.random() * Math.PI * 2
      this._orbitalRadii[i] = r
      this._orbitalAngles[i] = angle
      this._orbitalTilts[i] = (Math.random() - 0.5) * 1.4
      this._orbitalSpeeds[i] = 0.15 + Math.random() * 0.3
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: '#f0dfa9',
      size: 0.028,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
    this.orbitals = new THREE.Points(geo, mat)
    this._orbitalPos = geo.attributes.position
    this.group.add(this.orbitals)
  }

  setEnergy(e) {
    this.energy = THREE.MathUtils.clamp(e, 0, 1)
  }

  /** 0 = dormant/hidden inside globe, 1 = fully revealed (scroll approach). */
  setReveal(t) {
    const s = THREE.MathUtils.lerp(0.001, 1, t)
    this.group.scale.setScalar(s)
  }

  update(dt, elapsed) {
    this.coreUniforms.uTime.value = elapsed
    this.coreUniforms.uEnergy.value = this.energy

    this.rings.children.forEach((mesh, i) => {
      mesh.rotation.z += (0.12 + i * 0.05) * dt
    })

    const posArr = this._orbitalPos.array
    for (let i = 0; i < this._orbitalRadii.length; i++) {
      const angle = this._orbitalAngles[i] + elapsed * this._orbitalSpeeds[i]
      const r = this._orbitalRadii[i]
      const tilt = this._orbitalTilts[i]
      const x = Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = Math.sin(angle * 1.7 + tilt * 4.0) * r * 0.25 * tilt
      posArr[i * 3] = x
      posArr[i * 3 + 1] = y
      posArr[i * 3 + 2] = z
    }
    this._orbitalPos.needsUpdate = true

    this.core.rotation.y += 0.08 * dt
    this.core.rotation.x += 0.03 * dt
  }

  dispose() {
    this.core.geometry.dispose()
    this.core.material.dispose()
    this._ringMeshes.forEach((m) => {
      m.geometry.dispose()
      m.material.dispose()
    })
    this.orbitals.geometry.dispose()
    this.orbitals.material.dispose()
  }
}
