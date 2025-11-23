'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaImage, 
  FaBox, 
  FaSpinner, 
  FaExclamationTriangle, 
  FaPlus, 
  FaSearch, 
  FaCheck, 
  FaTimes 
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
interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  brand_name: string;
  primary_image?: string;
}
interface AvailableProduct extends Product {
  current_model_name?: string;
  model_id?: number;
}
export default function ModelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const modelId = parseInt(params.id as string);
  const [model, setModel] = useState<Model | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddProducts, setShowAddProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [addingProducts, setAddingProducts] = useState(false);
  const fetchModelDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/models/${modelId}`);
      const result = await response.json();
      if (result.success) {
        setModel(result.data);
      } else {
        setError(result.error || 'Erro ao carregar modelo');
      }
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      setError('Erro ao conectar com o servidor');
    }
  }, [modelId]);
  const fetchModelProducts = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/models/${modelId}/products`);
      const result = await response.json();
      if (result.success) {
        setProducts(result.data);
      } else {
        console.error('Erro ao carregar produtos do modelo:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos do modelo:', error);
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
    fetchModelDetails();
    fetchModelProducts();
  }, [modelId, fetchModelDetails, fetchModelProducts]);
  const fetchAvailableProducts = async () => {
    try {
      const params = new URLSearchParams({
        excludeModelId: modelId.toString(),
        search: searchTerm,
        limit: '50'
      });
      const response = await fetch(`/api/admin/models/available-products?${params}`);
      const result = await response.json();
      if (result.success) {
        setAvailableProducts(result.data.products);
      } else {
        console.error('Erro ao carregar produtos disponíveis:', result.error);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos disponíveis:', error);
    }
  };
  const handleAddProducts = async () => {
    if (selectedProducts.length === 0) return;
    setAddingProducts(true);
    try {
      const response = await fetch(`/api/admin/models/${modelId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productIds: selectedProducts
        })
      });
      const result = await response.json();
      if (result.success) {
        alert(`${selectedProducts.length} produto(s) adicionado(s) com sucesso!`);
        setSelectedProducts([]);
        setShowAddProducts(false);
        fetchModelProducts();
        fetchModelDetails(); 
      } else {
        alert(result.error || 'Erro ao adicionar produtos');
      }
    } catch (error) {
      console.error('Erro ao adicionar produtos:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setAddingProducts(false);
    }
  };
  const handleRemoveProduct = async (productId: number, productName: string) => {
    if (!confirm(`Tem certeza que deseja remover "${productName}" deste modelo?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/models/${modelId}/products`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productIds: [productId]
        })
      });
      const result = await response.json();
      if (result.success) {
        alert('Produto removido com sucesso!');
        fetchModelProducts();
        fetchModelDetails(); 
      } else {
        alert(result.error || 'Erro ao remover produto');
      }
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      alert('Erro ao conectar com o servidor');
    }
  };
  const handleDeleteModel = async () => {
    if (!model) return;
    if (!confirm(`Tem certeza que deseja excluir o modelo "${model.name}"?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/models/${modelId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        alert('Modelo excluído com sucesso!');
        router.push('/admin/modelos');
      } else {
        alert(result.error || 'Erro ao excluir modelo');
      }
    } catch (error) {
      console.error('Erro ao excluir modelo:', error);
      alert('Erro ao conectar com o servidor');
    }
  };
  const getModelImage = (model: Model) => {
    if (model.image_url) {
      if (model.image_url.startsWith('/api/models/images/')) {
        return model.image_url;
      }
      return model.image_url;
    }
    return null;
  };
  const getProductImage = (product: Product | AvailableProduct) => {
    if (product.primary_image) {
      return product.primary_image;
    }
    return null;
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
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
            onClick={() => router.push('/admin/modelos')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{model.name}</h1>
            <p className="text-gray-400">Detalhes do modelo</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/admin/modelos/${modelId}/editar`)}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
          >
            <FaEdit size={14} />
            Editar
          </button>
          <button
            onClick={handleDeleteModel}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaTrash size={14} />
            Excluir
          </button>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-dark-800/50 rounded-xl border border-dark-700/50 p-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="aspect-video bg-dark-700/50 rounded-lg overflow-hidden">
              {getModelImage(model) ? (
                <Image
                  src={getModelImage(model)!}
                  alt={model.name}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FaImage className="text-gray-400 text-4xl" />
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Nome</label>
                <p className="text-white font-medium">{model.name}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Slug</label>
                <p className="text-gray-300">{model.slug}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  model.is_active
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-red-900/50 text-red-300'
                }`}>
                  {model.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Ordem de Exibição</label>
                <p className="text-gray-300">{model.sort_order}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Produtos Associados</label>
                <p className="text-white font-medium">{model.product_count}</p>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Criado em</label>
                <p className="text-gray-300">
                  {new Date(model.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            {model.description && (
              <div className="mt-4">
                <label className="block text-gray-400 text-sm mb-1">Descrição</label>
                <p className="text-gray-300">{model.description}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-dark-800/50 rounded-xl border border-dark-700/50 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Produtos ({products.length})
          </h2>
          <button
            onClick={() => {
              setShowAddProducts(true);
              fetchAvailableProducts();
            }}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
          >
            <FaPlus size={14} />
            Adicionar Produtos
          </button>
        </div>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-dark-700/50 rounded-lg border border-dark-600/50 overflow-hidden"
              >
                <div className="aspect-video bg-dark-600/50 relative">
                  {getProductImage(product) ? (
                    <Image
                      src={getProductImage(product)!}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBox className="text-gray-400 text-2xl" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium text-sm mb-1">{product.name}</h3>
                  <p className="text-gray-400 text-xs mb-2">{product.brand_name}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-primary-400 font-bold text-sm">
                      {formatPrice(product.price)}
                    </span>
                    <span className="text-gray-400 text-xs">
                      Estoque: {product.stock_quantity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      product.is_active
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}>
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                    <button
                      onClick={() => handleRemoveProduct(product.id, product.name)}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                      title="Remover do modelo"
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FaBox className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Nenhum produto associado a este modelo</p>
            <button
              onClick={() => {
                setShowAddProducts(true);
                fetchAvailableProducts();
              }}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Adicionar Produtos
            </button>
          </div>
        )}
      </motion.div>
      {showAddProducts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-4xl max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Adicionar Produtos ao Modelo</h3>
                <button
                  onClick={() => {
                    setShowAddProducts(false);
                    setSelectedProducts([]);
                    setSearchTerm('');
                  }}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="mt-4">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setTimeout(() => fetchAvailableProducts(), 300);
                    }}
                    className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-96">
              {availableProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`bg-dark-700/50 rounded-lg border p-4 cursor-pointer transition-all ${
                        selectedProducts.includes(product.id)
                          ? 'border-primary-500 bg-primary-900/20'
                          : 'border-dark-600/50 hover:border-dark-500'
                      }`}
                      onClick={() => {
                        setSelectedProducts(prev => 
                          prev.includes(product.id)
                            ? prev.filter(id => id !== product.id)
                            : [...prev, product.id]
                        );
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            selectedProducts.includes(product.id)
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-400'
                          }`}>
                            {selectedProducts.includes(product.id) && (
                              <FaCheck className="text-white text-xs" />
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 w-12 h-12">
                          {getProductImage(product) ? (
                            <Image
                              src={getProductImage(product)!}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-dark-600 rounded flex items-center justify-center">
                              <FaBox className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{product.name}</p>
                          <p className="text-gray-400 text-xs">{product.brand_name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-primary-400 font-bold text-sm">
                              {formatPrice(product.price)}
                            </span>
                            {product.current_model_name && (
                              <span className="text-yellow-400 text-xs">
                                Modelo: {product.current_model_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaBox className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Nenhum produto disponível</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-dark-700">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  {selectedProducts.length} produto(s) selecionado(s)
                </p>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowAddProducts(false);
                      setSelectedProducts([]);
                      setSearchTerm('');
                    }}
                    className="px-4 py-2 bg-dark-700 text-gray-400 rounded-lg hover:text-white hover:bg-dark-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddProducts}
                    disabled={selectedProducts.length === 0 || addingProducts}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {addingProducts && <FaSpinner className="animate-spin" />}
                    Adicionar ({selectedProducts.length})
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
