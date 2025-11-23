import crypto from 'crypto';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; 
const SALT_LENGTH = 64; 
const HASH_ITERATIONS = 100000; 
const HASH_ALGORITHM = 'sha512';
export const ENCRYPTION_ENABLED = !!ENCRYPTION_KEY && ENCRYPTION_KEY.length >= 32;
function checkEncryptionAvailable() {
  if (!ENCRYPTION_ENABLED) {
    console.warn('⚠️ Criptografia desabilitada - configure ENCRYPTION_KEY para habilitar');
    return false;
  }
  return true;
}
function generateIV(): Buffer {
  return crypto.randomBytes(IV_LENGTH);
}
function generateSalt(): Buffer {
  return crypto.randomBytes(SALT_LENGTH);
}
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, 32, HASH_ALGORITHM);
}
export function encrypt(text: string): string {
  if (!checkEncryptionAvailable()) {
    return text;
  }
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input for encryption');
    }
    const iv = generateIV();
    const salt = generateSalt();
    const key = deriveKey(ENCRYPTION_KEY!, salt);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    cipher.setAAD(salt); 
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}
export function decrypt(encryptedText: string): string {
  if (!checkEncryptionAvailable()) {
    return encryptedText;
  }
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new Error('Invalid input for decryption');
    }
    if (!encryptedText.includes(':')) {
      return encryptedText;
    }
    const parts = encryptedText.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    const [saltHex, ivHex, authTagHex, encryptedData] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = deriveKey(ENCRYPTION_KEY!, salt);
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedText;
  }
}
export function hashUserId(userId: number): string {
  if (!checkEncryptionAvailable()) {
    return crypto.createHash('sha256').update(userId.toString()).digest('hex').substring(0, 16);
  }
  try {
    const salt = process.env.USER_ID_SALT;
    if (!salt) {
      throw new Error('USER_ID_SALT environment variable is required');
    }
    const data = `${userId}:${salt}:${Date.now()}`;
    const hash = crypto.createHmac(HASH_ALGORITHM, ENCRYPTION_KEY!)
      .update(data)
      .digest('hex');
    return hash.substring(0, 16);
  } catch (error) {
    console.error('User ID hashing error:', error);
    throw new Error('Failed to hash user ID');
  }
}
export function verifyUserIdHash(hash: string, userId: number): boolean {
  try {
    const generatedHash = hashUserId(userId);
    return generatedHash === hash;
  } catch (error) {
    console.error('User ID verification error:', error);
    return false;
  }
}
export function encryptPersonalData(data: any): any {
  if (!checkEncryptionAvailable()) {
    return data;
  }
  if (!data || typeof data !== 'object') {
    return data;
  }
  const sensitiveFields = [
    'cpf', 'birth_date', 'gender'
  ];
  const encrypted = { ...data };
  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === 'string' && encrypted[field].trim() !== '') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  return encrypted;
}
export function decryptPersonalData(data: any): any {
  if (!checkEncryptionAvailable()) {
    return data;
  }
  if (!data || typeof data !== 'object') {
    return data;
  }
  const sensitiveFields = [
    'cpf', 'birth_date', 'gender'
  ];
  const decrypted = { ...data };
  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        const value = decrypted[field];
        const isEncrypted = value.includes(':') && value.length > 50;
        if (isEncrypted) {
          decrypted[field] = decrypt(value);
        }
        } catch (error) {
          console.warn(`Failed to decrypt field ${field}:`, error instanceof Error ? error.message : String(error));
        }
    }
  }
  return decrypted;
}
export function searchUserByEmail(users: any[], email: string): any | null {
  if (!users || !Array.isArray(users)) {
    return null;
  }
  for (const user of users) {
    try {
      let userEmail = user.email;
      if (userEmail && userEmail.includes(':') && userEmail.split(':').length === 4) {
        try {
          userEmail = decrypt(userEmail);
        } catch (error) {
          console.warn('Erro ao descriptografar email para busca:', error instanceof Error ? error.message : String(error));
        }
      }
      if (userEmail && userEmail.toLowerCase() === email.toLowerCase()) {
        return decryptPersonalData(user);
      }
    } catch (error) {
      console.warn('Erro ao processar usuário na busca por email:', error instanceof Error ? error.message : String(error));
      continue;
    }
  }
  return null;
}
export function decryptForAdmin(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  const adminFields = [
    'cpf', 'birth_date', 'gender',
    'customer_cpf'
  ];
  const decrypted = { ...data };
  for (const field of adminFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        const value = decrypted[field];
        const isEncrypted = value.includes(':') && value.split(':').length === 4;
        if (isEncrypted) {
          decrypted[field] = decrypt(value);
        }
      } catch (error) {
        console.warn(`Erro ao descriptografar ${field} para admin:`, error instanceof Error ? error.message : String(error));
      }
    }
  }
  return decrypted;
}
export function decryptUsersForAdmin(users: any[]): any[] {
  if (!Array.isArray(users)) {
    return users;
  }
  console.log(`🔓 Descriptografando ${users.length} usuários para visualização do admin...`);
  return users.map((user, index) => {
    try {
      const decryptedUser = { ...user };
      const sensitiveFields = [
        'cpf', 'birth_date', 'gender',
        'customer_cpf' 
      ];
      const smartDecrypt = (value: string | null, fieldName: string): string | null => {
        if (!value || typeof value !== 'string') {
          return value;
        }
        try {
          const isEncrypted = value.includes(':') && value.split(':').length === 4;
          if (isEncrypted) {
            const decrypted = decrypt(value);
            console.log(`   ✅ ${fieldName}: descriptografado com sucesso`);
            return decrypted;
          } else {
            console.log(`   ℹ️ ${fieldName}: já em texto plano`);
            return value;
          }
        } catch (error) {
          console.warn(`   ⚠️ ${fieldName}: falha na descriptografia, mantendo valor original`);
          return value;
        }
      };
      sensitiveFields.forEach(field => {
        if (decryptedUser[field] !== undefined) {
          decryptedUser[field] = smartDecrypt(decryptedUser[field], field);
        }
      });
      decryptedUser._decryption_status = 'success';
      decryptedUser._decrypted_at = new Date().toISOString();
      return decryptedUser;
    } catch (error) {
      console.error(`❌ Erro ao descriptografar usuário ${index + 1}:`, error);
      return {
        ...user,
        _decryption_status: 'error',
        _decryption_error: error instanceof Error ? error.message : String(error),
        _decrypted_at: new Date().toISOString()
      };
    }
  });
}
export function decryptSingleUserForAdmin(user: any): any {
  if (!user || typeof user !== 'object') {
    return user;
  }
  console.log(`🔓 Descriptografando usuário ${user.id || 'desconhecido'} para admin...`);
  try {
    const decryptedUser = { ...user };
    const adminFields = [
      'cpf', 'birth_date', 'gender'
    ];
    let decryptedCount = 0;
    let plaintextCount = 0;
    let errorCount = 0;
    adminFields.forEach(field => {
      if (decryptedUser[field] && typeof decryptedUser[field] === 'string') {
        try {
          const value = decryptedUser[field];
          const isEncrypted = value.includes(':') && value.split(':').length === 4;
          if (isEncrypted) {
            decryptedUser[field] = decrypt(value);
            decryptedCount++;
            console.log(`   ✅ ${field}: descriptografado`);
          } else {
            plaintextCount++;
            console.log(`   ℹ️ ${field}: texto plano`);
          }
        } catch (error) {
          errorCount++;
          console.warn(`   ⚠️ ${field}: erro na descriptografia`);
        }
      }
    });
    decryptedUser._admin_decryption = {
      status: 'success',
      timestamp: new Date().toISOString(),
      stats: {
        decrypted_fields: decryptedCount,
        plaintext_fields: plaintextCount,
        error_fields: errorCount,
        total_processed: decryptedCount + plaintextCount + errorCount
      }
    };
    console.log(`   📊 Estatísticas: ${decryptedCount} descriptografados, ${plaintextCount} texto plano, ${errorCount} erros`);
    return decryptedUser;
  } catch (error) {
    console.error('❌ Erro crítico na descriptografia do usuário:', error);
    return {
      ...user,
      _admin_decryption: {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, 64, HASH_ALGORITHM);
  return `${salt}:${hash.toString('hex')}`;
}
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [salt, hash] = hashedPassword.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, 64, HASH_ALGORITHM);
    return hash === verifyHash.toString('hex');
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
export function encryptOrderData(orderData: any): any {
  if (!checkEncryptionAvailable()) {
    return orderData;
  }
  if (!orderData || typeof orderData !== 'object') {
    return orderData;
  }
  const sensitiveFields = [
    'customer_name', 'customer_email', 'customer_phone', 'customer_cpf',
    'billing_address', 'shipping_address', 'payment_method'
  ];
  const encrypted = { ...orderData };
  for (const field of sensitiveFields) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  return encrypted;
}
export function decryptOrderData(orderData: any): any {
  if (!checkEncryptionAvailable()) {
    return orderData;
  }
  if (!orderData || typeof orderData !== 'object') {
    return orderData;
  }
  const sensitiveFields = [
    'customer_name', 'customer_email', 'customer_phone', 'customer_cpf',
    'billing_address', 'shipping_address', 'payment_method'
  ];
  const decrypted = { ...orderData };
  for (const field of sensitiveFields) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field]);
      } catch (error) {
        console.warn(`Failed to decrypt order field ${field}:`, error);
      }
    }
  }
  return decrypted;
}
export function getEncryptionStatus() {
  return {
    enabled: ENCRYPTION_ENABLED,
    hasKey: !!ENCRYPTION_KEY,
    keyLength: ENCRYPTION_KEY?.length || 0,
    hasUserIdSalt: !!process.env.USER_ID_SALT
  };
}
export function encryptCheckoutData(checkoutData: any): any {
  if (!checkEncryptionAvailable()) {
    return checkoutData;
  }
  try {
    const encryptedData = { ...checkoutData };
    if (checkoutData.customer) {
      encryptedData.customer = encryptPersonalData(checkoutData.customer);
    }
    if (checkoutData.shipping_address) {
      if (typeof checkoutData.shipping_address === 'string') {
        encryptedData.shipping_address = encrypt(checkoutData.shipping_address);
      } else {
        const shippingData = { ...checkoutData.shipping_address };
        const sensitiveShippingFields = ['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipcode'];
        for (const field of sensitiveShippingFields) {
          if (shippingData[field]) {
            shippingData[field] = encrypt(shippingData[field]);
          }
        }
        encryptedData.shipping_address = JSON.stringify(shippingData);
      }
    }
    return encryptedData;
  } catch (error) {
    console.error('Error encrypting checkout data:', error);
    return checkoutData;
  }
}
export function decryptCheckoutData(encryptedData: any): any {
  if (!checkEncryptionAvailable()) {
    return encryptedData;
  }
  try {
    const decryptedData = { ...encryptedData };
    if (encryptedData.customer) {
      decryptedData.customer = decryptPersonalData(encryptedData.customer);
    }
    if (encryptedData.shipping_address) {
      try {
        const decryptedAddress = decrypt(encryptedData.shipping_address);
        decryptedData.shipping_address = decryptedAddress;
      } catch {
        try {
          const addressObj = JSON.parse(encryptedData.shipping_address);
          const sensitiveShippingFields = ['street', 'number', 'complement', 'neighborhood', 'city', 'state', 'zipcode'];
          for (const field of sensitiveShippingFields) {
            if (addressObj[field]) {
              addressObj[field] = decrypt(addressObj[field]);
            }
          }
          decryptedData.shipping_address = JSON.stringify(addressObj);
        } catch {
          console.warn('Could not decrypt shipping address, returning original data');
        }
      }
    }
    return decryptedData;
  } catch (error) {
    console.error('Error decrypting checkout data:', error);
    return encryptedData;
  }
}
