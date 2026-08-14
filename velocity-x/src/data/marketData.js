/**
 * VELOCITY — mock market data.
 * Self-contained, deterministic-ish generators standing in for a live feed.
 * lat/lon are used to project financial centers onto the 3D globe.
 */

export const REGIONS = [
  {
    id: 'india',
    label: 'India',
    city: 'Mumbai',
    lat: 19.076,
    lon: 72.8777,
    indices: [
      { label: 'NIFTY 50', value: 24812.35, change: 1.82 },
      { label: 'BANK NIFTY', value: 52104.6, change: 2.31 },
      { label: 'USD / INR', value: 83.42, change: 0.42 },
    ],
    flow: 0.78,
  },
  {
    id: 'usa',
    label: 'United States',
    city: 'New York',
    lat: 40.7128,
    lon: -74.006,
    indices: [
      { label: 'S&P 500', value: 5931.2, change: 0.64 },
      { label: 'NASDAQ', value: 19248.7, change: 0.91 },
      { label: 'DXY', value: 104.18, change: -0.12 },
    ],
    flow: 0.92,
  },
  {
    id: 'uk',
    label: 'United Kingdom',
    city: 'London',
    lat: 51.5074,
    lon: -0.1278,
    indices: [
      { label: 'FTSE 100', value: 8203.4, change: 0.28 },
      { label: 'GBP / USD', value: 1.274, change: -0.18 },
      { label: 'GILT 10Y', value: 4.12, change: 0.05 },
    ],
    flow: 0.55,
  },
  {
    id: 'japan',
    label: 'Japan',
    city: 'Tokyo',
    lat: 35.6762,
    lon: 139.6503,
    indices: [
      { label: 'NIKKEI 225', value: 39482.1, change: -0.44 },
      { label: 'USD / JPY', value: 156.32, change: 0.21 },
      { label: 'TOPIX', value: 2781.6, change: -0.31 },
    ],
    flow: 0.61,
  },
  {
    id: 'singapore',
    label: 'Singapore',
    city: 'Singapore',
    lat: 1.3521,
    lon: 103.8198,
    indices: [
      { label: 'STI', value: 3421.8, change: 0.73 },
      { label: 'SGD / USD', value: 0.742, change: 0.09 },
    ],
    flow: 0.48,
  },
  {
    id: 'uae',
    label: 'UAE',
    city: 'Dubai',
    lat: 25.2048,
    lon: 55.2708,
    indices: [
      { label: 'DFM GENERAL', value: 4512.3, change: 1.14 },
      { label: 'AED / USD', value: 3.6725, change: 0.0 },
    ],
    flow: 0.66,
  },
  {
    id: 'germany',
    label: 'Germany',
    city: 'Frankfurt',
    lat: 50.1109,
    lon: 8.6821,
    indices: [
      { label: 'DAX', value: 18642.7, change: 0.37 },
      { label: 'EUR / USD', value: 1.081, change: -0.06 },
    ],
    flow: 0.51,
  },
]

// Financial center stream routes — great-circle arcs carrying flowing gold particles.
export const STREAM_ROUTES = [
  ['usa', 'uk'],
  ['uk', 'uae'],
  ['uae', 'india'],
  ['india', 'singapore'],
  ['singapore', 'japan'],
  ['japan', 'usa'],
  ['uk', 'germany'],
  ['germany', 'uae'],
  ['usa', 'singapore'],
]

export const PORTFOLIO_ASSETS = [
  { id: 'btc', label: 'BTC', name: 'Bitcoin', value: 118420.5, change: 3.24, color: '#e8c874', radius: 3.4, speed: 0.18 },
  { id: 'eth', label: 'ETH', name: 'Ethereum', value: 4312.9, change: 2.11, color: '#c9a24b', radius: 4.3, speed: 0.14 },
  { id: 'nasdaq', label: 'NASDAQ', name: 'Nasdaq Composite', value: 19248.7, change: 0.91, color: '#f0dfa9', radius: 5.2, speed: 0.1 },
  { id: 'gold', label: 'GOLD', name: 'Spot Gold', value: 2634.8, change: 0.48, color: '#e8c874', radius: 6.1, speed: 0.08 },
  { id: 'forex', label: 'FOREX', name: 'DXY Basket', value: 104.18, change: -0.12, color: '#8b8680', radius: 7.0, speed: 0.06 },
]

export const AI_METRICS = {
  sentiment: 78,
  momentum: 82,
  liquidity: 64,
  risk: 31,
  signal: 'BUY',
}

export const WATCHLIST = [
  { symbol: 'BTC/USD', price: 118420.5, change: 3.24 },
  { symbol: 'ETH/USD', price: 4312.9, change: 2.11 },
  { symbol: 'XAU/USD', price: 2634.8, change: 0.48 },
  { symbol: 'NIFTY50', price: 24812.35, change: 1.82 },
  { symbol: 'EUR/USD', price: 1.081, change: -0.06 },
  { symbol: 'NASDAQ', price: 19248.7, change: 0.91 },
]

/** Deterministic pseudo-random, seeded — keeps SSR/CSR + reloads visually stable within a session. */
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateCandles(count = 90, startPrice = 118000, seed = 7) {
  const rand = mulberry32(seed)
  const candles = []
  let price = startPrice
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    const volatility = price * 0.012
    const open = price
    const drift = (rand() - 0.47) * volatility
    const close = Math.max(1, open + drift)
    const high = Math.max(open, close) + rand() * volatility * 0.6
    const low = Math.min(open, close) - rand() * volatility * 0.6
    const volume = 200 + rand() * 800
    candles.push({
      t: now - (count - i) * 3600_000,
      o: open,
      h: high,
      l: low,
      c: close,
      v: volume,
    })
    price = close
  }
  return candles
}

export function generateOrderBook(midPrice, depth = 12, seed = 3) {
  const rand = mulberry32(seed)
  const asks = []
  const bids = []
  for (let i = 1; i <= depth; i++) {
    asks.push({
      price: midPrice + i * midPrice * 0.0006 * (0.6 + rand() * 0.8),
      size: 0.05 + rand() * 2.4,
    })
    bids.push({
      price: midPrice - i * midPrice * 0.0006 * (0.6 + rand() * 0.8),
      size: 0.05 + rand() * 2.4,
    })
  }
  return { asks: asks.reverse(), bids }
}

export function generateRecentTrades(midPrice, count = 18, seed = 11) {
  const rand = mulberry32(seed)
  const trades = []
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    trades.push({
      price: midPrice * (1 + (rand() - 0.5) * 0.003),
      size: 0.01 + rand() * 1.2,
      side: rand() > 0.5 ? 'buy' : 'sell',
      t: now - i * 4200,
    })
  }
  return trades
}
