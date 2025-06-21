# Estoque Auto Backend

Backend para sistema de gerenciamento de estoque automotivo construído com Supabase Edge Functions.

## 🚀 Tecnologias

- **Supabase** - Backend as a Service
- **TypeScript** - Linguagem de programação
- **PostgreSQL** - Banco de dados
- **Edge Functions** - Serverless functions
- **GitHub Actions** - CI/CD

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Supabase CLI
- Conta no Supabase

## 🛠️ Instalação

1. **Clone o repositório**
   ```bash
   git clone <seu-repositorio>
   cd estoque-auto-backend
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp env.example .env
   ```
   
   Edite o arquivo `.env` com suas credenciais do Supabase:
   ```
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_ANON_KEY=sua_chave_anonima
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   ```

4. **Inicialize o Supabase localmente**
   ```bash
   supabase init
   supabase start
   ```

5. **Execute as migrações**
   ```bash
   supabase db reset
   ```

## 🚀 Desenvolvimento

### Comandos disponíveis

```bash
# Iniciar ambiente de desenvolvimento
npm run dev

# Executar testes
npm test

# Linting
npm run lint

# Formatação de código
npm run format

# Build do projeto
npm run build

# Deploy das Edge Functions
npm run deploy
```

### Estrutura do Projeto

```
estoque-auto-backend/
├── supabase/
│   ├── config.toml          # Configuração do Supabase
│   ├── migrations/          # Migrações do banco de dados
│   ├── seed.sql            # Dados iniciais
│   └── functions/          # Edge Functions
│       ├── auth/           # Autenticação
│       ├── vehicles/       # Gerenciamento de veículos
│       └── transactions/   # Transações
├── .github/
│   └── workflows/          # GitHub Actions
├── src/                    # Código fonte TypeScript
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Banco de Dados

### Tabelas Principais

- **companies** - Empresas/revendedoras
- **user_profiles** - Perfis de usuários (estende auth.users)
- **vehicles** - Veículos em estoque
- **vehicle_categories** - Categorias de veículos
- **customers** - Clientes
- **suppliers** - Fornecedores
- **transactions** - Transações (compra/venda)
- **maintenance_records** - Registros de manutenção

### Tipos Personalizados

- `user_role` - admin, manager, employee
- `vehicle_status` - available, sold, maintenance, reserved
- `transaction_type` - purchase, sale, transfer, adjustment

## 🔐 Autenticação

O sistema utiliza o sistema de autenticação nativo do Supabase:

- **auth.users** - Tabela nativa do Supabase para usuários
- **user_profiles** - Tabela customizada que estende auth.users
- Row Level Security (RLS) para isolamento de dados por empresa
- Trigger automático para criar user_profiles quando usuário se registra

### Fluxo de Registro

1. Usuário cria conta com `supabase.auth.signUp()`
2. Sistema cria registro na tabela `companies`
3. Trigger `handle_new_user()` cria automaticamente o `user_profile`
4. Usuário pode fazer login normalmente

## 🚀 Deploy

### Configuração do GitHub Actions

1. **Configure os secrets no GitHub:**
   - `SUPABASE_ACCESS_TOKEN` - Token de acesso do Supabase
   - `SUPABASE_PROJECT_REF` - Referência do projeto de produção
   - `SUPABASE_STAGING_PROJECT_REF` - Referência do projeto de staging
   - `SUPABASE_URL` - URL do projeto
   - `SUPABASE_ANON_KEY` - Chave anônima
   - `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço

2. **Deploy automático:**
   - Push para `main` → Deploy em produção
   - Push para `develop` → Deploy em staging
   - Pull Request → Executa testes

### Deploy Manual

```bash
# Link com o projeto Supabase
supabase link --project-ref seu-project-ref

# Deploy das migrações
supabase db push

# Deploy das Edge Functions
supabase functions deploy

# Reset e seed do banco (cuidado!)
supabase db reset --linked --seed
```

## 📡 API Endpoints

### Autenticação (Supabase Auth)
- `POST /auth/v1/signup` - Registro de usuário
- `POST /auth/v1/token` - Login de usuário
- `POST /auth/v1/logout` - Logout

### Veículos
- `GET /rest/v1/vehicles` - Listar veículos
- `POST /rest/v1/vehicles` - Criar veículo
- `PUT /rest/v1/vehicles` - Atualizar veículo
- `DELETE /rest/v1/vehicles` - Deletar veículo

### Transações
- `GET /rest/v1/transactions` - Listar transações
- `POST /rest/v1/transactions` - Criar transação

## 🔧 Configuração de Produção

1. **Crie um projeto no Supabase**
2. **Configure as variáveis de ambiente**
3. **Execute as migrações iniciais**
4. **Configure o GitHub Actions**
5. **Deploy das Edge Functions**

## 📝 Exemplo de Uso

### Registro de Empresa
```typescript
// 1. Criar a empresa
const { data: companyData, error: companyError } = await supabase
  .from('companies')
  .insert({ name: companyName, cnpj: cnpj.replace(/\D/g, '') })
  .select()
  .single()

// 2. Criar o usuário com metadados
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      nome: companyName,
      tipo: 'company',
      id_company: companyData.id
    }
  }
})
```

### Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@empresa.com',
  password: '123456'
})
```

### Listar Veículos
```typescript
const { data: vehicles, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('company_id', userProfile.company_id)
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para suporte, envie um email para suporte@empresa.com ou abra uma issue no GitHub. 