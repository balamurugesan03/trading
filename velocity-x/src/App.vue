<script setup>
import { ref } from 'vue'
import CursorField from './components/CursorField.vue'
import Navigation from './components/Navigation.vue'
import HeroScene from './components/HeroScene.vue'
import TradingTerminal from './components/TradingTerminal.vue'
import CandlestickScene from './components/CandlestickScene.vue'
import IntelligenceCore from './components/IntelligenceCore.vue'
import PortfolioOrbit from './components/PortfolioOrbit.vue'

const navRef = ref(null)
function onIntroComplete() {
  navRef.value?.reveal()
}
</script>

<template>
  <CursorField />
  <Navigation ref="navRef" />

  <main>
    <HeroScene @intro-complete="onIntroComplete" />
    <TradingTerminal />
    <CandlestickScene />
    <IntelligenceCore />
    <PortfolioOrbit />

    <footer class="site-footer section-pad">
      <div class="site-footer__row">
        <span class="site-footer__brand">VELOCITY</span>
        <p class="site-footer__note">A concept financial network. Market data simulated for demonstration.</p>
      </div>
      <div class="site-footer__meta">
        <span>© 2026 VELOCITY</span>
        <span>Built with Vue 3 · Three.js · GSAP</span>
      </div>
    </footer>
  </main>
</template>

<style scoped>
.site-footer {
  padding-block: 60px 40px;
  border-top: 1px solid var(--hairline);
}
.site-footer__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}
.site-footer__brand {
  font-family: var(--font-display);
  letter-spacing: 0.3em;
  font-size: 14px;
  color: var(--ink-1);
}
.site-footer__note {
  font-size: 12px;
  color: var(--ink-3);
  max-width: 380px;
}
.site-footer__meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ink-3);
  text-transform: uppercase;
}
</style>
