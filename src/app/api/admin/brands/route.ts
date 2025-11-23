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
    const brands = await database.query(
      `SELECT b.*, 
        (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) as product_count 
       FROM brands b 
       WHERE b.is_active = TRUE 
       ORDER BY b.name ASC`
    );
    const mappedBrands = brands.map((brand: any) => ({
      ...brand,
      is_active: Boolean(brand.is_active),
      _count: {
        products: brand.product_count || 0
      }
    }));
    return NextResponse.json({
      success: true,
      data: mappedBrands
    });
  } catch (error) {
    console.error('Erro ao buscar marcas:', error);
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
    const { name, description, logo_url, website } = body;
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const result = await database.query(
      `INSERT INTO brands (name, slug, description, logo_url, website, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, TRUE, NOW(), NOW())`,
      [name, slug, description, logo_url, website]
    );
    return NextResponse.json({
      success: true,
      data: { id: result.insertId, name, slug, description, logo_url, website, is_active: true },
      message: 'Marca criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar marca:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}