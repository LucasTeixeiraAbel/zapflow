# ZapFlow — Foundation v1.0

Base documental e ambiente local inicial para o ZapFlow, uma plataforma SaaS de campanhas de comunicação para pequenos negócios.

> **Escopo desta entrega:** arquitetura, responsabilidades dos módulos, modelo entidade-relacionamento, contratos entre Web/API/Worker, infraestrutura local e backlog inicial. Ainda não é a aplicação funcional e não realiza envios reais.

## Decisões principais

- Monorepo com `pnpm`.
- Web: Next.js + React + TypeScript.
- API: NestJS + TypeScript.
- Worker: NestJS + BullMQ.
- Persistência: PostgreSQL + Prisma ORM 7.
- Filas: Redis + BullMQ.
- Integração externa: adaptador para WhatsApp Cloud API.
- Desenvolvimento local no Windows 11: PostgreSQL e Redis no Docker; Web, API e Worker executados no host.
- Multi-tenancy desde o início; uma conexão WhatsApp por empresa no MVP.
- Campanhas e mensagens devem ser rastreáveis e idempotentes dentro dos limites do provedor.

## Estrutura desta entrega

```text
zapflow-foundation/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml
├── docs/
│   ├── architecture/architecture.md
│   ├── database/erd.mmd
│   ├── database/data-model.md
│   ├── contracts/api-contract.md
│   ├── contracts/worker-contract.md
│   └── backlog/backlog.md
└── scripts/
    ├── dev-up.ps1
    ├── dev-down.ps1
    └── dev-reset.ps1
```

## Pré-requisitos

1. Windows 11 com WSL 2 habilitado.
2. Docker Desktop em execução usando o backend WSL 2.
3. Node.js 24 LTS instalado (use a versão LTS, não a linha Current/Alpha).
4. Git instalado.
5. VS Code.

Node.js 24 foi escolhido por ser uma linha LTS suportada e compatível com os requisitos documentados do Prisma ORM 7. Não usamos versões `Current` ou `Alpha` para a base do projeto.

## Preparar ferramentas do projeto

Confirme as ferramentas no PowerShell:

```powershell
node --version
npm --version
```

Instale o pnpm globalmente com npm:

```powershell
npm install --global pnpm
pnpm --version
```

## Iniciar a infraestrutura local

Abra o PowerShell na raiz do repositório:

```powershell
Copy-Item .env.example .env
```

O `.env` contém apenas credenciais descartáveis de desenvolvimento. Não o envie ao GitHub.

Inicie PostgreSQL e Redis:

```powershell
docker compose up -d
```

Confira os serviços:

```powershell
docker compose ps
```

Acompanhe os logs:

```powershell
docker compose logs -f postgres redis
```

Verifique o PostgreSQL:

```powershell
docker compose exec postgres pg_isready -U zapflow -d zapflow
```

Verifique o Redis:

```powershell
docker compose exec redis redis-cli ping
```

Resultado esperado do Redis: `PONG`.

## Portas locais

| Serviço | Host | Porta do container |
|---|---:|---:|
| PostgreSQL 18 | `127.0.0.1:54329` | `5432` |
| Redis | `127.0.0.1:6380` | `6379` |

As portas no host foram escolhidas para reduzir conflitos com instalações locais. Os serviços ficam publicados apenas em `127.0.0.1`.

## Encerrar e preservar os dados

```powershell
docker compose down
```

Isso remove os containers, mas preserva os volumes nomeados.

Para apagar também os dados locais — operação destrutiva:

```powershell
docker compose down -v
```

## Próximo passo de implementação

Seguir o backlog em `docs/backlog/backlog.md`, começando por `ZAP-001`. A aplicação ainda deverá ser criada em `apps/web`, `apps/api`, `apps/worker` e `packages/contracts`.

## Regras importantes

- Nunca usar dados ou credenciais reais em desenvolvimento.
- Nunca colocar tokens da Meta no frontend.
- A API deriva o `tenantId` da sessão e da associação do usuário; não confia em `tenantId` livre enviado no corpo da requisição.
- O worker revalida autorização e lista de supressão imediatamente antes do envio.
- Mensagens com resultado de envio incerto não são reenviadas automaticamente sem reconciliação.
- O simulador deve funcionar antes de conectar a API oficial.
