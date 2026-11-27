# Modelo de dados — decisões e restrições

O diagrama ER está em `erd.mmd`. Este documento complementa o diagrama com regras de integridade e índices que deverão ser refletidos no schema Prisma e nas migrations SQL.

## 1. Convenções

- Chaves primárias: UUID.
- Datas armazenadas em UTC (`timestamptz` no PostgreSQL).
- Telefones: E.164, normalizados no backend.
- IDs externos do provedor: armazenados como strings.
- Campos flexíveis de integração: JSONB, sempre validados na entrada.
- Exclusão lógica para contatos quando necessário; eventos de consentimento e auditoria são append-only.
- Dados pessoais devem ter política de retenção e exclusão/anonimização definida antes da produção.

## 2. Entidades

### Tenant e usuários

- `Tenant`: empresa cliente do SaaS.
- `User`: identidade global de login.
- `Membership`: papel do usuário dentro de uma empresa. Um usuário poderá participar de mais de uma empresa.

Restrições:
- `User.email` único e normalizado em minúsculas.
- `Membership(tenantId, userId)` único.
- Papéis iniciais: `OWNER`, `ADMIN`, `OPERATOR`.

### WhatsAppConnection

Uma conexão por empresa no MVP. Armazena `wabaId`, `phoneNumberId`, telefone de exibição, estado e referência/ciphertext de credencial protegida.

Restrições:
- `tenantId` único na tabela no MVP.
- `phoneNumberId` único globalmente.
- Nunca retornar token ou ciphertext por endpoints de consulta.
- Preferir secret manager/KMS em produção. Em desenvolvimento, usar chave local fora do Git.

### Contact

Dados mínimos necessários para identificar e segmentar o cliente. `externalId` guarda o identificador do ERP de origem quando existir.

Restrições e índices:
- Único por `(tenantId, phoneE164)` entre contatos ativos.
- Índice por `(tenantId, lastVisitAt)`.
- Índice por `(tenantId, name)` para busca simples.
- Índice por `(tenantId, externalId)` quando `externalId` não for nulo.
- Importação não deve sobrescrever consentimento com base apenas no CSV.

### Consentimento: ContactConsent e ConsentEvent

`ContactConsent` é o estado atual de autorização por contato, canal e finalidade. `ConsentEvent` é o histórico imutável de concessão, alteração ou revogação, incluindo origem e evidência disponível.

Valores sugeridos:
- `channel`: `WHATSAPP`, `EMAIL`, etc.
- `purpose`: `MARKETING`, `UTILITY`, `SERVICE`.
- `status`: `GRANTED`, `REVOKED`, `UNKNOWN`.
- `action`: `GRANTED`, `REVOKED`, `EVIDENCE_UPDATED`.

Regras:
- Ausência de registro equivale a `UNKNOWN`, nunca a autorização.
- Importar um telefone não cria consentimento.
- Uma revogação deve atualizar `ContactConsent` e inserir uma `Suppression` na mesma transação.
- Antes de cada mensagem, o worker verifica o estado atual e a supressão.
- Armazenar a evidência estritamente necessária, evitando coletar conteúdo excessivo.

### Tag, ContactTag e Segment

- `Tag`: categoria definida por uma empresa.
- `ContactTag`: relação N:N.
- `Segment`: definição salva de filtros, representada por JSONB validado por schema versionado.

Não aceitar SQL, nomes de colunas arbitrários ou expressões executáveis no filtro JSON. Usar uma DSL limitada, por exemplo:

```json
{
  "version": 1,
  "rules": [
    { "field": "lastVisitDaysAgo", "operator": "gte", "value": 30 },
    { "field": "tagIds", "operator": "containsAny", "value": ["uuid-da-tag"] }
  ],
  "logic": "and"
}
```

### MessageTemplate

Representa um template sincronizado da Meta. Guardar nome externo, idioma, categoria, status e componentes necessários para apresentar parâmetros. O estado de aprovação deve refletir a última sincronização válida.

Restrição: único por `(connectionId, providerTemplateName, language)`.

### Campaign e CampaignRecipient

`Campaign` é a operação de negócio. `CampaignRecipient` é a fotografia do destinatário selecionado e o estado individual do processamento.

Regras:
- Único por `(campaignId, contactId)`.
- Ao iniciar campanha, resolver o público e persistir os destinatários elegíveis em transação.
- Não recalcular silenciosamente os destinatários de uma campanha já iniciada.
- Guardar somente parâmetros necessários para renderizar o template; evitar cópias desnecessárias de dados pessoais.
- Pausar/cancelar impede novos envios que ainda não iniciaram; requisições já submetidas ao provedor podem não ser reversíveis.

### Message e MessageEvent

`Message` representa a tentativa/resultado de comunicação. `MessageEvent` registra transições recebidas do provedor.

Estados principais:
- `SUBMITTING`: tentativa iniciada.
- `ACCEPTED`: provedor aceitou a requisição e retornou ID.
- `DELIVERED`: evento de entrega recebido.
- `READ`: evento de leitura recebido, quando disponível.
- `FAILED`: falha conhecida.
- `UNKNOWN`: resultado ambíguo; requer reconciliação antes de novo envio.

Não usar `SENT` como sinônimo de `DELIVERED`. A aceitação da API não garante entrega.

### Suppression

Lista operacional de bloqueio por contato, canal e finalidade. Usada como verificação rápida antes do envio.

Restrição: único por `(tenantId, contactId, channel, purpose)`. A remoção de supressão deve ser auditada e só ocorrer após nova autorização válida.

### ImportJob

Rastreia importação CSV, contagens e estado. Arquivos devem ficar em armazenamento privado e temporário; não guardar caminhos locais do computador do usuário.

### OutboxEvent

Fila durável no PostgreSQL para publicar trabalho no BullMQ sem janela de perda entre transação e Redis.

Campos relevantes: `aggregateType`, `aggregateId`, `eventType`, `payload`, `occurredAt`, `publishedAt`, `attempts`.

Índice recomendado: `(publishedAt, occurredAt)` para eventos pendentes.

### WebhookEvent

Persistência idempotente dos eventos recebidos. Validar assinatura antes de aceitar. A deduplicação deve usar chave estável derivada do evento/mensagem/status/horário do provedor; não assumir que cada POST possui um identificador único global.

### AuditLog

Registra ações importantes: login administrativo, alteração de membro, criação/início/pausa/cancelamento de campanha, mudança de consentimento e alteração de conexão. Não registrar tokens nem payloads sensíveis completos.

## 3. Chaves estrangeiras e isolamento

Quando possível, usar constraints compostas para garantir que relações entre entidades carreguem o mesmo `tenantId` (por exemplo, `CampaignRecipient(tenantId, campaignId)` referenciando `Campaign(tenantId, id)`). Se uma relação Prisma exigir migration SQL manual para essa garantia, documentar a migration.

Toda consulta empresarial exige `tenantId` autorizado no contexto. Chaves UUID não são autorização.

## 4. Índices e unicidade mínimos

- `Membership(tenantId, userId)` UNIQUE.
- `WhatsAppConnection(tenantId)` UNIQUE no MVP.
- `WhatsAppConnection(phoneNumberId)` UNIQUE.
- `Contact(tenantId, phoneE164)` UNIQUE para registros ativos.
- `ContactConsent(tenantId, contactId, channel, purpose)` UNIQUE.
- `ContactTag(contactId, tagId)` UNIQUE.
- `MessageTemplate(connectionId, providerTemplateName, language)` UNIQUE.
- `CampaignRecipient(campaignId, contactId)` UNIQUE.
- `Message(providerMessageId)` UNIQUE quando não nulo.
- `Message(campaignRecipientId)` UNIQUE quando não nulo.
- `Suppression(tenantId, contactId, channel, purpose)` UNIQUE.
- `WebhookEvent(dedupeKey)` UNIQUE.

## 5. Migrações

- Todas as mudanças de schema devem ser versionadas em migration.
- Não editar migrations já aplicadas em ambientes compartilhados.
- Testar migration em banco descartável antes de merge.
- Para constraints compostas, índices parciais e funções específicas do PostgreSQL, usar SQL explícito em migration quando necessário.
