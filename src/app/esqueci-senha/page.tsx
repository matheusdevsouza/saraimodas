'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) {
        setMessage('Se o e-mail estiver cadastrado, você receberá um link de redefinição em breve.')
      } else {
        setError(data.message || 'Não foi possível processar sua solicitação')
      }
    } catch (err) {
      setError('Erro ao enviar solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <section className="flex items-center justify-center bg-[#0D0D0D] px-4 pb-16 lg:pb-20" style={{ marginTop: '10.5rem', minHeight: 'calc(100vh - 10.5rem)', paddingTop: '2rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#1f1f1f] border border-[#2a2a2a] rounded-xl shadow-2xl p-8 flex flex-col gap-8"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 mb-2">
            <Image src="/images/logo.png" alt="Sarai Modas Logo" fill sizes="64px" className="object-contain filter brightness-110" priority />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2 text-center">Esqueci minha senha</h1>
          <p className="text-gray-400 text-center text-sm">Informe seu e-mail e enviaremos um link para redefinição de senha.</p>
        </div>
        {message && (
          <div className="p-4 rounded-lg text-sm bg-green-500/20 border border-green-500/30 text-green-400">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 rounded-lg text-sm bg-red-500/20 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-gray-300 font-medium text-sm">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu e-mail"
              className="px-4 py-3 rounded-lg bg-[#0D0D0D] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--logo-gold,#D4AF37)]/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-[var(--logo-gold,#D4AF37)] hover:bg-gradient-to-r hover:from-[var(--logo-gold,#D4A574)] hover:via-[var(--logo-gold-light,#E6B896)] hover:to-[var(--logo-gold,#D4A574)] disabled:bg-gray-600 disabled:cursor-not-allowed text-[#0D0D0D] font-semibold px-6 py-3 rounded-lg text-sm transition-all duration-300 w-full shadow-md hover:shadow-lg"
          >
            {loading ? 'Enviando...' : 'Enviar link de redefinição'}
          </button>
        </form>
        <div className="text-center">
          <Link href="/login" className="text-[var(--logo-gold,#D4AF37)] text-sm hover:underline font-medium">Voltar ao login</Link>
        </div>
      </motion.div>
    </section>
  )
}
