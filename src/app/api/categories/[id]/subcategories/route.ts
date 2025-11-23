import { NextRequest, NextResponse } from 'next/server'
import database from '@/lib/database'
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = parseInt(params.id)
    if (isNaN(categoryId)) {
      return NextResponse.json({
        success: false,
        error: 'ID da categoria inválido'
      }, { status: 400 })
    }
    const subcategories = await database.query(
      'SELECT * FROM subcategories WHERE category_id = ? AND is_active = TRUE ORDER BY name ASC',
      [categoryId]
    )
    const mappedSubcategories = subcategories.map((sub: any) => ({
      ...sub,
      is_active: Boolean(sub.is_active)
    }))
    return NextResponse.json({
      success: true,
      data: mappedSubcategories || []
    })
  } catch (error) {
    console.error('Erro ao buscar subcategorias:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      data: []
    }, { status: 500 })
  }
}
