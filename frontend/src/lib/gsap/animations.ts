import gsap from 'gsap'
import { TextPlugin } from 'gsap/TextPlugin'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(TextPlugin, CustomEase)
CustomEase.create('arabiq.bounce',  'M0,0 C0.14,0 0.242,0.438 0.272,0.561 0.313,0.728 0.354,0.963 0.362,1 0.37,0.985 0.414,0.873 0.455,0.851 0.51,0.822 0.57,0.999 0.612,1 0.62,1 0.672,0.994 0.714,0.997 0.788,1.001 0.862,1 1,1')
CustomEase.create('arabiq.snap',    'M0,0 C0.6,0 0.4,1 1,1')

// ── Letter ───────────────────────────────────────────────────────
export function animateLetterReveal(el: Element, delay = 0): gsap.core.Timeline {
  return gsap.timeline({ delay })
    .fromTo(el, { opacity: 0, scale: 0.4, rotation: -15, filter: 'blur(8px)' },
                { opacity: 1, scale: 1, rotation: 0, filter: 'blur(0px)', duration: 0.7, ease: 'arabiq.bounce' })
    .fromTo(el, { color: '#C9953A' }, { color: 'inherit', duration: 0.5, ease: 'power2.out' }, '-=0.3')
}

export function animateLetterGrid(els: Element[]): gsap.core.Timeline {
  return gsap.timeline()
    .fromTo(els, { opacity: 0, y: 20, scale: 0.7 },
                 { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'arabiq.snap', stagger: { amount: 0.8 } })
}

// ── Exercise feedback ────────────────────────────────────────────
export function animateCorrect(cardEl: Element): gsap.core.Timeline {
  return gsap.timeline()
    .to(cardEl, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC', duration: 0.15 })
    .to(cardEl, { y: -6, duration: 0.2, ease: 'power2.out' })
    .to(cardEl, { y: 0,  duration: 0.35, ease: 'arabiq.bounce' })
    .to(cardEl, { backgroundColor: '', borderColor: '', duration: 0.4 }, '-=0.2')
}

export function animateWrong(cardEl: Element): gsap.core.Timeline {
  return gsap.timeline()
    .to(cardEl, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', duration: 0.1 })
    .to(cardEl, { x: -10, duration: 0.07 })
    .to(cardEl, { x: 10,  duration: 0.07 })
    .to(cardEl, { x: -8,  duration: 0.06 })
    .to(cardEl, { x: 8,   duration: 0.06 })
    .to(cardEl, { x: 0,   duration: 0.08 })
    .to(cardEl, { backgroundColor: '', borderColor: '', duration: 0.4 })
}

// ── XP ───────────────────────────────────────────────────────────
export function animateXPBadge(badgeEl: Element): gsap.core.Timeline {
  return gsap.timeline()
    .fromTo(badgeEl, { opacity: 0, y: 0, scale: 0.5 }, { opacity: 1, y: -10, scale: 1.15, duration: 0.3, ease: 'back.out(2)' })
    .to(badgeEl, { scale: 1, duration: 0.15 })
    .to(badgeEl, { opacity: 0, y: -40, duration: 0.5, ease: 'power2.in', delay: 0.6 })
}

export function animateParticleBurst(containerEl: Element, count = 16, color = '#C9953A'): gsap.core.Timeline {
  const tl = gsap.timeline()
  const particles: HTMLElement[] = []
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div')
    p.style.cssText = `position:absolute;width:8px;height:8px;border-radius:50%;background:${color};top:50%;left:50%;pointer-events:none;`
    containerEl.appendChild(p)
    particles.push(p)
    const angle = (i / count) * 360
    const dist = 60 + Math.random() * 60
    tl.fromTo(p,
      { x: 0, y: 0, opacity: 1, scale: 1 },
      { x: Math.cos((angle * Math.PI) / 180) * dist, y: Math.sin((angle * Math.PI) / 180) * dist, opacity: 0, scale: 0.3, duration: 0.7 + Math.random() * 0.3, ease: 'power2.out' }, 0)
  }
  tl.call(() => particles.forEach((p) => p.remove()))
  return tl
}

// ── Progress ─────────────────────────────────────────────────────
export function animateProgressBar(barEl: Element, from: number, to: number, duration = 0.6): gsap.core.Tween {
  return gsap.fromTo(barEl, { width: `${from * 100}%` }, { width: `${to * 100}%`, duration, ease: 'power2.out' })
}

export function animateXPCounter(el: Element, from: number, to: number, duration = 1): gsap.core.Tween {
  const obj = { val: from }
  return gsap.to(obj, { val: to, duration, ease: 'power1.out', onUpdate: () => { el.textContent = Math.round(obj.val).toLocaleString() } })
}

// ── Screen transitions ────────────────────────────────────────────
export function animateStaggerIn(els: Element[], options: { delay?: number; stagger?: number } = {}): gsap.core.Timeline {
  const { delay = 0, stagger = 0.06 } = options
  return gsap.timeline({ delay })
    .fromTo(els, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger })
}

// ── Evaluation ───────────────────────────────────────────────────
export function animateCountdown(el: Element, onComplete?: () => void): gsap.core.Timeline {
  const steps = ['3', '2', '1', 'يلا !']
  const tl = gsap.timeline({ onComplete })
  steps.forEach((text, i) => {
    tl.call(() => { el.textContent = text })
      .fromTo(el, { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out' }, i * 0.85)
      .to(el,     { opacity: 0, scale: 0.8, duration: 0.2, ease: 'power2.in' }, i * 0.85 + 0.55)
  })
  return tl
}

export function animateScoreReveal(arcEl: SVGCircleElement, scoreEl: Element, score: number): gsap.core.Timeline {
  const r = parseFloat(arcEl.getAttribute('r') ?? '54')
  const circumference = 2 * Math.PI * r
  const obj = { val: 0 }
  return gsap.timeline()
    .set(arcEl, { strokeDasharray: circumference, strokeDashoffset: circumference })
    .to(arcEl,  { strokeDashoffset: circumference * (1 - score), duration: 1.2, ease: 'power2.inOut' })
    .to(obj,    { val: score * 100, duration: 1.2, ease: 'power2.inOut', onUpdate: () => { scoreEl.textContent = `${Math.round(obj.val)}%` } }, '<')
}

// ── Badge ────────────────────────────────────────────────────────
export function animateBadgeUnlock(badgeEl: Element): gsap.core.Timeline {
  return gsap.timeline()
    .fromTo(badgeEl, { opacity: 0, scale: 0, rotation: -180 }, { opacity: 1, scale: 1.2, rotation: 10, duration: 0.5, ease: 'back.out(2.5)' })
    .to(badgeEl, { scale: 1, rotation: -5, duration: 0.2 })
    .to(badgeEl, { rotation: 0, duration: 0.3, ease: 'elastic.out(1, 0.3)' })
}

// ── Streak ───────────────────────────────────────────────────────
export function animateStreakFire(fireEl: Element, streak: number): gsap.core.Timeline {
  const scale = 1 + Math.min(streak / 30, 1) * 0.5
  return gsap.timeline()
    .fromTo(fireEl, { scale: 0.8, opacity: 0.6 }, { scale, opacity: 1, duration: 0.6, ease: 'arabiq.bounce' })
    .to(fireEl, { scale: scale * 1.05, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
}

// ── Cards ────────────────────────────────────────────────────────
export function animateCards(cards: Element[], direction: 'up' | 'left' = 'up'): gsap.core.Timeline {
  const from = direction === 'up' ? { y: 24, x: 0 } : { x: 24, y: 0 }
  return gsap.timeline()
    .fromTo(cards, { opacity: 0, ...from }, { opacity: 1, x: 0, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.07 })
}

export function killAnimations(...els: (Element | null | undefined)[]) {
  els.forEach((el) => el && gsap.killTweensOf(el))
}