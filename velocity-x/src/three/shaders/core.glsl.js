/**
 * Market Core shader — a small dense golden energy sphere with an internal
 * fresnel glow and a soft animated noise shimmer, used for the hidden core
 * object at the center of the globe.
 */
export const coreVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

export const coreFragmentShader = /* glsl */ `
  precision mediump float;
  uniform vec3 uColor;
  uniform vec3 uColorHot;
  uniform float uTime;
  uniform float uEnergy; // 0..1 reacts to interaction

  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - clamp(dot(vNormal, viewDir), 0.0, 1.0), 1.6);
    float shimmer = 0.5 + 0.5 * sin(uTime * 2.2 + vNormal.y * 8.0);
    vec3 color = mix(uColor, uColorHot, fresnel * 0.7 + shimmer * 0.15 * uEnergy);
    float core = 0.55 + 0.45 * (1.0 - fresnel);
    float alpha = clamp(core + fresnel * 0.5, 0.0, 1.0);
    gl_FragColor = vec4(color * (0.7 + uEnergy * 0.6), alpha);
  }
`
