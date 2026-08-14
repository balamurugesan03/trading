<script setup>
import { ref } from 'vue'
import { useRevealOnScroll } from '../composables/useScrollAnimation.js'

const props = defineProps({
  eyebrow: { type: String, default: '' },
  as: { type: String, default: 'div' },
  delay: { type: Number, default: 0 },
})

const el = ref(null)
useRevealOnScroll(el, { delay: props.delay })
</script>

<template>
  <component :is="as" ref="el" class="section-transition">
    <p v-if="eyebrow" class="eyebrow section-transition__eyebrow">{{ eyebrow }}</p>
    <slot />
  </component>
</template>

<style scoped>
.section-transition {
  opacity: 0;
}
.section-transition__eyebrow {
  margin-bottom: 14px;
}
</style>
