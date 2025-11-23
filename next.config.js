/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'saraimodas.com.br',
        pathname: '/uploads/**',
      }
    ],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  experimental: {
    serverComponentsExternalPackages: ['mysql2'],
    serverActions: {
      allowedOrigins: ['localhost:3000', 'saraimodas.com.br']
    }
  },

  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig