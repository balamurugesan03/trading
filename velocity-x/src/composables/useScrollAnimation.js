import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { onBeforeUnmount, onMounted } from 'vue'

let registered = false
export function registerScrollTrigger() {
  if (registered) return
  gsap.registerPlugin(ScrollTrigger)
  registered = true
}

/**
 * Pins `el` for `lengthVh` viewport-heights of scroll and reports a 0..1
 * progress value — the spine of the cinematic hero → globe → core journey.
 */
export function useHeroScrollJourney(el, { onProgress, lengthVh = 420 } = {}) {
  registerScrollTrigger()
  let st = null

  function create() {
    st?.kill()
    st = ScrollTrigger.create({
      trigger: el.value,
      start: 'top top',
      end: `+=${lengthVh}%`,
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      onUpdate: (self) => onProgress?.(self.progress),
    })
  }

  return {
    init: create,
    refresh: () => ScrollTrigger.refresh(),
    destroy: () => st?.kill(),
  }
}

/** Generic fade/rise reveal for section content, triggered on scroll-into-view. */
export function useRevealOnScroll(el, { y = 28, delay = 0, start = 'top 78%' } = {}) {
  registerScrollTrigger()
  let ctx = null

  // el.value is only bound once the component has mounted and rendered —
  // creating the ScrollTrigger any earlier (e.g. synchronously in <script
  // setup>) would hand GSAP a null trigger.
  onMounted(() => {
    ctx = gsap.context(() => {
      gsap.fromTo(
        el.value,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          delay,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el.value,
            start,
          },
        }
      )
    })
  })

  onBeforeUnmount(() => ctx?.revert())
}
