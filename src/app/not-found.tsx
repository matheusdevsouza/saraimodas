'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { House, ArrowLeft, ShoppingBag } from 'phosphor-react'

const FloatingParticles = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute bg-[#F2C063]/20 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] relative flex flex-col items-center justify-center overflow-hidden pt-48 md:pt-64 pb-12">
      
      <FloatingParticles />
      
      
      <div className="absolute inset-0 bg-gradient-to-br from-[#261E10] via-[#0D0D0D] to-black opacity-80" />
      
      
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#F2C063]/10 rounded-full blur-3xl" />
      
      
      <div className="relative z-10 text-center px-4 max-w-2xl">
        
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative p-6 bg-[#261E10] border border-[#594725]/50 rounded-full">
            <ShoppingBag size={64} className="text-[#F2C063]" weight="duotone" />
            
            <motion.div
              className="absolute inset-0 rounded-full border border-[#F2C063]/30"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </motion.div>

        
        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-[#F2C063] via-[#A68444] to-[#594725] mb-6 leading-none"
        >
          404
        </motion.h1>

        
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-3xl md:text-4xl font-semibold text-white mb-4"
        >
          Esta página está fora de moda
        </motion.h2>

        
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed font-light"
        >
          Parece que você se perdeu na coleção! A página que você procura não existe ou foi movida. 
          Que tal explorar nossas <span className="text-[#F2C063] font-medium">peças exclusivas</span> e encontrar algo especial?
        </motion.p>

        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          
          <Link
            href="/"
            className="group relative inline-flex items-center gap-3 bg-transparent border border-[#F2C063] text-[#F2C063] font-light uppercase tracking-wider px-8 py-4 rounded-sm overflow-hidden transition-all duration-300"
          >
            <div className="absolute inset-0 bg-[#F2C063] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center gap-3 group-hover:text-[#0D0D0D] transition-colors duration-300">
              <House size={20} weight="thin" />
              Voltar ao Início
            </span>
          </Link>

          
          <button
            onClick={() => window.history.back()}
            className="group relative inline-flex items-center gap-3 bg-transparent border border-[#594725]/50 text-gray-400 font-light uppercase tracking-wider px-8 py-4 rounded-sm overflow-hidden transition-all duration-300"
          >
             <div className="absolute inset-0 bg-[#F2C063]/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-out" />
             <span className="relative z-10 flex items-center gap-3 group-hover:text-[#F2C063] transition-colors duration-300">
              <ArrowLeft size={20} weight="thin" />
              Página Anterior
            </span>
          </button>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          className="mt-12 pt-8 border-t border-[#594725]/30"
        >
          <p className="text-gray-400 mb-4 font-light">Ou explore nossas coleções:</p>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <Link href="/produtos" className="text-[#F2C063] hover:text-[#A68444] transition-colors duration-200 font-light uppercase tracking-wider text-sm">
              Coleção Completa
            </Link>
            <span className="text-[#594725]">•</span>
            <Link href="/produtos?categoria=vestidos" className="text-[#F2C063] hover:text-[#A68444] transition-colors duration-200 font-light uppercase tracking-wider text-sm">
              Vestidos
            </Link>
            <span className="text-[#594725]">•</span>
            <Link href="/produtos?categoria=acessorios" className="text-[#F2C063] hover:text-[#A68444] transition-colors duration-200 font-light uppercase tracking-wider text-sm">
              Acessórios
            </Link>
          </div>
        </motion.div>
      </div>

      
      <motion.div
        className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#F2C063]/50 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
          >
            <div className="w-2 h-2 rounded-full bg-[#F2C063]/30" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
