"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  FaUpload, 
  FaTrash, 
  FaEye, 
  FaStar, 
  FaVideo, 
  FaImage, 
  FaSpinner,
  FaCheck,
  FaTimes,
  FaDownload,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute
} from 'react-icons/fa';
import CustomVideoPlayer from '../CustomVideoPlayer';
interface MediaItem {
  id: number;
  url: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  isPrimary?: boolean;
  altText?: string;
  duration?: number;
  thumbnailUrl?: string;
  type: 'image' | 'video';
}
interface MediaManagerProps {
  productId: number;
  onMediaUpdate?: () => void;
}
export default function MediaManager({ productId, onMediaUpdate }: MediaManagerProps) {
  const [images, setImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [altText, setAltText] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}/media`);
      const result = await response.json();
      if (result.success) {
        setImages(result.data.images.map((img: any) => ({
          id: img.id,
          url: img.image_url,
          fileName: img.file_name || 'Nome não disponível',
          fileSize: img.file_size || 0,
          mimeType: img.mime_type || 'image/jpeg',
          isPrimary: Boolean(img.is_primary),
          altText: img.alt_text || img.file_name || 'Imagem do produto',
          type: 'image' as const
        })));
        setVideos(result.data.videos.map((vid: any) => ({
          id: vid.id,
          url: vid.video_url,
          fileName: vid.file_name || 'Nome não disponível',
          fileSize: vid.file_size || 0,
          mimeType: vid.mime_type || 'video/mp4',
          isPrimary: Boolean(vid.is_primary),
          altText: vid.alt_text || vid.file_name || 'Vídeo do produto',
          duration: vid.duration || null,
          thumbnailUrl: vid.thumbnail_url,
          type: 'video' as const
        })));
      } else {
        setError(result.error || 'Erro ao carregar mídia');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  }, [productId]);
  useEffect(() => {
    fetchMedia();
  }, [productId, fetchMedia]);
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      console.log('🔍 Debug upload:', {
        uploadType,
        fileCount: files.length,
        firstFile: files[0]?.name,
        firstFileType: files[0]?.type
      });
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }
      formData.append('type', uploadType);
      formData.append('altText', altText);
      formData.append('isPrimary', isPrimary.toString());
      const response = await fetch(`/api/admin/products/${productId}/media`, {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(`${files.length} arquivo(s) enviado(s) com sucesso!`);
        setAltText('');
        setIsPrimary(false);
        await fetchMedia();
        onMediaUpdate?.();
      } else {
        setError(result.error || 'Erro no upload');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  const handleDelete = async (mediaId: number, type: 'image' | 'video') => {
    if (!confirm('Tem certeza que deseja remover este arquivo?')) return;
    try {
      const response = await fetch(
        `/api/admin/products/${productId}/media?mediaId=${mediaId}&type=${type}`,
        { method: 'DELETE' }
      );
      const result = await response.json();
      if (result.success) {
        setSuccess('Arquivo removido com sucesso!');
        await fetchMedia();
        onMediaUpdate?.();
      } else {
        setError(result.error || 'Erro ao remover arquivo');
      }
    } catch (error) {
      setError('Erro ao conectar com o servidor');
    }
  };
  const handleTogglePrimary = async (mediaId: number, type: 'image' | 'video') => {
    try {
      const response = await fetch(`/api/admin/products/${productId}/media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, type, isPrimary: true })
      });
      if (response.ok) {
        await fetchMedia();
        onMediaUpdate?.();
      }
    } catch (error) {
      setError('Erro ao atualizar arquivo primário');
    }
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const MediaCard = ({ item }: { item: MediaItem }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group bg-dark-800/60 border-2 rounded-lg sm:rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/20 ${
        item.isPrimary 
          ? 'border-primary-500/60 shadow-lg shadow-primary-500/20' 
          : 'border-dark-700/60 hover:border-primary-500/40'
      }`}
    >
      <div className="relative aspect-square bg-dark-900 overflow-hidden">
        {item.type === 'image' ? (
          <>
            <Image
              src={item.url}
              alt={item.altText || item.fileName}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={(e) => {
              if (!e.currentTarget.dataset.errorLogged) {
                console.warn('Imagem não pôde ser carregada:', item.url);
                e.currentTarget.dataset.errorLogged = 'true';
              }
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
            onLoad={(e) => {
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.style.display = 'none';
              }
            }}
            />
            <div className="absolute inset-0 bg-dark-800 flex items-center justify-center" style={{ display: 'none' }}>
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-gray-600/30 rounded-lg flex items-center justify-center mb-3 mx-auto">
                  <FaImage className="text-gray-400" size={24} />
                </div>
                <p className="text-gray-400 text-xs font-medium">Imagem não encontrada</p>
                <p className="text-gray-500 text-xs mt-1">Verifique o arquivo</p>
              </div>
            </div>
          </>
        ) : (
          <div className="relative w-full h-full">
            <CustomVideoPlayer
              src={item.url}
              thumbnail={item.thumbnailUrl}
              alt={item.altText || ''}
              className="w-full h-full"
            />
          </div>
        )}
        <div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 flex items-start justify-between pointer-events-none">
          <div className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 sm:gap-1.5 backdrop-blur-sm pointer-events-auto ${
            item.type === 'image' ? 'bg-blue-500/90 text-white shadow-lg' : 'bg-red-500/90 text-white shadow-lg'
          }`}>
            {item.type === 'image' ? <FaImage size={10} className="sm:w-3 sm:h-3" /> : <FaVideo size={10} className="sm:w-3 sm:h-3" />}
            <span className="font-medium hidden sm:inline">{item.type === 'image' ? 'Imagem' : 'Vídeo'}</span>
          </div>
          {item.isPrimary && (
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 sm:gap-1.5 shadow-lg backdrop-blur-sm pointer-events-auto">
              <FaStar size={10} className="sm:w-3 sm:h-3" />
              <span className="font-medium hidden sm:inline">Principal</span>
            </div>
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 sm:from-black/80 via-black/20 to-transparent opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-2 sm:pb-4">
          <div className="flex items-center gap-2 sm:gap-2">
            <button
              onClick={() => {
                setSelectedMedia(item);
                setShowPreview(true);
              }}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full transition-all duration-200 hover:scale-110 touch-manipulation flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10"
              title="Visualizar"
            >
              <FaEye size={14} className="sm:w-4 sm:h-4" />
            </button>
            {!item.isPrimary && (
              <button
                onClick={() => handleTogglePrimary(item.id, item.type)}
                className="bg-yellow-500/80 hover:bg-yellow-500 backdrop-blur-sm text-white rounded-full transition-all duration-200 hover:scale-110 touch-manipulation flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10"
                title="Definir como principal"
              >
                <FaStar size={14} className="sm:w-4 sm:h-4" />
              </button>
            )}
            <button
              onClick={() => handleDelete(item.id, item.type)}
              className="bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white rounded-full transition-all duration-200 hover:scale-110 touch-manipulation flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10"
              title="Remover"
            >
              <FaTrash size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-3 sm:p-4 bg-dark-800/80 backdrop-blur-sm">
        <h4 className="text-white font-medium text-xs sm:text-sm truncate mb-2" title={item.fileName}>
          {item.fileName}
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-xs text-gray-400 mb-2">
          <span className="bg-dark-700/50 px-2 py-1 rounded-md text-xs">
            {item.fileSize ? formatFileSize(item.fileSize) : 'N/A'}
          </span>
          {item.type === 'video' && item.duration && (
            <span className="bg-dark-700/50 px-2 py-1 rounded-md text-xs">
              {formatDuration(item.duration)}
            </span>
          )}
        </div>
        {item.altText && item.altText !== item.fileName && (
          <p className="text-xs text-gray-300 truncate" title={item.altText}>
            {item.altText}
          </p>
        )}
      </div>
    </motion.div>
  );
  const PreviewModal = () => (
    <AnimatePresence>
      {showPreview && selectedMedia && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-dark-800 rounded-xl overflow-hidden w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 sm:p-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate pr-4">{selectedMedia.fileName}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0 p-1 touch-manipulation"
              >
                <FaTimes size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <div className="p-2 sm:p-4 max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-80px)] overflow-auto">
              {selectedMedia.type === 'image' ? (
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.altText || selectedMedia.fileName}
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg max-h-[70vh] object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 90vw, 80vw"
                />
              ) : (
                <CustomVideoPlayer
                  src={selectedMedia.url}
                  thumbnail={selectedMedia.thumbnailUrl}
                  alt={selectedMedia.altText || ''}
                  className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-dark-700 border-t-primary-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <FaImage className="text-primary-500 animate-pulse" size={20} />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-white font-medium mb-2 text-lg">Carregando mídia...</h3>
          <p className="text-gray-400 text-sm">Aguarde enquanto buscamos as imagens e vídeos do produto</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-lg flex items-center gap-3"
        >
          <FaTimes size={16} className="text-red-400" />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 text-green-300 p-4 rounded-lg flex items-center gap-3"
        >
          <FaCheck size={16} className="text-green-400" />
          <span className="font-medium">{success}</span>
        </motion.div>
      )}
      <div className="bg-gradient-to-br from-dark-800/80 to-dark-900/80 border border-dark-700/60 rounded-xl p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <FaUpload className="text-primary-400" size={20} />
          </div>
          <h3 className="text-white font-semibold text-lg">Upload de Mídia</h3>
        </div>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <label className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all cursor-pointer ${
              uploadType === 'image' 
                ? 'border-primary-500 bg-primary-500/10 text-primary-300' 
                : 'border-dark-700 bg-dark-800/50 text-gray-300 hover:border-dark-600'
            }`}>
              <input
                type="radio"
                name="mediaType"
                value="image"
                checked={uploadType === 'image'}
                onChange={(e) => {
                  console.log('🔄 Mudando para aba:', e.target.value);
                  setUploadType(e.target.value as 'image');
                }}
                className="sr-only"
              />
              <FaImage size={14} className="sm:w-4 sm:h-4" />
              <span className="font-medium text-sm sm:text-base">Imagens</span>
            </label>
            <label className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 transition-all cursor-pointer ${
              uploadType === 'video' 
                ? 'border-primary-500 bg-primary-500/10 text-primary-300' 
                : 'border-dark-700 bg-dark-800/50 text-gray-300 hover:border-dark-600'
            }`}>
              <input
                type="radio"
                name="mediaType"
                value="video"
                checked={uploadType === 'video'}
                onChange={(e) => {
                  console.log('🔄 Mudando para aba:', e.target.value);
                  setUploadType(e.target.value as 'video');
                }}
                className="sr-only"
              />
              <FaVideo size={14} className="sm:w-4 sm:h-4" />
              <span className="font-medium text-sm sm:text-base">Vídeos</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-medium">Texto alternativo</label>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descrição da imagem/vídeo"
                className="w-full bg-dark-900/50 border border-dark-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-colors"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 text-gray-300 cursor-pointer group">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  isPrimary 
                    ? 'bg-primary-500 border-primary-500' 
                    : 'border-dark-600 group-hover:border-dark-500'
                }`}>
                  {isPrimary && <FaCheck size={12} className="text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="sr-only"
                />
                <span className="font-medium">Definir como principal</span>
              </label>
            </div>
          </div>
          <div className="border-2 border-dashed border-dark-700 rounded-xl p-4 sm:p-6 lg:p-8 text-center hover:border-primary-500/50 transition-all duration-300 bg-dark-900/30 hidden sm:block">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={uploadType === 'image' ? 'image/*' : 'video/*'}
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 bg-primary-500/10 rounded-full">
                {uploadType === 'image' ? (
                  <FaImage className="text-primary-400" size={24} />
                ) : (
                  <FaVideo className="text-primary-400" size={24} />
                )}
              </div>
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-lg disabled:opacity-60 transition-all duration-200 font-medium shadow-lg hover:shadow-primary-500/25 text-sm sm:text-base"
                >
                  {uploading ? (
                  <>
                      <FaSpinner className="animate-spin sm:w-4 sm:h-4" size={14} />
                      <span className="hidden xs:inline">Enviando...</span>
                      <span className="xs:hidden">Enviando</span>
                    </>
                  ) : (
                    <>
                      <FaUpload size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Selecionar {uploadType === 'image' ? 'Imagens' : 'Vídeos'}</span>
                      <span className="xs:hidden">Selecionar</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-gray-400 text-xs sm:text-sm max-w-md">
                <p className="mb-1">
                  {uploadType === 'image' 
                    ? 'Formatos suportados: JPG, PNG, WebP, AVIF'
                    : 'Formatos suportados: MP4, WebM, OGG, AVI, MOV'
                  }
                </p>
                <p className="text-gray-500">Tamanho máximo: 50MB por arquivo</p>
              </div>
            </div>
          </div>
          <div className="border-2 border-dashed border-dark-700 rounded-xl p-4 text-center hover:border-primary-500/50 transition-all duration-300 bg-dark-900/30 sm:hidden">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={uploadType === 'image' ? 'image/*' : 'video/*'}
              onChange={(e) => handleUpload(e.target.files)}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-primary-500/10 rounded-full">
                {uploadType === 'image' ? (
                  <FaImage className="text-primary-400" size={20} />
                ) : (
                  <FaVideo className="text-primary-400" size={20} />
                )}
              </div>
              <div className="text-gray-400 text-xs text-center">
                <p className="mb-1">
                  {uploadType === 'image' 
                    ? 'Formatos: JPG, PNG, WebP, AVIF'
                    : 'Formatos: MP4, WebM, OGG, AVI, MOV'
                  }
                </p>
                <p className="text-gray-500">Máx: 50MB por arquivo</p>
              </div>
              {uploading && (
                <div className="w-full">
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-primary-400 text-xs mt-1">{uploadProgress}% Concluído</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {images.length > 0 && (
        <div className="bg-gradient-to-br from-dark-800/60 to-dark-900/60 border border-dark-700/60 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FaImage className="text-blue-400" size={18} />
              </div>
              <h3 className="text-white font-semibold text-base sm:text-lg">Imagens do Produto</h3>
            </div>
            <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium w-fit">
              {images.length} {images.length === 1 ? 'imagem' : 'imagens'}
            </div>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
            <AnimatePresence>
              {images.map((image) => (
                <MediaCard key={image.id} item={image} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      {videos.length > 0 && (
        <div className="bg-gradient-to-br from-dark-800/60 to-dark-900/60 border border-dark-700/60 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <FaVideo className="text-red-400" size={18} />
              </div>
              <h3 className="text-white font-semibold text-base sm:text-lg">Vídeos do Produto</h3>
            </div>
            <div className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm font-medium w-fit">
              {videos.length} {videos.length === 1 ? 'vídeo' : 'vídeos'}
            </div>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4">
            <AnimatePresence>
              {videos.map((video) => (
                <MediaCard key={video.id} item={video} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
      {images.length === 0 && videos.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-dark-800/60 border border-dark-700/60 rounded-xl p-6 sm:p-8 max-w-md mx-auto">
            <div className="p-4 bg-gray-600/20 rounded-full w-fit mx-auto mb-6">
              <FaImage className="text-gray-400" size={32} />
            </div>
            <h3 className="text-white font-medium mb-3 text-lg">Nenhuma mídia encontrada</h3>
            <p className="text-gray-400 mb-6 text-sm">Este produto ainda não possui imagens ou vídeos.</p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center gap-2 justify-center">
                <FaUpload size={12} className="text-gray-600" />
                <span>Faça upload de imagens para mostrar o produto</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <FaVideo size={12} className="text-gray-600" />
                <span>Adicione vídeos para demonstrações</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <FaStar size={12} className="text-gray-600" />
                <span>Defina uma imagem principal</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <PreviewModal />
      <div className="fixed bottom-4 right-4 sm:hidden z-50">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-14 h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-lg hover:shadow-xl disabled:opacity-60 transition-all duration-200 flex items-center justify-center touch-manipulation"
          title="Adicionar Mídia"
        >
          {uploading ? (
            <FaSpinner className="animate-spin" size={20} />
          ) : (
            <FaUpload size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
