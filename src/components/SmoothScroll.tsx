'use client'
import { useEffect, useRef, createContext, useContext, useCallback } from 'react'
import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}
interface LenisContextType {
  lenis: Lenis | null
  scrollTo: (target: string | number | HTMLElement, options?: any) => void
  scrollToTop: (options?: any) => void
  stop: () => void
  start: () => void
}
const LenisContext = createContext<LenisContextType>({
  lenis: null,
  scrollTo: () => {},
  scrollToTop: () => {},
  stop: () => {},
  start: () => {},
})
interface SmoothScrollProps {
  children: React.ReactNode
  options?: {
    duration?: number
    easing?: (t: number) => number
    orientation?: 'vertical' | 'horizontal'
    gestureOrientation?: 'vertical' | 'horizontal' | 'both'
    smoothWheel?: boolean
    wheelMultiplier?: number
    touchMultiplier?: number
    infinite?: boolean
    lerp?: number
  }
}
export function SmoothScroll({ children, options }: SmoothScrollProps) {
  const lenisRef = useRef<Lenis | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const pathname = usePathname()
  
  const checkIsMobile = () => {
    return typeof window !== 'undefined' && window.innerWidth < 768
  }
  
  const destroyLenis = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    if (lenisRef.current) {
      lenisRef.current.destroy()
      lenisRef.current = null
    }
  }
  
  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      destroyLenis()
      return
    }
    
    if (checkIsMobile()) {
      destroyLenis()
      return
    }
    
    const lenis = new Lenis({
      duration: options?.duration ?? 1.2,
      easing: options?.easing ?? ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      orientation: options?.orientation ?? 'vertical',
      gestureOrientation: options?.gestureOrientation ?? 'vertical',
      smoothWheel: options?.smoothWheel ?? true,
      wheelMultiplier: options?.wheelMultiplier ?? 1,
      touchMultiplier: options?.touchMultiplier ?? 2,
      infinite: options?.infinite ?? false,
      lerp: options?.lerp ?? 0.1,
      syncTouch: true,
      syncTouchLerp: 0.075,
    })
    lenisRef.current = lenis
    lenis.on('scroll', ScrollTrigger.update)
    function raf(time: number) {
      lenis.raf(time)
      rafIdRef.current = requestAnimationFrame(raf)
    }
    rafIdRef.current = requestAnimationFrame(raf)
    const scrollTriggerUpdate = () => {
      ScrollTrigger.update()
    }
    lenis.on('scroll', scrollTriggerUpdate)
    
    const handleResize = () => {
      if (checkIsMobile() && lenisRef.current) {
        destroyLenis()
      }
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      destroyLenis()
    }
  }, [pathname, options])
  useEffect(() => {
    if (lenisRef.current && !pathname?.startsWith('/admin') && !checkIsMobile()) {
      lenisRef.current.scrollTo(0, {
        immediate: true,
      })
      setTimeout(() => {
        ScrollTrigger.refresh()
      }, 100)
    }
  }, [pathname])
  const scrollTo = useCallback((target: string | number | HTMLElement, scrollOptions?: any) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, scrollOptions)
    }
  }, [])
  const scrollToTop = useCallback((scrollOptions?: any) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, scrollOptions)
    }
  }, [])
  const stop = useCallback(() => {
    if (lenisRef.current) {
      lenisRef.current.stop()
    }
  }, [])
  const start = useCallback(() => {
    if (lenisRef.current) {
      lenisRef.current.start()
    }
  }, [])
  const contextValue: LenisContextType = {
    lenis: lenisRef.current,
    scrollTo,
    scrollToTop,
    stop,
    start,
  }
  return (
    <LenisContext.Provider value={contextValue}>
      {children}
    </LenisContext.Provider>
  )
}
export function useLenis() {
  const context = useContext(LenisContext)
  if (!context) {
    throw new Error('useLenis must be used within SmoothScroll')
  }
  return context
}
