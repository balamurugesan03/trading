<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import gsap from 'gsap'

const links = ['Markets', 'Trading', 'Intelligence', 'Portfolio', 'Analytics']
const compact = ref(false)
const navEl = ref(null)
const revealed = ref(false)

function onScroll() {
  compact.value = window.scrollY > 80
}

function magnetMove(e) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  const relX = e.clientX - rect.left - rect.width / 2
  const relY = e.clientY - rect.top - rect.height / 2
  gsap.to(el, { x: relX * 0.35, y: relY * 0.5, duration: 0.4, ease: 'power3.out' })
}
function magnetLeave(e) {
  gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' })
}

function reveal() {
  revealed.value = true
}
defineExpose({ reveal })

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <nav ref="navEl" class="nav" :class="{ 'is-compact': compact, 'is-revealed': revealed }">
    <div class="nav__inner" :class="{ glass: compact }">
      <a href="#top" class="nav__brand" data-cursor="hover">VELOCITY</a>

      <ul class="nav__links">
        <li v-for="l in links" :key="l">
          <a
            href="#"
            class="nav__link magnetic"
            data-cursor="hover"
            @mousemove="magnetMove"
            @mouseleave="magnetLeave"
            >{{ l }}</a
          >
        </li>
      </ul>

      <button class="nav__cta magnetic" data-cursor="hover" @mousemove="magnetMove" @mouseleave="magnetLeave">
        <span>Connect</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 500;
  padding: 22px clamp(20px, 4vw, 56px);
  opacity: 0;
  transform: translateY(-16px);
  transition: opacity 1.1s var(--ease-out), transform 1.1s var(--ease-out);
}
.nav.is-revealed {
  opacity: 1;
  transform: translateY(0);
}

.nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--nav-h-compact);
  padding: 0 8px;
  border-radius: 999px;
  transition: background 0.5s var(--ease-out), border-color 0.5s var(--ease-out), padding 0.5s var(--ease-out);
  border: 1px solid transparent;
}
.nav.is-compact .nav__inner {
  padding: 0 10px 0 22px;
}

.nav__brand {
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.32em;
  color: var(--ink-0);
}

.nav__links {
  display: flex;
  gap: 8px;
  list-style: none;
}

.nav__link {
  display: inline-block;
  padding: 8px 16px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-2);
  transition: color 0.3s var(--ease-out);
}
.nav__link:hover {
  color: var(--gold-bright);
}

.nav__cta {
  display: inline-flex;
  align-items: center;
  padding: 10px 22px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--void);
  background: linear-gradient(135deg, var(--gold-bright), var(--gold));
  border-radius: 999px;
  font-weight: 500;
}

@media (max-width: 860px) {
  .nav__links { display: none; }
}
</style>
