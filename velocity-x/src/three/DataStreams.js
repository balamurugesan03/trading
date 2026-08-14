import * as THREE from 'three'
import { latLonToVector3, greatCircleCurve } from './geo.js'

const flowVertex = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uSize;
  attribute float aEnergy;
  varying float vEnergy;
  void main() {
    vEnergy = aEnergy;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float atten = uSize / max(-mvPosition.z, 0.001);
    gl_PointSize = clamp(atten * uPixelRatio * 40.0, 1.0, 10.0);
  }
`
const flowFragment = /* glsl */ `
  precision mediump float;
  uniform vec3 uColorDim;
  uniform vec3 uColorBright;
  varying float vEnergy;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float glow = smoothstep(0.5, 0.0, d);
    vec3 color = mix(uColorDim, uColorBright, vEnergy);
    gl_FragColor = vec4(color, glow * (0.45 + vEnergy * 0.5));
  }
`

/**
 * DataStreams — thin gold particle flows tracing great-circle arcs between
 * financial centers (New York → London → Dubai → Mumbai → Singapore → Tokyo…).
 * Stream intensity (density / speed / glow) encodes market activity.
 */
export class DataStreams {
  constructor({ routes, regions, radius = 4.6, perRoute = 34 }) {
    this.radius = radius
    this.perRoute = perRoute
    this.group = new THREE.Group()

    const regionMap = new Map(regions.map((r) => [r.id, r]))
    this.streams = routes.map(([fromId, toId]) => {
      const from = regionMap.get(fromId)
      const to = regionMap.get(toId)
      const a = latLonToVector3(from.lat, from.lon, radius)
      const b = latLonToVector3(to.lat, to.lon, radius)
      const curve = greatCircleCurve(a, b, radius, 0.32, 80)
      const intensity = (from.flow + to.flow) / 2
      return { curve, intensity, phase: Math.random() }
    })

    this._buildPoints()
  }

  _buildPoints() {
    const total = this.streams.length * this.perRoute
    const positions = new Float32Array(total * 3)
    const energy = new Float32Array(total)

    this.uniforms = {
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uSize: { value: 1.0 },
      uColorDim: { value: new THREE.Color('#6b5a2c') },
      uColorBright: { value: new THREE.Color('#f0dfa9') },
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aEnergy', new THREE.BufferAttribute(energy, 1))

    const material = new THREE.ShaderMaterial({
      vertexShader: flowVertex,
      fragmentShader: flowFragment,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    this.pointsMesh = new THREE.Points(geometry, material)
    this.group.add(this.pointsMesh)
    this._positionAttr = geometry.attributes.position
    this._energyAttr = geometry.attributes.aEnergy
  }

  setActivity(multiplier = 1) {
    this.activityMultiplier = multiplier
  }

  update(dt, elapsed) {
    const posArr = this._positionAttr.array
    const enArr = this._energyAttr.array
    const activity = this.activityMultiplier ?? 1
    let idx = 0

    for (const stream of this.streams) {
      const speed = 0.05 + stream.intensity * 0.12
      for (let i = 0; i < this.perRoute; i++) {
        const t = (stream.phase + i / this.perRoute + elapsed * speed * activity) % 1
        const p = stream.curve.getPointAt(t)
        posArr[idx * 3] = p.x
        posArr[idx * 3 + 1] = p.y
        posArr[idx * 3 + 2] = p.z
        // brighten near the tail's leading edge for a "comet" feel
        const edge = Math.pow(t > 0.02 ? 1 : t / 0.02, 0.5)
        enArr[idx] = stream.intensity * (0.5 + 0.5 * edge)
        idx++
      }
    }
    this._positionAttr.needsUpdate = true
    this._energyAttr.needsUpdate = true
  }

  setPixelRatio(pr) {
    this.uniforms.uPixelRatio.value = pr
  }

  dispose() {
    this.pointsMesh.geometry.dispose()
    this.pointsMesh.material.dispose()
  }
}
