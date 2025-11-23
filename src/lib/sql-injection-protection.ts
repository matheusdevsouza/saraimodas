import { NextRequest } from 'next/server';
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|TRUNCATE)\b)/gi,
  /[;'\"\\]/gi,
  /(\-\-|\/\*|\*\/|#)/gi,
  /(OR\s+['"]?\d*['"]?\s*=\s*['"]?\d*['"]?)/gi,
  /(AND\s+['"]?\d*['"]?\s*=\s*['"]?\d*['"]?)/gi,
  /(UNION\s+SELECT)/gi,
  /(DROP\s+TABLE)/gi,
  /(DELETE\s+FROM)/gi,
  /(INSERT\s+INTO)/gi,
  /(UPDATE\s+SET)/gi,
  /(ALTER\s+TABLE)/gi,
  /(CREATE\s+TABLE)/gi,
  /(EXEC\s*\()/gi,
  /(\/\*.*?\*\/)/gi,
  /(--.*$)/gm,
  /(#.*$)/gm,
  /(SLEEP\s*\()/gi,
  /(WAITFOR\s+DELAY)/gi,
  /(BENCHMARK\s*\()/gi,
  /(INFORMATION_SCHEMA)/gi,
  /(mysql\.user)/gi,
  /(sys\.databases)/gi,
  /(%27|%22|%3D|%3B|%2D|%2D)/gi,
  /(0x[0-9a-f]+)/gi,
  /(ASCII\s*\()/gi,
  /(SUBSTRING\s*\()/gi,
  /(LENGTH\s*\()/gi,
  /(CONCAT\s*\()/gi,
  /(\$where|\$ne|\$gt|\$lt|\$regex|\$exists|\$in|\$nin|\$or|\$and)/gi,
  /(\*|\(|\)|\\|\/|\+|<|>|;|,|"|'|=)/g
];
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<iframe[^>]*>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^<]*>/gi,
  /<meta\b[^<]*>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onfocus\s*=/gi,
  /ontoggle\s*=/gi,
  /<img[^>]*onerror/gi,
  /<img[^>]*src\s*=\s*[^>]*onerror/gi,
  /<svg[^>]*onload/gi,
  /<svg[^>]*onerror/gi,
  /<body[^>]*onload/gi,
  /<input[^>]*onfocus/gi,
  /<select[^>]*onfocus/gi,
  /<textarea[^>]*onfocus/gi,
  /<keygen[^>]*onfocus/gi,
  /<video[^>]*onerror/gi,
  /<audio[^>]*onerror/gi,
  /<source[^>]*onerror/gi,
  /<details[^>]*ontoggle/gi,
  /alert\s*\(/gi,
  /confirm\s*\(/gi,
  /prompt\s*\(/gi,
  /&#x?[0-9a-fA-F]+;/gi,
  /"[^"]*<script/gi,
  /'[^']*<script/gi,
  /<img\s+src\s*=\s*x\s+onerror/gi,
  /<svg\s+onload/gi,
  /<iframe\s+src\s*=\s*"javascript:/gi,
  /<body\s+onload/gi,
  /<input[^>]*onfocus[^>]*autofocus/gi,
  /<select[^>]*onfocus[^>]*autofocus/gi,
  /<textarea[^>]*onfocus[^>]*autofocus/gi,
  /<keygen[^>]*onfocus[^>]*autofocus/gi,
  /<video[^>]*><source[^>]*onerror/gi,
  /<audio[^>]*src\s*=\s*x[^>]*onerror/gi,
  /<details[^>]*open[^>]*ontoggle/gi
];
export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}
export function detectXSS(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    if (detectSQLInjection(input)) {
      throw new Error('Entrada maliciosa detectada - possível SQL Injection');
    }
    if (detectXSS(input)) {
      throw new Error('Entrada maliciosa detectada - possível XSS');
    }
    return input
      .replace(/[<>]/g, '') 
      .replace(/['"]/g, '') 
      .replace(/[;\\]/g, '') 
      .replace(/[(){}[\]|&$]/g, '') 
      .trim();
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};
    for (const key in input) {
      try {
        sanitized[key] = sanitizeInput(input[key]);
      } catch (error) {
        throw new Error(`Campo '${key}' contém entrada maliciosa`);
      }
    }
    return sanitized;
  }
  return input;
}
export function validateInput(data: any): { isValid: boolean; error?: string } {
  try {
    sanitizeInput(data);
    return { isValid: true };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Entrada inválida - possível ataque detectado' 
    };
  }
}
export function sqlInjectionProtection(request: NextRequest): { blocked: boolean; error?: string } {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const params = Array.from(searchParams.entries());
    for (const [key, value] of params) {
      if (detectSQLInjection(value)) {
        logSQLInjectionAttempt(request, `SQL Injection in param '${key}': ${value}`);
        return { 
          blocked: true, 
          error: `Parâmetro '${key}' contém possível SQL Injection` 
        };
      }
      if (detectXSS(value)) {
        logSQLInjectionAttempt(request, `XSS in param '${key}': ${value}`);
        return { 
          blocked: true, 
          error: `Parâmetro '${key}' contém possível XSS` 
        };
      }
    }
    return { blocked: false };
  } catch (error) {
    return { 
      blocked: true, 
      error: 'Erro ao validar entrada - possível ataque detectado' 
    };
  }
}
export function validateRequestBody(body: any): { isValid: boolean; error?: string } {
  return validateInput(body);
}
export function logSQLInjectionAttempt(request: NextRequest, details: string) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const timestamp = new Date().toISOString();
  console.log(`🚨 SECURITY ALERT DETECTED:`);
  console.log(`   IP: ${ip}`);
  console.log(`   User-Agent: ${userAgent}`);
  console.log(`   URL: ${request.url}`);
  console.log(`   Details: ${details}`);
  console.log(`   Timestamp: ${timestamp}`);
}
