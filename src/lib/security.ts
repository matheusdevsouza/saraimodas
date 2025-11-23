import crypto from 'crypto';
import { encrypt as secureEncrypt, decrypt as secureDecrypt } from './encryption';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
function legacyDecrypt(text: string): string {
  if (!text) return '';
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encryptedText = textParts.join(':');
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Erro ao descriptografar (Legacy):', error);
    return '';
  }
}
export function encrypt(text: string): string {
  if (!text) return '';
  return secureEncrypt(text);
}
export function decrypt(text: string): string {
  if (!text) return '';
  if (text.split(':').length === 4) {
    try {
      return secureDecrypt(text);
    } catch (error) {
      console.warn('Falha ao descriptografar GCM, tentando método legado:', error);
    }
  }
  return legacyDecrypt(text);
}
export function maskSensitiveData(data: string, type: 'cpf' | 'email' | 'phone'): string {
  if (!data) return '';
  switch (type) {
    case 'cpf':
      if (data.length === 11) {
        return `${data.substring(0, 3)}.***.***-${data.substring(9)}`;
      }
      return data;
    case 'email':
      const [local, domain] = data.split('@');
      if (local && domain) {
        const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(1, local.length - 1));
        const [domainName, tld] = domain.split('.');
        const maskedDomain = domainName.charAt(0) + '*'.repeat(Math.max(1, domainName.length - 1));
        return `${maskedLocal}@${maskedDomain}.${tld}`;
      }
      return data;
    case 'phone':
      if (data.length >= 10) {
        return data.substring(0, 5) + '*'.repeat(Math.max(1, data.length - 8)) + data.substring(data.length - 4);
      }
      return data;
    default:
      return data;
  }
}
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/['"]/g, '')
    .replace(/[;]/g, '')
    .replace(/[--]/g, '')
    .trim();
}
export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false;
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
  return true;
}
export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length === 11) {
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cpf;
}
export function formatAddress(addressString: string): {
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  shipping_cost: number;
} | null {
  if (!addressString) return null;
  try {
    const address = typeof addressString === 'string' ? JSON.parse(addressString) : addressString;
    return {
      street: address.street || '',
      number: address.number || '',
      complement: address.complement || '',
      neighborhood: address.neighborhood || '',
      city: address.city || '',
      state: address.state || '',
      zipcode: address.zipcode || '',
      shipping_cost: address.shipping_cost || 0
    };
  } catch (error) {
    console.error('Erro ao formatar endereço:', error);
    return null;
  }
}
export function generateAuditHash(data: string): string {
  return crypto.createHash('sha256').update(data + Date.now()).digest('hex');
}
export function hasPermissionToViewSensitiveData(user: any): boolean {
  return user && user.isAdmin === true;
}
export function encryptOrderData(orderData: any): any {
  if (!orderData || typeof orderData !== 'object') {
    return orderData;
  }
  const sensitiveFields = [
    'customer_name', 'customer_email', 'customer_phone', 'customer_cpf',
    'billing_address', 'shipping_address', 'payment_method'
  ];
  const encrypted = { ...orderData };
  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  return encrypted;
}
export function decryptOrderData(orderData: any): any {
  if (!orderData || typeof orderData !== 'object') {
    return orderData;
  }
  const sensitiveFields = [
    'customer_name', 'customer_email', 'customer_phone', 'customer_cpf',
    'billing_address', 'shipping_address', 'payment_method'
  ];
  const decrypted = { ...orderData };
  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.warn(`Failed to decrypt order field ${field}:`, error);
      }
    }
  }
  return decrypted;
}
