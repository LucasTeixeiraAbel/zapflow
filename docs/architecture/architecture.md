# Arquitetura do ZapFlow

Nosso objetivo é um sistema estável, escalável e fácil de manter. Escolhemos uma estrutura de **Monólito Modular**. Isso nos dá a agilidade de um monólito no início (sem o custo operacional de gerenciar microsserviços) mas mantém os módulos bem isolados, permitindo que a gente transforme partes em serviços independentes no futuro, se necessário.

## Visão Geral

O sistema é dividido em três partes principais que conversam entre si:

1.  **Frontend (O Painel):** Interface do usuário.
2.  **API (O Cérebro):** Gerencia regras de negócio, autenticação e dados.
3.  **Worker (O Braço Forte):** Processa filas e envios de mensagens pesadas.

---

## Stack Técnica

| Camada | Tecnologia | Por que? |
| :--- | :--- | :--- |
| **Frontend** | Next.js + TypeScript | Performance, SEO e ecossistema robusto. |
| **Interface** | Tailwind + shadcn/ui | Rapidez no desenvolvimento e consistência visual. |
| **Backend** | NestJS | Estrutura modular nativa, excelente para typescript. |
| **Banco** | PostgreSQL | Confiabilidade relacional para dados de empresas. |
| **ORM** | Prisma | Facilidade de tipagem e segurança na manipulação de dados. |
| **Filas** | Redis + BullMQ | Essencial para enviar mensagens em segundo plano sem travar a API. |
| **Infra** | Docker | Padronização de ambiente (desenvolvimento = produção). |

---

## Fluxo de Processamento de uma Campanha

O "coração" do sistema é como tratamos o envio de mensagens:

1.  **Criação:** O usuário cria a campanha no frontend.
2.  **Validação:** A API valida o modelo, o público e o consentimento.
3.  **Fila:** A API não envia as mensagens na hora. Ela coloca os destinatários em uma fila no **Redis**.
4.  **Processamento:** O **Worker** consome essa fila de forma controlada.
5.  **Envio:** O Worker faz a chamada à **WhatsApp Cloud API** respeitando limites de taxa (*rate limits*).
6.  **Feedback:** Quando a Meta retorna o status (entregue/lido), os **Webhooks** atualizam o banco de dados.

---

## Princípios de Segurança e Isolamento

*   **TenantID:** Cada tabela crítica no PostgreSQL possui um `tenant_id`. Isso garante, por design, que uma empresa nunca veja dados de outra.
*   **Segurança:** Credenciais da API da Meta são criptografadas antes de serem salvas.
*   **Webhooks:** Toda requisição recebida da Meta é assinada e validada para evitar falsificações.

---

## Estrutura do Código

```text
/apps/web      # Painel do usuário
/apps/api      # Backend (regras de negócio)
/apps/worker   # Processamento de filas (assíncrono)
/packages/shared # Código compartilhado entre apps (tipos, validações)
```

Essa estrutura nos permite compartilhar tipos entre o Frontend e o Backend, evitando bugs de disparidade de dados.
