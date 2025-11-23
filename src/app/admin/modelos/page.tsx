'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSearch, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaPlus,
  FaImage,
  FaBox,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
  FaRedo,
  FaBars,
  FaSpinner,
  FaExclamationTriangle,
  FaUsers,
  FaSortAmountDown,
  FaSortAmountUp
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CreateModelModal from '@/components/admin/CreateModelModal';
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
interface ModelStats {
  total: number;
  active: number;
  inactive: number;
  withProducts: number;
}
export default function AdminModels() {
  const [models, setModels] = useState<Model[]>([]);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalModels, setTotalModels] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const router = useRouter();
  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder
      });
      const response = await fetch(`/api/admin/models?${params}`);
      const result = await response.json();
      if (result.success) {
        setModels(result.data.models);
        setTotalPages(result.data.pagination.pages);
        setTotalModels(result.data.pagination.total);
        const stats: ModelStats = {
          total: result.data.pagination.total,
          active: result.data.models.filter((m: Model) => m.is_active).length,
          inactive: result.data.models.filter((m: Model) => !m.is_active).length,
          withProducts: result.data.models.filter((m: Model) => m.product_count > 0).length
        };
        setStats(stats);
      } else {
        setError(result.error || 'Erro ao carregar modelos');
      }
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, sortBy, sortOrder]);
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      if (width < 768) {
        setViewMode('grid');
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);
  const refreshModels = () => {
    setPage(1);
    fetchModels();
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchModels();
  };
  const handleDelete = async (modelId: number, modelName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o modelo "${modelName}"?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/admin/models/${modelId}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      if (result.success) {
        alert('Modelo excluído com sucesso!');
        fetchModels();
      } else {
        alert(result.error || 'Erro ao excluir modelo');
      }
    } catch (error) {
      console.error('Erro ao excluir modelo:', error);
      alert('Erro ao conectar com o servidor');
    }
  };
  const handleToggleStatus = async (modelId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/models/${modelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_active: !currentStatus
        })
      });
      const result = await response.json();
      if (result.success) {
        fetchModels();
      } else {
        alert(result.error || 'Erro ao alterar status do modelo');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
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
  if (loading && models.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-primary-500 mx-auto mb-4" />
          <p className="text-gray-400">Carregando modelos...</p>
        </div>
      </div>
    );
  }
  if (error && models.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={refreshModels}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-1">Gestão de Modelos</h1>
          <p className="text-gray-400 text-xs md:text-sm">Gerencie todos os modelos da sua loja</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {!isMobile && (
            <div className="flex bg-dark-800/50 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1 ${
                  viewMode === 'table' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FaBars size={12} />
                <span className="hidden md:inline">Tabela</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1 ${
                  viewMode === 'grid' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <FaBox size={12} />
                <span className="hidden md:inline">Cards</span>
              </button>
            </div>
          )}
          <button
            onClick={refreshModels}
            disabled={loading}
            className="px-3 py-2 bg-dark-800/50 text-gray-400 rounded-xl hover:text-white hover:bg-dark-700/50 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <FaRedo className={loading ? 'animate-spin' : ''} size={12} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-300 flex items-center gap-2 text-sm font-medium"
          >
            <FaPlus size={12} />
            <span>Novo Modelo</span>
          </button>
        </div>
      </motion.div>
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        >
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-3 lg:p-4 border-l-4 border-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Total</p>
                <p className="text-lg lg:text-xl font-bold text-white">
                  {stats.total}
                </p>
              </div>
              <div className="bg-primary-500 p-2 rounded-full">
                <FaBox className="text-white" size={14} />
              </div>
            </div>
          </div>
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-3 lg:p-4 border-l-4 border-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Ativos</p>
                <p className="text-lg lg:text-xl font-bold text-white">
                  {stats.active}
                </p>
              </div>
              <div className="bg-primary-500 p-2 rounded-full">
                <FaUsers className="text-white" size={14} />
              </div>
            </div>
          </div>
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-3 lg:p-4 border-l-4 border-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Inativos</p>
                <p className="text-lg lg:text-xl font-bold text-white">
                  {stats.inactive}
                </p>
              </div>
              <div className="bg-primary-500 p-2 rounded-full">
                <FaUsers className="text-white" size={14} />
              </div>
            </div>
          </div>
          <div className="bg-dark-800/50 backdrop-blur-sm border border-dark-700/50 rounded-xl p-3 lg:p-4 border-l-4 border-primary-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">Com Produtos</p>
                <p className="text-lg lg:text-xl font-bold text-white">
                  {stats.withProducts}
                </p>
              </div>
              <div className="bg-primary-500 p-2 rounded-full">
                <FaBox className="text-white" size={14} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-dark-800/50 rounded-xl p-4 border border-dark-700/50"
      >
        {isMobile && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-3 text-white mb-4 bg-dark-700/50 rounded-lg"
          >
            <span className="flex items-center gap-2">
              <FaFilter size={14} />
              Filtros
            </span>
            {showFilters ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        )}
        <div className={`space-y-4 ${isMobile && !showFilters ? 'hidden' : ''}`}>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Buscar por nome ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 text-sm"
            >
              Buscar
            </button>
          </form>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="created_at">Data de Criação</option>
              <option value="name">Nome</option>
              <option value="updated_at">Última Atualização</option>
              <option value="sort_order">Ordem de Exibição</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-white text-sm hover:bg-dark-600/50 transition-colors flex items-center justify-center gap-2"
            >
              {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
              {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSortBy('created_at');
                setSortOrder('desc');
                setPage(1);
              }}
              className="px-3 py-2 bg-dark-700/50 border border-dark-600/50 rounded-lg text-gray-400 text-sm hover:text-white hover:bg-dark-600/50 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {viewMode === 'table' && !isMobile ? (
          <div className="bg-dark-800/50 rounded-xl border border-dark-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Modelo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Produtos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ordem
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {models.map((model, index) => (
                    <motion.tr
                      key={model.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-dark-700/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-10 h-10">
                            {getModelImage(model) ? (
                              <Image
                                src={getModelImage(model)!}
                                alt={model.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-dark-600 rounded-lg flex items-center justify-center">
                                <FaImage className="text-gray-400 text-lg" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{model.name}</p>
                            <p className="text-gray-400 text-xs">{model.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
                          {model.product_count} produto{model.product_count !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleToggleStatus(model.id, model.is_active)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            model.is_active
                              ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
                              : 'bg-red-900/50 text-red-300 hover:bg-red-800/50'
                          }`}
                        >
                          {model.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-300 text-sm">{model.sort_order}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-gray-300 text-sm">
                          {new Date(model.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/admin/modelos/${model.id}`)}
                            className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                            title="Visualizar"
                          >
                            <FaEye size={14} />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/modelos/${model.id}/editar`)}
                            className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                            title="Editar"
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(model.id, model.name)}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Excluir"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {models.map((model, index) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-dark-800/50 rounded-xl border border-dark-700/50 overflow-hidden hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="aspect-video relative bg-dark-700/50">
                  {getModelImage(model) ? (
                    <Image
                      src={getModelImage(model)!}
                      alt={model.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaImage className="text-gray-400 text-3xl" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleStatus(model.id, model.is_active)}
                      className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        model.is_active
                          ? 'bg-green-900/80 text-green-300 hover:bg-green-800/80'
                          : 'bg-red-900/80 text-red-300 hover:bg-red-800/80'
                      }`}
                    >
                      {model.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-white font-medium text-sm mb-1">{model.name}</h3>
                    <p className="text-gray-400 text-xs">{model.slug}</p>
                    {model.description && (
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2">{model.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-500/15 text-primary-300 border border-primary-500/30">
                      {model.product_count} produto{model.product_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-400 text-xs">
                      Ordem: {model.sort_order}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    Criado em {new Date(model.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => router.push(`/admin/modelos/${model.id}`)}
                      className="px-3 py-1.5 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-600/25 transition-colors text-xs flex items-center gap-1"
                    >
                      <FaEye size={12} />
                      Ver
                    </button>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => router.push(`/admin/modelos/${model.id}/editar`)}
                        className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                        title="Editar"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(model.id, model.name)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        {models.length === 0 && !loading && (
          <div className="text-center py-12">
            <FaBox className="text-4xl text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">Nenhum modelo encontrado</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Criar Primeiro Modelo
            </button>
          </div>
        )}
      </motion.div>
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-between"
        >
          <p className="text-gray-400 text-sm">
            Mostrando {models.length} de {totalModels} modelos
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 bg-dark-800/50 text-gray-400 rounded-lg hover:text-white hover:bg-dark-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Anterior
            </button>
            <span className="px-3 py-2 bg-primary-500 text-white rounded-lg text-sm">
              {page}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 bg-dark-800/50 text-gray-400 rounded-lg hover:text-white hover:bg-dark-700/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Próxima
            </button>
          </div>
        </motion.div>
      )}
      <CreateModelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refreshModels}
      />
    </div>
  );
}
