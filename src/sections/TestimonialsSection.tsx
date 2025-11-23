'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useGSAP } from '@/hooks/useGSAP'
import { Star } from 'phosphor-react'
import gsap from 'gsap'
interface Testimonial {
  id: number
  name: string
  location: string
  comment: string
  rating: number
  image: string | null
  created_at: string
  updated_at: string
}
const TestimonialSkeleton = () => (
  <div className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/30 max-w-lg mx-auto">
    <div className="mb-6 space-y-3">
      <div className="h-4 bg-gray-800 rounded-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
      </div>
      <div className="h-4 bg-gray-800 rounded-md w-4/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
      </div>
      <div className="h-4 bg-gray-800 rounded-md w-3/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
        </div>
        <div>
          <div className="h-4 w-24 bg-gray-800 rounded-md mb-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
          </div>
          <div className="h-3 w-20 bg-gray-800 rounded-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-4 h-4 bg-gray-800 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-shimmer"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
)
export function TestimonialsSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const { scrollAnimation } = useGSAP()
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/testimonials')
        const data = await response.json()
        if (data.success) {
          setTestimonials(data.data)
        }
      } catch (error) {
        console.error('Erro ao buscar depoimentos:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTestimonials()
  }, [])
  useEffect(() => {
    const slider = sliderRef.current
    const slides = slider?.children
    if (!slider || !slides || loading) return
    gsap.set(slides, {
      opacity: 0,
      scale: 0.8,
      y: 50
    })
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: "top center+=100",
        once: true
      }
    })
    tl.to(slides, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: "back.out(1.2)"
    })
    return () => {
      if (tl.scrollTrigger) {
        tl.scrollTrigger.kill()
      }
    }
  }, [loading])
  const getTestimonialPages = () => {
    const pages = []
    const itemsPerPage = isMobile ? 1 : 1 
    for (let i = 0; i < testimonials.length; i += itemsPerPage) {
      const page = testimonials.slice(i, i + itemsPerPage)
      pages.push(page)
    }
    return pages
  }
  const testimonialPages = getTestimonialPages()
  const totalPages = testimonialPages.length
  useEffect(() => {
    setCurrentIndex(0)
    if (sliderRef.current) {
      gsap.set(sliderRef.current, { x: 0 })
    }
  }, [isMobile])
  const goToNextSlide = useCallback(() => {
    if (sliderRef.current && totalPages > 1) {
      const nextIndex = (currentIndex + 1) % totalPages
      setCurrentIndex(nextIndex)
      const transformX = -nextIndex * (100 / totalPages)
      gsap.to(sliderRef.current, {
        x: `${transformX}%`,
        duration: 0.8,
        ease: "power2.out"
      })
    }
  }, [currentIndex, totalPages]);
  useEffect(() => {
    if (totalPages <= 1 || isPaused) return
    const interval = setInterval(() => {
      goToNextSlide()
    }, 5000) 
    return () => clearInterval(interval)
  }, [currentIndex, totalPages, isPaused, goToNextSlide])
  if (loading) {
    return (
      <section ref={sectionRef} className="py-12 sm:py-16 md:py-20 lg:py-24 bg-dark-900 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6">
              <span className="text-white">O que nossos </span>
              <span className="text-[var(--logo-gold,#D4AF37)]">clientes dizem</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-4">
              Veja os depoimentos de quem já comprou conosco
            </p>
          </motion.div>
          <div className="relative">
            <div className="overflow-hidden">
              <div className="flex gap-6 pb-8 justify-center">
                <TestimonialSkeleton />
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
  if (!testimonials.length) {
    return (
      <section ref={sectionRef} className="py-12 sm:py-16 md:py-20 lg:py-24 bg-dark-900 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12 md:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6">
              <span className="text-white">O que nossos </span>
              <span className="text-[var(--logo-gold,#D4AF37)]">clientes dizem</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-4">
              Veja os depoimentos de quem já comprou conosco
            </p>
          </motion.div>
          <div className="text-center text-gray-400 px-4">
            <p className="text-sm sm:text-base">Nenhum depoimento encontrado.</p>
          </div>
        </div>
      </section>
    )
  }
  return (
    <section ref={sectionRef} className="py-12 sm:py-16 md:py-20 lg:py-24 bg-dark-900 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 md:mb-6"
          >
            <span className="text-white">O que nossos </span>
            <span className="text-primary-500">clientes dizem</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-lg sm:max-w-xl md:max-w-2xl mx-auto px-4"
          >
            Veja os depoimentos de quem já comprou conosco
          </motion.p>
        </motion.div>
        <div className="relative">
          <div 
            className="overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              ref={sliderRef}
              className="flex"
              style={{
                width: `${totalPages * 100}%`,
                willChange: 'transform',
                transform: 'translate3d(0, 0, 0)'
              }}
            >
              {testimonialPages.map((page, pageIndex) => (
                <div
                  key={pageIndex}
                  className="w-full flex-shrink-0"
                  style={{ width: `${100 / totalPages}%` }}
                >
                  <div className="flex gap-6 pb-8 justify-center">
                    {page.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="bg-dark-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/30 max-w-lg mx-auto"
                      >
                        <div className="mb-6">
                          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
                            &quot;{testimonial.comment}&quot;
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[var(--logo-gold,#D4AF37)] flex items-center justify-center">
                              <span className="text-[#0D0D0D] font-bold text-lg">
                                {testimonial.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-white font-semibold text-sm sm:text-base">
                                {testimonial.name}
                              </h4>
                              <p className="text-gray-400 text-xs sm:text-sm">
                                {testimonial.location}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                weight={i < testimonial.rating ? "fill" : "regular"}
                                className={i < testimonial.rating ? "text-yellow-400" : "text-gray-600"}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index)
                    if (sliderRef.current) {
                      const transformX = -index * (100 / totalPages)
                      gsap.to(sliderRef.current, {
                        x: `${transformX}%`,
                        duration: 0.8,
                        ease: "power2.out"
                      })
                    }
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-[var(--logo-gold,#D4AF37)] w-8'
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                />
              ))}
            </div>
          )}
          <div className="text-center mt-8">
            <Link
              href="/contato"
              className="inline-flex items-center gap-2 bg-[var(--logo-gold,#D4AF37)] hover:bg-[var(--logo-gold,#D4AF37)]/90 text-[#0D0D0D] font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
            >
              Deixe Sua Avaliação
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
