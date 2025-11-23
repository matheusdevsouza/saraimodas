'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaTimes, 
  FaSave, 
  FaSpinner, 
  FaImage,
  FaUpload
} from 'react-icons/fa';
import Image from 'next/image';
interface CreateModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
interface FormData {
  name: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}
export default function CreateModelModal({ isOpen, onClose, onSuccess }: CreateModelModalProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    image_url: '',
    sort_order: 0,
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (result.success) {
        alert('Modelo criado com sucesso!');
        handleClose();
        onSuccess();
      } else {
        alert(result.error || 'Erro ao criar modelo');
      }
    } catch (error) {
      console.error('Erro ao criar modelo:', error);
      alert('Erro ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      image_url: '',
      sort_order: 0,
      is_active: true
    });
    setImagePreview(null);
    onClose();
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Criar Novo Modelo</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
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
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <span className="text-gray-400 text-sm">Modelo ativo</span>
                  </label>
                  <p className="text-gray-500 text-xs mt-1">
                    Modelos inativos não aparecem no site
                  </p>
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
                  <label className="block text-gray-400 text-sm font-medium">Upload da Imagem</label>
                  <div className="border-2 border-dashed border-dark-600/70 rounded-xl p-6 bg-dark-700/30">
                    <input
                      id="create-model-image"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const localUrl = URL.createObjectURL(file)
                        setImagePreview(localUrl)
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                      <div className="w-12 h-12 rounded-full bg-primary-600/20 text-primary-400 flex items-center justify-center">
                        <FaUpload />
                      </div>
                      <div className="text-gray-400 text-sm">Arraste a imagem aqui ou</div>
                      <label
                        htmlFor="create-model-image"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white cursor-pointer hover:bg-primary-700 transition-colors text-sm"
                      >
                        <FaUpload />
                        Selecionar Imagem
                      </label>
                      <p className="text-gray-500 text-xs">JPG, PNG, WebP • até 20MB</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="image_url" className="block text-gray-400 text-sm font-medium mb-2">
                    URL da Imagem (opcional)
                  </label>
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleImageUrlChange}
                    className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="p-6 border-t border-dark-700">
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 bg-dark-700 text-gray-400 rounded-lg hover:text-white hover:bg-dark-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              {saving ? 'Criando...' : 'Criar Modelo'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
