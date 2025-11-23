'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, User, List, X, MagnifyingGlass, Truck, UserPlus, EnvelopeSimple, SignOut, AddressBook, UserCircle, Receipt } from 'phosphor-react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import SidebarCart from './SidebarCart'
import { useAuth } from '@/contexts/AuthContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const { state: cartState, isCartSidebarOpen, setIsCartSidebarOpen } = useCart()
  const { user, authenticated, logout } = useAuth();

  const [isSearching, setIsSearching] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearching(true)
      window.location.href = `/pesquisa?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  const menuItems = [
    { label: 'Início', href: '/' },
    { label: 'Coleção', href: '/produtos' },
    { label: 'Vestidos', href: '/produtos?categoria=vestidos' },
    { label: 'Acessórios', href: '/produtos?categoria=acessorios' },
    { label: 'Sobre', href: '/sobre' },
  ]

  return (
    <header className="fixed top-0 w-full z-50">
      
      <div className="bg-[#0D0D0D] transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative flex items-center justify-between h-20">
            
            <motion.a
              href="/"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              className="flex items-center cursor-pointer group relative z-10"
              title="Sarai Modas - Ir para a página inicial"
            >
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/images/logo.png"
                  alt="Sarai Modas"
                  fill
                  sizes="(max-width: 640px) 56px, 64px"
                  className="object-contain filter brightness-110"
                  priority
                />
              </div>
            </motion.a>

            
            <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg z-10">
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              >
                <div className={`relative flex items-center bg-[var(--header-gold,#A67C52)] rounded-full px-4 py-2.5 transition-all duration-300 ${
                  isSearchFocused ? 'ring-2 ring-[var(--header-gold-hover,#B8863F)]/50 shadow-lg shadow-[var(--header-gold-hover,#B8863F)]/10' : ''
                }`}>
                  <MagnifyingGlass 
                    size={20} 
                    weight="regular" 
                    className="text-white/70 mr-3 flex-shrink-0" 
                  />
                  <input
                    type="text"
                    placeholder="Buscar produtos, vestidos, acessórios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    className="flex-1 bg-transparent text-white placeholder-white/70 focus:outline-none text-sm w-full"
                  />
                  {searchQuery && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={clearSearch}
                      className="ml-2 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                      <X size={16} weight="bold" />
                    </motion.button>
                  )}
                </div>
              </motion.form>
            </div>

            
            <div className="flex items-center gap-3 relative">
              
              <motion.button
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2.5 bg-gradient-to-br from-[var(--header-gold,#A67C52)]/20 to-[#0D0D0D] hover:from-[var(--header-gold-hover,#B8863F)]/40 hover:to-[var(--header-gold-hover,#B8863F)]/20 text-gray-400 hover:text-[var(--header-gold-hover,#B8863F)] rounded-2xl transition-all duration-300 overflow-hidden group hidden sm:flex"
                title="Rastrear Pedido"
                onClick={() => setShowTrackingModal(true)}
              >
                <div className="absolute inset-0 bg-[var(--header-gold-hover,#B8863F)]/0 group-hover:bg-[var(--header-gold-hover,#B8863F)]/15 transition-all duration-300" />
                <Truck size={20} weight="regular" className="relative z-10" />
                <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[var(--header-gold-hover,#B8863F)]/40 transition-all duration-300" />
              </motion.button>

              
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCartSidebarOpen(true)}
                className="relative p-3 bg-transparent text-gray-400 hover:text-[var(--logo-gold,#D4A574)] rounded-2xl transition-all duration-300 group"
                title="Carrinho"
              >
                <ShoppingCart size={22} weight="regular" className="relative z-10" />
                {cartState.itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-[var(--logo-gold,#D4A574)] text-[#0D0D0D] text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-[#0D0D0D] z-20"
                  >
                    {cartState.itemCount}
                  </motion.span>
                )}
              </motion.button>

              
              <div className="relative ml-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative px-4 py-2.5 bg-[var(--header-gold,#A67C52)] hover:bg-[var(--header-gold-hover,#B8863F)] text-[#0D0D0D] rounded-xl transition-all duration-300 flex items-center gap-2 group overflow-hidden shadow-md hover:shadow-lg"
                  title="Minha Conta"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  id="user-menu-trigger"
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-xl" />
                  <User size={18} weight="regular" className="relative z-10" />
                  <span className="relative z-10 font-medium text-sm hidden sm:inline">
                    {authenticated && user ? (user.display_name || user.name.split(' ')[0]) : 'Conta'}
                  </span>
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-[#0D0D0D]/20 transition-all duration-300" />
                </motion.button>
                
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      ref={userMenuRef}
                      className="absolute z-50 min-w-[260px] bg-[#0D0D0D] rounded-2xl shadow-2xl py-3 mt-2 backdrop-blur-md"
                      style={{ right: 0, top: '100%' }}
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {authenticated && user ? (
                        <>
                          <div className="px-5 py-3 text-white font-semibold flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[var(--logo-gold,#D4A574)]/20 flex items-center justify-center">
                              <User size={20} className="text-[var(--logo-gold,#D4A574)]" weight="regular" />
                            </div>
                            <div>
                              <p className="text-sm">{`Olá, ${(user.display_name || user.name.split(' ')[0])}!`}</p>
                              <p className="text-xs text-gray-400 font-normal">{user.email}</p>
                            </div>
                          </div>
                          <div className="py-2">
                            <a href="/perfil" className="flex items-center gap-3 px-5 py-3 text-gray-300 hover:bg-[var(--logo-gold,#D4A574)]/10 hover:text-[var(--logo-gold,#D4A574)] transition-colors rounded-lg mx-2">
                              <UserCircle size={18} className="text-gray-400" weight="regular" />
                              <span className="text-sm">Meu Perfil</span>
                            </a>
                            <a href="/meus-pedidos" className="flex items-center gap-3 px-5 py-3 text-gray-300 hover:bg-[var(--logo-gold,#D4A574)]/10 hover:text-[var(--logo-gold,#D4A574)] transition-colors rounded-lg mx-2">
                              <Receipt size={18} className="text-gray-400" weight="regular" />
                              <span className="text-sm">Meus Pedidos</span>
                            </a>
                            <a href="/enderecos" className="flex items-center gap-3 px-5 py-3 text-gray-300 hover:bg-[var(--logo-gold,#D4A574)]/10 hover:text-[var(--logo-gold,#D4A574)] transition-colors rounded-lg mx-2">
                              <AddressBook size={18} className="text-gray-400" weight="regular" />
                              <span className="text-sm">Endereços</span>
                            </a>
                            {user.is_admin && (
                              <a href="/admin" className="flex items-center gap-3 px-5 py-3 text-gray-300 hover:bg-[var(--logo-gold,#D4A574)]/10 hover:text-[var(--logo-gold,#D4A574)] transition-colors mt-2 rounded-lg mx-2">
                                <div className="w-6 h-6 bg-[var(--logo-gold,#D4A574)] rounded-lg flex items-center justify-center">
                                  <span className="text-[#0D0D0D] text-xs font-bold">A</span>
                                </div>
                                <span className="text-sm">Dashboard Admin</span>
                              </a>
                            )}
                          </div>
                          <div className="mt-2 pt-2">
                            <button
                              onClick={async () => { await logout(); setUserMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-5 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors rounded-lg mx-2"
                            >
                              <SignOut size={18} className="text-gray-400" weight="regular" />
                              <span className="text-sm">Sair</span>
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <a href="/login" className="flex items-center gap-3 px-5 py-3 text-gray-300 hover:bg-[var(--logo-gold,#D4A574)]/10 hover:text-[var(--logo-gold,#D4A574)] transition-colors rounded-lg mx-2">
                            <User size={18} className="text-gray-400" weight="regular" />
                            <span className="text-sm">Fazer Login</span>
                          </a>
                          <a href="/criar-conta" className="flex items-center gap-3 px-5 py-3 bg-[var(--logo-gold,#D4A574)]/10 text-[var(--logo-gold,#D4A574)] hover:bg-[var(--logo-gold,#D4A574)]/20 transition-colors rounded-lg mx-2 font-medium">
                            <UserPlus size={18} weight="regular" />
                            <span className="text-sm">Criar Conta</span>
                          </a>
                          <a href="/contato" className="flex items-center gap-3 px-5 py-3 text-gray-300 hover:bg-[var(--logo-gold,#D4A574)]/10 hover:text-[var(--logo-gold,#D4A574)] transition-colors rounded-lg mx-2 mt-2">
                            <EnvelopeSimple size={18} className="text-gray-400" weight="regular" />
                            <span className="text-sm">Contato</span>
                          </a>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="lg:hidden p-2.5 bg-gradient-to-br from-[var(--header-gold,#A67C52)]/20 to-[#0D0D0D] hover:from-[var(--header-gold-hover,#B8863F)]/40 hover:to-[var(--header-gold-hover,#B8863F)]/20 text-gray-400 hover:text-[var(--header-gold-hover,#B8863F)] rounded-2xl transition-all duration-300 overflow-hidden group relative"
              >
                <div className="absolute inset-0 bg-[var(--header-gold-hover,#B8863F)]/0 group-hover:bg-[var(--header-gold-hover,#B8863F)]/15 transition-all duration-300" />
                {isMenuOpen ? (
                  <X size={22} weight="bold" className="relative z-10" />
                ) : (
                  <List size={22} weight="regular" className="relative z-10" />
                )}
                <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-[var(--header-gold-hover,#B8863F)]/40 transition-all duration-300" />
              </motion.button>
            </div>
          </div>

          
          <div className="lg:hidden pb-4">
            <form onSubmit={handleSearch} className="relative">
              <div className={`relative flex items-center bg-[var(--header-gold,#A67C52)] rounded-full px-4 py-3 transition-all duration-300 ${
                isSearchFocused ? 'ring-2 ring-[var(--header-gold-hover,#B8863F)]/50' : ''
              }`}>
                <MagnifyingGlass 
                  size={20} 
                  weight="regular" 
                  className="text-white/70 mr-3 flex-shrink-0" 
                />
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className="flex-1 bg-transparent text-white placeholder-white/70 focus:outline-none text-sm"
                  />
                {searchQuery && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={clearSearch}
                    className="ml-2 text-white/70 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  >
                    <X size={16} weight="bold" />
                  </motion.button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      
      <div 
        className="bg-[var(--header-gold,#A67C52)] relative z-40"
      >
        <div className="container mx-auto px-4">
          
          <nav className="hidden lg:flex items-center justify-center gap-2 py-4">
            {menuItems.map((item, index) => (
              <motion.a
                key={item.href}
                href={item.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2, scale: 1.05 }}
                className="relative px-6 py-2.5 text-[#0D0D0D] font-medium text-sm uppercase tracking-wide rounded-xl group overflow-hidden"
              >
                
                <motion.div
                  className="absolute inset-0 bg-[#0D0D0D]/15 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                  initial={false}
                  whileHover={{ scale: 1.1 }}
                />
                
                
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#0D0D0D] rounded-full opacity-0 group-hover:opacity-100"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
                
                
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.5 }}
                />
                
                
                <span className="relative z-10 block transition-all duration-300 group-hover:font-semibold">{item.label}</span>
              </motion.a>
            ))}
          </nav>

          
          <AnimatePresence>
            {isMenuOpen && (
              <motion.nav
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden py-4 space-y-1 overflow-hidden"
              >
                {menuItems.map((item, index) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4, scale: 1.02 }}
                    className="relative block px-6 py-3 text-[#0D0D0D] transition-all duration-300 rounded-xl font-medium uppercase tracking-wide group overflow-hidden"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    
                    <motion.div
                      className="absolute inset-0 bg-[#0D0D0D]/15 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                      initial={false}
                    />
                    
                    
                    <motion.div
                      className="absolute left-0 top-0 bottom-0 w-1 bg-[#0D0D0D] rounded-full opacity-0 group-hover:opacity-100"
                      initial={{ scaleY: 0 }}
                      whileHover={{ scaleY: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    
                    <span className="relative z-10 block transition-all duration-300 group-hover:font-semibold">{item.label}</span>
                  </motion.a>
                ))}
              </motion.nav>
            )}
          </AnimatePresence>
        </div>
      </div>

      
      <AnimatePresence>
        {showTrackingModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#0D0D0D] rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 text-center"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.25 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--logo-gold,#D4A574)]/20 rounded-full flex items-center justify-center">
                <Truck size={32} className="text-[var(--logo-gold,#D4A574)]" weight="regular" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Rastreamento de Pedido</h2>
              <p className="text-gray-400 mb-6 text-sm">
                Você será redirecionado para o site de rastreamento externo <span className='text-[var(--logo-gold,#D4A574)] font-semibold'>17TRACK</span>. Deseja continuar?
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  className="px-6 py-3 rounded-xl bg-[#0D0D0D] text-gray-300 hover:bg-[#0D0D0D]/80 hover:text-white transition-colors font-medium text-sm"
                  onClick={() => setShowTrackingModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-6 py-3 rounded-xl bg-[var(--logo-gold,#D4A574)] hover:bg-[var(--logo-gold-light,#E6B896)] text-[#0D0D0D] transition-colors font-semibold text-sm shadow-lg shadow-[var(--logo-gold,#D4A574)]/20"
                  onClick={() => {
                    window.open('https://www.17track.net/pt', '_blank')
                    setShowTrackingModal(false)
                  }}
                >
                  Ir para rastreamento
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      
      <SidebarCart open={isCartSidebarOpen} onClose={() => setIsCartSidebarOpen(false)} />
    </header>
  )
}
