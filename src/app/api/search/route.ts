import { NextRequest, NextResponse } from 'next/server';
import database from '@/lib/database';
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Query de busca deve ter pelo menos 2 caracteres'
      }, { status: 400 });
    }
    const searchTerm = query.trim().toLowerCase();
    const likeTerm = `%${searchTerm}%`;
    const results: Array<{
      id: number;
      name: string;
      slug: string;
      price: number;
      image: string;
      type: 'product' | 'brand' | 'category';
      brand?: string;
      category?: string;
    }> = [];
    const products = await database.query(
      `SELECT p.id, p.name, p.slug, p.price, p.description,
              b.name as brand_name, 
              c.name as category_name,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as image_url
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE (p.name LIKE ? OR p.description LIKE ? OR p.slug LIKE ?)
       AND p.is_active = TRUE
       LIMIT 5`,
      [likeTerm, likeTerm, likeTerm]
    );
    products.forEach((product: any) => {
      results.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        image: product.image_url || '',
        type: 'product' as const,
        brand: product.brand_name,
        category: product.category_name
      });
    });
    const brands = await database.query(
      `SELECT * FROM brands 
       WHERE (name LIKE ? OR slug LIKE ?) 
       AND is_active = TRUE 
       LIMIT 3`,
      [likeTerm, likeTerm]
    );
    brands.forEach((brand: any) => {
      results.push({
        id: brand.id,
        name: brand.name,
        slug: brand.slug || brand.name.toLowerCase().replace(/\s+/g, '-'),
        price: 0,
        image: brand.logo_url || '',
        type: 'brand' as const,
        brand: brand.name,
        category: undefined
      });
    });
    const categories = await database.query(
      `SELECT * FROM categories 
       WHERE (name LIKE ? OR slug LIKE ?) 
       AND is_active = TRUE 
       LIMIT 3`,
      [likeTerm, likeTerm]
    );
    categories.forEach((category: any) => {
      results.push({
        id: category.id,
        name: category.name,
        slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
        price: 0,
        image: '',
        type: 'category' as const,
        brand: undefined,
        category: category.name
      });
    });
    const typeOrder = { product: 1, brand: 2, category: 3 };
    results.sort((a, b) => {
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      const aNameMatch = a.name.toLowerCase().includes(searchTerm);
      const bNameMatch = b.name.toLowerCase().includes(searchTerm);
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      return 0;
    });
    const limitedResults = results.slice(0, 10);
    return NextResponse.json({
      success: true,
      results: limitedResults,
      total: limitedResults.length,
      query: searchTerm
    });
  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 });
  }
}
