import { NextRequest, NextResponse } from 'next/server'
import { getProductsByModel, getProductVariants } from '@/lib/database'
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    console.log('Buscando produtos para modelo:', slug)
    const products = await getProductsByModel(slug)
    console.log('Produtos encontrados:', products.length)
    const productsWithSizes = []
    for (const product of products) {
      const variants = await getProductVariants(product.id)
      let sizes = variants.map((variant: any) => variant.size).filter(Boolean)
      const allowedSizes = ['38', '39', '40', '41', '42', '43']
      sizes = sizes.filter((size: string) => allowedSizes.includes(size))
      sizes = Array.from(new Set(sizes))
      if (sizes.length === 0) {
        sizes = allowedSizes
      }
      productsWithSizes.push({
        ...product,
        sizes: sizes
      })
    }
    return NextResponse.json({
      success: true,
      data: productsWithSizes
    })
  } catch (error) {
    console.error('Erro ao buscar produtos por modelo:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}