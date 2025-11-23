import { NextRequest, NextResponse } from 'next/server'
import database from '@/lib/database'
import { authenticateUser, isAdmin } from '@/lib/auth'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }
    const modelId = parseInt(params.id);
    if (isNaN(modelId)) {
      return NextResponse.json({
        success: false,
        error: 'ID do modelo inválido'
      }, { status: 400 });
    }
    const productsQuery = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.stock_quantity,
        p.is_active,
        b.name as brand_name,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.model_id = ? AND p.is_active = 1
      ORDER BY p.name ASC
    `;
    const products = await database.query(productsQuery, [modelId]);
    return NextResponse.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Erro ao buscar produtos do modelo:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }
    const modelId = parseInt(params.id);
    if (isNaN(modelId)) {
      return NextResponse.json({
        success: false,
        error: 'ID do modelo inválido'
      }, { status: 400 });
    }
    const body = await request.json();
    const { productIds } = body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Lista de produtos é obrigatória'
      }, { status: 400 });
    }
    const modelExists = await database.query(
      'SELECT id FROM models WHERE id = ?',
      [modelId]
    );
    if (modelExists.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Modelo não encontrado'
      }, { status: 404 });
    }
    const placeholders = productIds.map(() => '?').join(',');
    const productsExist = await database.query(
      `SELECT id FROM products WHERE id IN (${placeholders}) AND is_active = 1`,
      productIds
    );
    if (productsExist.length !== productIds.length) {
      return NextResponse.json({
        success: false,
        error: 'Um ou mais produtos não foram encontrados'
      }, { status: 400 });
    }
    await database.query(
      `UPDATE products SET model_id = ?, updated_at = NOW() WHERE id IN (${placeholders})`,
      [modelId, ...productIds]
    );
    return NextResponse.json({
      success: true,
      message: `${productIds.length} produto(s) adicionado(s) ao modelo com sucesso`
    });
  } catch (error) {
    console.error('Erro ao adicionar produtos ao modelo:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }
    const modelId = parseInt(params.id);
    if (isNaN(modelId)) {
      return NextResponse.json({
        success: false,
        error: 'ID do modelo inválido'
      }, { status: 400 });
    }
    const body = await request.json();
    const { productIds } = body;
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Lista de produtos é obrigatória'
      }, { status: 400 });
    }
    const placeholders = productIds.map(() => '?').join(',');
    await database.query(
      `UPDATE products SET model_id = NULL, updated_at = NOW() WHERE id IN (${placeholders}) AND model_id = ?`,
      [...productIds, modelId]
    );
    return NextResponse.json({
      success: true,
      message: `${productIds.length} produto(s) removido(s) do modelo com sucesso`
    });
  } catch (error) {
    console.error('Erro ao remover produtos do modelo:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}