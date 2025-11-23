import { NextRequest, NextResponse } from 'next/server';
import { generateToken, setAuthCookie, loginWithEncryptedData } from '@/lib/auth';
import database from '@/lib/database';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { decryptFromDatabase } from '@/lib/transparent-encryption';
import { detectSQLInjection, detectXSS } from '@/lib/sql-injection-protection';
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(ip, 'login', request);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Muitas tentativas. Tente novamente em ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60)} minutos.`,
          error: 'Rate limit exceeded'
        },
        { status: 429 }
      );
    }
    const body = await request.json();
    const { email, password } = body;
    if (detectSQLInjection(email) || detectSQLInjection(password)) {
      return NextResponse.json(
        { error: 'Acesso negado - tentativa de ataque detectada' },
        { status: 403 }
      );
    }
    if (detectXSS(email) || detectXSS(password)) {
      return NextResponse.json(
        { error: 'Acesso negado - tentativa de ataque XSS detectada' },
        { status: 403 }
      );
    }
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }
    const loginResult = await loginWithEncryptedData(email, password, database.query);
    if (!loginResult.success) {
      return NextResponse.json(
        { success: false, message: loginResult.error },
        { status: 401 }
      );
    }
    const user = decryptFromDatabase('users', loginResult.user);
    if (!user.email_verified_at) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'E-mail não verificado. Verifique sua caixa de entrada e clique no link de verificação.',
          emailNotVerified: true 
        },
        { status: 401 }
      );
    }
    if (!user.is_active) {
      return NextResponse.json(
        { success: false, message: 'Conta desativada. Entre em contato conosco.' },
        { status: 401 }
      );
    }
    await database.updateUserLastLogin(user.id);
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      emailVerified: !!user.email_verified_at,
      isAdmin: !!user.is_admin,
    };
    const token = generateToken(tokenPayload);
    const response = NextResponse.json(
      { 
        success: true, 
        message: 'Login realizado com sucesso!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: !!user.email_verified_at,
        }
      },
      { status: 200 }
    );
    return setAuthCookie(response, token);
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}