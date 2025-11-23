import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
import { authenticateUser, isAdmin } from '@/lib/auth';

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
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID do produto inválido' },
        { status: 400 }
      );
    }

    const product = await database.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    if (!product || product.length === 0) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ product: product[0] });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
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
        { success: false, error: 'Acesso negado. Apenas administradores autorizados.' },
        { status: 401 }
      );
    }
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'ID do produto inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const currentRows = await database.query('SELECT * FROM products WHERE id = ?', [productId]);
    const current = currentRows && currentRows[0] ? currentRows[0] : null;
    if (!current) {
      return NextResponse.json({ success: false, error: 'Produto não encontrado' }, { status: 404 });
    }

    const nextName = body.name !== undefined ? body.name : current.name;
    const nextSlug = (nextName || '')
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const nextDescription = body.description !== undefined ? body.description : current.description;
    const nextPrice = body.price !== undefined ? (body.price === null ? null : parseFloat(body.price)) : current.price;
    const nextStock = body.stock_quantity !== undefined ? (body.stock_quantity === null ? null : parseInt(body.stock_quantity)) : current.stock_quantity;
    const nextIsActive = body.is_active !== undefined ? (body.is_active ? 1 : 0) : current.is_active;
    const nextBrandId = body.brand_id !== undefined ? (body.brand_id === null ? null : parseInt(body.brand_id)) : current.brand_id;
    const nextModelId = body.model_id !== undefined ? (body.model_id === null ? null : parseInt(body.model_id)) : current.model_id;

    const updateQuery = `
      UPDATE products SET 
        name = ?, 
        slug = ?, 
        description = ?, 
        price = ?, 
        stock_quantity = ?, 
        is_active = ?, 
        brand_id = ?, 
        model_id = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    await database.query(updateQuery, [
      nextName,
      nextSlug,
      nextDescription,
      nextPrice,
      nextStock,
      nextIsActive,
      nextBrandId,
      nextModelId,
      productId
    ]);

    const updatedProduct = await database.query(
      'SELECT * FROM products WHERE id = ?',
      [productId]
    );

    return NextResponse.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      product: updatedProduct[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
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
        { success: false, error: 'Acesso negado. Apenas administradores autorizados.' },
        { status: 401 }
      );
    }
    
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'ID do produto inválido' },
        { status: 400 }
      );
    }

    const existingProduct = await database.query(
      'SELECT id FROM products WHERE id = ?',
      [productId]
    );

    if (!existingProduct || existingProduct.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    await database.query(
      'DELETE FROM product_images WHERE product_id = ?',
      [productId]
    );

    await database.query(
      'DELETE FROM product_variants WHERE product_id = ?',
      [productId]
    );

    await database.query(
      'DELETE FROM product_reviews WHERE product_id = ?',
      [productId]
    );

    await database.query(
      'DELETE FROM order_items WHERE product_id = ?',
      [productId]
    );

    await database.query(
      'DELETE FROM products WHERE id = ?',
      [productId]
    );

    return NextResponse.json({
      success: true,
      message: 'Produto excluído com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}