import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const fileName = params.path.join('/');
    const filePath = join(process.cwd(), 'public', 'uploads', 'models', fileName);
    console.log('🔍 [MODEL IMAGE] Tentando servir arquivo:', {
      fileName,
      filePath,
      exists: existsSync(filePath)
    });
    if (!existsSync(filePath)) {
      console.error('❌ [MODEL IMAGE] Arquivo não encontrado:', filePath);
      return new NextResponse('Arquivo não encontrado', { status: 404 });
    }
    const fileBuffer = await readFile(filePath);
    const extension = fileName.split('.').pop()?.toLowerCase();
    let mimeType = 'application/octet-stream';
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        mimeType = 'image/jpeg';
        break;
      case 'png':
        mimeType = 'image/png';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      case 'avif':
        mimeType = 'image/avif';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'svg':
        mimeType = 'image/svg+xml';
        break;
    }
    console.log('✅ [MODEL IMAGE] Arquivo servido com sucesso:', {
      fileName,
      size: fileBuffer.length,
      mimeType
    });
    const bytes = new Uint8Array(fileBuffer);
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('❌ [MODEL IMAGE] Erro ao servir arquivo:', error);
    console.error('❌ [MODEL IMAGE] Stack trace:', error?.stack);
    return new NextResponse('Erro interno do servidor', { status: 500 });
  }
}
