'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Tag, Star } from 'phosphor-react'
import { useState, useEffect, useRef } from 'react'
import { formatPrice } from '@/lib/utils'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const collections = [
  {
    id: 1,
    name: 'Coleção Primavera',
    description: 'Peças leves e delicadas para a estação',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    link: '/produtos?colecao=primavera'
  },
  {
    id: 2,
    name: 'Elegância Clássica',
    description: 'Peças atemporais para ocasiões especiais',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    link: '/produtos?colecao=elegante'
  },
  {
    id: 3,
    name: 'Noite & Festa',
    description: 'Brilhe em qualquer evento',
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80',
    link: '/produtos?colecao=noite'
  }
]

function CollectionCard({ collection, index }: { collection: typeof collections[0], index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  
  const containerVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        delay: index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94], 
      },
    },
  }

  const imageVariants = {
    rest: { 
      scale: 1,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: {
      scale: 1.15,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const overlayVariants = {
    rest: { 
      opacity: 0.7,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: {
      opacity: 0.85,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const contentVariants = {
    rest: { 
      y: 0, opacity: 1,
      transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: {
      y: -8,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const buttonVariants = {
    rest: { 
      x: 0,
      scale: 1,
      backgroundColor: 'var(--logo-gold, #D4A574)',
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: {
      x: 8,
      scale: 1.05,
      backgroundColor: 'var(--logo-gold-light, #E6B896)',
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const titleVariants = {
    rest: { 
      x: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: {
      x: 4,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ 
        y: -12,
        scale: 1.02,
        transition: {
          duration: 0.5,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-[500px] md:h-[550px] overflow-hidden bg-[#261E10] rounded-xl cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-[var(--logo-gold,#D4A574)]/20 transition-shadow duration-700"
    >
      <Link href={collection.link} className="block w-full h-full">
        
        <motion.div
          className="relative w-full h-full"
          variants={imageVariants}
          initial="rest"
          animate={isHovered ? 'hover' : 'rest'}
        >
          <Image
            src={collection.imageUrl}
            alt={collection.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority={index === 0}
          />
          
          
          <motion.div
            variants={overlayVariants}
            initial="rest"
            animate={isHovered ? 'hover' : 'rest'}
            className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/95 via-[#0D0D0D]/50 to-transparent"
          />
          
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: isHovered ? 0.3 : 0,
            }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--logo-gold,#D4A574)]/20 to-transparent"
            style={{
              transform: `translateX(${isHovered ? '100%' : '-100%'})`,
            }}
          />
        </motion.div>
        
        
        <motion.div
          variants={contentVariants}
          initial="rest"
          animate={isHovered ? 'hover' : 'rest'}
          className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10"
        >
          
          <motion.h3
            variants={titleVariants}
            initial="rest"
            animate={isHovered ? 'hover' : 'rest'}
            className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-[var(--logo-gold,#D4A574)] transition-colors duration-500"
          >
            {collection.name}
          </motion.h3>
          
          
          <motion.p
            initial={{ opacity: 0.8 }}
            animate={{ 
              opacity: isHovered ? 1 : 0.8,
            }}
            transition={{ duration: 0.4 }}
            className="text-gray-300 mb-6 font-light text-base md:text-lg leading-relaxed"
          >
            {collection.description}
          </motion.p>
          
          
          <motion.div
            variants={buttonVariants}
            initial="rest"
            animate={isHovered ? 'hover' : 'rest'}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wider shadow-lg"
            style={{ color: '#0D0D0D' }}
          >
            <span>Explorar</span>
            <motion.div
              animate={{
                x: isHovered ? 4 : 0,
              }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <ArrowRight size={20} weight="bold" />
            </motion.div>
          </motion.div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

const looks = [
  {
    id: 1,
    title: 'Look Urbano',
    description: 'Conforto e estilo para o dia a dia',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    products: ['Vestido Midi', 'Bolsa Elegante', 'Sandália']
  },
  {
    id: 2,
    title: 'Elegância Noturna',
    description: 'Perfeito para ocasiões especiais',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    products: ['Vestido Longo', 'Acessórios Dourados', 'Sapatilha']
  },
  {
    id: 3,
    title: 'Clássico Atemporal',
    description: 'Peças que nunca saem de moda',
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80',
    products: ['Blazer Premium', 'Saia Midi', 'Bolsa Clutch']
  }
]

function LookCard({ look, index }: { look: typeof looks[0], index: number }) {
  const [isHovered, setIsHovered] = useState(false)

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        delay: index * 0.15,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  const imageVariants = {
    rest: { 
      scale: 1,
      transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: {
      scale: 1.15,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const overlayVariants = {
    rest: { 
      opacity: 0.7,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: {
      opacity: 0.85,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const titleVariants = {
    rest: { 
      x: 0,
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: {
      x: 4,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  const buttonVariants = {
    rest: { 
      x: 0,
      scale: 1,
      backgroundColor: 'var(--logo-gold, #D4A574)',
      transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
    },
    hover: {
      x: 8,
      scale: 1.05,
      backgroundColor: 'var(--logo-gold-light, #E6B896)',
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative h-[500px] rounded-xl overflow-hidden cursor-pointer shadow-lg border border-[#261E10] hover:border-[var(--logo-gold,#D4A574)]/20 transition-colors duration-500"
    >
      <Link href="/produtos" className="block h-full w-full relative">
          
          <div className="absolute inset-0 overflow-hidden">
            <motion.div className="relative w-full h-full" variants={imageVariants} initial="rest" animate={isHovered ? 'hover' : 'rest'}>
              <Image
                  src={look.imageUrl}
                  alt={look.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
              />
            </motion.div>
          </div>
          
          
          <motion.div className="absolute inset-0 bg-[#0D0D0D]" variants={overlayVariants} initial="rest" animate={isHovered ? 'hover' : 'rest'} />
          
          
          <div className="absolute inset-0 flex flex-col justify-end p-8 z-10">
             <motion.div>
                <motion.h3 
                  variants={titleVariants}
                  initial="rest" animate={isHovered ? 'hover' : 'rest'}
                  className="text-2xl font-bold mb-2 text-white group-hover:text-[var(--logo-gold,#D4A574)] transition-colors duration-500"
                >
                  {look.title}
                </motion.h3>
                <p className="text-gray-300 mb-4 font-light">
                  {look.description}
                </p>
                
                <ul className="space-y-2 mb-6">
                  {look.products.map((product, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[var(--logo-gold,#D4A574)] rounded-full" />
                      {product}
                    </li>
                  ))}
                </ul>

                <motion.div 
                  variants={buttonVariants}
                  initial="rest" animate={isHovered ? 'hover' : 'rest'}
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-lg font-semibold text-sm uppercase tracking-wider shadow-lg"
                  style={{ color: '#0D0D0D' }}
                >
                  <span>Ver Look Completo</span>
                  <motion.div
                    animate={{
                      x: isHovered ? 4 : 0,
                    }}
                    transition={{
                      duration: 0.4,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  >
                    <ArrowRight size={16} weight="bold" />
                  </motion.div>
                </motion.div>
             </motion.div>
          </div>
      </Link>
    </motion.div>
  )
}

function FlickeringGrid() {
  const [mounted, setMounted] = useState(false)
  const [squares, setSquares] = useState<{id: number, x: number, y: number, delay: number, duration: number, repeatDelay: number}[]>([])

  useEffect(() => {
    setMounted(true)
    const width = window.innerWidth
    const height = 2500 
    const cols = Math.floor(width / 60)
    const rows = Math.floor(height / 60)
    const newSquares = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.floor(Math.random() * cols) * 60,
      y: Math.floor(Math.random() * rows) * 60,
      delay: Math.random() * 10,
      duration: 1 + Math.random() * 2,
      repeatDelay: 5 + Math.random() * 15 
    }))
    setSquares(newSquares)
  }, [])

  if (!mounted) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {squares.map((sq) => (
        <motion.div
          key={sq.id}
          className="absolute bg-[var(--logo-gold,#D4A574)]"
          style={{
            left: sq.x,
            top: sq.y,
            width: 60,
            height: 60,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 0.15, 0], 
          }}
          transition={{
            duration: sq.duration,
            repeat: Infinity,
            delay: sq.delay,
            ease: "easeInOut",
            repeatDelay: sq.repeatDelay
          }}
        />
      ))}
    </div>
  )
}

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

export function FeaturedCollectionsSection() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/products?limit=3&featured=true')
        const data = await response.json()
        
        if (data.success) {
          setProducts(data.data)
        }
      } catch (error) {
        console.error('Erro ao carregar ofertas:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoadingTestimonials(true)
        const response = await fetch('/api/testimonials')
        const data = await response.json()
        
        if (data.success) {
          setTestimonials(data.data)
        }
      } catch (error) {
        console.error('Erro ao buscar depoimentos:', error)
      } finally {
        setLoadingTestimonials(false)
      }
    }

    fetchTestimonials()
  }, [])

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    const slider = sliderRef.current
    const slides = slider?.children
    if (!slider || !slides || loadingTestimonials) return

    gsap.set(slides, {
      opacity: 0,
      scale: 0.8,
      y: 50
    })

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: testimonialsRef.current,
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
  }, [loadingTestimonials])

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
  const totalTestimonialPages = testimonialPages.length

  useEffect(() => {
    setCurrentTestimonialIndex(0)
  }, [isMobile])

  return (
    <section className="pt-24 md:pt-32 pb-0 bg-[#0D0D0D] relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--logo-gold,#D4A574)]/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 left-1/4 w-96 h-96 bg-[var(--logo-gold,#D4A574)]/5 rounded-full blur-3xl"
        />
        
        
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(var(--logo-gold,#D4A574) 1px, transparent 1px),
              linear-gradient(90deg, var(--logo-gold,#D4A574) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        
        <FlickeringGrid />
      </div>

      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ 
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block text-sm uppercase tracking-wider text-gray-400 mb-4 font-medium"
          >
            Nossas Coleções
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            Descubra sua{' '}
            <span className="bg-gradient-to-r from-[var(--logo-gold,#D4A574)] via-[var(--logo-gold-light,#E6B896)] to-[var(--logo-gold,#D4A574)] bg-clip-text text-transparent">
              Elegância
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Curadoria especial de peças que refletem sofisticação e estilo único
          </motion.p>
        </motion.div>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-32">
          {collections.map((collection, index) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              index={index}
            />
          ))}
        </div>

        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ 
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="text-center mb-16 md:mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block text-sm uppercase tracking-wider text-gray-400 mb-4 font-medium"
          >
            Lookbook
          </motion.span>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
          >
            Looks{' '}
            <span className="bg-gradient-to-r from-[var(--logo-gold,#D4A574)] via-[var(--logo-gold-light,#E6B896)] to-[var(--logo-gold,#D4A574)] bg-clip-text text-transparent">
              Completos
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Inspire-se com combinações perfeitas criadas pela nossa equipe de estilo
          </motion.p>
        </motion.div>

        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-24">
          {looks.map((look, index) => (
            <LookCard key={look.id} look={look} index={index} />
          ))}
        </div>
      </div>

      
      <div className="relative w-full h-12 md:h-24 z-20 mt-0 mb-[-1px]">
        <svg
          className="absolute bottom-0 left-0 w-full h-full"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ transform: 'rotate(180deg)' }}
        >
          
          <path
            d="M0 0v100S0 4 500 4s500 96 500 96V0H0Z"
            fill="#0D0D0D"
          />
          
          <path
            d="M0 0v100S0 4 500 4s500 96 500 96V0H0Z"
            fill="#261E10"
            fillOpacity="0.3"
          />
        </svg>
      </div>

      
      <div className="relative z-20 pb-24 md:pb-32 bg-[#0D0D0D]">
        
        <div className="absolute inset-0 bg-gradient-to-b from-[#261E10]/30 to-transparent pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-20 pt-12">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="text-sm uppercase tracking-wider text-gray-400 font-medium">
                Ofertas Especiais
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Peças em{' '}
              <span className="bg-gradient-to-r from-[var(--logo-gold,#D4A574)] via-[var(--logo-gold-light,#E6B896)] to-[var(--logo-gold,#D4A574)] bg-clip-text text-transparent">
                Destaque
              </span>
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Seleção especial de peças especiais com condições exclusivas
            </p>
          </motion.div>

          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product, index) => {
              const discount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price)
                ? Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100)
                : 0

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  className="group relative bg-[#261E10] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <Link href={`/produto/${product.slug}`} className="block">
                    <div className="relative aspect-[3/4] overflow-hidden bg-[#0D0D0D]">
                      <Image
                        src={product.primary_image || (product.images && product.images[0]?.url) || 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      {discount > 0 && (
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 bg-[var(--logo-gold,#D4AF37)] text-[#0D0D0D] text-xs uppercase tracking-wider font-bold rounded-lg">
                            -{discount}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <h3 className="font-semibold text-white group-hover:text-[var(--logo-gold,#D4AF37)] transition-colors duration-300 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-semibold text-[var(--logo-gold,#D4AF37)]">
                          {formatPrice(product.price)}
                        </span>
                        {product.originalPrice && discount > 0 && (
                          <span className="text-sm text-gray-500 line-through font-light">
                            {formatPrice(product.originalPrice)}
                          </span>
                        )}
                      </div>
                      <div className="pt-2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--logo-gold,#D4AF37)] text-[#0D0D0D] rounded-lg group-hover:gap-3 transition-all duration-300 text-sm uppercase tracking-wider font-semibold">
                          <span>Ver Detalhes</span>
                          <ArrowRight size={16} weight="bold" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>

          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center mt-12 mb-20"
          >
            <Link
              href="/produtos?ofertas=true"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--logo-gold,#D4AF37)] text-[#0D0D0D] hover:bg-[var(--logo-gold,#D4AF37)]/90 rounded-lg transition-all duration-300 uppercase tracking-wider text-sm font-semibold shadow-md hover:shadow-lg"
            >
              Ver Todas as Ofertas
              <ArrowRight size={16} weight="thin" />
            </Link>
          </motion.div>

          
          <div ref={testimonialsRef} className="mt-20 pt-20 border-t border-[#261E10]/50">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-12 md:mb-16"
            >
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="text-sm uppercase tracking-wider text-gray-400 font-medium">
                  Depoimentos
                </span>
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
              >
                <span className="text-white">O que nossos </span>
                <span className="bg-gradient-to-r from-[var(--logo-gold,#D4A574)] via-[var(--logo-gold-light,#E6B896)] to-[var(--logo-gold,#D4A574)] bg-clip-text text-transparent">
                  clientes dizem
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                Veja os depoimentos de quem já comprou conosco
              </motion.p>
            </motion.div>

            {loadingTestimonials ? (
              <div className="text-center text-gray-400">
                <div className="animate-spin rounded-sm h-12 w-12 border-b border-[var(--logo-gold,#D4A574)] mx-auto"></div>
              </div>
            ) : testimonials.length > 0 ? (
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
                      width: `${totalTestimonialPages * 100}%`,
                      willChange: 'transform',
                      transform: 'translate3d(0, 0, 0)'
                    }}
                  >
                    {testimonialPages.map((page, pageIndex) => (
                      <div
                        key={pageIndex}
                        className="w-full flex-shrink-0"
                        style={{ width: `${100 / totalTestimonialPages}%` }}
                      >
                        <div className="flex gap-6 pb-8 justify-center">
                          {page.map((testimonial) => (
                            <div
                              key={testimonial.id}
                              className="bg-[#261E10]/50 backdrop-blur-sm rounded-2xl p-8 border border-[#261E10] max-w-lg mx-auto w-full"
                            >
                              <div className="mb-6">
                                <p className="text-gray-300 text-base leading-relaxed">
                                  &quot;{testimonial.comment}&quot;
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-full bg-[var(--logo-gold,#D4A574)] flex items-center justify-center">
                                    <span className="text-[#0D0D0D] font-bold text-lg">
                                      {testimonial.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="text-white font-semibold text-base">
                                      {testimonial.name}
                                    </h4>
                                    <p className="text-gray-400 text-sm">
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
                                      className={i < testimonial.rating ? "text-[var(--logo-gold,#D4A574)]" : "text-gray-600"}
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

                {totalTestimonialPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    {[...Array(totalTestimonialPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentTestimonialIndex(index)
                          if (sliderRef.current) {
                            const transformX = -index * (100 / totalTestimonialPages)
                            gsap.to(sliderRef.current, {
                              x: `${transformX}%`,
                              duration: 0.8,
                              ease: "power2.out"
                            })
                          }
                        }}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentTestimonialIndex
                            ? 'bg-[var(--logo-gold,#D4A574)] w-8'
                            : 'bg-gray-600 hover:bg-gray-500 w-2'
                        }`}
                      />
                    ))}
                  </div>
                )}

                <div className="text-center mt-8">
                  <Link
                    href="/contato"
                    className="inline-flex items-center gap-2 bg-[var(--logo-gold,#D4A574)] hover:bg-[var(--logo-gold,#D4A574)]/90 text-[#0D0D0D] font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg"
                  >
                    Deixe Sua Avaliação
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p>Nenhum depoimento encontrado.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
