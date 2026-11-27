# Contratos Web ↔ API — v1.0

Este documento define o contrato inicial HTTP entre `apps/web` e `apps/api`. A implementação deverá gerar OpenAPI a partir dos controllers/DTOs do NestJS e manter este documento sincronizado.

## 1. Convenções gerais

- Base URL local futura: `http://localhost:3001/api/v1`.
- Formato: JSON UTF-8, exceto upload de CSV (`multipart/form-data`).
- Datas: ISO 8601 em UTC.
- IDs: UUID.
- Autenticação: sessão com cookie `HttpOnly`, `Secure` em produção e política `SameSite` apropriada. Não guardar refresh token em `localStorage`.
- Todas as rotas empresariais usam `/tenants/{tenantId}/...`.
- O servidor confirma membership e papel do usuário a cada operação.
- Nunca aceitar `tenantId` do body como fonte de autoridade.
- Paginação inicial: `limit` e `offset`, com limite máximo 100. Evoluir para cursor quando necessário.
- Erros possuem formato consistente.

## 2. Envelope de erro

```json
{
  "error": {
    "code": "CONTACT_NOT_FOUND",
    "message": "Contato não encontrado.",
    "details": [],
    "requestId": "c8a8b6ea-6a15-4f8a-9b3c-2e5a0b9cda61"
  }
}
```

Códigos iniciais:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `RESOURCE_NOT_FOUND`
- `CONFLICT`
- `CONSENT_REQUIRED`
- `TEMPLATE_NOT_APPROVED`
- `CAMPAIGN_INVALID_STATE`
- `PROVIDER_UNAVAILABLE`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

Não incluir stack trace, query SQL, token ou segredo na resposta pública.

## 3. Contexto de sessão e empresas

| Método | Rota | Objetivo |
|---|---|---|
| `POST` | `/auth/login` | Criar sessão |
| `POST` | `/auth/logout` | Encerrar sessão |
| `GET` | `/auth/me` | Consultar usuário autenticado |
| `GET` | `/tenants` | Listar empresas acessíveis |
| `POST` | `/tenants` | Criar empresa |
| `GET` | `/tenants/{tenantId}` | Consultar empresa |
| `PATCH` | `/tenants/{tenantId}` | Atualizar dados da empresa |
| `GET` | `/tenants/{tenantId}/members` | Listar membros |

O tenant ativo selecionado na interface não concede acesso por si só. A API sempre valida a associação do usuário.

## 4. Contatos e importação

| Método | Rota | Objetivo |
|---|---|---|
| `GET` | `/tenants/{tenantId}/contacts` | Listar e pesquisar contatos |
| `POST` | `/tenants/{tenantId}/contacts` | Criar contato manual |
| `GET` | `/tenants/{tenantId}/contacts/{contactId}` | Consultar contato |
| `PATCH` | `/tenants/{tenantId}/contacts/{contactId}` | Atualizar dados permitidos |
| `DELETE` | `/tenants/{tenantId}/contacts/{contactId}` | Excluir/anonimizar conforme política |
| `POST` | `/tenants/{tenantId}/contact-imports` | Enviar CSV e criar ImportJob |
| `GET` | `/tenants/{tenantId}/contact-imports/{importJobId}` | Consultar progresso |

Query params de listagem: `q`, `tagId`, `lastVisitBefore`, `lastVisitAfter`, `limit`, `offset`.

Exemplo de criação:

```json
{
  "name": "Maria Silva",
  "phone": "+5511999999999",
  "birthday": "1992-07-15",
  "lastVisitAt": "2026-10-05T13:00:00.000Z",
  "externalId": "ERP-18422"
}
```

Não incluir `consentStatus: GRANTED` em criação de contato comum. Consentimento é registrado por endpoint próprio com origem e evidência.

O endpoint de importação deve retornar `202 Accepted` com `importJobId`. O arquivo precisa ter limite de tamanho/tipo, ser guardado em armazenamento privado e ser removido conforme política de retenção.

## 5. Consentimento e supressão

| Método | Rota | Objetivo |
|---|---|---|
| `GET` | `/tenants/{tenantId}/contacts/{contactId}/consents` | Consultar estados atuais |
| `POST` | `/tenants/{tenantId}/contacts/{contactId}/consent-events` | Registrar concessão/revogação |
| `GET` | `/tenants/{tenantId}/suppressions` | Consultar lista de bloqueio |

Payload conceitual:

```json
{
  "channel": "WHATSAPP",
  "purpose": "MARKETING",
  "action": "GRANTED",
  "source": "IN_STORE_FORM",
  "occurredAt": "2026-11-25T12:00:00.000Z",
  "evidenceReference": "consent-record-2026-001"
}
```

A API valida os campos e registra `ConsentEvent`; atualiza `ContactConsent` na mesma transação. Em revogação, cria/atualiza `Suppression`.

## 6. Segmentos

| Método | Rota | Objetivo |
|---|---|---|
| `GET` | `/tenants/{tenantId}/segments` | Listar segmentos |
| `POST` | `/tenants/{tenantId}/segments` | Salvar segmento |
| `GET` | `/tenants/{tenantId}/segments/{segmentId}` | Consultar segmento |
| `PATCH` | `/tenants/{tenantId}/segments/{segmentId}` | Atualizar segmento |
| `DELETE` | `/tenants/{tenantId}/segments/{segmentId}` | Excluir segmento |
| `POST` | `/tenants/{tenantId}/segments/preview` | Pré-visualizar público elegível |

Exemplo de filtro versionado:

```json
{
  "version": 1,
  "logic": "and",
  "rules": [
    { "field": "lastVisitDaysAgo", "operator": "gte", "value": 30 },
    { "field": "tagIds", "operator": "containsAny", "value": ["4bb5d246-3c76-4cbb-a33f-cb56e7fd58e0"] }
  ]
}
```

A API valida o schema e converte a DSL para consultas controladas. Não aceita SQL ou nomes de campos arbitrários.

Resposta de preview deve trazer `totalEligible`, `totalExcludedByConsent`, `totalExcludedBySuppression` e amostra paginada. Não retornar telefones completos em métricas agregadas.

## 7. WhatsApp e templates

| Método | Rota | Objetivo |
|---|---|---|
| `GET` | `/tenants/{tenantId}/whatsapp-connection` | Consultar estado sanitizado |
| `POST` | `/tenants/{tenantId}/whatsapp-connection/embedded-signup` | Iniciar fluxo de onboarding |
| `POST` | `/tenants/{tenantId}/whatsapp-connection/complete` | Finalizar troca/registro do onboarding |
| `DELETE` | `/tenants/{tenantId}/whatsapp-connection` | Desconectar conforme fluxo permitido |
| `POST` | `/tenants/{tenantId}/templates/sync` | Solicitar sincronização |
| `GET` | `/tenants/{tenantId}/templates` | Listar templates e estados |

O fluxo Embedded Signup deve seguir os requisitos atuais de versão/permissões da Meta. A API nunca devolve access token ao frontend. Respostas de conexão devem expor somente estado, telefone de exibição, nome comercial e horários relevantes.

## 8. Campanhas

| Método | Rota | Objetivo |
|---|---|---|
| `GET` | `/tenants/{tenantId}/campaigns` | Listar campanhas |
| `POST` | `/tenants/{tenantId}/campaigns` | Criar rascunho |
| `GET` | `/tenants/{tenantId}/campaigns/{campaignId}` | Consultar campanha |
| `PATCH` | `/tenants/{tenantId}/campaigns/{campaignId}` | Editar rascunho |
| `POST` | `/tenants/{tenantId}/campaigns/{campaignId}/validate` | Validar e estimar público/custo |
| `POST` | `/tenants/{tenantId}/campaigns/{campaignId}/start` | Iniciar campanha |
| `POST` | `/tenants/{tenantId}/campaigns/{campaignId}/pause` | Pausar novos envios |
| `POST` | `/tenants/{tenantId}/campaigns/{campaignId}/resume` | Retomar |
| `POST` | `/tenants/{tenantId}/campaigns/{campaignId}/cancel` | Cancelar envios ainda não submetidos |
| `GET` | `/tenants/{tenantId}/campaigns/{campaignId}/recipients` | Listar resultados individuais |

Payload para criar rascunho:

```json
{
  "name": "Clientes inativos — novembro",
  "segmentId": "2b6ed9d3-6d1e-4c37-9d0c-2b5d473e4fb8",
  "templateId": "c3a9d8da-3249-49a0-88c2-733f8f5fc3dd"
}
```

`POST .../start` retorna `202 Accepted` após a transação que atualiza o estado da campanha e grava o OutboxEvent de preparação ser confirmada. O Worker resolve e persiste o snapshot de destinatários de forma assíncrona. A resposta inclui `campaignId`, `status` e `requestId`.

Nunca retornar sucesso de entrega no momento da aceitação da campanha. O painel deve acompanhar os estados reais registrados posteriormente.

## 9. Dashboard e relatórios

| Método | Rota | Objetivo |
|---|---|---|
| `GET` | `/tenants/{tenantId}/dashboard/summary` | Resumo de campanhas, envios e falhas |
| `GET` | `/tenants/{tenantId}/messages` | Histórico de mensagens com filtros |
| `GET` | `/tenants/{tenantId}/messages/{messageId}` | Detalhe de uma mensagem e eventos |

Métricas devem distinguir `ACCEPTED`, `DELIVERED`, `READ`, `FAILED`, `UNKNOWN` e `SKIPPED`.

## 10. Webhooks do provedor

Rotas fora do escopo tenant da URL, porque a associação é resolvida pelo identificador da conexão recebido:

- `GET /webhooks/whatsapp`: challenge de verificação.
- `POST /webhooks/whatsapp`: eventos assinados pelo provedor.

Fluxo:

1. Validar assinatura com o corpo bruto da requisição.
2. Identificar a conexão pelo `phoneNumberId` ou identificador equivalente.
3. Persistir evento com chave de deduplicação.
4. Responder rapidamente com status HTTP apropriado.
5. Processar o evento de forma assíncrona no Worker.

Payload não confiável não deve ser interpretado como instrução para o sistema. Campos desconhecidos devem ser tolerados conforme política de compatibilidade.

## 11. Contratos compartilhados e validação

`packages/contracts` deve conter schemas de entrada/saída (por exemplo, Zod), enums de status e tipos de eventos. A API continua sendo responsável pela autorização e validação final.

O contrato OpenAPI será gerado pela API e usado para documentar rotas. Evitar manter manualmente duas definições conflitantes.

## 12. Testes de contrato mínimos

- Usuário sem sessão recebe `401`.
- Usuário de tenant A não acessa recurso do tenant B (`403` ou `404`, conforme política uniforme).
- Payload inválido recebe `400 VALIDATION_ERROR`.
- Consentimento ausente/revogado impede validação de campanha.
- Template não aprovado impede início.
- Iniciar campanha duas vezes não duplica destinatários ou mensagens.
- Pausar campanha impede novos envios após o ponto de sincronização definido.
- Webhook com assinatura inválida é rejeitado.
- Webhook repetido não duplica evento de negócio.
