import { NextRequest, NextResponse } from 'next/server';
import database, { 
  getProductSizes, 
  addProductSize, 
  updateProductSizeStock, 
  removeProductSize,
  deactivateProductSize,
  getProductById 
} from '@/lib/database';
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
        { success: false, error: 'ID do produto inválido' },
        { status: 400 }
      );
    }
    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    const sizes = await getProductSizes(productId);
    return NextResponse.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name
        },
        sizes: sizes || []
      }
    });
  } catch (error) {
    console.error('Erro ao buscar tamanhos do produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
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
    const body = await request.json();
    const { size, stock_quantity } = body;
    if (!size || typeof size !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Tamanho é obrigatório' },
        { status: 400 }
      );
    }
    const qtyPost = typeof stock_quantity === 'number' ? stock_quantity : Number(String(stock_quantity).trim());
    if (!Number.isFinite(qtyPost)) {
      return NextResponse.json(
        { success: false, error: 'Quantidade em estoque é obrigatória' },
        { status: 400 }
      );
    }
    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    await addProductSize(productId, size, Math.trunc(qtyPost));
    return NextResponse.json({
      success: true,
      message: 'Tamanho adicionado com sucesso',
      data: {
        product_id: productId,
        size,
        stock_quantity: Math.trunc(qtyPost)
      }
    });
  } catch (error) {
    console.error('Erro ao adicionar tamanho:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
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
    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'ID do produto inválido' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const { id, size, original_size, stock_quantity, is_active } = body as {
      id?: number;
      size: string;
      original_size?: string;
      stock_quantity: number | string;
      is_active: boolean;
    };
    if (!size || typeof size !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Tamanho é obrigatório' },
        { status: 400 }
      );
    }
    const qtyPut = typeof stock_quantity === 'number' ? stock_quantity : Number(String(stock_quantity).trim());
    if (!Number.isFinite(qtyPut)) {
      return NextResponse.json(
        { success: false, error: 'Quantidade em estoque é obrigatória' },
        { status: 400 }
      );
    }
    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    const newSize = size?.trim();
    const whereById = id && Number.isFinite(Number(id));
    const currentLookupSize = (original_size ?? size)?.trim();
    try {
      if (whereById) {
        await database.query(
          'UPDATE product_sizes SET size = ?, stock_quantity = ?, is_active = ?, updated_at = NOW() WHERE product_id = ? AND id = ?',
          [newSize, Math.trunc(qtyPut), is_active ? true : false, productId, id]
        );
      } else {
        await database.query(
          'UPDATE product_sizes SET size = ?, stock_quantity = ?, is_active = ?, updated_at = NOW() WHERE product_id = ? AND size = ?',
          [newSize, Math.trunc(qtyPut), is_active ? true : false, productId, currentLookupSize]
        );
      }
    } catch (e: any) {
      const message = e?.message || e?.toString?.() || 'Erro ao atualizar tamanho';
      if (message.includes('Duplicate') || message.includes('duplicate') || message.includes('UNIQUE')) {
        return NextResponse.json(
          { success: false, error: 'Já existe um tamanho com esse nome para este produto.' },
          { status: 409 }
        );
      }
      console.error('Erro ao atualizar tamanho:', e);
      throw e;
    }
    return NextResponse.json({
      success: true,
      message: 'Estoque do tamanho atualizado com sucesso',
      data: {
        product_id: productId,
        size,
        stock_quantity: Math.trunc(qtyPut)
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar estoque do tamanho:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
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
    const { searchParams } = new URL(request.url);
    const size = searchParams.get('size');
    if (!size) {
      return NextResponse.json(
        { success: false, error: 'Tamanho é obrigatório' },
        { status: 400 }
      );
    }
    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    await removeProductSize(productId, size);
    return NextResponse.json({
      success: true,
      message: 'Tamanho removido com sucesso',
      data: {
        product_id: productId,
        size
      }
    });
  } catch (error) {
    console.error('Erro ao remover tamanho:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}