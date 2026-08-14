import { onBeforeUnmount, onMounted, reactive } from 'vue'
import { REGIONS, PORTFOLIO_ASSETS, AI_METRICS, WATCHLIST } from '../data/marketData.js'

function randomWalk(value, magnitude = 0.06) {
  return value * (1 + (Math.random() - 0.5) * magnitude * 0.01)
}

/**
 * Reactive market data — a lightweight simulated feed layered over the
 * static mock dataset so the UI reads as "live" without a real backend.
 */
export function useMarketData({ live = true, intervalMs = 2400 } = {}) {
  const regions = reactive(structuredClone(REGIONS))
  const portfolio = reactive(structuredClone(PORTFOLIO_ASSETS))
  const intelligence = reactive({ ...AI_METRICS })
  const watchlist = reactive(structuredClone(WATCHLIST))

  let timer = null

  function tick() {
    regions.forEach((r) => {
      r.indices.forEach((idx) => {
        idx.value = randomWalk(idx.value, 0.4)
        idx.change = Number((idx.change + (Math.random() - 0.5) * 0.08).toFixed(2))
      })
      r.flow = Math.min(1, Math.max(0.15, r.flow + (Math.random() - 0.5) * 0.05))
    })
    portfolio.forEach((a) => {
      a.value = randomWalk(a.value, 0.5)
      a.change = Number((a.change + (Math.random() - 0.5) * 0.1).toFixed(2))
    })
    watchlist.forEach((w) => {
      w.price = randomWalk(w.price, 0.5)
      w.change = Number((w.change + (Math.random() - 0.5) * 0.1).toFixed(2))
    })
    intelligence.sentiment = Math.min(99, Math.max(1, Math.round(intelligence.sentiment + (Math.random() - 0.5) * 4)))
    intelligence.momentum = Math.min(99, Math.max(1, Math.round(intelligence.momentum + (Math.random() - 0.5) * 4)))
    intelligence.liquidity = Math.min(99, Math.max(1, Math.round(intelligence.liquidity + (Math.random() - 0.5) * 3)))
    intelligence.risk = Math.min(99, Math.max(1, Math.round(intelligence.risk + (Math.random() - 0.5) * 3)))
  }

  onMounted(() => {
    if (live) timer = setInterval(tick, intervalMs)
  })
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return { regions, portfolio, intelligence, watchlist, tick }
}
