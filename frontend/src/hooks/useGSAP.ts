import { useEffect, useRef, useCallback, RefObject } from 'react'
import gsap from 'gsap'
import { useGSAP as _useGSAP } from '@gsap/react'

export { _useGSAP as useGSAP }

export function useAnimateIn<T extends Element>(config: {
  from: gsap.TweenVars
  to: gsap.TweenVars
  delay?: number
}): RefObject<T> {
  const ref = useRef<T>(null)
  const { from, to, delay = 0 } = config
  _useGSAP(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current, from, { ...to, delay })
  }, { scope: ref, dependencies: [delay] })
  return ref
}

export function useShake<T extends Element>(): [RefObject<T>, () => void] {
  const ref = useRef<T>(null)
  const shake = useCallback(() => {
    if (!ref.current) return
    gsap.killTweensOf(ref.current)
    gsap.timeline()
      .to(ref.current, { x: -10, duration: 0.06 })
      .to(ref.current, { x: 10,  duration: 0.06 })
      .to(ref.current, { x: -8,  duration: 0.05 })
      .to(ref.current, { x: 8,   duration: 0.05 })
      .to(ref.current, { x: 0,   duration: 0.07 })
  }, [])
  return [ref, shake]
}

export function usePulse<T extends Element>(active = true): RefObject<T> {
  const ref = useRef<T>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  useEffect(() => {
    if (!ref.current) return
    if (active) {
      tweenRef.current = gsap.to(ref.current, { scale: 1.05, duration: 0.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
    } else {
      tweenRef.current?.kill()
      gsap.to(ref.current, { scale: 1, duration: 0.2 })
    }
    return () => { tweenRef.current?.kill() }
  }, [active])
  return ref
}

export function useXPCounter(
  from: number,
  to: number,
  duration = 1.2,
  active = false
): RefObject<HTMLElement> {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!active || !ref.current) return
    const obj = { val: from }
    const tween = gsap.to(obj, {
      val: to, duration, ease: 'power1.out',
      onUpdate: () => { if (ref.current) ref.current.textContent = Math.round(obj.val).toLocaleString() },
    })
    return () => { tween.kill() }
  }, [active, from, to, duration])
  return ref
}