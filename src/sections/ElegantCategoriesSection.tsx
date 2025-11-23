'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Tag, TShirt, Bag, Sparkle, Heart, Crown } from 'phosphor-react'
interface Category {
  id: number
  name: string
  slug: string
  description: string
  productCount: number
}
const categoryIcons: { [key: string]: any } = {
  'vestidos': Tag,
  'blusas': TShirt,
  'acessorios': Bag,
  'saias': Tag,
  'casacos': TShirt,
  'default': Sparkle
}
const defaultCategories = [
  { name: 'Vestidos', slug: 'vestidos', icon: Tag, description: 'Peças elegantes para todos os momentos' },
  { name: 'Blusas', slug: 'blusas', icon: TShirt, description: 'Conforto e sofisticação' },
  { name: 'Acessórios', slug: 'acessorios', icon: Bag, description: 'Detalhes que fazem a diferença' },
  { name: 'Saias', slug: 'saias', icon: Tag, description: 'Versatilidade e estilo' },
  { name: 'Casacos', slug: 'casacos', icon: TShirt, description: 'Elegância para o inverno' },
  { name: 'Coleção Premium', slug: 'premium', icon: Crown, description: 'Peças exclusivas e sofisticadas' }
]
export function ElegantCategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        if (data.success && data.data.length > 0) {
          setCategories(data.data.slice(0, 6))
        } else {
          setCategories(defaultCategories.map((cat, i) => ({
            id: i + 1,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            productCount: Math.floor(Math.random() * 50) + 10
          })))
        }
      } catch (error) {
        console.error('Erro ao buscar categorias:', error)
        setCategories(defaultCategories.map((cat, i) => ({
          id: i + 1,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          productCount: Math.floor(Math.random() * 50) + 10
        })))
      } finally {
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])
  if (loading) {
    return (
      <section className="py-24 bg-[#261E10]">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-sm h-12 w-12 border-b border-[var(--logo-gold,#D4AF37)]"></div>
          </div>
        </div>
      </section>
    )
  }
  return (
    <section className="py-24 bg-[#261E10]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-sm uppercase tracking-wider text-gray-400 mb-4 font-medium">
            Categorias
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4">
            Explore Nossas Coleções
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Encontre peças perfeitas para cada momento do seu dia
          </p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category, index) => {
            const IconComponent = categoryIcons[category.slug.toLowerCase()] || categoryIcons.default || Sparkle
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Link
                  href={`/produtos?categoria=${category.slug}`}
                  className="flex flex-col items-center p-6 bg-[#0D0D0D] rounded-lg hover:bg-[#261E10] transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <div className="mb-4 p-4 bg-[#261E10] rounded-lg group-hover:bg-[var(--logo-gold,#D4AF37)] transition-all duration-300">
                    <IconComponent 
                      size={32} 
                      className="text-gray-300 group-hover:text-[#0D0D0D] transition-colors duration-300" 
                      weight="regular" 
                    />
                  </div>
                  <h3 className="text-center font-semibold text-white mb-2 group-hover:text-[var(--logo-gold,#D4AF37)] transition-colors duration-300">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.productCount} peças
                  </p>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
