import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { findUserByEmail, decryptFromDatabase } from './transparent-encryption';
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!process.env.JWT_SECRET) {
  throw new Error('ERRO CRÍTICO DE SEGURANÇA: A variável de ambiente JWT_SECRET não está definida. O servidor não pode iniciar sem ela.');
}
const JWT_EXPIRES_IN = '24h'; 
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; 
const PASSWORD_HISTORY_SIZE = 5;
const loginAttempts = new Map<string, { count: number; lockoutUntil: number }>();
const passwordHistory = new Map<number, string[]>();
const activeSessions = new Map<string, { userId: number; lastActivity: number }>();
export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  emailVerified: boolean;
  isAdmin?: boolean;
  sessionId: string;
  iat: number;
}
export interface RefreshTokenPayload {
  userId: number;
  sessionId: string;
  tokenVersion: number;
}
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 15; 
  return await bcrypt.hash(password, saltRounds);
}
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 12) {
    errors.push('Senha deve ter pelo menos 12 caracteres');
  }
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial (@$!%*?&)');
  }
  if (!/(?=.*[^\w\s])/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere não alfanumérico');
  }
  const commonPatterns = ['123456', 'password', 'qwerty', 'admin', 'user'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    errors.push('Senha não pode conter padrões comuns');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}
export function isPasswordReused(userId: number, newPassword: string): boolean {
  const history = passwordHistory.get(userId) || [];
  return history.some(oldHash => bcrypt.compareSync(newPassword, oldHash));
}
export function addPasswordToHistory(userId: number, hashedPassword: string): void {
  const history = passwordHistory.get(userId) || [];
  history.unshift(hashedPassword);
  if (history.length > PASSWORD_HISTORY_SIZE) {
    history.splice(PASSWORD_HISTORY_SIZE);
  }
  passwordHistory.set(userId, history);
}
export function checkLoginRateLimit(identifier: string): { allowed: boolean; remainingTime: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(identifier);
  if (!attempt) {
    return { allowed: true, remainingTime: 0 };
  }
  if (attempt.lockoutUntil > now) {
    return { 
      allowed: false, 
      remainingTime: Math.ceil((attempt.lockoutUntil - now) / 1000) 
    };
  }
  if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
    attempt.count = 0;
    attempt.lockoutUntil = 0;
  }
  return { allowed: true, remainingTime: 0 };
}
export function recordLoginAttempt(identifier: string, success: boolean): void {
  const attempt = loginAttempts.get(identifier) || { count: 0, lockoutUntil: 0 };
  if (success) {
    attempt.count = 0;
    attempt.lockoutUntil = 0;
  } else {
    attempt.count++;
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      attempt.lockoutUntil = Date.now() + LOCKOUT_DURATION;
    }
  }
  loginAttempts.set(identifier, attempt);
}
export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'sessionId'>): string {
  const sessionId = generateSessionId();
  const tokenPayload = {
    ...payload,
    sessionId,
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    algorithm: 'HS512', 
    issuer: 'saraimodas',
    audience: 'saraimodas-users'
  });
}
export function generateRefreshToken(userId: number, sessionId: string): string {
  const payload: RefreshTokenPayload = {
    userId,
    sessionId,
    tokenVersion: Date.now()
  };
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    algorithm: 'HS512',
    issuer: 'saraimodas',
    audience: 'saraimodas-refresh'
  });
}
export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS512'],
      issuer: 'saraimodas',
      audience: 'saraimodas-users'
    }) as unknown as JWTPayload;
    return payload;
  } catch (error) {
    return null;
  }
}
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS512'],
      issuer: 'saraimodas',
      audience: 'saraimodas-refresh'
    }) as unknown as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
}
export function invalidateSession(sessionId: string): boolean {
  return activeSessions.delete(sessionId);
}
export function invalidateAllUserSessions(userId: number): void {
  for (const [sessionId, session] of Array.from(activeSessions.entries())) {
    if (session.userId === userId) {
      activeSessions.delete(sessionId);
    }
  }
}
export function cleanupInactiveSessions(): void {
  const now = Date.now();
  const maxInactiveTime = 24 * 60 * 60 * 1000; 
  for (const [sessionId, session] of Array.from(activeSessions.entries())) {
    if (now - session.lastActivity > maxInactiveTime) {
      activeSessions.delete(sessionId);
    }
  }
}
export function setAuthCookie(response: NextResponse, token: string, refreshToken?: string): NextResponse {
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', 
    maxAge: 24 * 60 * 60, 
    path: '/',
    domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
  });
  if (refreshToken) {
    response.cookies.set('refresh-token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', 
      maxAge: 7 * 24 * 60 * 60, 
      path: '/api/auth/refresh',
      domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined,
    });
  }
  return response;
}
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete('auth-token');
  response.cookies.delete('refresh-token');
  return response;
}
export function getTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get('auth-token');
  return cookie?.value || null;
}
export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get('refresh-token');
  return cookie?.value || null;
}
export async function authenticateUser(request: NextRequest): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return payload;
}
function getClientIP(request: NextRequest): string {
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
export function isAuthenticated(payload: JWTPayload | null): boolean {
  return payload !== null;
}
export function isEmailVerified(payload: JWTPayload | null): boolean {
  return payload?.emailVerified || false;
}
export function canAccessProtectedPages(payload: JWTPayload | null): boolean {
  return isAuthenticated(payload) && isEmailVerified(payload);
} 
export function isAdmin(payload: JWTPayload | null): boolean {
  return payload?.isAdmin || false;
}
export function canAccessResource(payload: JWTPayload | null, resourceOwnerId: number): boolean {
  if (!payload) return false;
  if (payload.isAdmin) return true;
  return payload.userId === resourceOwnerId;
}
export function logSecurityEvent(event: string, details: any): void {
}
export async function loginWithEncryptedData(email: string, password: string, queryFunction: Function): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const user = await findUserByEmail(email, queryFunction);
    if (!user) {
      return {
        success: false,
        error: 'Email ou senha incorretos'
      };
    }
    if (!user.is_active) {
      return {
        success: false,
        error: 'Conta desativada. Entre em contato com o suporte.'
      };
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Email ou senha incorretos'
      };
    }
    const { password: _, ...userWithoutPassword } = user;
    return {
      success: true,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return {
      success: false,
      error: 'Erro interno do servidor'
    };
  }
}
