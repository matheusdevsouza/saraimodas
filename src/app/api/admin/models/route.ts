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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const skip = (page - 1) * limit;
    let query = `
      SELECT 
        m.*,
        COUNT(p.id) as product_count
      FROM models m
      LEFT JOIN products p ON m.id = p.model_id AND p.is_active = TRUE
    `;
    const conditions = [];
    const params = [];
    if (search) {
      conditions.push(`(m.name LIKE ? OR m.description LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status !== 'all') {
      conditions.push(`m.is_active = ?`);
      params.push(status === 'active' ? true : false);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' GROUP BY m.id';
    const validSortColumns = ['name', 'created_at', 'updated_at', 'sort_order'];
    const validSortOrders = ['asc', 'desc'];
    if (validSortColumns.includes(sortBy) && validSortOrders.includes(sortOrder)) {
      query += ` ORDER BY m.${sortBy} ${sortOrder.toUpperCase()}`;
    }
    query += ` LIMIT ${limit} OFFSET ${skip}`;
    const models = await database.query(query, params);
    let countQuery = `SELECT COUNT(DISTINCT m.id) as total FROM models m`;
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await database.query(countQuery, params);
    const total = countResult[0]?.total || 0;
    const pages = Math.ceil(total / limit);
    return NextResponse.json({
      success: true,
      data: {
        models,
        pagination: {
          page,
          pages,
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar modelos:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
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
    if (!body.name) {
      return NextResponse.json({
        success: false,
        error: 'Nome do modelo é obrigatório'
      }, { status: 400 });
    }
    let baseSlug = body.slug || body.name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existingModel = await database.query(
        'SELECT id FROM models WHERE slug = ?',
        [slug]
      );
      if (existingModel.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    const insertQuery = `
      INSERT INTO models (
        name, slug, description, image_url, sort_order, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const result = await database.query(insertQuery, [
      body.name,
      slug,
      body.description || null,
      body.image_url || null,
      body.sort_order || 0,
      body.is_active !== undefined ? (body.is_active ? true : false) : true
    ]);
    const newModel = await database.query(
      'SELECT * FROM models WHERE id = ?',
      [result.insertId]
    );
    return NextResponse.json({
      success: true,
      message: 'Modelo criado com sucesso',
      data: newModel[0]
    });
  } catch (error) {
    console.error('Erro ao criar modelo:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}