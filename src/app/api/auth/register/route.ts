import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import database from '@/lib/database';
import { sendVerificationEmail } from '@/lib/email';
import crypto from 'crypto';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, phone, cpf, birth_date, gender } = body;
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'As senhas não coincidem' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'E-mail inválido' },
        { status: 400 }
      );
    }
    if (phone && phone.length > 50) {
      return NextResponse.json(
        { success: false, message: 'Telefone muito longo (máximo 50 caracteres)' },
        { status: 400 }
      );
    }
    const existingUser = await database.getUserByEmail(email.toLowerCase());
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'E-mail já cadastrado' },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const userResult = await database.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone ? phone.trim().substring(0, 50) : null,
      cpf: cpf ? cpf.trim() : null,
      birth_date: birth_date || null,
      gender: gender || null,
    });
    const userId = userResult.insertId;
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await database.createVerificationToken(userId, verificationToken);
    await sendVerificationEmail({
      email: email.toLowerCase().trim(),
      name: name.trim(),
      verificationToken,
    });
    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso! Verifique seu e-mail para ativar a conta.',
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}