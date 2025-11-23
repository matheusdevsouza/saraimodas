export const SECURITY_CONFIG = {
  AUTH: {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    PASSWORD_RESET_EXPIRES_IN: process.env.PASSWORD_RESET_EXPIRES_IN || '1h',
    EMAIL_VERIFICATION_EXPIRES_IN: process.env.EMAIL_VERIFICATION_EXPIRES_IN || '24h',
  },
  RATE_LIMITING: {
    MAX_REQUESTS_PER_MINUTE: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '100'),
    MAX_REQUESTS_PER_HOUR: parseInt(process.env.MAX_REQUESTS_PER_HOUR || '1000'),
    MAX_REQUESTS_PER_DAY: parseInt(process.env.MAX_REQUESTS_PER_DAY || '10000'),
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    BLOCK_DURATION: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION || '900000'), 
  },
  ENCRYPTION: {
    KEY: process.env.ENCRYPTION_KEY || '',
    ALGORITHM: 'aes-256-gcm',
    IV_LENGTH: 16,
    SALT_LENGTH: 32,
    ITERATIONS: 100000,
  },
  UPLOAD: {
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'), 
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  },
  SECURITY_HEADERS: {
    X_FRAME_OPTIONS: 'DENY',
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    PERMISSIONS_POLICY: 'camera=(), microphone=(), geolocation=(), payment=()',
    X_DNS_PREFETCH_CONTROL: 'off',
    X_DOWNLOAD_OPTIONS: 'noopen',
    X_PERMITTED_CROSS_DOMAIN_POLICIES: 'none',
    CROSS_ORIGIN_EMBEDDER_POLICY: 'require-corp',
    CROSS_ORIGIN_OPENER_POLICY: 'same-origin',
    CROSS_ORIGIN_RESOURCE_POLICY: 'same-origin',
    STRICT_TRANSPORT_SECURITY: 'max-age=31536000; includeSubDomains; preload',
    EXPECT_CT: 'max-age=86400, enforce',
  },
  CSP: {
    DEFAULT_SRC: "'self'",
    SCRIPT_SRC: "'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
    STYLE_SRC: "'self' 'unsafe-inline' https://fonts.googleapis.com",
    FONT_SRC: "'self' https://fonts.gstatic.com",
    IMG_SRC: "'self' data: https: blob:",
    CONNECT_SRC: "'self' https://api.mercadopago.com https://viacep.com.br",
    FRAME_SRC: "'self' https://www.mercadopago.com.br",
    OBJECT_SRC: "'none'",
    BASE_URI: "'self'",
    FORM_ACTION: "'self'",
  },
  DEV: {
    ENABLE_DATABASE: process.env.NODE_ENV === 'production',
    ENABLE_CACHING: process.env.NODE_ENV === 'production',
    ENABLE_LOGGING: process.env.NODE_ENV === 'production',
    ENABLE_MONITORING: process.env.NODE_ENV === 'production',
  },
  URLS: {
    PRIVACY_POLICY_URL: process.env.PRIVACY_POLICY_URL || '/politica-de-privacidade',
    TERMS_OF_SERVICE_URL: process.env.TERMS_OF_SERVICE_URL || '/termos-de-uso'
  }
};
export function validateSecurityConfig(config: typeof SECURITY_CONFIG): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config.AUTH.JWT_SECRET || config.AUTH.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET deve ter pelo menos 32 caracteres para ser considerado seguro');
  }
  if (!config.ENCRYPTION.KEY || config.ENCRYPTION.KEY.length < 32) {
    errors.push('ENCRYPTION_KEY deve ter pelo menos 32 caracteres');
  }
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      errors.push('MERCADOPAGO_ACCESS_TOKEN é obrigatório em produção');
    }
    if (!process.env.SMTP_HOST) {
      errors.push('Configurações SMTP são obrigatórias em produção');
    }
  }
  return { valid: errors.length === 0, errors };
}
export function getSecurityConfig() {
  return SECURITY_CONFIG;
}
export function validateRuntimeSecurity() {
  const config = getSecurityConfig();
  const { errors } = validateSecurityConfig(config);
  if (errors.length > 0) {
    console.error('❌ Erros de configuração de segurança:', errors);
    if (config.DEV.ENABLE_DATABASE) {
      throw new Error('Configuração de segurança inválida');
    }
  }
  return { errors, config };
}
export default getSecurityConfig();
