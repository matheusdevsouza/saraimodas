'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faEnvelope,
  faPhone
} from '@fortawesome/free-solid-svg-icons'
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'
import { ArrowRight } from 'phosphor-react'
export function ContactSection() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-b from-[#0D0D0D] via-[var(--logo-gold,#D4A574)]/10 to-[#0D0D0D] relative overflow-hidden">
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
          className="absolute top-20 right-1/4 w-48 h-48 bg-[var(--logo-gold,#D4A574)] rounded-full blur-3xl"
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
          className="absolute bottom-20 left-1/4 w-48 h-48 bg-[var(--logo-gold,#D4A574)] rounded-full blur-3xl"
        />
      </div>
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ 
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-[var(--logo-gold,#D4A574)]/20 backdrop-blur-sm border border-[var(--logo-gold,#D4A574)] rounded-full"
            >
              <FontAwesomeIcon 
                icon={faEnvelope} 
                className="text-[var(--logo-gold,#D4A574)] text-sm" 
              />
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--logo-gold,#D4A574)] font-semibold">
                Entre em Contato
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            >
              Fale{' '}
              <span className="bg-gradient-to-r from-[var(--logo-gold,#D4A574)] via-[var(--logo-gold-light,#E6B896)] to-[var(--logo-gold,#D4A574)] bg-clip-text text-transparent">
                Conosco
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed"
            >
              Estamos prontos para ajudar você com qualquer dúvida sobre nossos produtos ou pedidos
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-center"
          >
            <Link href="/contato">
              <motion.button
                whileHover={{ 
                  scale: 1.05, 
                  y: -2,
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ 
                  duration: 0.5, 
                  ease: [0.25, 0.46, 0.45, 0.94] 
                }}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[var(--logo-gold,#D4A574)] text-[#0D0D0D] rounded-full font-semibold text-sm uppercase tracking-wider shadow-lg shadow-[var(--logo-gold,#D4A574)]/30 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                style={{
                  transition: 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.6s ease, transform 0.5s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(212, 165, 116, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(212, 165, 116, 0.3), 0 4px 6px -2px rgba(212, 165, 116, 0.2)';
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    opacity: { 
                      duration: 0.5, 
                      ease: [0.25, 0.46, 0.45, 0.94] 
                    },
                    x: {
                      duration: 2,
                      repeat: Infinity,
                      ease: 'linear',
                    }
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-opacity duration-500"
                />
                <motion.span 
                  className="relative z-10"
                  initial={{ x: 0 }}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  ENTRAR EM CONTATO
                </motion.span>
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative z-10"
                >
                  <ArrowRight size={18} weight="thin" />
                </motion.div>
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
export const NewsletterSection = ContactSection
