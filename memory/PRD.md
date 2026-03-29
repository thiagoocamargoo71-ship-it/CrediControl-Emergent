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

## Core Requirements (Static)

### Autenticação
- [x] Registro de usuário (nome, email, senha)
- [x] Login e logout
- [x] JWT com cookies httpOnly
- [x] Roles: admin e user
- [x] Proteção de rotas por role

### Gestão de Clientes
- [x] Criar cliente (nome, telefone, documento, notas)
- [x] Editar cliente
- [x] Excluir cliente
- [x] Listar clientes

### Gestão de Empréstimos
- [x] Criar empréstimo com cálculo automático
- [x] Cliente, valor, juros mensal, parcelas, data inicial, intervalo
- [x] Geração automática de parcelas
- [x] Visualizar detalhes do empréstimo

### Controle de Parcelas
- [x] Listar parcelas por empréstimo
- [x] Marcar parcela como paga
- [x] Cálculo automático de juros de atraso
- [x] Status: pending, paid, overdue

### Dashboard do Usuário
- [x] Total emprestado
- [x] Total recebido
- [x] Total a receber
- [x] Número de clientes
- [x] Parcelas atrasadas

### Painel Admin
- [x] Total de usuários
- [x] Total de empréstimos
- [x] Valor total movimentado
- [x] Listar usuários
- [x] Bloquear/desbloquear usuário
- [x] Excluir usuário

## What's Been Implemented (29/03/2026)

### Backend (FastAPI + MongoDB)
- Autenticação JWT completa com bcrypt
- CRUD de clientes com validação
- CRUD de empréstimos com geração automática de parcelas
- Cálculo de juros mensais e juros de atraso diário
- Registro de pagamentos
- Dashboard de métricas
- Painel administrativo
- CORS configurado para HTTPS
- Cookies seguros para produção

### Frontend (React + Tailwind + Shadcn)
- Interface em Português (BR)
- Tema escuro com design profissional
- Login/Registro com validação
- Dashboard do usuário com métricas
- Gestão de clientes (CRUD completo)
- Gestão de empréstimos com prévia de cálculo
- Visualização de parcelas e pagamentos
- Painel administrativo
- Sidebar de navegação

## Prioritized Backlog

### P0 (Critical) - ✅ Completed
- Autenticação e autorização
- Gestão básica de clientes
- Criação de empréstimos com cálculo
- Geração de parcelas
- Registro de pagamentos

### P1 (Important) - Future
- Contratos em PDF
- Histórico de alterações
- Exportação de dados (CSV/Excel)
- Backup automático

### P2 (Nice to Have) - Future
- Integração com WhatsApp
- Planos pagos (multi-tenant completo)
- Dashboard avançado com gráficos
- Notificações de vencimento
- App mobile

## Next Tasks List
1. Implementar geração de contratos em PDF
2. Adicionar gráficos no dashboard
3. Sistema de notificações de parcelas vencidas
4. Integração com WhatsApp para lembretes
5. Exportação de relatórios
