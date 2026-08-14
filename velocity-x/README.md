# VELOCITY

A living financial intelligence machine — an original, ultra-premium 3D trading
concept site. Obsidian black + metallic gold. Vue 3, Vite, Three.js, GSAP +
ScrollTrigger, custom GLSL.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production bundle to dist/
npm run preview   # serve the production build locally
```

## What's here

**The cinematic hero** (`src/components/HeroScene.vue` + `src/three/`) —
a black-screen intro assembles a particle globe (`NeuralGlobe.js`), gold data
streams arc between financial centers (`DataStreams.js`), region nodes pulse
(`MarketNodes.js`), and GSAP `ScrollTrigger` pins the section for a
scroll-scrubbed camera journey (`SceneManager.js`) from orbit → through the
globe → to the hidden `MarketCore.js` → out into the terminal. Dragging the
globe rotates it with inertia, a per-particle "kick" trail, and a release
shockwave (the **VELOCITY FIELD** interaction) — see `NeuralGlobe.applyDrag` /
`.release()`. The custom cursor (`CursorField.vue`) and the in-scene cursor
gravitational field (`SceneManager._updatePointerField`) share one pointer
source (`useMouseField.js`).

**Below the fold**: `TradingTerminal.vue` (2D-first terminal UI — order book,
candlestick canvas, buy/sell, watchlist, portfolio), `CandlestickScene.vue`
(an optional 3D price/volume landscape, `three/CandleField.js`),
`IntelligenceCore.vue` (energy-ring metrics + neural background + waveform),
and `PortfolioOrbit.vue` (assets orbiting a portfolio-value core).

Market data is a self-contained mock feed (`src/data/marketData.js` +
`useMarketData.js`) — no backend required.

## Notes

- Desktop gets the full particle counts; `SceneManager.detectQualityTier()`
  reduces counts on tablet/mobile. Touch: drag rotates, pinch zooms
  (nudges the scroll-journey camera), tap surfaces the region HUD.
- All Three.js geometries/materials are explicitly disposed on unmount
  (see each class's `dispose()` and `useThreeScene.js`).
