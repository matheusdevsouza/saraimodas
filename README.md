# 👗 Sarai Modas

**E-commerce de moda feminina**

## 📋 Sobre o Projeto

A Sarai Modas é uma plataforma de e-commerce moderna desenvolvida em Next.js 14, focada na venda de moda feminina. O projeto oferece uma experiência de compra completa com integração ao Mercado Pago, sistema de autenticação seguro e painel administrativo.

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Autenticação**: NextAuth.js
- **Pagamentos**: Mercado Pago API
- **Email**: Nodemailer com SMTP

## 📁 Estrutura do Projeto

```
SaraiModas/
├── 📁 src/                    # Código fonte da aplicação
│   ├── 📁 app/               # App Router do Next.js
│   │   ├── 📁 admin/         # Painel administrativo
│   │   ├── 📁 api/           # API Routes
│   │   └── 📁 [pages]/       # Páginas públicas
│   ├── 📁 components/        # Componentes React
│   ├── 📁 lib/               # Utilitários e configurações de segurança
│   └── 📁 sections/          # Seções da homepage
├── 📁 public/                # Arquivos estáticos
│   └── 📁 uploads/           # Uploads dinâmicos (Ignorado no Git)
├── 📁 prisma/                # Schema e migrações do banco
├── 📁 private/               # Arquivos sensíveis (Ignorado no Git)
└── 📁 backups/               # Backups de segurança (Ignorado no Git)
```

## 🛡️ Segurança e Arquivos Ignorados

Para garantir a segurança do projeto e a integridade dos dados dos usuários, os seguintes arquivos e diretórios são **automaticamente ignorados** pelo Git e não devem ser enviados para repositórios públicos:

### 1. Dados Sensíveis (`.env`, chaves)
Todas as variáveis de ambiente, chaves de API, tokens do Mercado Pago e credenciais de banco de dados são mantidas estritamente locais.
- **Arquivos:** `.env`, `.env.local`, `*.pem`, `*.key`

### 2. Mídia do Usuário (`public/uploads/`)
Imagens de produtos e modelos enviadas pelo painel administrativo são armazenadas localmente, mas não versionadas. Isso evita que o repositório fique pesado e protege dados de teste/produção.
- **Diretórios:** `public/uploads/products/*`, `public/uploads/models/*`

### 3. Banco de Dados e Backups
Arquivos de banco de dados SQLite (se usado em dev) e dumps SQL de backup.
- **Diretórios:** `backups/`, `database/*.sql`, `prisma/*.db`

### 4. Logs e Temporários
Logs de erro, debug e arquivos temporários gerados durante a execução.
- **Arquivos:** `*.log`, `temp_*`, `npm-debug.log`

---

## ⚙️ Configuração do Ambiente

### 1. Clone o repositório
```bash
git clone https://github.com/matheusdevsouza/saraimodas.git
cd sarai
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto baseando-se nas chaves necessárias (DB, Auth, Pagamentos).

### 4. Configure o banco de dados
```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Execute o projeto
```bash
npm run dev
```

---

**Desenvolvido com muito amor, café e spotify para todas as mulheres elegantes!**
