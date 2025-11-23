import { NextRequest, NextResponse } from 'next/server'
import database from '@/lib/database'
import { authenticateUser, isAdmin } from '@/lib/auth'
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const excludeModelId = searchParams.get('excludeModelId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    let query = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.stock_quantity,
        p.model_id,
        b.name as brand_name,
        m.name as current_model_name,
        pi.image_url as primary_image
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN models m ON p.model_id = m.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      WHERE p.is_active = 1
    `;
    const params = [];
    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ? OR b.name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (excludeModelId) {
      query += ' AND (p.model_id IS NULL OR p.model_id != ?)';
      params.push(parseInt(excludeModelId));
    }
    query += ' ORDER BY p.name ASC';
    query += ` LIMIT ${limit} OFFSET ${skip}`;
    const products = await database.query(query, params);
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.is_active = 1
    `;
    const countParams = [];
    if (search) {
      countQuery += ' AND (p.name LIKE ? OR p.description LIKE ? OR b.name LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (excludeModelId) {
      countQuery += ' AND (p.model_id IS NULL OR p.model_id != ?)';
      countParams.push(parseInt(excludeModelId));
    }
    const countResult = await database.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    const pages = Math.ceil(total / limit);
    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          pages,
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos disponíveis:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}