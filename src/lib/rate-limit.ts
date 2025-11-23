import { NextRequest } from 'next/server';
interface RateLimitInfo {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockExpiry: number;
}
const rateLimitStore = new Map<string, RateLimitInfo>();
const RATE_LIMIT_CONFIG = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockDuration: 30 * 60 * 1000,
  },
  register: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDuration: 60 * 60 * 1000,
  },
  emailVerification: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
    blockDuration: 60 * 60 * 1000,
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDuration: 60 * 60 * 1000,
  },
  contact: {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
    blockDuration: 60 * 60 * 1000,
  },
  general: {
    maxAttempts: 100,
    windowMs: 60 * 1000,
    blockDuration: 5 * 60 * 1000,
  },
  checkout: {
    maxAttempts: 10,
    windowMs: 5 * 60 * 1000,
    blockDuration: 15 * 60 * 1000,
  },
  imageUpload: {
    maxAttempts: 20,
    windowMs: 60 * 1000,
    blockDuration: 10 * 60 * 1000,
  },
};
function getRateLimitKey(identifier: string, type: keyof typeof RATE_LIMIT_CONFIG): string {
  return `${type}:${identifier}`;
}
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  return '127.0.0.1';
}
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}
export function checkRateLimit(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIG,
  request?: NextRequest
): { allowed: boolean; remaining: number; resetTime: number; blocked: boolean } {
  const config = RATE_LIMIT_CONFIG[type];
  const key = getRateLimitKey(identifier, type);
  const now = Date.now();
  let info = rateLimitStore.get(key);
  if (!info) {
    info = {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
      blockExpiry: 0,
    };
    rateLimitStore.set(key, info);
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetTime: info.resetTime,
      blocked: false,
    };
  }
  if (info.blocked) {
    if (now < info.blockExpiry) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: info.blockExpiry,
        blocked: true,
      };
    } else {
      info.blocked = false;
      info.count = 0;
      info.resetTime = now + config.windowMs;
    }
  }
  if (now > info.resetTime) {
    info.count = 1;
    info.resetTime = now + config.windowMs;
  } else {
    info.count++;
  }
  if (info.count > config.maxAttempts) {
    info.blocked = true;
    info.blockExpiry = now + config.blockDuration;
    if (request) {
      console.warn(`Rate limit exceeded for ${type}:`, {
        identifier,
        ip: getClientIP(request),
        userAgent: getUserAgent(request),
        timestamp: new Date().toISOString(),
      });
    }
    return {
      allowed: false,
      remaining: 0,
      resetTime: info.blockExpiry,
      blocked: true,
    };
  }
  rateLimitStore.set(key, info);
  return {
    allowed: true,
    remaining: Math.max(0, config.maxAttempts - info.count),
    resetTime: info.resetTime,
    blocked: false,
  };
}
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  for (const [key, info] of Array.from(rateLimitStore.entries())) {
    if (now > info.resetTime && !info.blocked) {
      rateLimitStore.delete(key);
    }
    if (info.blocked && now > info.blockExpiry) {
      rateLimitStore.delete(key);
    }
  }
}
export function getRateLimitStats(): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const [key, info] of Array.from(rateLimitStore.entries())) {
    const type = key.split(':')[0];
    if (!stats[type]) {
      stats[type] = 0;
    }
    stats[type]++;
  }
  return stats;
}
export function resetRateLimit(identifier: string, type: keyof typeof RATE_LIMIT_CONFIG): boolean {
  const key = getRateLimitKey(identifier, type);
  return rateLimitStore.delete(key);
}
export function isIPBlocked(ip: string, type: keyof typeof RATE_LIMIT_CONFIG): boolean {
  const key = getRateLimitKey(ip, type);
  const info = rateLimitStore.get(key);
  if (!info) return false;
  if (info.blocked && Date.now() < info.blockExpiry) {
    return true;
  }
  return false;
}
export function createRateLimitMiddleware(type: keyof typeof RATE_LIMIT_CONFIG) {
  return function rateLimitMiddleware(request: NextRequest) {
    const ip = getClientIP(request);
    const result = checkRateLimit(ip, type, request);
    if (!result.allowed) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        message: `Muitas tentativas. Tente novamente em ${Math.ceil((result.resetTime - Date.now()) / 1000 / 60)} minutos.`,
        resetTime: result.resetTime,
        blocked: result.blocked,
      };
    }
    return {
      success: true,
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  };
}
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
}
