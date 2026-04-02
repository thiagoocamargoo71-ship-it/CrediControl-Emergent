# CrediControl - Product Requirements Document

## Original Problem Statement
Sistema SaaS web completo para gestão de empréstimos pessoais com:
- Autenticação JWT
- Separação de acesso entre ADMIN e USER
- Gestão de clientes
- Gestão de empréstimos
- Geração automática de parcelas
- Controle de pagamentos
- Dashboard básico

## User Personas

### Admin (Administrador do Sistema)
- Visualiza estatísticas gerais do sistema
- Gerencia usuários (listar, bloquear, excluir)
- Não tem acesso a dados financeiros individuais

### User (Usuário/Operador de Empréstimos)
- Cadastra e gerencia clientes
- Cria e gerencia empréstimos
- Controla parcelas e pagamentos
- Visualiza dashboard com métricas financeiras

## Tech Stack
- **Frontend**: React.js + Tailwind CSS + Shadcn UI (Dark Theme)
- **Backend**: FastAPI (Python)
- **Database**: Supabase PostgreSQL (migrado de MongoDB em 31/03/2026)
- **Auth**: JWT com cookies httpOnly
- **DB Client**: supabase-py async client com service_role key

## Core Requirements

### Autenticação
- [x] Registro de usuário (nome, email, senha)
- [x] Login e logout
- [x] JWT com cookies httpOnly
- [x] Roles: admin e user
- [x] Proteção de rotas por role
- [x] Brute force protection

### Gestão de Clientes
- [x] CRUD completo (criar, editar, excluir, listar)
- [x] Status do cliente (sem empréstimo, em dia, atrasado)
- [x] Sistema de indicação (referral)

### Gestão de Empréstimos
- [x] Criar empréstimo com cálculo automático de juros
- [x] Geração automática de parcelas
- [x] Visualizar detalhes do empréstimo
- [x] Excluir empréstimo (com CASCADE)

### Controle de Parcelas
- [x] Listar parcelas por empréstimo
- [x] Página central de parcelas com filtros
- [x] Marcar parcela como paga
- [x] Cálculo automático de juros de atraso (diário)
- [x] Status: pending, paid, overdue

### Dashboard do Usuário
- [x] Total emprestado, a receber, recebido
- [x] Número de clientes e empréstimos
- [x] Parcelas atrasadas
- [x] Resumo financeiro

### Painel Admin
- [x] Estatísticas gerais (usuários, empréstimos, valor total)
- [x] CRUD de usuários
- [x] Bloquear/desbloquear usuário

### Configurações
- [x] Atualizar perfil (nome, email)
- [x] Alterar senha
- [x] Preferências de empréstimo (taxa padrão, intervalo padrão)

## Database Schema (Supabase PostgreSQL)
- **users**: id (UUID), name, email, password_hash, role, is_blocked, default_interest_rate, default_interval_days, created_at
- **login_attempts**: id (UUID), identifier, count, lockout_until
- **customers**: id (UUID), user_id (FK), name, phone, email, document, address, notes, is_referral, referral_name, referral_phone, created_at
- **loans**: id (UUID), user_id (FK), customer_id (FK), amount, interest_rate, total_amount, number_of_installments, start_date, interval_days, created_at
- **installments**: id (UUID), loan_id (FK), number, amount, updated_amount, due_date, status, paid_at
- **payments**: id (UUID), installment_id (FK), amount_paid, payment_date

## Prioritized Backlog

### P1 (Important) - Next
- Contratos em PDF
- Integração WhatsApp para cobranças
- Exportação de dados (CSV/Excel)

### P2 (Nice to Have) - Future
- Planos pagos (multi-tenant completo)
- Dashboard avançado com gráficos
- Notificações de vencimento
- App mobile
- Relatórios avançados
