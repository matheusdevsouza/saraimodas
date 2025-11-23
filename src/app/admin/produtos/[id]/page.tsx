"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { FaSpinner, FaSave, FaArrowLeft, FaCheckCircle } from 'react-icons/fa'
import MediaManager from '@/components/admin/MediaManager'
import ProductSizesManager from '@/components/admin/ProductSizesManager'

interface Product {
  id: number
  name: string
  description?: string
  price: number
  stock_quantity: number
  is_active: boolean
  brand_id?: number
  model_id?: number
}

interface Brand {
  id: number;
  name: string;
}

interface Model {
  id: number;
  name: string;
}

export default function ProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params?.id)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [models, setModels] = useState<Model[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        const [productRes, brandsRes, modelsRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch('/api/brands'),
          fetch('/api/models')
        ])
        
        if (!productRes.ok) throw new Error('Falha ao carregar produto')
        
        const productData = await productRes.json()
        const brandsData = await brandsRes.json()
        const modelsData = await modelsRes.json()
        
        const data = productData.product
        
        if (!data || !data.id) {
          throw new Error('Dados do produto inválidos')
        }
        
        setProduct({
          id: data.id,
          name: data.name || '',
          description: data.description ?? '',
          price: Number(data.price ?? 0),
          stock_quantity: Number(data.stock_quantity ?? 0),
          is_active: Boolean(data.is_active),
          brand_id: data.brand_id ? Number(data.brand_id) : undefined,
          model_id: data.model_id ? Number(data.model_id) : undefined
        })
        
        if (brandsData.success) setBrands(brandsData.data || [])
        if (modelsData.success) setModels(modelsData.data || [])
        
      } catch (e: any) {
        setError(e.message || 'Erro inesperado')
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchData()
  }, [id])

  async function handleSave() {
    if (!product) return
    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: Number(product.price),
          stock_quantity: Number(product.stock_quantity),
          is_active: Boolean(product.is_active),
          brand_id: product.brand_id,
          model_id: product.model_id
        })
      })
      if (!res.ok) throw new Error('Falha ao salvar alterações')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <FaSpinner className="animate-spin text-primary-500" size={24} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="admin-product-page min-h-screen bg-dark-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        <div className="mb-4 sm:mb-6">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200 text-sm sm:text-base"
          >
            <FaArrowLeft size={16} className="sm:w-4 sm:h-4" /> 
            <span className="hidden xs:inline">Voltar</span>
          </button>
        </div>

        <div className="bg-dark-800/60 border border-dark-700/60 rounded-xl sm:rounded-2xl overflow-hidden">
          
          <div className="p-4 sm:p-6 border-b border-dark-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  Editar Produto #{product.id}
                </h1>
                <p className="text-sm text-gray-400 mt-1 hidden sm:block">
                  Gerencie as informações e configurações do produto
                </p>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg sm:rounded-xl disabled:opacity-60 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin" size={16} />
                    <span className="hidden xs:inline">Salvando...</span>
                    <span className="xs:hidden">Salvar</span>
                  </>
                ) : (
                  <>
                    <FaSave size={16} />
                    <span className="hidden xs:inline">Salvar Alterações</span>
                    <span className="xs:hidden">Salvar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            
            {saved && (
              <div className="flex items-center gap-2 text-green-400 mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <FaCheckCircle size={16} />
                <span className="text-sm">Alterações salvas com sucesso!</span>
              </div>
            )}

            <div className="space-y-6">
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome do Produto
                  </label>
                  <input
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
                    placeholder="Digite o nome do produto"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Marca
                  </label>
                  <select
                    value={product.brand_id || ''}
                    onChange={(e) => setProduct({ ...product, brand_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
                  >
                    <option value="">Selecione uma marca</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Modelo
                  </label>
                  <select
                    value={product.model_id || ''}
                    onChange={(e) => setProduct({ ...product, model_id: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
                  >
                    <option value="">Selecione um modelo</option>
                    {models.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={product.price}
                    onChange={(e) => setProduct({ ...product, price: Number(e.target.value) })}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Estoque Total
                  </label>
                  <input
                    type="number"
                    value={product.stock_quantity}
                    onChange={(e) => setProduct({ ...product, stock_quantity: Number(e.target.value) })}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
                    placeholder="0"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status do Produto
                  </label>
                  <select
                    value={product.is_active ? 'true' : 'false'}
                    onChange={(e) => setProduct({ ...product, is_active: e.target.value === 'true' })}
                    className="w-full max-w-xs bg-dark-900/50 border border-dark-600 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200"
                  >
                    <option value="true">✅ Ativo</option>
                    <option value="false">❌ Inativo</option>
                  </select>
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    rows={4}
                    value={product.description || ''}
                    onChange={(e) => setProduct({ ...product, description: e.target.value })}
                    className="w-full bg-dark-900/50 border border-dark-600 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all duration-200 resize-none"
                    placeholder="Descreva o produto..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
          
          <div className="hidden sm:block">
            <ProductSizesManager 
              productId={product.id} 
              productName={product.name}
            />
          </div>

          <div className="block sm:hidden">
            <div className="bg-dark-800/60 border border-dark-700/60 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-dark-700/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary-500/20 rounded-lg">
                      <svg className="w-4 h-4 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Gerenciar Tamanhos</h3>
                      <p className="text-xs text-gray-400">{product.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      alert('Funcionalidade de gerenciamento de tamanhos será implementada para mobile');
                    }}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Gerenciar
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-400 text-center">
                  Para gerenciar tamanhos, acesse a versão desktop ou use um dispositivo com tela maior.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-dark-800/60 border border-dark-700/60 rounded-xl sm:rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-dark-700/60">
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                📸 Gerenciamento de Mídia
              </h2>
              <p className="text-sm text-gray-400 mt-1 hidden sm:block">
                Gerencie imagens e vídeos do produto
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <MediaManager 
                productId={product.id} 
                onMediaUpdate={() => {
                  console.log('Mídia atualizada');
                }}
              />
            </div>
          </div>
        </div>

        <div className="fixed bottom-4 right-4 sm:hidden z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-14 h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-lg hover:shadow-xl disabled:opacity-60 transition-all duration-200 flex items-center justify-center"
          >
            {saving ? (
              <FaSpinner className="animate-spin" size={20} />
            ) : (
              <FaSave size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
