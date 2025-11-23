'use client'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarBlank } from 'phosphor-react'
const editorialStories = [
  {
    id: 1,
    title: 'A Arte da Elegância',
    excerpt: 'Descubra como pequenos detalhes fazem toda a diferença na composição de um look perfeito.',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80',
    date: '15 Mar 2025',
    category: 'Estilo'
  },
  {
    id: 2,
    title: 'Tendências Primavera-Verão',
    excerpt: 'As cores, texturas e silhuetas que vão dominar a estação mais quente do ano.',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    date: '10 Mar 2025',
    category: 'Tendências'
  },
  {
    id: 3,
    title: 'Momentos Especiais',
    excerpt: 'Como escolher o vestido perfeito para ocasiões que merecem ser inesquecíveis.',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    date: '5 Mar 2025',
    category: 'Guia'
  }
]
export function EditorialSection() {
  return (
    <section className="py-24 bg-[#0D0D0D]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm uppercase tracking-wider text-gray-400 mb-4 font-medium">
            Fashion Stories
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
            Inspiração & Tendências
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Conteúdos exclusivos sobre moda, estilo e as últimas tendências
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {editorialStories.map((story, index) => (
            <motion.article
              key={story.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -5 }}
              className="group bg-[#261E10] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            >
              <Link href="/blog" className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={story.imageUrl}
                    alt={story.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#0D0D0D]/90 backdrop-blur-sm text-[var(--logo-gold,#D4AF37)] text-xs uppercase tracking-wider font-semibold rounded-lg">
                      {story.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <CalendarBlank size={14} weight="regular" />
                    <span>{story.date}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white group-hover:text-[var(--logo-gold,#D4AF37)] transition-colors duration-300">
                    {story.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed line-clamp-2">
                    {story.excerpt}
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--logo-gold,#D4AF37)] text-[#0D0D0D] rounded-lg group-hover:gap-3 transition-all duration-300 mt-2">
                    <span className="text-sm uppercase tracking-wider font-semibold">
                      Ler Mais
                    </span>
                    <ArrowRight size={16} weight="bold" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
