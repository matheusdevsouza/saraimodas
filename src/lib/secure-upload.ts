import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { extname, basename } from 'path';
import { logSecurityEvent, SecurityEventType, SecurityLevel } from './security-logger';
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
];
export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024,
  document: 10 * 1024 * 1024,
  avatar: 2 * 1024 * 1024,
};
export const MAX_IMAGE_DIMENSIONS = {
  width: 4096,
  height: 4096,
};
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedFilename: string;
  fileType: string;
  fileSize: number;
  dimensions?: { width: number; height: number };
}
export interface UploadConfig {
  allowedTypes: string[];
  maxSize: number;
  maxDimensions?: { width: number; height: number };
  requireDimensions?: boolean;
  allowSvg?: boolean;
  sanitizeFilename?: boolean;
}
export const UPLOAD_CONFIGS = {
  productImage: {
    allowedTypes: ALLOWED_IMAGE_TYPES.filter(type => type !== 'image/svg+xml'),
    maxSize: MAX_FILE_SIZES.image,
    maxDimensions: MAX_IMAGE_DIMENSIONS,
    requireDimensions: true,
    sanitizeFilename: true,
  },
  avatar: {
    allowedTypes: ALLOWED_IMAGE_TYPES.filter(type => type !== 'image/svg+xml'),
    maxSize: MAX_FILE_SIZES.avatar,
    maxDimensions: { width: 1024, height: 1024 },
    requireDimensions: true,
    sanitizeFilename: true,
  },
  document: {
    allowedTypes: ALLOWED_DOCUMENT_TYPES,
    maxSize: MAX_FILE_SIZES.document,
    sanitizeFilename: true,
  },
  banner: {
    allowedTypes: ALLOWED_IMAGE_TYPES.filter(type => type !== 'image/svg+xml'),
    maxSize: MAX_FILE_SIZES.image,
    maxDimensions: { width: 1920, height: 1080 },
    requireDimensions: true,
    sanitizeFilename: true,
  },
};
export async function validateFile(
  file: File,
  config: UploadConfig,
  request: NextRequest
): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    sanitizedFilename: '',
    fileType: file.type,
    fileSize: file.size,
  };
  if (!config.allowedTypes.includes(file.type)) {
    result.isValid = false;
    result.errors.push(`Tipo de arquivo não permitido: ${file.type}`);
    logSecurityEvent(
      SecurityEventType.FILE_UPLOAD_REJECTED,
      SecurityLevel.WARNING,
      request,
      {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        reason: 'Invalid file type'
      }
    );
  }
  if (file.size > config.maxSize) {
    result.isValid = false;
    result.errors.push(`Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máximo: ${(config.maxSize / 1024 / 1024).toFixed(2)}MB)`);
    logSecurityEvent(
      SecurityEventType.FILE_UPLOAD_REJECTED,
      SecurityLevel.WARNING,
      request,
      {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        maxSize: config.maxSize,
        reason: 'File too large'
      }
    );
  }
  if (config.requireDimensions && file.type.startsWith('image/')) {
    try {
      const dimensions = await getImageDimensions(file);
      result.dimensions = dimensions;
      if (config.maxDimensions) {
        if (dimensions.width > config.maxDimensions.width || dimensions.height > config.maxDimensions.height) {
          result.isValid = false;
          result.errors.push(`Imagem muito grande: ${dimensions.width}x${dimensions.height} (máximo: ${config.maxDimensions.width}x${config.maxDimensions.height})`);
        }
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push('Não foi possível verificar as dimensões da imagem');
    }
  }
  if (file.type === 'image/svg+xml' && !config.allowSvg) {
    result.isValid = false;
    result.errors.push('Arquivos SVG não são permitidos por questões de segurança');
    logSecurityEvent(
      SecurityEventType.FILE_UPLOAD_REJECTED,
      SecurityLevel.WARNING,
      request,
      {
        filename: file.name,
        fileType: file.type,
        reason: 'SVG not allowed'
      }
    );
  }
  if (config.sanitizeFilename) {
    result.sanitizedFilename = sanitizeFilename(file.name);
  } else {
    result.sanitizedFilename = file.name;
  }
  const extension = extname(file.name).toLowerCase();
  const allowedExtensions = config.allowedTypes.map(type => {
    if (type === 'image/jpeg') return '.jpg';
    if (type === 'image/jpg') return '.jpg';
    if (type === 'image/png') return '.png';
    if (type === 'image/webp') return '.webp';
    if (type === 'image/gif') return '.gif';
    if (type === 'image/svg+xml') return '.svg';
    if (type === 'application/pdf') return '.pdf';
    if (type === 'application/msword') return '.doc';
    if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '.docx';
    if (type === 'text/plain') return '.txt';
    return '';
  }).filter(Boolean);
  if (!allowedExtensions.includes(extension as any)) {
    result.isValid = false;
    result.errors.push(`Extensão de arquivo não permitida: ${extension}`);
  }
  if (result.isValid) {
    const isValidContent = await validateFileContent(file);
    if (!isValidContent) {
      result.isValid = false;
      result.errors.push('Conteúdo do arquivo não corresponde ao tipo declarado');
      logSecurityEvent(
        SecurityEventType.FILE_UPLOAD_REJECTED,
        SecurityLevel.WARNING,
        request,
        {
          filename: file.name,
          fileType: file.type,
          reason: 'Content mismatch'
        }
      );
    }
  }
  if (result.isValid) {
    logSecurityEvent(
      SecurityEventType.FILE_UPLOAD_SUCCESS,
      SecurityLevel.INFO,
      request,
      {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        dimensions: result.dimensions
      }
    );
  }
  return result;
}
async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}
export async function validateFileContent(file: File): Promise<boolean> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);
  if (file.type.startsWith('image/')) {
    return validateImageMagicBytes(uint8Array, file.type);
  }
  if (file.type === 'application/pdf') {
    return uint8Array[0] === 0x25 && uint8Array[1] === 0x50 && uint8Array[2] === 0x44 && uint8Array[3] === 0x46;
  }
  if (file.type.includes('word')) {
    return (
      (uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF && uint8Array[2] === 0x11 && uint8Array[3] === 0xE0) || 
      (uint8Array[0] === 0x50 && uint8Array[1] === 0x4B && uint8Array[2] === 0x03 && uint8Array[3] === 0x04)   
    );
  }
  if (file.type === 'text/plain') {
    return !uint8Array.includes(0);
  }
  return true;
}
function validateImageMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  switch (mimeType) {
    case 'image/jpeg':
    case 'image/jpg':
      return bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
    case 'image/png':
      return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
    case 'image/webp':
      return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
             bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
    case 'image/gif':
      return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
    case 'image/svg+xml':
      const text = new TextDecoder().decode(bytes.slice(0, 100));
      return text.trim().startsWith('<?xml') || text.trim().startsWith('<svg');
    default:
      return false;
  }
}
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}
export function generateUniqueFilename(originalName: string, userId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = extname(originalName);
  const baseName = basename(originalName, extension);
  const sanitizedBaseName = sanitizeFilename(baseName);
  let filename = `${sanitizedBaseName}_${timestamp}_${random}${extension}`;
  if (userId) {
    filename = `user_${userId}_${filename}`;
  }
  return filename;
}
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hash = createHash('sha256');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}
export async function isDuplicateFile(file: File, existingHashes: string[]): Promise<boolean> {
  const fileHash = await calculateFileHash(file);
  return existingHashes.includes(fileHash);
}
export async function processSecureUpload(
  file: File,
  config: UploadConfig,
  request: NextRequest,
  userId?: string
): Promise<{
  success: boolean;
  filename?: string;
  filePath?: string;
  errors?: string[];
  warnings?: string[];
}> {
  try {
    const validation = await validateFile(file, config, request);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }
    const uniqueFilename = generateUniqueFilename(validation.sanitizedFilename, userId);
    const fileHash = await calculateFileHash(file);
    return {
      success: true,
      filename: uniqueFilename,
      filePath: `/uploads/${uniqueFilename}`,
      warnings: validation.warnings,
    };
  } catch (error) {
    logSecurityEvent(
      SecurityEventType.FILE_UPLOAD_FAILED,
      SecurityLevel.ERROR,
      request,
      {
        filename: file.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    );
    return {
      success: false,
      errors: ['Erro interno ao processar upload'],
    };
  }
}
export function cleanupTempFiles(): void {
}
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupTempFiles, 60 * 60 * 1000);
}
