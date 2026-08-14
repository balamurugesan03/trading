/**
 * Generic gold particle point-cloud shader.
 * Drives: NeuralGlobe, DataStreams, MarketCore orbitals.
 *
 * Per-particle attributes:
 *   aTarget   vec3  — assembled (final) position
 *   aScatter  vec3  — pre-assembly scattered origin
 *   aRandom   vec3  — [assembly delay 0..1, drag-kick weight, phase]
 *   aEnergy   float — base brightness / size multiplier 0..1
 *
 * Uniforms drive: assembly progress, cursor attraction field, drag kick,
 * a traveling market-pulse wave, and global time.
 */
export const particleVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;      // 0 = scattered, 1 = fully assembled
  uniform float uPixelRatio;
  uniform float uSize;
  uniform vec3  uCursor;        // world space
  uniform float uCursorRadius;
  uniform float uCursorStrength;
  uniform vec3  uDragVelocity;  // decaying per-frame drag impulse
  uniform float uPulsePhase;    // 0..1 traveling wave progress, <0 disables
  uniform float uPulseWidth;

  attribute vec3 aTarget;
  attribute vec3 aScatter;
  attribute vec3 aRandom;
  attribute float aEnergy;

  varying float vEnergy;
  varying float vGlow;

  float easeOutCubic(float x) {
    return 1.0 - pow(1.0 - x, 3.0);
  }

  void main() {
    float delay = aRandom.x * 0.65;
    float local = clamp((uProgress - delay) / (1.0 - delay), 0.0, 1.0);
    float eased = easeOutCubic(local);

    vec3 pos = mix(aScatter, aTarget, eased);

    // gentle organic drift once assembled
    float driftT = uTime * 0.35 + aRandom.z * 6.2831;
    vec3 drift = vec3(sin(driftT), cos(driftT * 1.3), sin(driftT * 0.7)) * 0.02 * eased;
    pos += drift;

    // cursor gravitational field
    vec3 toCursor = uCursor - pos;
    float dist = length(toCursor);
    float pull = smoothstep(uCursorRadius, 0.0, dist) * uCursorStrength * eased;
    pos += normalize(toCursor + 1e-4) * pull;

    // drag kick — per-particle weighted impulse, creates a stretch-like trail
    pos += uDragVelocity * (0.4 + aRandom.y * 1.6) * eased;

    // traveling market pulse ring (expands outward from origin along radius)
    float r = length(aTarget);
    if (uPulsePhase >= 0.0) {
      float wave = 1.0 - smoothstep(0.0, uPulseWidth, abs(r * 0.14 - uPulsePhase));
      pos += normalize(aTarget + 1e-4) * wave * 0.12 * eased;
      vGlow = wave;
    } else {
      vGlow = 0.0;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float sizeAtten = (uSize * aEnergy) / max(-mvPosition.z, 0.001);
    gl_PointSize = clamp(sizeAtten * uPixelRatio * 60.0, 1.0, 42.0) * mix(0.15, 1.0, eased);

    vEnergy = aEnergy;
  }
`

export const particleFragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec3 uColorDim;
  uniform vec3 uColorBright;
  uniform float uOpacity;

  varying float vEnergy;
  varying float vGlow;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    float core = smoothstep(0.09, 0.0, dist);
    float halo = smoothstep(0.5, 0.0, dist);

    vec3 color = mix(uColorDim, uColorBright, clamp(vEnergy + vGlow * 0.8, 0.0, 1.0));
    float alpha = (halo * 0.35 + core * 0.9) * uOpacity;
    alpha += vGlow * 0.4;

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`
