import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { checkRateLimit, getClientIP } from '@/lib/rate-limit'
import { validateCSRFRequest, createCSRFResponse } from '@/lib/csrf-protection'
import database from '@/lib/database'
import { detectSQLInjection, detectXSS } from '@/lib/sql-injection-protection'
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};
export async function POST(request: NextRequest) {
  try {
    if (!validateCSRFRequest(request)) {
      return createCSRFResponse(
        { error: 'Token CSRF inválido ou ausente' },
        403
      );
    }
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(ip, 'contact', request);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Muitas tentativas. Tente novamente em ${Math.ceil((rateLimit.resetTime - Date.now()) / 1000 / 60)} minutos.`
        },
        { status: 429 }
      );
    }
    const body = await request.json();
    const { name, email, phone, subject, message } = body;
    if (detectSQLInjection(name) || detectSQLInjection(email) || detectSQLInjection(phone) || 
        detectSQLInjection(subject) || detectSQLInjection(message)) {
      return NextResponse.json(
        { error: 'Acesso negado - tentativa de ataque detectado' },
        { status: 403 }
      );
    }
    if (detectXSS(name) || detectXSS(email) || detectXSS(phone) || 
        detectXSS(subject) || detectXSS(message)) {
      return NextResponse.json(
        { error: 'Acesso negado - tentativa de ataque XSS detectada' },
        { status: 403 }
      );
    }
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'E-mail inválido' },
        { status: 400 }
      );
    }
    try {
      await database.query(
        'INSERT INTO contact_messages (name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [name, email, phone || null, subject, message]
      );
    } catch (dbError) {
      console.error('Erro ao salvar mensagem no banco:', dbError);
    }
    try {
    const transporter = createTransporter();
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
        subject: `Nova mensagem de contato: ${subject}`,
      html: `
          <h2>Nova mensagem de contato</h2>
          <p><strong>Nome:</strong> ${name}</p>
                <p><strong>E-mail:</strong> ${email}</p>
          <p><strong>Telefone:</strong> ${phone || 'Não informado'}</p>
          <p><strong>Assunto:</strong> ${subject}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      };
      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Erro ao enviar e-mail:', emailError);
    }
    return NextResponse.json(
      { 
        success: true, 
        message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro no formulário de contato:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}