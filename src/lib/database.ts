import { Pool, QueryResult } from 'pg'
import { 
  encryptPersonalData, 
  decryptPersonalData, 
  encryptOrderData, 
  decryptOrderData,
  hashUserId,
  verifyUserIdHash,
  searchUserByEmail,
  ENCRYPTION_ENABLED
} from './encryption'
import { 
  encryptForDatabase, 
  decryptFromDatabase, 
  ENCRYPTION_FIELDS,
  encryptValue
} from './transparent-encryption'

interface DBConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  max?: number
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
}
interface ProductFilters {
  brand_id?: number
  category_id?: number
  subcategory_id?: number
  subcategory_slug?: string
  color?: string
  is_featured?: boolean
  search?: string
  limit?: number
  unique?: boolean
  min_price?: number
  max_price?: number
  color_ids?: number[] 
}
interface OrderData {
  user_id?: number
  items: OrderItem[]
  customer: Customer
  shipping_address: ShippingAddress
  payment_data?: PaymentData
}
interface OrderItem {
  product_id: number
  variant_id?: number
  name: string
  sku?: string
  size?: string
  color?: string
  product_color?: string
  quantity: number
  price: number
}
interface Customer {
  name: string
  email: string
  phone?: string
  cpf?: string
}
interface ShippingAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipcode: string
}
interface PaymentData {
  external_reference?: string
  payment_status?: string
  payment_method?: string
  payment_id?: string
}
interface UserData {
  name: string
  email: string
  phone?: string
  cpf?: string
  password?: string
}
interface ReviewData {
  product_id: number
  user_id?: number
  reviewer_name: string
  reviewer_email: string
  rating: number
  title?: string
  comment: string
}
interface TestimonialFilters {
  is_featured?: boolean
  limit?: number
}

const dbConfig: DBConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}

let pool: Pool | null = null

function initializePool() {
  if (pool) return pool;
  
  if (process.env.NODE_ENV === 'development') {
    if (!(globalThis as any)._pgPool) {
      (globalThis as any)._pgPool = new Pool(dbConfig)
    }
    pool = (globalThis as any)._pgPool
  } else {
    pool = new Pool(dbConfig)
  }
  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    initializePool();
  }
  return pool as Pool
}

function convertQueryToPg(sql: string): string {
  let i = 1;
  let converted = sql.replace(/\?/g, () => `$${i++}`);
  
  if (converted.trim().toUpperCase().startsWith('INSERT') && !converted.toUpperCase().includes('RETURNING')) {
    converted = converted.replace(/;\s*$/, '');
    converted += ' RETURNING id';
  }
  
  return converted;
}

async function query(sql: string, params: any[] = []): Promise<any> {
  try {
    if (typeof window !== 'undefined') {
      throw new Error('Database queries cannot be executed in the browser');
    }
    const pool = getPool()
    const pgSql = convertQueryToPg(sql);
    
    const result = await pool.query(pgSql, params)
    
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      return result.rows
    }
    
    return {
      insertId: result.rows.length > 0 && result.rows[0].id ? result.rows[0].id : 0,
      affectedRows: result.rowCount,
      rows: result.rows
    }
  } catch (error) {
    console.error('Erro na query:', error)
    console.error('SQL Original:', sql)
    throw error
  }
}

export async function transaction(queries: Array<{ sql: string; params: any[] }>): Promise<any[]> {
  const pool = getPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const results = []
    for (const { sql, params } of queries) {
      const pgSql = convertQueryToPg(sql);
      const result = await client.query(pgSql, params)
      
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        results.push(result.rows)
      } else {
        results.push({
          insertId: result.rows.length > 0 && result.rows[0].id ? result.rows[0].id : 0,
          affectedRows: result.rowCount
        })
      }
    }
    await client.query('COMMIT')
    return results
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getProducts(filters: ProductFilters = {}): Promise<any[]> {
  let sql = `
    SELECT p.*, b.name as brand_name, c.name as category_name, 
           s.name as subcategory_name, pi.image_url as primary_image
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories s ON p.subcategory_id = s.id
    LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
    WHERE p.is_active = TRUE
  `
  const params: any[] = []
  if (filters.brand_id) {
    sql += ' AND p.brand_id = ?'
    params.push(filters.brand_id)
  }
  if (filters.category_id) {
    sql += ' AND p.category_id = ?'
    params.push(filters.category_id)
  }
  if (filters.subcategory_id) {
    sql += ' AND p.subcategory_id = ?'
    params.push(filters.subcategory_id)
  }
  if (filters.subcategory_slug) {
    sql += ' AND s.slug = ?'
    params.push(filters.subcategory_slug)
  }
  if (filters.color) {
    sql += ' AND p.color = ?'
    params.push(filters.color)
  }
  if (filters.min_price !== undefined) {
    sql += ' AND p.price >= ?'
    params.push(filters.min_price)
  }
  if (filters.max_price !== undefined) {
    sql += ' AND p.price <= ?'
    params.push(filters.max_price)
  }
  if (filters.is_featured) {
    sql += ' AND p.is_featured = TRUE'
  }
  if (filters.search) {
    sql += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.color LIKE ?)'
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`)
  }
  sql += ' ORDER BY p.id ASC'
  if (filters.limit) {
    sql += ' LIMIT ?'
    params.push(parseInt(filters.limit.toString()))
  }
  return await query(sql, params)
}
export async function getProductById(id: number): Promise<any | null> {
  try {
    const sql = `
      SELECT p.*, b.name as brand_name, c.name as category_name, s.name as subcategory_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.id = ? AND p.is_active = TRUE
    `
    const results = await query(sql, [id])
    return results[0] || null
  } catch (error) {
    console.error('Erro ao buscar produto por ID:', error);
    return null;
  }
}
export async function getProductBySlug(slug: string): Promise<any | null> {
  try {
    const sql = `
      SELECT p.*, b.name as brand_name, c.name as category_name, s.name as subcategory_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.slug = ? AND p.is_active = TRUE
    `;
    const results = await query(sql, [slug]);
    return results[0] || null;
  } catch (error) {
    console.error('Erro ao buscar produto por slug:', error);
    return null;
  }
}
export async function getProductImages(productId: number): Promise<any[]> {
  try {
    const sql = `
      SELECT * FROM product_images 
      WHERE product_id = ? 
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `;
    return await query(sql, [productId]);
  } catch (error) {
    console.error('Erro ao buscar imagens do produto:', error);
    return [];
  }
}
export async function getProductVideos(productId: number): Promise<any[]> {
  try {
    const sql = `
      SELECT * FROM product_videos 
      WHERE product_id = ? 
      ORDER BY is_primary DESC, sort_order ASC, id ASC
    `;
    return await query(sql, [productId]);
  } catch (error) {
    console.warn('Tabela product_videos não encontrada, retornando array vazio');
    return [];
  }
}
export async function getProductMedia(productId: number): Promise<{ images: any[], videos: any[] }> {
  try {
    const [images, videos] = await Promise.all([
      getProductImages(productId),
      getProductVideos(productId)
    ]);
    return { images, videos };
  } catch (error) {
    console.error('Erro ao buscar mídia do produto:', error);
    return { images: [], videos: [] };
  }
}
export async function getProductVariants(productId: number): Promise<any[]> {
  try {
    const sql = `
      SELECT DISTINCT size, id, product_id, is_active, created_at, updated_at
      FROM product_variants 
      WHERE product_id = ? AND is_active = TRUE
      ORDER BY size ASC
    `
    return await query(sql, [productId])
  } catch (error) {
    console.warn('Tabela product_variants não encontrada, retornando array vazio');
    return [];
  }
}
export async function getProductSizes(productId: number): Promise<any[]> {
  try {
    const sql = `
      SELECT id, product_id, size, stock_quantity, is_active, created_at, updated_at
      FROM product_sizes 
      WHERE product_id = ?
      ORDER BY CAST(size AS INTEGER) ASC, size ASC
    `
    const result = await query(sql, [productId]);
    return result;
  } catch (error) {
    console.warn('Tabela product_sizes não encontrada, retornando array vazio');
    return [];
  }
}
export async function getActiveProductSizes(productId: number): Promise<any[]> {
  try {
    const sql = `
      SELECT id, product_id, size, stock_quantity, is_active, created_at, updated_at
      FROM product_sizes 
      WHERE product_id = ? AND is_active = TRUE
      ORDER BY CAST(size AS INTEGER) ASC, size ASC
    `
    return await query(sql, [productId])
  } catch (error) {
    console.warn('Tabela product_sizes não encontrada, retornando array vazio');
    return [];
  }
}
export async function addProductSize(productId: number, size: string, stockQuantity: number = 0): Promise<any> {
  try {
    const sql = `
      INSERT INTO product_sizes (product_id, size, stock_quantity, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 1, NOW(), NOW())
      ON CONFLICT (product_id, size) DO UPDATE SET
        stock_quantity = EXCLUDED.stock_quantity,
        is_active = 1,
        updated_at = NOW()
    `
    return await query(sql, [productId, size, stockQuantity])
  } catch (error) {
    console.error('Erro ao adicionar tamanho do produto:', error);
    throw error;
  }
}
export async function updateProductSizeStock(productId: number, size: string, stockQuantity: number): Promise<any> {
  try {
    const sql = `
      UPDATE product_sizes 
      SET stock_quantity = ?, updated_at = NOW()
      WHERE product_id = ? AND size = ?
    `
    return await query(sql, [stockQuantity, productId, size])
  } catch (error) {
    console.error('Erro ao atualizar estoque do tamanho:', error);
    throw error;
  }
}
export async function removeProductSize(productId: number, size: string): Promise<any> {
  try {
    const sql = `
      DELETE FROM product_sizes 
      WHERE product_id = ? AND size = ?
    `
    return await query(sql, [productId, size])
  } catch (error) {
    console.error('Erro ao remover tamanho do produto:', error);
    throw error;
  }
}
export async function deactivateProductSize(productId: number, size: string): Promise<any> {
  try {
    const sql = `
      UPDATE product_sizes 
      SET is_active = 0, updated_at = NOW()
      WHERE product_id = ? AND size = ?
    `
    return await query(sql, [productId, size])
  } catch (error) {
    console.error('Erro ao desativar tamanho do produto:', error);
    throw error;
  }
}
export async function getProductTotalStock(productId: number): Promise<number> {
  try {
    const sql = `
      SELECT COALESCE(SUM(stock_quantity), 0) as total_stock
      FROM product_sizes 
      WHERE product_id = ? AND is_active = TRUE
    `
    const result = await query(sql, [productId])
    return result[0]?.total_stock || 0
  } catch (error) {
    console.error('Erro ao obter estoque total do produto:', error);
    return 0
  }
}
export async function getAvailableColors(): Promise<any[]> {
  const sql = `
    SELECT DISTINCT color, color_hex, COUNT(*) as product_count
    FROM products 
    WHERE is_active = TRUE AND color IS NOT NULL
    GROUP BY color, color_hex
    ORDER BY product_count DESC, color ASC
  `
  return await query(sql)
}
export async function getSimilarProducts(productId: number): Promise<any[]> {
  const sql = `
    SELECT p2.*, pi.image_url as primary_image
    FROM products p1
    JOIN products p2 ON p1.subcategory_id = p2.subcategory_id 
    LEFT JOIN product_images pi ON p2.id = pi.product_id AND pi.is_primary = TRUE
    WHERE p1.id = ? AND p2.id != ? AND p2.is_active = TRUE
  `;
  return await query(sql, [productId, productId]);
}
export async function getBrands(): Promise<any[]> {
  const sql = 'SELECT * FROM brands WHERE is_active = TRUE ORDER BY name ASC'
  const results = await query(sql)
  return results.map((brand: any) => ({
    ...brand,
    logo_url: brand.use_blob ? `/api/brands/images/${brand.id}` : brand.logo_url
  }))
}
export async function getBrandByName(name: string): Promise<any | null> {
  const sql = 'SELECT * FROM brands WHERE name = ? AND is_active = TRUE'
  const results = await query(sql, [name])
  return results[0] || null
}
export async function getBrandBySlug(slug: string): Promise<any | null> {
  const sqlBySlug = 'SELECT * FROM brands WHERE slug = ? AND is_active = TRUE'
  const resultsBySlug = await query(sqlBySlug, [slug])
  if (resultsBySlug.length > 0) {
    return resultsBySlug[0]
  }
  const brandName = slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return await getBrandByName(brandName)
}
export async function getCategories(): Promise<any[]> {
  const sql = 'SELECT * FROM categories WHERE is_active = TRUE ORDER BY sort_order ASC, name ASC'
  return await query(sql)
}
export async function getSubcategories(categoryId: number | null = null): Promise<any[]> {
  let sql = 'SELECT * FROM subcategories WHERE is_active = TRUE'
  const params: any[] = []
  if (categoryId) {
    sql += ' AND category_id = ?'
    params.push(categoryId)
  }
  sql += ' ORDER BY sort_order ASC, name ASC'
  return await query(sql, params)
}
export async function createOrder(orderData: OrderData): Promise<{ orderId: number; orderNumber: string; total_amount: number }> {
  const { user_id, items, customer, shipping_address, payment_data } = orderData
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping_cost = subtotal > 199 ? 0 : 15.90
  const total_amount = subtotal + shipping_cost
  const orderSql = `
    INSERT INTO orders (
      user_id, order_number, external_reference, status, payment_status,
      subtotal, shipping_cost, total_amount, customer_name, customer_email,
      customer_phone, customer_cpf, shipping_address
    ) VALUES (?, ?, ?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?, ?)
  `
  const orderNumber = `VPF${Date.now()}`
  const externalReference = payment_data?.external_reference || `order_${Date.now()}`
  const orderParams = [
    user_id,
    orderNumber,
    externalReference,
    subtotal,
    shipping_cost,
    total_amount,
    customer.name,
    customer.email,
    customer.phone,
    customer.cpf || null,
    JSON.stringify(shipping_address)
  ]
  const orderResult = await query(orderSql, orderParams)
  const orderId = orderResult.insertId
  for (const item of items) {
    const itemSql = `
      INSERT INTO order_items (
        order_id, product_id, variant_id, product_name, product_sku,
        size, color, product_color, quantity, unit_price, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const itemParams = [
      orderId,
      item.product_id,
      item.variant_id || null,
      item.name,
      item.sku || null,
      item.size || null,
      item.color || null,
      item.product_color || null,
      item.quantity,
      item.price,
      item.price * item.quantity
    ]
    await query(itemSql, itemParams)
  }
  return { orderId, orderNumber, total_amount }
}
export async function updateOrderStatus(orderId: number, status: string, paymentData: Partial<PaymentData> = {}): Promise<any> {
  const sql = `
    UPDATE orders 
    SET status = ?, payment_status = ?, payment_method = ?, payment_id = ?, updated_at = NOW()
    WHERE id = ?
  `
  const params = [
    status,
    paymentData.payment_status || status,
    paymentData.payment_method || null,
    paymentData.payment_id || null,
    orderId
  ]
  return await query(sql, params)
}
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  gender?: 'M' | 'F' | 'Other';
}
async function createUser(userData: CreateUserData): Promise<any> {
  const sql = `
    INSERT INTO users (name, email, password, phone, cpf, birth_date, gender, email_verified_at, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 1)
  `;
  const params = [
    userData.name,
    userData.email,
    userData.password, 
    userData.phone || null,
    userData.cpf || null,
    userData.birth_date || null,
    userData.gender || null,
  ];
  return await queryWithEncryption(sql, params, 'users');
}
async function getUserByEmail(email: string): Promise<any> {
  const sql = `SELECT * FROM users WHERE is_active = 1`;
  const result = await queryWithEncryption(sql, [], 'users');
  if (result && result.length > 0) {
    const user = result.find((user: any) => {
      try {
        const decryptedEmail = user.email?.toLowerCase()?.trim();
        return decryptedEmail === email.toLowerCase().trim();
      } catch (error) {
        return false;
      }
    });
    if (user) {
      return user;
    }
  }
  return null;
}
export async function getUserById(id: number): Promise<any> {
  const sql = `SELECT * FROM users WHERE id = ? AND is_active = 1`;
  const result = await query(sql, [id]);
  if (result[0]) {
    try {
      return decryptPersonalData(result[0]);
    } catch (error) {
      console.warn('Erro ao descriptografar dados do usuário:', error instanceof Error ? error.message : String(error));
      return result[0]; 
    }
  }
  return null;
}
export async function getUserByUuid(uuid: string): Promise<any> {
  const sql = `SELECT * FROM users WHERE user_uuid = ? AND is_active = 1`;
  const result = await query(sql, [uuid]);
  if (result[0]) {
    try {
      return decryptPersonalData(result[0]);
    } catch (error) {
      console.warn('Erro ao descriptografar dados do usuário:', error instanceof Error ? error.message : String(error));
      return result[0]; 
    }
  }
  return null;
}
export async function updateUserEmailVerification(userId: number): Promise<any> {
  const sql = `UPDATE users SET email_verified_at = NOW() WHERE id = ?`;
  return await query(sql, [userId]);
}
async function updateUserLastLogin(userId: number): Promise<any> {
  const sql = `UPDATE users SET last_login = NOW() WHERE id = ?`;
  return await query(sql, [userId]);
}
async function createVerificationToken(userId: number, token: string): Promise<any> {
  const sql = `
    INSERT INTO email_verification_tokens (user_id, token, expires_at)
    VALUES (?, ?, NOW() + INTERVAL '24 HOURS') 
  `;
  return await query(sql, [userId, token]);
}
export async function getVerificationToken(token: string): Promise<any> {
  const sql = `
    SELECT vt.*, u.email, u.name 
    FROM email_verification_tokens vt
    JOIN users u ON vt.user_id = u.id
    WHERE vt.token = ? AND vt.expires_at > NOW() AND vt.is_used = 0
  `;
  const result = await query(sql, [token]);
  return result[0] || null;
}
export async function markVerificationTokenAsUsed(token: string): Promise<any> {
  const sql = `UPDATE email_verification_tokens SET is_used = 1, used_at = NOW() WHERE token = ?`;
  return await query(sql, [token]);
}
export async function deleteExpiredVerificationTokens(): Promise<any> {
  const sql = `DELETE FROM email_verification_tokens WHERE expires_at < NOW()`;
  return await query(sql);
}
export async function createPasswordResetToken(userId: number, token: string): Promise<any> {
  const sql = `
    INSERT INTO password_reset_tokens (user_id, token, expires_at)
    VALUES (?, ?, NOW() + INTERVAL '1 HOUR')
  `;
  return await query(sql, [userId, token]);
}
export async function getPasswordResetToken(token: string): Promise<any> {
  const sql = `
    SELECT prt.*, u.email, u.name 
    FROM password_reset_tokens prt
    JOIN users u ON prt.user_id = u.id
    WHERE prt.token = ? AND prt.expires_at > NOW() AND prt.is_used = 0
  `;
  const result = await query(sql, [token]);
  return result[0] || null;
}
export async function markPasswordResetTokenAsUsed(token: string): Promise<any> {
  const sql = `UPDATE password_reset_tokens SET is_used = 1, used_at = NOW() WHERE token = ?`;
  return await query(sql, [token]);
}
export async function updateUserPassword(userId: number, hashedPassword: string): Promise<any> {
  const sql = `UPDATE users SET password = ? WHERE id = ?`;
  return await query(sql, [hashedPassword, userId]);
}
export async function deleteExpiredPasswordResetTokens(): Promise<any> {
  const sql = `DELETE FROM password_reset_tokens WHERE expires_at < NOW()`;
  return await query(sql);
}
export async function isEmailAlreadyRegistered(email: string): Promise<boolean> {
  const sql = `SELECT COUNT(*) as count FROM users WHERE email = ?`;
  const result = await query(sql, [email]);
  return parseInt(result[0].count) > 0;
}
export async function isUserEmailVerified(userId: number): Promise<boolean> {
  const sql = `SELECT email_verified_at FROM users WHERE id = ?`;
  const result = await query(sql, [userId]);
  return result[0]?.email_verified_at !== null;
}
export async function getProductReviews(productId: number, limit: number = 10): Promise<any[]> {
  try {
    const sql = `
      SELECT * FROM product_reviews 
      WHERE product_id = ? AND is_approved = TRUE
      ORDER BY created_at DESC
      LIMIT ?
    `
    return await query(sql, [productId, limit])
  } catch (error) {
    console.warn('Tabela product_reviews não encontrada, retornando array vazio');
    return []
  }
}
export async function createProductReview(reviewData: ReviewData): Promise<any> {
  const sql = `
    INSERT INTO product_reviews (
      product_id, user_id, reviewer_name, reviewer_email, rating, title, comment, is_approved
    ) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)
  `
  const params = [
    reviewData.product_id,
    reviewData.user_id || null,
    reviewData.reviewer_name,
    reviewData.reviewer_email,
    reviewData.rating,
    reviewData.title || null,
    reviewData.comment,
  ]
  return await query(sql, params)
}
export async function getTestimonials(filters: TestimonialFilters = {}): Promise<any[]> {
  let sql = `
    SELECT t.*
    FROM testimonials t
    WHERE t.is_active = TRUE
  `
  const params: any[] = []
  if (filters.is_featured !== undefined) {
    sql += ' AND t.is_featured = ?'
    params.push(filters.is_featured)
  }
  sql += ' ORDER BY t.is_featured DESC, t.sort_order ASC, t.created_at DESC'
  if (filters.limit) {
    sql += ' LIMIT ?'
    params.push(filters.limit)
  }
  return await query(sql, params)
}
export async function getBanners(position: string = 'hero'): Promise<any[]> {
  const sql = `
    SELECT * FROM banners 
    WHERE is_active = TRUE AND position = ?
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
    ORDER BY sort_order ASC
  `
  return await query(sql, [position])
}
export async function getSetting(key: string): Promise<string | null> {
  const sql = 'SELECT setting_value FROM site_settings WHERE setting_key = ?'
  const results = await query(sql, [key])
  return results[0]?.setting_value || null
}
export async function setSetting(key: string, value: string, type: string = 'text'): Promise<any> {
  const sql = `
    INSERT INTO site_settings (setting_key, setting_value, setting_type, updated_at)
    VALUES (?, ?, ?, NOW())
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
  `
  return await query(sql, [key, value, type])
}
export async function getModels(): Promise<any[]> {
  try {
    const sql = `
      SELECT id, name, slug, description, image_url, use_blob, sort_order
      FROM models 
      WHERE is_active = TRUE 
      ORDER BY sort_order ASC
    `
    const results = await query(sql)
    return results.map((model: any) => ({
      ...model,
      image_url: model.use_blob ? `/api/models/images/${model.id}` : model.image_url
    }))
  } catch (error) {
    console.error('Erro em getModels:', error)
    throw error
  }
}
export async function getModelBySlug(slug: string): Promise<any | null> {
  try {
    const sql = `
      SELECT id, name, slug, description, image_url, use_blob
      FROM models 
      WHERE slug = ?
    `
    const results = await query(sql, [slug])
    if (results.length > 0) {
      const model = results[0]
      return {
        ...model,
        image_url: model.use_blob ? `/api/models/images/${model.id}` : model.image_url
      }
    }
    return null
  } catch (error) {
    console.error('Erro em getModelBySlug:', error)
    throw error
  }
}
export async function searchProducts(searchQuery: string): Promise<any[]> {
  try {
    const sql = `
      SELECT DISTINCT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.original_price,
        p.is_new,
        p.is_featured,
        p.is_bestseller,
        p.stock_quantity,
        p.created_at,
        b.name as brand_name,
        c.name as category_name,
        sc.name as subcategory_name,
        COALESCE(pi.image_url, '/images/Logo.png') as image
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      WHERE p.is_active = TRUE
        AND (
          p.name ILIKE ? OR
          p.description ILIKE ? OR
          b.name ILIKE ? OR
          c.name ILIKE ? OR
          sc.name ILIKE ? OR
          p.slug ILIKE ?
        )
      ORDER BY 
        CASE 
          WHEN p.name ILIKE ? THEN 1
          WHEN p.name ILIKE ? THEN 2
          ELSE 3
        END,
        p.is_featured DESC,
        p.is_new DESC,
        p.created_at DESC
      LIMIT 100
    `
    const searchTerm = `%${searchQuery}%`
    const startsWith = `${searchQuery}%`
    const exactMatch = searchQuery
    const results = await query(sql, [
      searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
      startsWith, exactMatch
    ])
    return results
  } catch (error) {
    console.error('Erro em searchProducts:', error)
    throw error
  }
}
export async function getProductsByModel(modelSlug: string): Promise<any[]> {
  try {
    const modelSql = `
      SELECT id, name, slug 
      FROM models 
      WHERE slug = ? AND is_active = TRUE
    `
    const modelResults = await query(modelSql, [modelSlug])
    if (modelResults.length === 0) {
      return []
    }
    const model = modelResults[0]
    const productsSql = `
      SELECT p.*, b.name as brand_name, c.name as category_name, 
             s.name as subcategory_name,
             (
               SELECT pi2.image_url FROM product_images pi2 
               WHERE pi2.product_id = p.id AND pi2.is_primary = TRUE 
               LIMIT 1
             ) as primary_image
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN subcategories s ON p.subcategory_id = s.id
      WHERE p.is_active = TRUE 
        AND p.model_id = ?
      GROUP BY p.id, b.name, c.name, s.name
      ORDER BY p.created_at DESC
    `
    const products = await query(productsSql, [model.id])
    return products
  } catch (error) {
    console.error('Erro em getProductsByModel:', error)
    throw error
  }
}
export async function getProductsByBrand(brandSlug: string): Promise<any[]> {
  let brand = await getBrandBySlug(brandSlug)
  if (!brand) {
    const brandName = brandSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    brand = await getBrandByName(brandName)
  }
  if (!brand) return []
  const sql = `
    SELECT p.*, b.name as brand_name, c.name as category_name, 
           s.name as subcategory_name,
           (
             SELECT pi2.image_url FROM product_images pi2 WHERE pi2.product_id = p.id AND pi2.is_primary = TRUE LIMIT 1
           ) as primary_image
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN subcategories s ON p.subcategory_id = s.id
    WHERE p.is_active = TRUE 
      AND p.brand_id = ?
    GROUP BY p.id, b.name, c.name, s.name
    ORDER BY p.created_at DESC
  `
  return await query(sql, [brand.id])
}
export async function getProductColors(): Promise<any[]> {
  const sql = `
    SELECT DISTINCT color as name, color_hex as hex, color as slug
    FROM products 
    WHERE is_active = TRUE AND color IS NOT NULL
    ORDER BY color ASC
  `;
  return await query(sql);
}
export async function getOrderByTrackingCode(trackingCode: string): Promise<any | null> {
  const sql = `
    SELECT * FROM orders 
    WHERE tracking_code = ? AND is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 1
  `
  const results = await query(sql, [trackingCode]);
  return results[0] || null;
}
export async function getOrderItems(orderId: number): Promise<any[]> {
  const sql = `
    SELECT oi.*, p.name, p.slug
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ? AND oi.is_active = TRUE
    ORDER BY oi.created_at ASC
  `
  return await query(sql, [orderId]);
}
export async function getOrderById(orderId: number): Promise<any | null> {
  const sql = `
    SELECT * FROM orders 
    WHERE id = ? AND is_active = TRUE
  `
  const results = await query(sql, [orderId]);
  return results[0] || null;
}
export async function queryWithEncryption(sql: string, params: any[] = [], tableName?: string): Promise<any> {
  try {
    let processedParams = [...params];
    const isInsert = sql.toUpperCase().includes('INSERT');
    const isUpdate = sql.toUpperCase().includes('UPDATE');
    const isSelect = sql.toUpperCase().includes('SELECT');

    if (!tableName) {
      const insertMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
      const updateMatch = sql.match(/UPDATE\s+(\w+)/i);
      const selectMatch = sql.match(/FROM\s+(\w+)/i);
      if (insertMatch) tableName = insertMatch[1];
      else if (updateMatch) tableName = updateMatch[1];
      else if (selectMatch) tableName = selectMatch[1];
    }

    if ((isInsert || isUpdate) && tableName) {
      const fieldsToEncrypt = ENCRYPTION_FIELDS[tableName as keyof typeof ENCRYPTION_FIELDS];
      if (fieldsToEncrypt) {
        if (isInsert) {
          const fieldMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
          if (fieldMatch) {
            const fieldNames = fieldMatch[1].split(',').map(f => f.trim());
            fieldsToEncrypt.forEach(fieldToEncrypt => {
              const fieldIndex = fieldNames.indexOf(fieldToEncrypt);
              if (fieldIndex !== -1 && processedParams[fieldIndex]) {
                processedParams[fieldIndex] = encryptValue(processedParams[fieldIndex]);
              }
            });
          }
        }
      }
    }

    const result = await query(sql, processedParams);
    
    let rows = Array.isArray(result) ? result : (result.rows || []);

    if (isSelect && tableName && rows.length > 0) {
      const fieldsToDecrypt = ENCRYPTION_FIELDS[tableName as keyof typeof ENCRYPTION_FIELDS];
      if (fieldsToDecrypt) {
        const decryptedRows = rows.map((row: any) => decryptFromDatabase(tableName as string, row));
        return decryptedRows;
      }
    }

    return result;
  } catch (error) {
    console.error('❌ [DB] Erro na query criptografada:', error);
    throw error;
  }
}

const originalQuery = query;
const database = { 
  query: queryWithEncryption, 
  transaction, 
  getPool,
  getProducts, 
  getProductById, 
  getAvailableColors,
  getSimilarProducts,
  getBrands, 
  getBrandByName,
  getBrandBySlug,
  getCategories,
  createOrder,
  updateOrderStatus,
  getModels,
  getModelBySlug,
  getProductsByModel,
  getProductsByBrand,
  getProductColors,
  searchProducts,
  getOrderByTrackingCode,
  getOrderItems,
  getOrderById,
  createUser,
  getUserById,
  getUserByEmail,
  createVerificationToken,
  updateUserLastLogin
}
export { queryWithEncryption as query };
export { getUserByEmail };
export default database