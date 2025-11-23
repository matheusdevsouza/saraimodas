import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { authenticateUser, isAdmin } from '@/lib/auth';
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }
    const categories = await database.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count 
       FROM categories c 
       WHERE c.is_active = TRUE 
       ORDER BY c.sort_order ASC`
    );
    const mappedCategories = categories.map((cat: any) => ({
      ...cat,
      is_active: Boolean(cat.is_active),
      subcategories: [], 
      _count: {
        products: cat.product_count || 0
      }
    }));
    return NextResponse.json({
      success: true,
      data: mappedCategories
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado' },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { name, description, image_url, sort_order } = body;
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    const result = await database.query(
      `INSERT INTO categories (name, slug, description, image_url, sort_order, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
      [name, slug, description, image_url, sort_order ? parseInt(sort_order) : 0]
    );
    return NextResponse.json({
      success: true,
      data: { id: result.insertId, name, slug, description, image_url, sort_order, is_active: true },
      message: 'Categoria criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}