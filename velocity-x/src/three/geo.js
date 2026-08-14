import * as THREE from 'three'

/** Convert lat/lon (degrees) to a position on a sphere of given radius. */
export function latLonToVector3(lat, lon, radius, target = new THREE.Vector3()) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return target.set(x, y, z)
}

/** Even distribution of N points on a unit sphere via the Fibonacci-sphere method. */
export function fibonacciSphere(count, radius = 1) {
  const points = []
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    const x = Math.cos(theta) * r
    const z = Math.sin(theta) * r
    points.push(new THREE.Vector3(x * radius, y * radius, z * radius))
  }
  return points
}

/** Great-circle interpolation between two points on a sphere (slerp), lifted outward mid-arc. */
export function greatCircleCurve(a, b, radius, lift = 0.35, segments = 64) {
  const start = a.clone().normalize()
  const end = b.clone().normalize()
  const omega = Math.acos(THREE.MathUtils.clamp(start.dot(end), -1, 1))
  const pts = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    let p
    if (omega < 1e-5) {
      p = start.clone()
    } else {
      const s1 = Math.sin((1 - t) * omega) / Math.sin(omega)
      const s2 = Math.sin(t * omega) / Math.sin(omega)
      p = start.clone().multiplyScalar(s1).add(end.clone().multiplyScalar(s2))
    }
    const arcHeight = Math.sin(t * Math.PI) * lift
    p.multiplyScalar(radius * (1 + arcHeight))
    pts.push(p)
  }
  return new THREE.CatmullRomCurve3(pts)
}
