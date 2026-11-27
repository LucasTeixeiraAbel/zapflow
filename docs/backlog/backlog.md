# Backlog inicial — ZapFlow

O backlog está ordenado por dependência e valor de validação. Trabalhar em histórias verticais pequenas, com critérios de aceite testáveis. Não começar pelo envio real à Meta: primeiro entregar um fluxo ponta a ponta com provedor simulado.

## Prioridades

- **P0**: bloqueador para a primeira demonstração funcional.
- **P1**: necessário para o piloto seguro com usuários.
- **P2**: evolução pós-MVP.

## EPIC 0 — Fundação do repositório

### ZAP-001 — Criar monorepo
**Prioridade:** P0  
**Descrição:** Criar estrutura `apps/web`, `apps/api`, `apps/worker` e `packages/contracts`, `packages/database`. Configurar pnpm workspace e TypeScript.

**Critérios de aceite:**
- `pnpm install` funciona na raiz.
- Cada aplicação possui comando de desenvolvimento e build, mesmo que inicialmente mínimo.
- Dependências compartilhadas têm versão controlada pelo workspace.
- README explica como iniciar cada app.

### ZAP-002 — Subir dependências locais com Docker Compose
**Prioridade:** P0  
**Descrição:** Disponibilizar PostgreSQL e Redis com volumes persistentes, healthchecks e portas locais.

**Critérios de aceite:**
- `docker compose up -d` inicia ambos os serviços.
- PostgreSQL fica healthy e aceita conexão.
- Redis responde `PONG`.
- `docker compose down` preserva volumes.
- `.env` está ignorado pelo Git.

### ZAP-003 — Padrões de engenharia
**Prioridade:** P0  
**Descrição:** Configurar ESLint, Prettier, TypeScript strict, editorconfig, scripts de lint/test/build e GitHub Actions.

**Critérios de aceite:**
- Pull request executa lint, testes e build.
- Build falha quando há erro de TypeScript.
- Nenhum segredo é necessário no CI para testar o esqueleto.

### ZAP-004 — Health checks
**Prioridade:** P0  
**Descrição:** Criar endpoints de liveness/readiness da API e verificação de dependências.

**Critérios de aceite:**
- `/health/live` informa se o processo está ativo.
- `/health/ready` verifica PostgreSQL e Redis sem expor credenciais.
- Worker registra estado de inicialização e dependências nos logs.

## EPIC 1 — Dados e multi-tenancy

### ZAP-005 — Configurar Prisma e migrations
**Prioridade:** P0  
**Descrição:** Configurar Prisma ORM 7 com PostgreSQL, cliente compartilhado e fluxo de migrations.

**Critérios de aceite:**
- API conecta ao PostgreSQL local.
- Migration inicial pode ser aplicada em banco vazio.
- Testes podem preparar e limpar banco dedicado.

### ZAP-006 — Implementar entidades de identidade e tenant
**Prioridade:** P0  
**Descrição:** Criar Tenant, User e Membership com papéis iniciais.

**Critérios de aceite:**
- Usuário pode pertencer a uma ou mais empresas.
- Membership possui unicidade por tenant/usuário.
- Acesso a tenant sem membership é negado.

### ZAP-007 — Provar isolamento entre empresas
**Prioridade:** P0  
**Descrição:** Implementar contexto de tenant, guard e repositórios escopados; escrever testes negativos.

**Critérios de aceite:**
- Usuário do tenant A não lista, consulta, altera ou exclui registros do tenant B.
- Fornecer ID de outro tenant no path ou body não contorna a autorização.
- Ações administrativas validam papel.

## EPIC 2 — Contatos e consentimento

### ZAP-008 — CRUD de contatos
**Prioridade:** P0  
**Descrição:** Implementar cadastro, consulta, busca, edição e exclusão lógica de contatos.

**Critérios de aceite:**
- Telefone é normalizado para E.164.
- Não há duplicação de telefone ativo dentro do mesmo tenant.
- Todas as operações são escopadas por tenant.

### ZAP-009 — Importação CSV com prévia
**Prioridade:** P0  
**Descrição:** Criar fluxo de upload, mapeamento de colunas, validação e resumo de importação.

**Critérios de aceite:**
- Usuário visualiza prévia antes de confirmar.
- Linhas inválidas e duplicadas são contabilizadas.
- Importação não concede consentimento.
- ImportJob registra totais e estado.

### ZAP-010 — Registro de consentimento e supressão
**Prioridade:** P0  
**Descrição:** Implementar ConsentEvent, ContactConsent e Suppression.

**Critérios de aceite:**
- Ausência de evidência resulta em estado UNKNOWN.
- Concessão e revogação produzem eventos auditáveis.
- Revogação atualiza estado atual e supressão na mesma transação.
- Contato revogado não aparece como elegível para campanha de finalidade correspondente.

### ZAP-011 — Tags e segmentos
**Prioridade:** P0  
**Descrição:** Implementar tags e DSL versionada para segmentos.

**Critérios de aceite:**
- Usuário cria e edita tags.
- Usuário salva filtros suportados.
- Preview retorna quantidade total e exclusões por consentimento/supressão.
- Filtros inválidos ou campos não permitidos são rejeitados.

## EPIC 3 — Campanha com simulação

### ZAP-012 — Catálogo e seleção de templates simulados
**Prioridade:** P0  
**Descrição:** Criar contrato do MessageProvider e FakeMessagingProvider com catálogo de templates fictícios para desenvolvimento.

**Critérios de aceite:**
- Interface não depende de classes específicas da Meta.
- Template de teste possui categoria, idioma, estado e variáveis.
- Não existe envio externo no modo simulado.

### ZAP-013 — Criar rascunho e validar campanha
**Prioridade:** P0  
**Descrição:** Criar campanha em rascunho, selecionar segmento e template, validar público e apresentar prévia.

**Critérios de aceite:**
- Campanha guarda configuração versionada.
- Validação não envia mensagem.
- Destinatários sem autorização são excluídos e contabilizados.
- Template inválido impede início.

### ZAP-014 — Implementar Transactional Outbox
**Prioridade:** P0  
**Descrição:** Persistir eventos de domínio na mesma transação das operações críticas e publicar para BullMQ via dispatcher.

**Critérios de aceite:**
- Falha do Redis não perde a intenção de trabalho já gravada no banco.
- Dispatcher retoma eventos não publicados.
- Publicar o mesmo evento duas vezes não duplica efeito de negócio.

### ZAP-015 — Processar campanha no FakeMessagingProvider
**Prioridade:** P0  
**Descrição:** Preparar destinatários, enfileirar trabalhos individuais e simular respostas do provedor.

**Critérios de aceite:**
- Cada destinatário possui estado próprio.
- Campanha continua após fechar o navegador.
- Retomar worker não duplica mensagens simuladas.
- Pausar/cancelar impede novos destinatários de iniciar processamento.

### ZAP-016 — Histórico e dashboard
**Prioridade:** P0  
**Descrição:** Exibir progresso, contagens, falhas, destinatários e eventos de mensagens.

**Critérios de aceite:**
- Dashboard distingue aceitação, entrega, leitura, falha, ignorado e resultado incerto.
- Histórico permite filtrar por campanha e estado.
- Dados exibidos correspondem ao banco, não ao estado local do navegador.

## EPIC 4 — WhatsApp Cloud API

### ZAP-017 — Configurar conta Meta de desenvolvimento
**Prioridade:** P1  
**Descrição:** Preparar app, número de teste, permissões, credenciais e ambiente isolado.

**Critérios de aceite:**
- Credenciais ficam somente no ambiente/API.
- Nenhum segredo é comitado.
- Fluxo de teste documentado.

### ZAP-018 — Implementar WhatsAppCloudApiProvider
**Prioridade:** P1  
**Descrição:** Implementar envio de templates e sincronização de catálogo pelo adaptador.

**Critérios de aceite:**
- API externa fica encapsulada no provider.
- Erros externos são traduzidos para erros internos tipados.
- Limites e retentativas são tratados por política explícita.
- Timeout/resposta ambígua gera UNKNOWN, sem retry cego.

### ZAP-019 — Implementar webhook verificado
**Prioridade:** P1  
**Descrição:** Verificar assinatura, persistir eventos, deduplicar e processar assincronamente.

**Critérios de aceite:**
- Assinatura inválida é rejeitada.
- Eventos repetidos não duplicam MessageEvent.
- Eventos de entrega/leitura atualizam estados sem regressão.

### ZAP-020 — Onboarding de conexão empresarial
**Prioridade:** P1  
**Descrição:** Implementar fluxo de conexão conforme requisitos atuais de Embedded Signup e validar, em ambiente de teste, o cenário de número existente/coexistência quando aplicável.

**Critérios de aceite:**
- Token nunca é exposto ao frontend.
- Estado de conexão é visível e auditável.
- O produto não promete coexistência até concluir validação técnica e de elegibilidade.

## EPIC 5 — Piloto seguro

### ZAP-021 — Controles operacionais da campanha
**Prioridade:** P1  
**Descrição:** Implementar pausa, retomada, cancelamento, limite por conexão e custo estimado.

**Critérios de aceite:**
- Limite de envio respeita configuração e limites do provedor.
- Campanha pausada não inicia novos envios.
- Estimativa identifica premissas e não é apresentada como cobrança final.

### ZAP-022 — Hardening de segurança e privacidade
**Prioridade:** P1  
**Descrição:** Revisar retenção, exclusão/anonimização, logs, criptografia, backups, direitos dos titulares e controle de acesso.

**Critérios de aceite:**
- Logs não contêm tokens ou telefones completos sem necessidade.
- Há procedimento para descadastro e atendimento de titular.
- Backup e restauração são testados.

### ZAP-023 — Piloto com estabelecimento
**Prioridade:** P1  
**Descrição:** Validar onboarding, importação, campanha e resultados com um estabelecimento que tenha autorização documentada dos destinatários.

**Critérios de aceite:**
- Tempo de preparação medido.
- Problemas de usabilidade registrados.
- Nenhuma mensagem enviada a contato sem autorização válida.
- Aprendizados registrados em `docs/`.

## Ordem de execução sugerida

1. ZAP-001 a ZAP-004: esqueleto e ambiente.
2. ZAP-005 a ZAP-007: persistência e isolamento multiempresa.
3. ZAP-008 a ZAP-011: contatos, consentimento e segmentação.
4. ZAP-012 a ZAP-016: campanha ponta a ponta com simulação.
5. ZAP-017 a ZAP-020: integração oficial.
6. ZAP-021 a ZAP-023: preparação e execução do piloto.

## Definition of Done

Uma tarefa só está concluída quando:

- código e documentação foram atualizados;
- lint, typecheck e testes passam;
- migrações foram testadas (quando aplicável);
- isolamento por tenant foi testado (quando aplicável);
- não há segredo no diff;
- critérios de aceite foram demonstrados;
- commit tem mensagem clara e escopo pequeno.
