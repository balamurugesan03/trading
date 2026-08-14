import * as THREE from 'three'
import { latLonToVector3 } from './geo.js'

/**
 * MarketNodes — pulsing financial-center markers on the globe surface
 * (instanced octahedra, additive gold). Also exposes world positions for
 * proximity-based region hover detection (done cheaply without full raycast
 * since there are only a handful of nodes).
 */
export class MarketNodes {
  constructor({ regions, radius = 4.6 }) {
    this.radius = radius
    this.regions = regions
    this.group = new THREE.Group()

    this.positions = regions.map((r) => latLonToVector3(r.lat, r.lon, radius * 1.01))

    const geo = new THREE.OctahedronGeometry(0.09, 0)
    const mat = new THREE.MeshBasicMaterial({
      color: '#f0dfa9',
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.InstancedMesh(geo, mat, regions.length)
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(regions.length * 3), 3)

    this._dummy = new THREE.Object3D()
    this._phases = regions.map(() => Math.random() * Math.PI * 2)
    this._activeIndex = -1

    this.positions.forEach((p, i) => {
      this._dummy.position.copy(p)
      this._dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this._dummy.matrix)
      this.mesh.setColorAt(i, new THREE.Color('#f0dfa9'))
    })

    this.group.add(this.mesh)
  }

  setActiveRegion(index) {
    this._activeIndex = index
  }

  update(dt, elapsed) {
    this.positions.forEach((p, i) => {
      const isActive = i === this._activeIndex
      const pulse = 0.85 + Math.sin(elapsed * 2.4 + this._phases[i]) * 0.15
      const scale = (isActive ? 1.9 : 1) * pulse
      this._dummy.position.copy(p)
      this._dummy.scale.setScalar(scale)
      this._dummy.rotation.set(elapsed * 0.6 + i, elapsed * 0.4, 0)
      this._dummy.updateMatrix()
      this.mesh.setMatrixAt(i, this._dummy.matrix)
      const c = isActive ? new THREE.Color('#ffe9b0') : new THREE.Color('#e8c874')
      this.mesh.setColorAt(i, c)
    })
    this.mesh.instanceMatrix.needsUpdate = true
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
  }

  /** World-space positions, transformed by the parent group's current matrix. */
  getWorldPositions(parentMatrixWorld) {
    return this.positions.map((p) => p.clone().applyMatrix4(parentMatrixWorld))
  }

  dispose() {
    this.mesh.geometry.dispose()
    this.mesh.material.dispose()
  }
}
