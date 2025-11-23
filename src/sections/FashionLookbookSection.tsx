'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'phosphor-react'
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
export function FashionLookbookSection() {
  return (
    <section className="pt-0 pb-24 bg-[#0D0D0D]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm uppercase tracking-wider text-gray-400 mb-4 font-medium">
            Lookbook
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
            Looks Completos
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Inspire-se com combinações perfeitas criadas pela nossa equipe de estilo
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {looks.map((look, index) => (
            <motion.div
              key={look.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="group relative"
            >
              <Link href="/produtos" className="block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[#261E10] rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                  <Image
                    src={look.imageUrl}
                    alt={look.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-[#0D0D0D]/60 group-hover:bg-[#0D0D0D]/40 transition-all duration-500" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 + 0.3 }}
                    >
                      <h3 className="text-2xl font-semibold text-white mb-2">
                        {look.title}
                      </h3>
                      <p className="text-gray-300 mb-4 font-light">
                        {look.description}
                      </p>
                      <ul className="space-y-2 mb-6">
                        {look.products.map((product, i) => (
                          <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                            <span className="w-2 h-2 bg-[var(--logo-gold,#D4AF37)] rounded-full" />
                            {product}
                          </li>
                        ))}
                      </ul>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--logo-gold,#D4AF37)] text-[#0D0D0D] rounded-lg group-hover:gap-3 transition-all duration-300">
                        <span className="text-sm uppercase tracking-wider font-semibold">
                          Ver Look Completo
                        </span>
                        <ArrowRight size={16} weight="bold" />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
