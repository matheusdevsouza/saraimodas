import { z } from 'zod';
import { logSecurityEvent, SecurityEventType, SecurityLevel } from './security-logger';

const MAX_STRING_LENGTH = 1000;
const MAX_ARRAY_LENGTH = 100;
const MAX_OBJECT_DEPTH = 5;
const FORBIDDEN_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
  /eval\s*\(/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
  /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  /union\s+select/gi,
  /drop\s+table/gi,
  /insert\s+into/gi,
  /update\s+set/gi,
  /delete\s+from/gi,
  /exec\s*\(/gi,
  /system\s*\(/gi,
  /shell_exec\s*\(/gi,
  /passthru\s*\(/gi,
  /`.*`/g,
  /\$\(.*\)/g,
  /\.\.\//g,
  /\.\.\\/g,
];

export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input;
  
  sanitized = sanitized
    .replace(/[<>]/g, '') 
    .replace(/javascript:/gi, '') 
    .replace(/on\w+=/gi, '') 
    .replace(/vbscript:/gi, '') 
    .replace(/expression\s*\(/gi, '') 
    .replace(/eval\s*\(/gi, '') 
    .replace(/`/g, '') 
    .replace(/\$/g, '') 
    .replace(/\.\./g, '') 
    .replace(/\\/g, '') 
    .replace(/"/g, '&quot;') 
    .replace(/'/g, '&#x27;') 
    .replace(/&/g, '&amp;') 
    .replace(/\//g, '&#x2F;') 
    .replace(/\n/g, '<br>') 
    .replace(/\r/g, '') 
    .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;'); 
  
  FORBIDDEN_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  if (sanitized.length > MAX_STRING_LENGTH) {
    sanitized = sanitized.substring(0, MAX_STRING_LENGTH);
  }
  
  return sanitized.trim();
}

export function sanitizeObject(obj: any, depth: number = 0): any {
  if (depth > MAX_OBJECT_DEPTH) {
    return '[OBJECT_TOO_DEEP]';
  }
  
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (typeof obj === 'number') {
    if (isNaN(obj) || !isFinite(obj)) {
      return 0;
    }
    return obj;
  }
  
  if (typeof obj === 'boolean') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length > MAX_ARRAY_LENGTH) {
      return obj.slice(0, MAX_ARRAY_LENGTH);
    }
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    const keys = Object.keys(obj);
    
    if (keys.length > MAX_ARRAY_LENGTH) {
      const limitedKeys = keys.slice(0, MAX_ARRAY_LENGTH);
      limitedKeys.forEach(key => {
        const sanitizedKey = sanitizeString(key);
        if (sanitizedKey) {
          sanitized[sanitizedKey] = sanitizeObject(obj[key], depth + 1);
        }
      });
    } else {
      keys.forEach(key => {
        const sanitizedKey = sanitizeString(key);
        if (sanitizedKey) {
          sanitized[sanitizedKey] = sanitizeObject(obj[key], depth + 1);
        }
      });
    }
    
    return sanitized;
  }
  
  return String(obj);
}

export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  request?: any
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    
    const sanitizedData = sanitizeObject(validatedData);
    
    const finalData = schema.parse(sanitizedData);
    
    if (request) {
      logSecurityEvent(
        SecurityEventType.VALIDATION_SUCCESS,
        SecurityLevel.INFO,
        request,
        { dataType: schema.constructor.name }
      );
    }
    
    return { success: true, data: finalData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => err.message);
      
      if (request) {
        logSecurityEvent(
          SecurityEventType.VALIDATION_FAILED,
          SecurityLevel.WARNING,
          request,
          { 
            errors,
            dataType: schema.constructor.name,
            data: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : String(data)
          }
        );
      }
      
      return { success: false, errors };
    }
    
    if (request) {
      logSecurityEvent(
        SecurityEventType.VALIDATION_FAILED,
        SecurityLevel.ERROR,
        request,
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          dataType: schema.constructor.name
        }
      );
    }
    
    return { success: false, errors: ['Erro de validação desconhecido'] };
  }
}

export const UserRegistrationSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços')
    .transform(val => sanitizeString(val)),
  
  email: z.string()
    .email('E-mail inválido')
    .max(255, 'E-mail muito longo')
    .toLowerCase()
    .transform(val => sanitizeString(val)),
  
  password: z.string()
    .min(12, 'Senha deve ter pelo menos 12 caracteres')
    .max(128, 'Senha muito longa')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial')
    .refine(password => {
      const commonPatterns = ['123456', 'password', 'qwerty', 'admin', 'user', 'test'];
      return !commonPatterns.some(pattern => password.toLowerCase().includes(pattern));
    }, 'Senha não pode conter padrões comuns'),
  
  confirmPassword: z.string(),
  
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999')
    .transform(val => sanitizeString(val)),
  
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 123.456.789-00')
    .refine((cpf) => validateCPF(cpf), 'CPF inválido')
    .transform(val => sanitizeString(val)),
  
  birth_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 13 && age <= 120;
    }, 'Idade deve estar entre 13 e 120 anos')
    .transform(val => sanitizeString(val)),
  
  gender: z.enum(['M', 'F', 'Other']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export const UserLoginSchema = z.object({
  email: z.string()
    .email('E-mail inválido')
    .toLowerCase()
    .transform(val => sanitizeString(val)),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export const UserUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional()
    .transform(val => val ? sanitizeString(val) : val),
  
  phone: z.string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (11) 99999-9999')
    .optional()
    .transform(val => val ? sanitizeString(val) : val),
  
  birth_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional()
    .transform(val => val ? sanitizeString(val) : val),
  
  gender: z.enum(['M', 'F', 'Other']).optional(),
});

export const AddressSchema = z.object({
  name: z.string()
    .min(2, 'Nome do endereço deve ter pelo menos 2 caracteres')
    .max(100, 'Nome do endereço muito longo')
    .transform(val => sanitizeString(val)),
  
  street: z.string()
    .min(3, 'Rua deve ter pelo menos 3 caracteres')
    .max(200, 'Rua muito longa')
    .transform(val => sanitizeString(val)),
  
  number: z.string()
    .min(1, 'Número é obrigatório')
    .max(20, 'Número muito longo')
    .transform(val => sanitizeString(val)),
  
  complement: z.string()
    .max(100, 'Complemento muito longo')
    .optional()
    .transform(val => val ? sanitizeString(val) : val),
  
  neighborhood: z.string()
    .min(2, 'Bairro deve ter pelo menos 2 caracteres')
    .max(100, 'Bairro muito longo')
    .transform(val => sanitizeString(val)),
  
  city: z.string()
    .min(2, 'Cidade deve ter pelo menos 2 caracteres')
    .max(100, 'Cidade muito longa')
    .transform(val => sanitizeString(val)),
  
  state: z.string()
    .length(2, 'Estado deve ter 2 caracteres')
    .regex(/^[A-Z]{2}$/, 'Estado deve estar em maiúsculas')
    .transform(val => sanitizeString(val)),
  
  zip_code: z.string()
    .regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 12345-678')
    .transform(val => sanitizeString(val)),
});

export const ProductCreateSchema = z.object({
  name: z.string()
    .min(3, 'Nome do produto deve ter pelo menos 3 caracteres')
    .max(200, 'Nome do produto muito longo')
    .transform(val => sanitizeString(val)),
  
  description: z.string()
    .min(10, 'Descrição deve ter pelo menos 10 caracteres')
    .max(2000, 'Descrição muito longa')
    .transform(val => sanitizeString(val)),
  
  price: z.number()
    .positive('Preço deve ser positivo')
    .max(999999.99, 'Preço muito alto')
    .refine(price => !isNaN(price) && isFinite(price), 'Preço deve ser um número válido'),
  
  stock_quantity: z.number()
    .int('Quantidade em estoque deve ser um número inteiro')
    .min(0, 'Quantidade em estoque não pode ser negativa')
    .max(999999, 'Quantidade em estoque muito alta')
    .refine(qty => !isNaN(qty) && isFinite(qty), 'Quantidade deve ser um número válido'),
  
  brand_id: z.number()
    .int('ID da marca deve ser um número inteiro')
    .positive('ID da marca deve ser válido')
    .refine(id => !isNaN(id) && isFinite(id), 'ID da marca deve ser um número válido'),
  
  model_id: z.number()
    .int('ID do modelo deve ser um número inteiro')
    .positive('ID do modelo deve ser válido')
    .refine(id => !isNaN(id) && isFinite(id), 'ID do modelo deve ser um número válido'),
  
  category_id: z.number()
    .int('ID da categoria deve ser um número inteiro')
    .positive('ID da categoria deve ser válido')
    .refine(id => !isNaN(id) && isFinite(id), 'ID da categoria deve ser um número válido'),
  
  is_active: z.boolean().optional(),
});

export const ProductUpdateSchema = ProductCreateSchema.partial();

export const OrderCreateSchema = z.object({
  items: z.array(z.object({
    product_id: z.number()
      .int('ID do produto deve ser um número inteiro')
      .positive('ID do produto deve ser válido')
      .refine(id => !isNaN(id) && isFinite(id), 'ID do produto deve ser um número válido'),
    
    quantity: z.number()
      .int('Quantidade deve ser um número inteiro')
      .positive('Quantidade deve ser positiva')
      .max(100, 'Quantidade muito alta')
      .refine(qty => !isNaN(qty) && isFinite(qty), 'Quantidade deve ser um número válido'),
    
    price: z.number()
      .positive('Preço deve ser positivo')
      .refine(price => !isNaN(price) && isFinite(price), 'Preço deve ser um número válido'),
  })).min(1, 'Pedido deve ter pelo menos um item').max(MAX_ARRAY_LENGTH, 'Pedido com muitos itens'),
  
  customer: z.object({
    name: z.string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo')
      .transform(val => sanitizeString(val)),
    
    email: z.string()
      .email('E-mail inválido')
      .max(255, 'E-mail muito longo')
      .toLowerCase()
      .transform(val => sanitizeString(val)),
    
    phone: z.string()
      .min(10, 'Telefone deve ter pelo menos 10 dígitos')
      .max(20, 'Telefone muito longo')
      .transform(val => sanitizeString(val)),
  }),
  
  shipping_address: z.object({
    street: z.string()
      .min(3, 'Rua deve ter pelo menos 3 caracteres')
      .max(200, 'Rua muito longa')
      .transform(val => sanitizeString(val)),
    
    number: z.string()
      .min(1, 'Número é obrigatório')
      .max(20, 'Número muito longo')
      .transform(val => sanitizeString(val)),
    
    neighborhood: z.string()
      .min(2, 'Bairro deve ter pelo menos 2 caracteres')
      .max(100, 'Bairro muito longo')
      .transform(val => sanitizeString(val)),
    
    city: z.string()
      .min(2, 'Cidade deve ter pelo menos 2 caracteres')
      .max(100, 'Cidade muito longa')
      .transform(val => sanitizeString(val)),
    
    state: z.string()
      .length(2, 'Estado deve ter 2 caracteres')
      .regex(/^[A-Z]{2}$/, 'Estado deve estar em maiúsculas')
      .transform(val => sanitizeString(val)),
    
    zip_code: z.string()
      .regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 12345-678')
      .transform(val => sanitizeString(val)),
  }),
  
  payment_method: z.string()
    .min(1, 'Método de pagamento é obrigatório')
    .max(50, 'Método de pagamento muito longo')
    .transform(val => sanitizeString(val)),
});

export const CheckoutSchema = z.object({
  items: z.array(z.object({
    product_id: z.number()
      .int('ID do produto deve ser um número inteiro')
      .positive('ID do produto deve ser válido')
      .refine(id => !isNaN(id) && isFinite(id), 'ID do produto deve ser um número válido'),
    
    quantity: z.number()
      .int('Quantidade deve ser um número inteiro')
      .positive('Quantidade deve ser positiva')
      .max(100, 'Quantidade muito alta')
      .refine(qty => !isNaN(qty) && isFinite(qty), 'Quantidade deve ser um número válido'),
    
    price: z.number()
      .positive('Preço deve ser positivo')
      .refine(price => !isNaN(price) && isFinite(price), 'Preço deve ser um número válido'),
    
    size: z.string()
      .max(20, 'Tamanho muito longo')
      .optional()
      .transform(val => val ? sanitizeString(val) : val),
    
    color: z.string()
      .max(50, 'Cor muito longa')
      .optional()
      .transform(val => val ? sanitizeString(val) : val),
  })).min(1, 'Carrinho deve ter pelo menos um item').max(MAX_ARRAY_LENGTH, 'Carrinho com muitos itens'),
  
  customer: z.object({
    name: z.string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo')
      .transform(val => sanitizeString(val)),
    
    email: z.string()
      .email('E-mail inválido')
      .max(255, 'E-mail muito longo')
      .toLowerCase()
      .transform(val => sanitizeString(val)),
    
    phone: z.string()
      .min(10, 'Telefone deve ter pelo menos 10 dígitos')
      .max(20, 'Telefone muito longo')
      .transform(val => sanitizeString(val)),
    
    cpf: z.string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 123.456.789-00')
      .refine((cpf) => validateCPF(cpf), 'CPF inválido')
      .transform(val => sanitizeString(val)),
  }),
  
  shipping_address: z.object({
    zipCode: z.string()
      .regex(/^\d{5}-\d{3}$/, 'CEP deve estar no formato 12345-678')
      .transform(val => sanitizeString(val)),
    
    street: z.string()
      .min(3, 'Rua deve ter pelo menos 3 caracteres')
      .max(200, 'Rua muito longa')
      .transform(val => sanitizeString(val)),
    
    number: z.string()
      .min(1, 'Número é obrigatório')
      .max(20, 'Número muito longo')
      .transform(val => sanitizeString(val)),
    
    neighborhood: z.string()
      .min(2, 'Bairro deve ter pelo menos 2 caracteres')
      .max(100, 'Bairro muito longo')
      .transform(val => sanitizeString(val)),
    
    city: z.string()
      .min(2, 'Cidade deve ter pelo menos 2 caracteres')
      .max(100, 'Cidade muito longa')
      .transform(val => sanitizeString(val)),
    
    state: z.string()
      .length(2, 'Estado deve ter 2 caracteres')
      .regex(/^[A-Z]{2}$/, 'Estado deve estar em maiúsculas')
      .transform(val => sanitizeString(val)),
    
    complement: z.string()
      .max(100, 'Complemento muito longo')
      .optional()
      .transform(val => val ? sanitizeString(val) : val),
    
    shipping_cost: z.number()
      .min(0, 'Custo de frete não pode ser negativo')
      .refine(cost => !isNaN(cost) && isFinite(cost), 'Custo de frete deve ser um número válido'),
  }),
  
  payment_method: z.string()
    .min(1, 'Método de pagamento é obrigatório')
    .max(50, 'Método de pagamento muito longo')
    .transform(val => sanitizeString(val)),
});

export const CepSchema = z.string()
  .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos numéricos')
  .transform(val => sanitizeString(val));

export const PaymentSchema = z.object({
  amount: z.number()
    .positive('Valor deve ser positivo')
    .refine(amount => !isNaN(amount) && isFinite(amount), 'Valor deve ser um número válido'),
  
  currency: z.string()
    .default('BRL')
    .transform(val => sanitizeString(val)),
  
  description: z.string()
    .min(1, 'Descrição é obrigatória')
    .max(200, 'Descrição muito longa')
    .transform(val => sanitizeString(val)),
  
  external_reference: z.string()
    .min(1, 'Referência externa é obrigatória')
    .max(100, 'Referência externa muito longa')
    .transform(val => sanitizeString(val)),
});

function validateCPF(cpf: string): boolean {
  try {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  } catch (error) {
    return false;
  }
}

export function detectSuspiciousData(data: any): { suspicious: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  function checkValue(value: any, path: string = ''): void {
    if (typeof value === 'string') {
      FORBIDDEN_PATTERNS.forEach(pattern => {
        if (pattern.test(value)) {
          reasons.push(`Padrão suspeito encontrado em ${path}: ${pattern.source}`);
        }
      });
      
      if (value.length > MAX_STRING_LENGTH) {
        reasons.push(`String muito longa em ${path}: ${value.length} caracteres`);
      }
    } else if (Array.isArray(value)) {
      if (value.length > MAX_ARRAY_LENGTH) {
        reasons.push(`Array muito longo em ${path}: ${value.length} itens`);
      }
      
      value.forEach((item, index) => {
        checkValue(item, `${path}[${index}]`);
      });
    } else if (typeof value === 'object' && value !== null) {
      const keys = Object.keys(value);
      if (keys.length > MAX_ARRAY_LENGTH) {
        reasons.push(`Objeto com muitas chaves em ${path}: ${keys.length} chaves`);
      }
      
      keys.forEach(key => {
        checkValue(value[key], `${path}.${key}`);
      });
    }
  }
  
  checkValue(data);
  
  return {
    suspicious: reasons.length > 0,
    reasons
  };
}

export type UserRegistration = z.infer<typeof UserRegistrationSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type Address = z.infer<typeof AddressSchema>;
export type ProductCreate = z.infer<typeof ProductCreateSchema>;
export type ProductUpdate = z.infer<typeof ProductUpdateSchema>;
export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type Checkout = z.infer<typeof CheckoutSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
