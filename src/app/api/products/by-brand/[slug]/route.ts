import { NextRequest, NextResponse } from 'next/server'
import { getProductsByBrand, getProductVariants } from '@/lib/database'
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const products = await getProductsByBrand(slug)
    const productsWithSizes = await Promise.all(
      products.map(async (product: any) => {
        const variants = await getProductVariants(product.id)
        let sizes = variants.map((variant: any) => variant.size).filter(Boolean)
        const allowedSizes = ['38', '39', '40', '41', '42', '43']
        sizes = sizes.filter((size: string) => allowedSizes.includes(size))
        sizes = Array.from(new Set(sizes))
        if (sizes.length === 0) {
          sizes = allowedSizes
        }
        return {
          ...product,
          sizes
        }
      })
    )
    return NextResponse.json({ success: true, data: productsWithSizes })
  } catch (error) {
    console.error('Erro ao buscar produtos por marca:', error)
    return NextResponse.json({ success: false, error: 'Erro interno do servidor' }, { status: 500 })
  }
}