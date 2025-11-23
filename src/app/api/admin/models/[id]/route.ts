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
    const modelQuery = `
      SELECT 
        m.*,
        COUNT(p.id) as product_count
      FROM models m
      LEFT JOIN products p ON m.id = p.model_id AND p.is_active = 1
      WHERE m.id = ?
      GROUP BY m.id
    `;
    const models = await database.query(modelQuery, [modelId]);
    if (models.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Modelo não encontrado'
      }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: models[0]
    });
  } catch (error) {
    console.error('Erro ao buscar modelo:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
export async function PATCH(
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
    const existingModel = await database.query(
      'SELECT * FROM models WHERE id = ?',
      [modelId]
    );
    if (existingModel.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Modelo não encontrado'
      }, { status: 404 });
    }
    let slug = existingModel[0].slug;
    if (body.name && body.name !== existingModel[0].name) {
      let baseSlug = body.name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      let newSlug = baseSlug;
      let counter = 1;
      while (true) {
        const existingSlug = await database.query(
          'SELECT id FROM models WHERE slug = ? AND id != ?',
          [newSlug, modelId]
        );
        if (existingSlug.length === 0) break;
        newSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slug = newSlug;
    }
    const updateQuery = `
      UPDATE models SET 
        name = ?, 
        slug = ?, 
        description = ?, 
        image_url = ?, 
        sort_order = ?, 
        is_active = ?, 
        updated_at = NOW()
      WHERE id = ?
    `;
    await database.query(updateQuery, [
      body.name || existingModel[0].name,
      slug,
      body.description !== undefined ? body.description : existingModel[0].description,
      body.image_url !== undefined ? body.image_url : existingModel[0].image_url,
      body.sort_order !== undefined ? body.sort_order : existingModel[0].sort_order,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : existingModel[0].is_active,
      modelId
    ]);
    const updatedModel = await database.query(
      'SELECT * FROM models WHERE id = ?',
      [modelId]
    );
    return NextResponse.json({
      success: true,
      message: 'Modelo atualizado com sucesso',
      data: updatedModel[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar modelo:', error);
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
    const existingModel = await database.query(
      'SELECT * FROM models WHERE id = ?',
      [modelId]
    );
    if (existingModel.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Modelo não encontrado'
      }, { status: 404 });
    }
    const productsCount = await database.query(
      'SELECT COUNT(*) as count FROM products WHERE model_id = ? AND is_active = 1',
      [modelId]
    );
    if (productsCount[0].count > 0) {
      return NextResponse.json({
        success: false,
        error: `Não é possível excluir o modelo. Existem ${productsCount[0].count} produto(s) associado(s) a ele.`
      }, { status: 400 });
    }
    await database.query('DELETE FROM models WHERE id = ?', [modelId]);
    return NextResponse.json({
      success: true,
      message: 'Modelo excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir modelo:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}