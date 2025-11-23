import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import './globals.css'
import { LayoutShell } from '@/components/LayoutShell'
import { CartProvider } from '@/contexts/CartContext'
import { AuthProvider } from '@/contexts/AuthContext'
import Link from 'next/link'

const montserrat = Montserrat({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-montserrat',
})

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Sarai Modas - Moda Feminina de Alta Sofisticação',
  description: 'Elegância em cada detalhe. Descubra a nova coleção Sarai Modas.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${montserrat.variable} ${inter.variable} ${montserrat.className} bg-[#0D0D0D] text-white antialiased`}>
        <AuthProvider>
          <CartProvider>
            <LayoutShell>
              {children}
            </LayoutShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
