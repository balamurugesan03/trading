<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useMarketData } from '../composables/useMarketData.js'
import { useThreeScene } from '../composables/useThreeScene.js'
import { AmbientField } from '../three/AmbientField.js'
import { detectQualityTier } from '../three/SceneManager.js'
import { generateCandles, generateOrderBook, generateRecentTrades, WATCHLIST } from '../data/marketData.js'

const { portfolio, watchlist } = useMarketData()

const ambientCanvas = ref(null)
useThreeScene(ambientCanvas, { tier: detectQualityTier() }, AmbientField)

const symbols = WATCHLIST.map((w) => w.symbol)
const activeSymbol = ref('BTC/USD')
const side = ref('buy')
const amount = ref('0.25')

const candles = ref(generateCandles(110, 118000, 7))
const orderBook = ref(generateOrderBook(118420, 10, 3))
const recentTrades = ref(generateRecentTrades(118420, 16, 11))

const chartCanvas = ref(null)
const hoverCandle = ref(null)

const activeAsset = computed(() => watchlist.find((w) => w.symbol === activeSymbol.value) || watchlist[0])

const totalCost = computed(() => {
  const n = Number(amount.value) || 0
  return (n * (activeAsset.value?.price ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })
})

function drawChart() {
  const canvas = chartCanvas.value
  if (!canvas) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const w = rect.width
  const h = rect.height
  ctx.clearRect(0, 0, w, h)

  const data = candles.value
  const prices = data.flatMap((c) => [c.h, c.l])
  const max = Math.max(...prices)
  const min = Math.min(...prices)
  const pad = (max - min) * 0.08
  const top = max + pad
  const bottom = min - pad

  const volMax = Math.max(...data.map((c) => c.v))
  const chartH = h * 0.76
  const volH = h * 0.18
  const volTop = h - volH

  const slot = w / data.length
  const bodyW = Math.max(2, slot * 0.55)

  // gridlines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'
  ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    const y = (chartH / 4) * i
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  data.forEach((c, i) => {
    const x = i * slot + slot / 2
    const yFor = (p) => chartH - ((p - bottom) / (top - bottom)) * chartH
    const up = c.c >= c.o
    const color = up ? '#58c98f' : '#d9695f'

    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(x, yFor(c.h))
    ctx.lineTo(x, yFor(c.l))
    ctx.stroke()

    ctx.fillStyle = color
    const yOpen = yFor(c.o)
    const yClose = yFor(c.c)
    const bodyTop = Math.min(yOpen, yClose)
    const bodyH = Math.max(1, Math.abs(yClose - yOpen))
    ctx.fillRect(x - bodyW / 2, bodyTop, bodyW, bodyH)

    // volume
    const vh = (c.v / volMax) * volH
    ctx.fillStyle = up ? 'rgba(88,201,143,0.35)' : 'rgba(217,105,95,0.35)'
    ctx.fillRect(x - bodyW / 2, h - vh, bodyW, vh)
  })
  void volTop

  // hover crosshair + last price line
  const last = data[data.length - 1]
  const lastY = chartH - ((last.c - bottom) / (top - bottom)) * chartH
  ctx.strokeStyle = 'rgba(232,200,116,0.5)'
  ctx.setLineDash([3, 4])
  ctx.beginPath()
  ctx.moveTo(0, lastY)
  ctx.lineTo(w, lastY)
  ctx.stroke()
  ctx.setLineDash([])
}

function onChartMove(e) {
  const canvas = chartCanvas.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const slot = rect.width / candles.value.length
  const idx = Math.min(candles.value.length - 1, Math.max(0, Math.floor(x / slot)))
  hoverCandle.value = candles.value[idx]
}
function onChartLeave() {
  hoverCandle.value = null
}

// subtle 3D perspective tilt on whichever panel the cursor is over
let tiltedPanel = null
function onGridMouseMove(e) {
  const panel = e.target.closest('.panel')
  if (panel !== tiltedPanel) {
    if (tiltedPanel) tiltedPanel.style.transform = ''
    tiltedPanel = panel
  }
  if (!panel) return
  const rect = panel.getBoundingClientRect()
  const relX = (e.clientX - rect.left) / rect.width - 0.5
  const relY = (e.clientY - rect.top) / rect.height - 0.5
  panel.style.transform = `perspective(900px) rotateX(${(-relY * 5).toFixed(2)}deg) rotateY(${(relX * 5).toFixed(2)}deg) translateZ(2px)`
}
function onGridMouseLeave() {
  if (tiltedPanel) {
    tiltedPanel.style.transform = ''
    tiltedPanel = null
  }
}

let resizeObs = null
let refreshTimer = null

onMounted(async () => {
  await nextTick()
  drawChart()
  resizeObs = new ResizeObserver(() => drawChart())
  if (chartCanvas.value) resizeObs.observe(chartCanvas.value)

  refreshTimer = setInterval(() => {
    orderBook.value = generateOrderBook(activeAsset.value?.price ?? 118420, 10, Date.now() % 997)
    recentTrades.value = generateRecentTrades(activeAsset.value?.price ?? 118420, 16, Date.now() % 733)
    const arr = candles.value.slice()
    const lastC = arr[arr.length - 1]
    const drift = lastC.c * (Math.random() - 0.5) * 0.004
    lastC.c = Math.max(1, lastC.c + drift)
    lastC.h = Math.max(lastC.h, lastC.c)
    lastC.l = Math.min(lastC.l, lastC.c)
    candles.value = arr
    drawChart()
  }, 2600)
})
onBeforeUnmount(() => {
  resizeObs?.disconnect()
  if (refreshTimer) clearInterval(refreshTimer)
})
watch(activeSymbol, () => {
  candles.value = generateCandles(110, activeAsset.value?.price ?? 100, activeSymbol.value.length * 13)
  nextTick(drawChart)
})
</script>

<template>
  <section id="trading" class="terminal section-pad">
    <header class="terminal__header">
      <p class="eyebrow">Trading</p>
      <h2 class="display-l">The Terminal</h2>
    </header>

    <canvas ref="ambientCanvas" class="terminal__ambient" aria-hidden="true"></canvas>

    <div class="terminal__grid" @mousemove="onGridMouseMove" @mouseleave="onGridMouseLeave">
      <!-- asset selector + price -->
      <div class="panel panel--asset glass">
        <div class="asset-tabs">
          <button
            v-for="s in symbols"
            :key="s"
            class="asset-tabs__item"
            :class="{ active: s === activeSymbol }"
            data-cursor="hover"
            @click="activeSymbol = s"
          >
            {{ s }}
          </button>
        </div>
        <div class="asset-price">
          <span class="asset-price__value mono-num">{{ activeAsset?.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
          <span class="asset-price__change mono-num" :class="activeAsset?.change >= 0 ? 'text-up' : 'text-down'">
            {{ activeAsset?.change >= 0 ? '+' : '' }}{{ activeAsset?.change.toFixed(2) }}%
          </span>
          <span class="asset-price__label">24H</span>
        </div>
      </div>

      <!-- chart -->
      <div class="panel panel--chart glass">
        <div class="panel__label">
          <span>{{ activeSymbol }} · 1H</span>
          <span v-if="hoverCandle" class="mono-num panel__ohlc">
            O {{ hoverCandle.o.toFixed(1) }} H {{ hoverCandle.h.toFixed(1) }} L {{ hoverCandle.l.toFixed(1) }} C {{ hoverCandle.c.toFixed(1) }}
          </span>
        </div>
        <canvas ref="chartCanvas" class="chart-canvas" @mousemove="onChartMove" @mouseleave="onChartLeave"></canvas>
      </div>

      <!-- order book -->
      <div class="panel panel--book glass">
        <p class="panel__label">Order Book</p>
        <div class="book">
          <div v-for="(a, i) in orderBook.asks" :key="'a' + i" class="book__row book__row--ask">
            <span class="book__bar" :style="{ width: Math.min(100, a.size * 22) + '%' }"></span>
            <span class="mono-num">{{ a.price.toFixed(1) }}</span>
            <span class="mono-num text-dim">{{ a.size.toFixed(3) }}</span>
          </div>
          <div class="book__mid mono-num">{{ activeAsset?.price.toFixed(1) }}</div>
          <div v-for="(b, i) in orderBook.bids" :key="'b' + i" class="book__row book__row--bid">
            <span class="book__bar" :style="{ width: Math.min(100, b.size * 22) + '%' }"></span>
            <span class="mono-num">{{ b.price.toFixed(1) }}</span>
            <span class="mono-num text-dim">{{ b.size.toFixed(3) }}</span>
          </div>
        </div>
      </div>

      <!-- buy/sell -->
      <div class="panel panel--trade glass">
        <div class="trade-tabs">
          <button class="trade-tabs__item" :class="{ active: side === 'buy' }" data-cursor="hover" @click="side = 'buy'">Buy</button>
          <button class="trade-tabs__item" :class="{ active: side === 'sell' }" data-cursor="hover" @click="side = 'sell'">Sell</button>
        </div>
        <label class="trade-field">
          <span>Amount</span>
          <input v-model="amount" type="text" inputmode="decimal" />
        </label>
        <div class="trade-total">
          <span>Total</span>
          <span class="mono-num">${{ totalCost }}</span>
        </div>
        <button class="trade-submit" :class="side" data-cursor="hover">{{ side === 'buy' ? 'Buy' : 'Sell' }} {{ activeSymbol.split('/')[0] }}</button>
      </div>

      <!-- recent trades -->
      <div class="panel panel--trades glass">
        <p class="panel__label">Recent Trades</p>
        <div class="trades-list">
          <div v-for="(t, i) in recentTrades" :key="i" class="trades-list__row">
            <span class="mono-num" :class="t.side === 'buy' ? 'text-up' : 'text-down'">{{ t.price.toFixed(1) }}</span>
            <span class="mono-num text-dim">{{ t.size.toFixed(3) }}</span>
          </div>
        </div>
      </div>

      <!-- watchlist -->
      <div class="panel panel--watchlist glass">
        <p class="panel__label">Watchlist</p>
        <div v-for="w in watchlist" :key="w.symbol" class="watchlist-row" :class="{ active: w.symbol === activeSymbol }" data-cursor="hover" @click="activeSymbol = w.symbol">
          <span>{{ w.symbol }}</span>
          <span class="mono-num">{{ w.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) }}</span>
          <span class="mono-num" :class="w.change >= 0 ? 'text-up' : 'text-down'">{{ w.change >= 0 ? '+' : '' }}{{ w.change.toFixed(2) }}%</span>
        </div>
      </div>

      <!-- portfolio -->
      <div class="panel panel--portfolio glass">
        <p class="panel__label">Portfolio</p>
        <div v-for="a in portfolio" :key="a.id" class="portfolio-row">
          <span class="portfolio-row__dot" :style="{ background: a.color }"></span>
          <span>{{ a.label }}</span>
          <span class="mono-num">{{ a.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) }}</span>
          <span class="mono-num" :class="a.change >= 0 ? 'text-up' : 'text-down'">{{ a.change >= 0 ? '+' : '' }}{{ a.change.toFixed(2) }}%</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.terminal {
  position: relative;
  padding-top: 120px;
  padding-bottom: 120px;
}
.terminal__header { position: relative; margin-bottom: 40px; }

.terminal__ambient {
  position: absolute;
  inset: -60px 0 0 0;
  height: calc(100% + 60px);
  width: 100%;
  z-index: 0;
  pointer-events: none;
}

.terminal__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 14px;
}

.panel {
  padding: 18px 20px;
  border-radius: var(--radius-m);
  transition: transform 0.15s var(--ease-out), border-color 0.3s;
  transform-style: preserve-3d;
  will-change: transform;
}
.panel:hover {
  border-color: var(--glass-border-strong);
}
.panel__label {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-3);
  margin-bottom: 14px;
}
.panel__ohlc { color: var(--gold); text-transform: none; letter-spacing: 0; }

.panel--asset { grid-column: span 12; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.panel--chart { grid-column: span 8; height: 380px; display: flex; flex-direction: column; }
.panel--book { grid-column: span 4; }
.panel--trade { grid-column: span 4; }
.panel--trades { grid-column: span 4; }
.panel--watchlist { grid-column: span 4; }
.panel--portfolio { grid-column: span 12; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; }

.asset-tabs { display: flex; gap: 4px; flex-wrap: wrap; }
.asset-tabs__item {
  padding: 7px 14px;
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--ink-2);
  border: 1px solid transparent;
  border-radius: 999px;
}
.asset-tabs__item.active { color: var(--gold-bright); border-color: var(--glass-border-strong); }

.asset-price { display: flex; align-items: baseline; gap: 12px; }
.asset-price__value { font-size: 26px; font-family: var(--font-display); color: var(--ink-0); }
.asset-price__change { font-size: 14px; }
.asset-price__label { font-size: 10px; color: var(--ink-3); letter-spacing: 0.16em; }

.chart-canvas { flex: 1; width: 100%; height: 100%; cursor: none; }

.book { display: flex; flex-direction: column; font-size: 11px; }
.book__row { position: relative; display: grid; grid-template-columns: 1fr 1fr; padding: 3px 0; }
.book__bar { position: absolute; top: 0; right: 0; height: 100%; opacity: 0.12; }
.book__row--ask .book__bar { background: var(--down); }
.book__row--bid .book__bar { background: var(--up); }
.book__mid { text-align: center; padding: 8px 0; color: var(--gold-champagne); font-size: 13px; border-top: 1px solid var(--hairline); border-bottom: 1px solid var(--hairline); margin: 4px 0; }

.trade-tabs { display: flex; gap: 6px; margin-bottom: 16px; }
.trade-tabs__item { flex: 1; padding: 9px; font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid var(--hairline); color: var(--ink-2); }
.trade-tabs__item.active { color: var(--gold-bright); border-color: var(--glass-border-strong); }

.trade-field { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--ink-2); border-bottom: 1px solid var(--hairline); padding: 10px 0; margin-bottom: 12px; }
.trade-field input { background: none; border: none; color: var(--ink-0); text-align: right; width: 120px; font-size: 13px; }

.trade-total { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-2); margin-bottom: 16px; }

.trade-submit { width: 100%; padding: 13px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; border-radius: var(--radius-s); }
.trade-submit.buy { background: linear-gradient(135deg, #7fdba8, #3f9d6d); color: #06110a; }
.trade-submit.sell { background: linear-gradient(135deg, #e7998f, #b2483c); color: #170807; }

.trades-list { display: flex; flex-direction: column; gap: 5px; font-size: 11px; }
.trades-list__row { display: flex; justify-content: space-between; }

.watchlist-row { display: grid; grid-template-columns: 1fr auto auto; gap: 10px; padding: 8px 0; font-size: 11px; border-bottom: 1px solid var(--hairline); }
.watchlist-row.active { color: var(--gold-bright); }

.portfolio-row { display: flex; align-items: center; gap: 8px; font-size: 11px; padding: 10px; border: 1px solid var(--hairline); }
.portfolio-row__dot { width: 6px; height: 6px; border-radius: 50%; }
.portfolio-row span:nth-child(2) { flex: 1; color: var(--ink-2); }

@media (max-width: 1080px) {
  .panel--chart { grid-column: span 12; }
  .panel--book, .panel--trade, .panel--trades, .panel--watchlist { grid-column: span 6; }
}
@media (max-width: 640px) {
  .panel--book, .panel--trade, .panel--trades, .panel--watchlist { grid-column: span 12; }
}
</style>
