import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { sendOrderShippedEmail } from '@/lib/email';
import { authenticateUser, isAdmin } from '@/lib/auth';
import { 
  maskSensitiveData, 
  formatCPF, 
  formatAddress, 
  sanitizeInput,
  hasPermissionToViewSensitiveData,
  generateAuditHash 
} from '@/lib/security';
import { decryptFromDatabase } from '@/lib/transparent-encryption';
export async function GET(
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
    const orderId = sanitizeInput(params.id);
    if (!orderId || isNaN(Number(orderId))) {
      return NextResponse.json(
        { error: 'ID do pedido inválido' },
        { status: 400 }
      );
    }
    const auditHash = generateAuditHash(`admin_view_order_${orderId}_${user.userId}`);
    const order = await database.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    if (!order || order.length === 0) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }
    const items = await database.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    const orderData = order[0];
    const decryptedOrder = decryptFromDatabase('orders', orderData);
    const processedOrder = {
      ...decryptedOrder,
      createdAt: decryptedOrder.created_at,
      updatedAt: decryptedOrder.updated_at,
      shipped_at: decryptedOrder.shipped_at,
      delivered_at: decryptedOrder.delivered_at,
      items: items || [],
      customer_cpf: decryptedOrder.customer_cpf ? '***.***.***-**' : null,
      customer_email: decryptedOrder.customer_email ? '***@***.***' : null,
      customer_phone: decryptedOrder.customer_phone ? '***-****-****' : null,
      shipping_address: decryptedOrder.shipping_address ? '*** ENDEREÇO PROTEGIDO ***' : null,
      formatted_address: null,
      _audit_hash: auditHash,
      _accessed_by: user.userId,
      _accessed_at: new Date().toISOString()
    };
    return NextResponse.json({ order: processedOrder });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function PUT(
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
    const orderId = params.id;
    const body = await request.json();
    const { status, payment_status, tracking_code, tracking_url, shipping_company, shipping_status, shipping_notes } = body;
    const updateFields = [];
    const updateValues = [];
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (payment_status !== undefined) {
      updateFields.push('payment_status = ?');
      updateValues.push(payment_status);
    }
    if (tracking_code !== undefined) {
      updateFields.push('tracking_code = ?');
      updateValues.push(tracking_code);
    }
    if (tracking_url !== undefined) {
      updateFields.push('tracking_url = ?');
      updateValues.push(tracking_url);
    }
    if (shipping_company !== undefined) {
      updateFields.push('shipping_company = ?');
      updateValues.push(shipping_company);
    }
    if (shipping_status !== undefined) {
      updateFields.push('shipping_status = ?');
      updateValues.push(shipping_status);
    }
    if (shipping_notes !== undefined) {
      updateFields.push('shipping_notes = ?');
      updateValues.push(shipping_notes);
    }
    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }
    updateValues.push(orderId);
    await database.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    const updatedOrder = await database.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );
    const items = await database.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [orderId]
    );
    const orderWithItems = {
      ...updatedOrder[0],
      items: items || []
    };
    if (status === "shipped" && updatedOrder && updatedOrder[0] && updatedOrder[0].customer_email) {
      try {
        const order = updatedOrder[0];
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);
        await sendOrderShippedEmail({
          email: order.customer_email,
          name: order.customer_name || "Cliente",
          orderNumber: order.order_number,
          trackingCode: order.tracking_code || "N/A",
          trackingUrl: order.tracking_url || "#",
          shippingCompany: order.shipping_company || "Transportadora",
          estimatedDelivery: estimatedDelivery.toLocaleDateString("pt-BR")
        });
        console.log(`Email de envio enviado para ${order.customer_email}`);
      } catch (emailError) {
        console.error("Erro ao enviar email de envio:", emailError);
      }
    }
    return NextResponse.json({
      success: true,
      message: 'Pedido atualizado com sucesso',
      order: orderWithItems
    });
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}