'use client';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const { login, resendVerification } = useAuth();
  const router = useRouter();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setShowResendVerification(false);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          if (result.user?.is_admin) {
            router.push('/admin');
          } else {
            router.push('/');
          }
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.message });
        if (result.emailNotVerified) {
          setShowResendVerification(true);
          setResendEmail(formData.email);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro interno do servidor' });
    } finally {
      setLoading(false);
    }
  };
  const handleResendVerification = async () => {
    if (!resendEmail) return;
    setLoading(true);
    try {
      const result = await resendVerification(resendEmail);
      setMessage({ 
        type: result.success ? 'success' : 'error', 
        text: result.message 
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao reenviar verificação' });
    } finally {
      setLoading(false);
    }
  };
  return (
    <section className="min-h-screen flex items-center justify-center bg-[#0D0D0D] py-12 px-4">
      <div className="w-full max-w-md bg-[#261E10] rounded-xl shadow-2xl p-8 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 mb-2">
            <Image src="/logo.png" alt="Sarai Modas Logo" fill sizes="64px" className="object-contain filter brightness-110" priority />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2 text-center">Entrar na sua conta</h1>
          <p className="text-gray-400 text-center text-sm">Bem-vindo de volta! Faça login para continuar.</p>
        </div>
        {message && (
          <div className={`p-4 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
              : 'bg-red-500/20 border border-red-500/30 text-red-400'
          }`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-gray-300 font-medium text-sm">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="px-4 py-3 rounded-lg bg-[#0D0D0D] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--logo-gold,#D4AF37)]/50 transition-all"
              placeholder="Digite seu e-mail"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-gray-300 font-medium text-sm">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="px-4 py-3 rounded-lg bg-[#0D0D0D] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--logo-gold,#D4AF37)]/50 transition-all"
              placeholder="Digite sua senha"
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <Link href="/esqueci-senha" className="text-[var(--logo-gold,#D4AF37)] text-sm hover:underline font-medium">Esqueceu a senha?</Link>
            <Link href="/criar-conta" className="text-gray-400 text-sm hover:text-[var(--logo-gold,#D4AF37)] hover:underline font-medium">Criar conta</Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-[var(--logo-gold,#D4AF37)] hover:bg-[var(--logo-gold,#D4AF37)]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-[#0D0D0D] font-semibold px-6 py-3 rounded-lg text-sm transition-all duration-300 w-full shadow-md hover:shadow-lg"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        {showResendVerification && (
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm mb-3">
              Não recebeu o e-mail de verificação?
            </p>
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full bg-[var(--logo-gold,#D4AF37)] hover:bg-[var(--logo-gold,#D4AF37)]/90 disabled:bg-gray-600 text-[#0D0D0D] font-semibold px-4 py-2 rounded-lg text-xs transition-all"
            >
              {loading ? 'Enviando...' : 'Reenviar E-mail de Verificação'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}