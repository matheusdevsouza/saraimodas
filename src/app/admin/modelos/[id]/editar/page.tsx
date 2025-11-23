'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, 
  FaSave, 
  FaImage, 
  FaSpinner,
  FaExclamationTriangle,
  FaUpload,
  FaTimes,
  FaEdit
} from 'react-icons/fa';
import Image from 'next/image';
interface Model {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}
interface FormData {
  name: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}
export default function EditModelPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = parseInt(params.id as string);
  const [model, setModel] = useState<Model | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    image_url: '',
    sort_order: 0,
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [associatedProducts, setAssociatedProducts] = useState<Array<{ id: number; name: string; price: number; primary_image?: string }>>([]);
  const [allModels, setAllModels] = useState<Array<{ id: number; name: string }>>([]);
  const [reassignModelFor, setReassignModelFor] = useState<number | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<number | null>(null);
  const [actionModalProductId, setActionModalProductId] = useState<number | null>(null);
  const fetchModel = useCallback(async () => {
    try {
      const [response, productsRes, modelsRes] = await Promise.all([
        fetch(`/api/admin/models/${modelId}`),
        fetch(`/api/admin/models/${modelId}/products`),
        fetch(`/api/models`)
      ]);
      const result = await response.json();
      if (result.success) {
        const modelData = result.data;
        setModel(modelData);
        setFormData({
          name: modelData.name || '',
          description: modelData.description || '',
          image_url: modelData.image_url || '',
          sort_order: modelData.sort_order || 0,
          is_active: modelData.is_active
        });
        setImagePreview(modelData.image_url || null);
      } else {
        setError(result.error || 'Erro ao carregar modelo');
      }
      if (productsRes.ok) {
        const productsJson = await productsRes.json();
        if (productsJson.success) setAssociatedProducts(productsJson.data || []);
      }
      if (modelsRes.ok) {
        const modelsJson = await modelsRes.json();
        if (modelsJson.success) setAllModels(modelsJson.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [modelId]);
  useEffect(() => {
    if (isNaN(modelId)) {
      setError('ID do modelo inválido');
      setLoading(false);
      return;
    }
    fetchModel();
  }, [modelId, fetchModel]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }));
  };
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, image_url: url }));
    setImagePreview(url || null);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nome do modelo é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/models/${modelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        alert('Modelo atualizado com sucesso!');
        router.push(`/admin/modelos/${modelId}`);
      } else {
        alert(result.error || 'Erro ao atualizar modelo');
      }
    } catch (error) {
      console.error('Erro ao atualizar modelo:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Carregando modelo...</p>
        </div>
      </div>
    );
  }
  if (error || !model) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error || 'Modelo não encontrado'}</p>
          <button
            onClick={() => router.push('/admin/modelos')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Voltar para Modelos
          </button>
        </div>
      </div>
    );
  }
  const hasExistingImage = Boolean(imagePreview || formData.image_url)
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/admin/modelos/${modelId}`)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Editar Modelo</h1>
            <p className="text-gray-400">{model.name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/admin/modelos/${modelId}`)}
            className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg hover:text-white hover:bg-dark-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-dark-800/50 rounded-xl border border-dark-700/50 p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Informações Básicas</h3>
              <div>
                <label htmlFor="name" className="block text-gray-400 text-sm font-medium mb-2">
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                  placeholder="Ex: Air Max 95"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-gray-400 text-sm font-medium mb-2">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Descrição do modelo..."
                />
              </div>
              <div>
                <label htmlFor="sort_order" className="block text-gray-400 text-sm font-medium mb-2">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  id="sort_order"
                  name="sort_order"
                  value={formData.sort_order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                  placeholder="0"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Menor número aparece primeiro no carrossel
                </p>
              </div>
              <div>
                <label className="flex items-center justify-between p-3 bg-dark-700/40 border border-dark-600/50 rounded-lg cursor-pointer select-none">
                  <div>
                    <p className="text-white text-sm font-medium">Modelo ativo</p>
                    <p className="text-gray-500 text-xs">Modelos inativos não aparecem no site</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? 'bg-primary-500' : 'bg-dark-500'}`}
                    aria-pressed={formData.is_active}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-5' : 'translate-x-1'}`}
                    />
                  </button>
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Imagem do Modelo</h3>
              <div className="aspect-video bg-dark-700/50 rounded-lg overflow-hidden border border-dark-600/50">
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                      onError={() => setImagePreview(null)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData(prev => ({ ...prev, image_url: '' }));
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-600/80 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <FaImage className="text-gray-400 text-4xl mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Nenhuma imagem selecionada</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-gray-200 text-sm font-semibold">
                    {hasExistingImage ? 'Substituir Imagem' : 'Upload da Imagem'}
                  </label>
                  {hasExistingImage && (
                    <span className="text-[11px] px-2 py-1 rounded-md bg-red-500/15 text-red-300 border border-red-500/30">Imagem atual será substituída</span>
                  )}
                </div>
                <div className={`border-2 border-dashed rounded-xl p-6 ${hasExistingImage ? 'border-red-600/60 bg-red-500/5' : 'border-dark-600/70 bg-dark-700/30'}` }>
                  <input
                    id="model-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        const data = new FormData()
                        data.append('file', file)
                        const res = await fetch(`/api/admin/models/${modelId}/media`, { method: 'POST', body: data })
                        const result = await res.json()
                        if (result.success) {
                          setFormData(prev => ({ ...prev, image_url: result.data.image_url }))
                          setImagePreview(result.data.image_url)
                        } else {
                          alert(result.error || 'Erro ao enviar imagem')
                        }
                      } catch (err) {
                        alert('Erro ao conectar com o servidor para upload')
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasExistingImage ? 'bg-red-500/20 text-red-400' : 'bg-primary-600/20 text-primary-400'}` }>
                      <FaUpload />
                    </div>
                    <div className="text-gray-400 text-sm">
                      {hasExistingImage ? 'Arraste a nova imagem aqui ou' : 'Arraste a imagem aqui ou'}
                    </div>
                    <label
                      htmlFor="model-image-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white cursor-pointer transition-colors text-sm ${hasExistingImage ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'}`}
                    >
                      <FaUpload />
                      {hasExistingImage ? 'Selecionar Nova Imagem' : 'Selecionar Imagem'}
                    </label>
                    <p className="text-gray-500 text-xs">JPG, PNG, WebP • até 20MB</p>
                    {hasExistingImage && (
                      <p className="text-red-300/80 text-xs mt-1">Ao enviar, a imagem atual do modelo será substituída imediatamente.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-dark-700">
            <button
              type="button"
              onClick={() => router.push(`/admin/modelos/${modelId}`)}
              className="px-6 py-2 bg-dark-700 text-gray-400 rounded-lg hover:text-white hover:bg-dark-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="bg-dark-800/50 rounded-xl border border-dark-700/50 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Produtos Associados</h3>
          <span className="px-2.5 py-1 rounded-md text-xs bg-dark-700/60 text-gray-300 border border-dark-600/60">
            {associatedProducts.length} produto{associatedProducts.length === 1 ? '' : 's'}
          </span>
        </div>
        {associatedProducts.length === 0 ? (
          <p className="text-gray-400 text-sm">Nenhum produto associado a este modelo.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {associatedProducts.map((p) => (
              <div key={p.id} className="bg-dark-900/60 border border-dark-700/50 rounded-lg p-3 flex gap-3 items-center relative">
                <button
                  onClick={() => setActionModalProductId(p.id)}
                  className="absolute top-2 right-2 text-gray-300 hover:text-white bg-dark-700/70 hover:bg-dark-600/80 rounded-full p-1.5"
                  title="Editar ações"
                >
                  <FaEdit size={14} />
                </button>
                <div className="w-16 h-16 rounded-md overflow-hidden bg-dark-700/60 flex-shrink-0">
                  {p.primary_image ? (
                    <Image src={p.primary_image} alt={p.name} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <FaImage />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{p.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {reassignModelFor && (
          <div className="mt-4 flex items-center gap-2">
            <select
              value={reassignTargetId ?? ''}
              onChange={(e) => setReassignTargetId(parseInt(e.target.value))}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
            >
              <option value="">Selecionar modelo…</option>
              {allModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <button
              onClick={async () => {
                if (!reassignTargetId) return
                try {
                  const res = await fetch(`/api/admin/products/${reassignModelFor}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model_id: reassignTargetId })
                  })
                  const json = await res.json()
                  if (json.success !== false) {
                    setAssociatedProducts(prev => prev.filter(p => p.id !== reassignModelFor))
                    setReassignModelFor(null)
                    setReassignTargetId(null)
                  } else {
                    alert(json.error || 'Falha ao atualizar modelo do produto')
                  }
                } catch (e) {
                  alert('Erro ao conectar com o servidor')
                }
              }}
              className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm"
            >
              Confirmar
            </button>
            <button
              onClick={() => { setReassignModelFor(null); setReassignTargetId(null) }}
              className="px-3 py-2 bg-dark-700 text-gray-300 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        )}
      </motion.div>
      {actionModalProductId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setActionModalProductId(null)}>
          <div className="bg-dark-800 border border-dark-700 rounded-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-dark-700">
              <h4 className="text-white font-semibold text-base">Ações do Produto</h4>
              <button className="text-gray-400 hover:text-white" onClick={() => setActionModalProductId(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <button
                className="w-full text-left px-4 py-3 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30"
                onClick={async () => {
                  if (!confirm('Remover este produto do modelo?')) return
                  try {
                    const res = await fetch(`/api/admin/products/${actionModalProductId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ model_id: null })
                    })
                    const json = await res.json()
                    if (json.success !== false) {
                      setAssociatedProducts(prev => prev.filter(ap => ap.id !== actionModalProductId))
                      setActionModalProductId(null)
                    } else {
                      alert(json.error || 'Falha ao desassociar')
                    }
                  } catch (e) {
                    alert('Erro ao conectar com o servidor')
                  }
                }}
              >
                Desassociar do Modelo
              </button>
              <div className="rounded-lg border border-dark-700 p-3">
                <label className="block text-sm text-gray-400 mb-2">Mudar para o modelo</label>
                <div className="flex items-center gap-2">
                  <select
                    value={reassignTargetId ?? ''}
                    onChange={(e) => setReassignTargetId(parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm"
                  >
                    <option value="">Selecionar…</option>
                    {allModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  <button
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm disabled:opacity-50"
                    disabled={!reassignTargetId}
                    onClick={async () => {
                      if (!reassignTargetId) return
                      try {
                        const res = await fetch(`/api/admin/products/${actionModalProductId}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ model_id: reassignTargetId })
                        })
                        const json = await res.json()
                        if (json.success !== false) {
                          setAssociatedProducts(prev => prev.filter(p => p.id !== actionModalProductId))
                          setActionModalProductId(null)
                          setReassignTargetId(null)
                        } else {
                          alert(json.error || 'Falha ao atualizar modelo do produto')
                        }
                      } catch (e) {
                        alert('Erro ao conectar com o servidor')
                      }
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-dark-700 flex justify-end">
              <button className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg" onClick={() => setActionModalProductId(null)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
