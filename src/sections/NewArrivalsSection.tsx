'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ArrowRight, Sparkle, Star } from 'phosphor-react'

export function NewArrivalsSection() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/products?limit=4&sort=newest')
        const data = await response.json()
        
        if (data.success) {
          setProducts(data.data)
        }
      } catch (error) {
        console.error('Erro ao carregar novos produtos:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  if (loading) {
    return (
      <section className="py-32 bg-gradient-to-b from-[#0D0D0D] via-[var(--logo-gold,#D4A574)]/10 to-[#0D0D0D] relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 border-4 border-[var(--logo-gold,#D4A574)] border-t-transparent rounded-full"
            />
          </div>
        </div>
      </section>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 60, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  }

  return (
    <section
      ref={sectionRef}
      className="relative py-32 overflow-hidden bg-gradient-to-b from-[#0D0D0D] via-[var(--logo-gold,#D4A574)]/5 to-[#0D0D0D]"
    >
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-20 left-10 w-96 h-96 bg-[var(--logo-gold,#D4A574)] rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-[var(--logo-gold,#D4A574)]/30 rounded-full blur-3xl"
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
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-20"
        >
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[var(--logo-gold,#D4A574)]/20 backdrop-blur-sm border border-[var(--logo-gold,#D4A574)]/30 rounded-full"
          >
            <Sparkle size={16} className="text-[var(--logo-gold,#D4A574)]" weight="fill" />
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--logo-gold,#D4A574)] font-semibold">
              Novidades
            </span>
          </motion.div>

          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Últimas{' '}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-[var(--logo-gold,#D4A574)] via-[var(--logo-gold-light,#E6B896)] to-[var(--logo-gold,#D4A574)] bg-clip-text text-transparent">
                Chegadas
              </span>
              <motion.div
                initial={{ width: 0 }}
                animate={isInView ? { width: '100%' } : {}}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute bottom-2 left-0 h-3 bg-[var(--logo-gold,#D4A574)]/20 -z-0"
                style={{ transform: 'skewX(-12deg)' }}
              />
            </span>
          </motion.h2>

          
          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
          >
            As peças mais recentes da nossa coleção, cuidadosamente selecionadas para você
          </motion.p>

          
          <motion.div
            initial={{ width: 0 }}
            animate={isInView ? { width: '120px' } : {}}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mx-auto mt-8 h-px bg-gradient-to-r from-transparent via-[var(--logo-gold,#D4A574)] to-transparent"
          />
        </motion.div>

        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              variants={itemVariants}
              whileHover={{ y: -12, scale: 1.02 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="group relative"
            >
              <Link href={`/produto/${product.slug}`} className="block">
                
                <div className="relative h-full bg-gradient-to-b from-[#0D0D0D] to-[#261E10] rounded-2xl overflow-hidden border border-[#261E10] group-hover:border-[var(--logo-gold,#D4A574)]/50 transition-all duration-500 shadow-xl group-hover:shadow-2xl group-hover:shadow-[var(--logo-gold,#D4A574)]/20">
                  
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--logo-gold,#D4A574)]/0 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  
                  <div className="relative aspect-[2/3] overflow-hidden bg-[#261E10]">
                    <Image
                      src={product.primary_image || (product.images && product.images[0]?.url) || 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      priority={index < 2}
                    />
                    
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                      className="absolute top-5 left-5 z-10"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-[var(--logo-gold,#D4A574)] blur-md opacity-75" />
                        <span className="relative px-4 py-1.5 bg-[var(--logo-gold,#D4A574)] text-[#0D0D0D] text-xs uppercase tracking-wider font-bold rounded-full shadow-lg">
                          Novo
                        </span>
                      </div>
                    </motion.div>

                    
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    >
                      <Star size={20} className="text-[var(--logo-gold,#D4A574)]" weight="fill" />
                    </motion.div>

                    
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute bottom-5 right-5 p-3 bg-[#0D0D0D]/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 border border-[var(--logo-gold,#D4A574)]/30 hover:bg-[var(--logo-gold,#D4A574)] hover:border-[var(--logo-gold,#D4A574)]"
                    >
                      <Heart size={18} className="text-white group-hover:text-[#0D0D0D]" weight="regular" />
                    </motion.button>
                  </div>

                  
                  <div className="p-6 space-y-3 relative z-10">
                    
                    <h3 className="font-semibold text-lg text-white group-hover:text-[var(--logo-gold,#D4A574)] transition-colors duration-300 line-clamp-2 min-h-[3rem]">
                      {product.name}
                    </h3>
                    
                    
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-[var(--logo-gold,#D4A574)]">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ opacity: 1, y: 0 }}
                      className="pt-2"
                    >
                      <div className="flex items-center gap-2 text-[var(--logo-gold,#D4A574)] text-sm font-medium">
                        <span>Ver detalhes</span>
                        <ArrowRight size={16} weight="thin" className="group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <Link href="/produtos?novidades=true">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[var(--logo-gold,#D4A574)] text-[#0D0D0D] rounded-full font-semibold text-sm uppercase tracking-wider shadow-lg shadow-[var(--logo-gold,#D4A574)]/30 hover:shadow-xl hover:shadow-[var(--logo-gold,#D4A574)]/50 transition-all duration-300 overflow-hidden"
            >
              
              <motion.div
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
              <span className="relative z-10">Ver Todas as Novidades</span>
              <ArrowRight size={18} weight="thin" className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
