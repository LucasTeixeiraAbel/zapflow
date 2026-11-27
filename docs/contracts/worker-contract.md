# Contratos API ↔ Worker — v1.0

## 1. Princípios

- PostgreSQL é a fonte da verdade para estados de negócio.
- Redis/BullMQ é infraestrutura de entrega de trabalhos, não o registro definitivo da campanha.
- A API grava a intenção de trabalho em `OutboxEvent` na mesma transação que altera os dados de negócio.
- O Worker recebe IDs, carrega o estado atual no banco e valida novamente as pré-condições.
- Jobs podem ser executados mais de uma vez; todos os handlers devem ser idempotentes.
- Payload de job não deve carregar token, telefone completo, conteúdo sensível ou grandes listas de contatos.

## 2. Filas e payloads

| Fila | Job | Payload mínimo | Produtor | Consumidor |
|---|---|---|---|---|
| `zapflow.outbox` | `dispatch-pending` | `{ batchSize }` | Scheduler interno | Outbox dispatcher |
| `zapflow.imports` | `process-csv-import` | `{ importJobId }` | Outbox dispatcher | Import processor |
| `zapflow.campaigns` | `prepare-campaign` | `{ campaignId }` | Outbox dispatcher | Campaign processor |
| `zapflow.messages` | `send-campaign-recipient` | `{ campaignRecipientId }` | Campaign processor | Message sender |
| `zapflow.webhooks` | `process-provider-event` | `{ webhookEventId }` | Outbox dispatcher | Webhook processor |

Os nomes são identificadores internos versionados. Alterações incompatíveis devem introduzir versão no `jobName` ou no envelope.

## 3. Envelope comum

```ts
export interface JobEnvelope<TPayload> {
  version: 1;
  jobId: string;
  correlationId: string;
  tenantId: string;
  createdAt: string; // ISO 8601 UTC
  payload: TPayload;
}
```

Exemplo de job de envio:

```json
{
  "version": 1,
  "jobId": "5cfd02b3-e628-4a58-94dd-3f6e71d1bbab",
  "correlationId": "a4114a26-6b7f-47c4-8a5f-4ae363d38149",
  "tenantId": "2b6ed9d3-6d1e-4c37-9d0c-2b5d473e4fb8",
  "createdAt": "2026-11-25T12:00:00.000Z",
  "payload": {
    "campaignRecipientId": "f99a1fd0-9b96-4bf4-8b32-1dbcf26d8bde"
  }
}
```

`tenantId` dentro do job é contexto para validação e observabilidade; o Worker deve conferir se o registro carregado pertence ao tenant informado.

## 4. Outbox dispatcher

Responsabilidades:

1. Buscar eventos não publicados em lotes.
2. Reservar eventos com bloqueio transacional (`FOR UPDATE SKIP LOCKED` ou estratégia equivalente).
3. Publicar job com identificador determinístico derivado do OutboxEvent.
4. Marcar `publishedAt` apenas após confirmação de publicação na fila.
5. Incrementar tentativas e registrar falhas operacionais.
6. Permitir reprocessamento seguro de eventos presos.

A reserva deve ter timeout/lease ou ser executada dentro de transação curta. Não manter uma transação aberta enquanto uma chamada de rede ao Redis fica bloqueada.

## 5. Processador de campanha

Ao receber `prepare-campaign`:

1. Carregar campanha e confirmar tenant.
2. Confirmar que a campanha está no estado correto.
3. Resolver snapshot dos destinatários conforme o contrato da campanha.
4. Excluir contatos sem autorização atual, suprimidos, inválidos ou sem telefone utilizável.
5. Criar `CampaignRecipient` uma única vez por `(campaignId, contactId)`.
6. Persistir contagens e OutboxEvents dos envios.
7. Atualizar estado da campanha.

O processo deve ser paginado. Não carregar milhares de contatos em memória.

## 6. Message sender

Para cada `campaignRecipientId`:

1. Carregar campanha, destinatário, contato, conexão e template no tenant correto.
2. Verificar se campanha continua `SENDING` e não foi pausada/cancelada.
3. Verificar consentimento atual e supressão no momento do envio.
4. Verificar template aprovado, idioma e parâmetros.
5. Aplicar limite de concorrência/ritmo por conexão e política do provedor.
6. Criar registro de tentativa antes da chamada externa, no estado `SUBMITTING`.
7. Chamar `MessagingProvider.sendTemplate`.
8. Em aceitação confirmada, salvar providerMessageId e `ACCEPTED`.
9. Em erro conhecido e permanente, salvar `FAILED` com código seguro.
10. Em erro transitório com rejeição explícita, aplicar retentativa respeitando `Retry-After` e política do provedor.
11. Em timeout, queda de conexão ou resposta ambígua, marcar `UNKNOWN` e não repetir automaticamente até reconciliação.

### Retentativas

- `429` com rejeição explícita: retentar conforme `Retry-After` e backoff.
- Erros de validação/autorização/template (`4xx` permanentes): não retentar sem correção.
- Timeout ou `5xx` ambíguo: estado `UNKNOWN`; não fazer retry cego.
- Erro local antes de iniciar a chamada externa: pode ser repetido com segurança.

BullMQ `attempts` não deve ser usado como única política de retry para chamadas que podem ter sido aceitas externamente.

## 7. Processador de webhook

1. Carregar `WebhookEvent` persistido pela API.
2. Confirmar tenant/conexão.
3. Deduplicar pelo `dedupeKey`.
4. Mapear evento externo para evento interno tipado.
5. Encontrar mensagem pelo identificador do provedor.
6. Inserir `MessageEvent` uma única vez.
7. Atualizar estado materializado sem regredir estados válidos (por exemplo, um evento atrasado não deve trocar `READ` para `DELIVERED`).
8. Marcar webhook como processado ou falho com erro sanitizado.

## 8. Import processor

1. Carregar ImportJob e arquivo privado.
2. Verificar encoding, tamanho, cabeçalhos e mapeamento.
3. Processar por lotes.
4. Normalizar E.164 e validar campos.
5. Identificar duplicados por tenant.
6. Criar/atualizar contatos sem conceder consentimento automaticamente.
7. Guardar contagens e erros por linha sem expor dados pessoais em logs.
8. Excluir arquivo temporário conforme política.

## 9. Estados e propriedade de atualização

| Estado/campo | API | Worker | Webhook processor |
|---|---:|---:|---:|
| Rascunho de campanha | cria/edita | não | não |
| Início/pausa/cancelamento solicitado | sim | confirma/obedece | não |
| Preparação e fila | solicita | atualiza | não |
| Resultado da submissão | não | atualiza | pode reconciliar |
| Entrega/leitura | consulta | não é fonte | atualiza via evento |
| Consentimento | registra | lê e revalida | pode registrar opt-out se fluxo suportado |

## 10. Backpressure e proteção operacional

- Concorrência configurável por conexão WhatsApp.
- Limite global de workers.
- Pausar fila quando a conexão estiver desconectada ou a conta estiver em estado de risco.
- Monitorar idade do job mais antigo, tamanho da fila, taxa de falhas e tempo de processamento.
- Implementar circuit breaker para falhas repetidas do provedor.
- Campanhas não devem consumir toda a capacidade do worker: reservar concorrência para webhooks e tarefas de manutenção.

## 11. Testes obrigatórios

- Job duplicado não cria segundo envio.
- Consentimento revogado entre validação da campanha e execução do job bloqueia o envio.
- Campanha pausada não envia novos destinatários.
- Erro permanente não entra em retry infinito.
- Timeout ambíguo resulta em `UNKNOWN`, sem reenvio automático.
- Webhook duplicado não duplica MessageEvent.
- Evento atrasado não regride status.
- Worker reiniciado retoma jobs pendentes sem perder estado persistido.
