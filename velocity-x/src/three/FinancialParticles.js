import * as THREE from 'three'

/**
 * FinancialParticles — ambient dust field the camera travels through during
 * the scroll journey (Section 3: "financial data particles surround the
 * camera"). Deliberately sparse and dim so it reads as depth, not noise.
 */
export class FinancialParticles {
  constructor({ count = 900, spread = 22 } = {}) {
    this.group = new THREE.Group()

    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread
      speeds[i] = 0.02 + Math.random() * 0.05
    }
    this._speeds = speeds
    this._base = positions.slice()

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const mat = new THREE.PointsMaterial({
      color: '#8f8265',
      size: 0.02,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    this.mesh = new THREE.Points(geo, mat)
    this._pos = geo.attributes.position
    this.group.add(this.mesh)
  }

  /** 0 = invisible, 1 = fully present (peaks mid-journey). */
  setVisibility(v) {
    this.mesh.material.opacity = THREE.MathUtils.clamp(v, 0, 1) * 0.55
  }

  update(dt, elapsed) {
    const arr = this._pos.array
    for (let i = 0; i < this._speeds.length; i++) {
      arr[i * 3 + 1] = this._base[i * 3 + 1] + Math.sin(elapsed * this._speeds[i] + i) * 1.4
    }
    this._pos.needsUpdate = true
    this.group.rotation.y += 0.00025 * dt * 60
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
  }
}
