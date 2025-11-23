import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, isAdmin } from '@/lib/auth'
import database from '@/lib/database'
import { join } from 'path'
import { existsSync, statSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📤 [MODEL UPLOAD] Iniciando upload de imagem do modelo')
    const user = await authenticateUser(request)
    if (!user || !isAdmin(user)) {
      console.log('❌ [MODEL UPLOAD] Acesso negado')
      return NextResponse.json({ success: false, error: 'Acesso negado' }, { status: 403 })
    }
    const modelId = parseInt(params.id)
    if (isNaN(modelId)) {
      console.log('❌ [MODEL UPLOAD] ID do modelo inválido:', params.id)
      return NextResponse.json({ success: false, error: 'ID do modelo inválido' }, { status: 400 })
    }
    console.log('🔍 [MODEL UPLOAD] Verificando modelo ID:', modelId)
    const existing = await database.query('SELECT id, name FROM models WHERE id = ?', [modelId])
    if (!existing || existing.length === 0) {
      console.log('❌ [MODEL UPLOAD] Modelo não encontrado:', modelId)
      return NextResponse.json({ success: false, error: 'Modelo não encontrado' }, { status: 404 })
    }
    console.log('✅ [MODEL UPLOAD] Modelo encontrado:', existing[0].name)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      console.log('❌ [MODEL UPLOAD] Nenhum arquivo enviado')
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado' }, { status: 400 })
    }
    console.log('📄 [MODEL UPLOAD] Arquivo recebido:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    })
    if (!file.type.startsWith('image/')) {
      console.log('❌ [MODEL UPLOAD] Tipo de arquivo inválido:', file.type)
      return NextResponse.json({ success: false, error: 'Apenas imagens são suportadas' }, { status: 400 })
    }
    if (file.size > 20 * 1024 * 1024) { 
      console.log('❌ [MODEL UPLOAD] Arquivo muito grande:', file.size)
      return NextResponse.json({ success: false, error: 'Arquivo muito grande (máx. 20MB)' }, { status: 400 })
    }
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 8)
    const originalExt = file.name.split('.').pop() || 'jpg'
    const ext = originalExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
    const fileName = `model_${modelId}_${timestamp}_${random}.${ext}`
    console.log('📝 [MODEL UPLOAD] Nome do arquivo gerado:', fileName)
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'models')
    console.log('📁 [MODEL UPLOAD] Diretório de upload:', uploadDir)
    if (!existsSync(uploadDir)) {
      console.log('📁 [MODEL UPLOAD] Criando diretório:', uploadDir)
      await mkdir(uploadDir, { recursive: true })
      console.log('✅ [MODEL UPLOAD] Diretório criado com sucesso')
    } else {
      console.log('✅ [MODEL UPLOAD] Diretório já existe')
    }
    const filePath = join(uploadDir, fileName)
    console.log('💾 [MODEL UPLOAD] Caminho completo do arquivo:', filePath)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    console.log('💾 [MODEL UPLOAD] Buffer criado, tamanho:', buffer.length)
    await writeFile(filePath, buffer)
    console.log('✅ [MODEL UPLOAD] Arquivo salvo no disco')
    if (!existsSync(filePath)) {
      console.error('❌ [MODEL UPLOAD] Arquivo não foi salvo corretamente')
      return NextResponse.json({ success: false, error: 'Erro ao salvar arquivo' }, { status: 500 })
    }
    const fileStats = statSync(filePath)
    console.log('✅ [MODEL UPLOAD] Arquivo verificado:', {
      path: filePath,
      size: fileStats.size,
      exists: true
    })
    if (fileStats.size !== buffer.length) {
      console.error('❌ [MODEL UPLOAD] Tamanho do arquivo não corresponde:', {
        expected: buffer.length,
        actual: fileStats.size
      })
      return NextResponse.json({ success: false, error: 'Erro ao salvar arquivo (tamanho incorreto)' }, { status: 500 })
    }
    const imageUrl = `/uploads/models/${fileName}`
    console.log('🔗 [MODEL UPLOAD] URL da imagem:', imageUrl)
    await database.query('UPDATE models SET image_url = ?, updated_at = NOW() WHERE id = ?', [imageUrl, modelId])
    console.log('✅ [MODEL UPLOAD] Banco de dados atualizado')
    const updatedModel = await database.query('SELECT image_url FROM models WHERE id = ?', [modelId])
    if (updatedModel && updatedModel.length > 0) {
      console.log('✅ [MODEL UPLOAD] Verificação final - image_url no banco:', updatedModel[0].image_url)
    }
    console.log('✅ [MODEL UPLOAD] Upload concluído com sucesso')
    return NextResponse.json({ 
      success: true, 
      message: 'Imagem enviada com sucesso', 
      data: { image_url: imageUrl } 
    })
  } catch (error: any) {
    console.error('❌ [MODEL UPLOAD] Erro ao fazer upload da imagem do modelo:', error)
    console.error('❌ [MODEL UPLOAD] Stack trace:', error?.stack)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}