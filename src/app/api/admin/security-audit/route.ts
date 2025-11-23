import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, isAdmin } from '@/lib/auth';
import { runSecurityAudit } from '@/lib/security-audit';
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { success: false, error: 'Acesso negado. Apenas administradores autorizados.' },
        { status: 401 }
      );
    }
    console.log(`🔍 [SECURITY AUDIT] Iniciado por admin: ${user.userId}`);
    const auditReport = await runSecurityAudit();
    console.log(`🔍 [SECURITY AUDIT] Concluído - Status: ${auditReport.overallStatus} Score: ${auditReport.score}%`);
    return NextResponse.json({
      success: true,
      report: auditReport
    });
  } catch (error) {
    console.error('❌ Erro na auditoria de segurança:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno durante auditoria de segurança',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}