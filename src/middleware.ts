import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MALICIOUS_PATTERNS = [
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\s+.*FROM/i,
  /(;|\-\-|\/\*|\*\/).*(SELECT|INSERT|UPDATE|DELETE|DROP)/i,
  /(\b(OR|AND)\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?\s*(OR|AND))/i,
  /(\b(OR|AND)\s+['"]\w+['"]\s*=\s*['"]\w+['"]\s*(OR|AND))/i,
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:\s*[^"'\s]/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /<iframe[^>]*src\s*=\s*["'][^"']*["']/gi,
  /\.\.\/\.\.\//,
  /\.\.\\\.\.\\/,
  /[;&|`$]\s*(rm|del|format|shutdown|reboot|kill)/i,
  /[()=*!&|].*(cn|uid|mail|objectClass)/i,
];

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' data: https://cdnjs.cloudflare.com; connect-src 'self'; frame-ancestors 'none';",
};

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isAdminAPI = pathname.startsWith('/api/admin/');
  const response = NextResponse.next();
  
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  if (isAdminAPI) {
    const userAgent = request.headers.get('user-agent') || '';
    const suspiciousUserAgents = [
      'sqlmap',
      'nikto',
      'nmap',
      'curl',
      'wget',
      'python-requests',
      'java',
      'go-http-client'
    ];
    
    if (suspiciousUserAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      console.log(`🚨 [SECURITY] Suspicious User-Agent detected: ${userAgent}`);
      return new NextResponse('Access Denied', { status: 403 });
    }
    
    const queryString = searchParams.toString();
    if (queryString && pathname.includes('/orders/') && MALICIOUS_PATTERNS.some(pattern => pattern.test(queryString))) {
      console.log(`🚨 [SECURITY] Malicious query detected: ${queryString}`);
      return new NextResponse('Access Denied', { status: 403 });
    }
    
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    console.log(`🔍 [AUDIT] Admin API access: ${pathname} from IP: ${ip} User-Agent: ${userAgent}`);

    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      console.log(`🚨 [SECURITY] Admin API access attempt without token: ${pathname}`);
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    
    if (!payload) {
      console.log(`🚨 [SECURITY] Invalid token during Admin API access: ${pathname}`);
      return NextResponse.json({ success: false, error: 'Token inválido ou expirado' }, { status: 401 });
    }

    if (!payload.isAdmin) {
      console.log(`🚨 [SECURITY] Unauthorized Admin API access attempt (Not Admin): ${pathname} User: ${payload.email}`);
      return NextResponse.json({ success: false, error: 'Acesso negado: Requer privilégios de administrador' }, { status: 403 });
    }
  }
  
  if (pathname.match(/^\/admin\/pedidos\/\d+$/)) {
    const orderId = pathname.split('/').pop();
    
    if (!orderId || isNaN(Number(orderId))) {
      console.log(`🚨 [SECURITY] Invalid order ID format: ${orderId}`);
      return new NextResponse('Invalid Request', { status: 400 });
    }
    
    if (Number(orderId) > 999999999) {
      console.log(`🚨 [SECURITY] Order ID too large: ${orderId}`);
      return new NextResponse('Invalid Request', { status: 400 });
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    '/admin/:path*',
    '/api/orders/:path*',
    '/api/checkout/:path*'
  ]
};

function base64UrlToUint8Array(base64Url: string) {
  const padding = '='.repeat((4 - base64Url.length % 4) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function verifyAuth(token: string) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    const secret = process.env.JWT_SECRET;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['verify']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToUint8Array(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      data
    );

    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlToUint8Array(payloadB64));
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}
