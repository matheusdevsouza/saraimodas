import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { authenticateUser, isAdmin } from '@/lib/auth';
import { generateAuditHash, formatAddress } from '@/lib/security';
import { decryptFromDatabase } from '@/lib/transparent-encryption';
import bcrypt from 'bcryptjs';
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores autorizados.' },
        { status: 401 }
      );
    }
    const { dataType, password } = await request.json();
    const orderId = params.id;
    if (!dataType || !password) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }
    if (!['email', 'phone', 'cpf', 'address'].includes(dataType)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de dados inválido' },
        { status: 400 }
      );
    }
    const order = await database.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    if (!order || order.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }
    const adminUser = await database.query(
      'SELECT id, password FROM users WHERE id = ? AND is_admin = TRUE',
      [user.userId]
    );
    if (!adminUser || adminUser.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuário administrador não encontrado' },
        { status: 404 }
      );
    }
    const isValidPassword = await bcrypt.compare(password, adminUser[0].password);
    if (!isValidPassword) {
      const auditHash = generateAuditHash(`failed_reveal_attempt_${orderId}_${user.userId}`);
      return NextResponse.json(
        { success: false, error: 'Senha incorreta' },
        { status: 403 }
      );
    }
    const orderData = decryptFromDatabase('orders', order[0]);
    let revealedData: any = {};
    switch (dataType) {
      case 'email':
        revealedData = {
          email: orderData.customer_email
        };
        break;
      case 'phone':
        revealedData = {
          phone: orderData.customer_phone
        };
        break;
      case 'cpf':
        revealedData = {
          cpf: orderData.customer_cpf
        };
        break;
      case 'address':
        revealedData = {
          shipping_address: orderData.shipping_address,
          formatted_address: orderData.shipping_address ? formatAddress(orderData.shipping_address) : null
        };
        break;
    }
    const auditHash = generateAuditHash(`data_revealed_${orderId}_${user.userId}_${dataType}`);
    try {
      await database.query(`
        INSERT INTO audit_logs (
          admin_id, order_id, action_type, data_type, 
          audit_hash, created_at
        ) VALUES (?, ?, 'DATA_REVEAL', ?, ?, NOW())
      `, [user.userId, orderId, dataType, auditHash]);
    } catch (auditError) {
    }
    return NextResponse.json({
      success: true,
      data: revealedData,
      auditHash,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro ao revelar dados sensíveis:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}