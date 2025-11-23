'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
const heroImages = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1920&q=80',
    mobileImageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=768&q=80',
    alt: 'Sarai Modas - Elegância em cada detalhe - BANNER PRINCIPAL'
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1920&q=80',
    mobileImageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=768&q=80',
    alt: 'Nova Coleção - Moda Feminina de Alta Sofisticação'
  }
]
export function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const autoPlayRef = useRef<NodeJS.Timeout>()
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current)
      }
    }
  }, [])
  const goToImage = (index: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentImage(index)
    setTimeout(() => setIsAnimating(false), 500)
  }
  const currentImageData = heroImages[currentImage]
  return (
    <section className="relative min-h-[calc(100svh-112px)] sm:min-h-[calc(100vh-112px)] overflow-hidden" style={{ marginTop: '112px' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <div className="relative w-full h-full">
            <Image
              src={isMobile ? currentImageData.mobileImageUrl : currentImageData.imageUrl}
              alt={currentImageData.alt}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-[#0D0D0D]/60" />
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="text-center max-w-4xl"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-[var(--logo-gold,#D4AF37)] text-sm md:text-base uppercase tracking-wider mb-4 font-medium"
          >
            Sarai Modas
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-4xl md:text-6xl lg:text-7xl font-semibold text-white mb-6 leading-tight"
          >
            Elegância em cada detalhe.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="text-gray-300 text-lg md:text-xl mb-8 max-w-2xl mx-auto"
          >
            Descubra a nova coleção Sarai Modas.
          </motion.p>
          <motion.a
            href="/produtos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block px-8 py-4 bg-[var(--logo-gold,#D4AF37)] text-[#0D0D0D] font-semibold uppercase tracking-wider hover:bg-gradient-to-r hover:from-[var(--logo-gold,#D4A574)] hover:via-[var(--logo-gold-light,#E6B896)] hover:to-[var(--logo-gold,#D4A574)] transition-all duration-300 rounded-lg shadow-lg"
          >
            Explorar Coleção
          </motion.a>
        </motion.div>
      </div>
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToImage(index)}
            className={`transition-all duration-300 ${
              index === currentImage
                ? 'w-8 h-0.5 bg-[#F2C063]'
                : 'w-6 h-0.5 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
