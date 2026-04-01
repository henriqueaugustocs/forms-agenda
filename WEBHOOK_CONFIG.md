# Configuração do Webhook

## Como Configurar

O sistema envia dados do formulário e da reunião via webhook automaticamente.

### 1. Edite o arquivo `.env`

Adicione ou atualize a seguinte linha no seu arquivo `.env`:

```bash
WEBHOOK_URLS=https://webhook.synna.com.br/webhook/d7683517-2ef8-4952-af76-53832eb17cf2
```

### 2. Múltiplos Webhooks (Opcional)

Se você precisar enviar para múltiplos webhooks, separe as URLs por vírgula:

```bash
WEBHOOK_URLS=https://webhook.synna.com.br/webhook/d7683517-2ef8-4952-af76-53832eb17cf2,https://outro-webhook.com/endpoint
```

### 3. Reinicie o Servidor

Após alterar o `.env`, reinicie o servidor para aplicar as mudanças:

```bash
npm run dev
# ou
pm2 restart all
```

## Dados Enviados

O webhook recebe os seguintes dados:

### Quando o formulário é preenchido:
```json
{
  "evento": "formulario_preenchido",
  "timestamp": "2026-04-01T12:22:00.000Z",
  "origem": "landing_diagnostico",
  "nome": "Nome do Lead",
  "email": "email@exemplo.com",
  "telefone": "(62) 98443-0710",
  "empresa": "Nome da Empresa",
  "segmento": "Beleza e Estética",
  "classificacao": "quente",
  "score": 25,
  "respostas": {
    "trabalha_com_agendamento": "Sim, o dia todo",
    "quem_atende": "Secretária/Recepcionista",
    "canal_principal": "WhatsApp",
    "volume_diario": "50-100",
    "tamanho_empresa": "5-10",
    "investimento": "Sim, urgente"
  }
}
```

### Quando a reunião é agendada:
```json
{
  "evento": "reuniao_agendada",
  "timestamp": "2026-04-01T12:22:00.000Z",
  "origem": "landing_diagnostico",
  "nome": "Nome do Lead",
  "email": "email@exemplo.com",
  "telefone": "(62) 98443-0710",
  "classificacao": "quente",
  "score": 25,
  "data_reuniao": "2026-04-02",
  "hora_reuniao": "14:00",
  "agendou_reuniao": true,
  "google_calendar_link": "https://calendar.google.com/...",
  "google_calendar_event_id": "abc123..."
}
```

## Verificação

Para verificar se o webhook está funcionando:

1. Preencha o formulário de diagnóstico
2. Agende uma reunião
3. Verifique se os dados chegaram no endpoint configurado

## Troubleshooting

- **Webhook não está sendo chamado**: Verifique se a variável `WEBHOOK_URLS` está configurada no `.env`
- **Dados não chegam**: Verifique os logs do servidor para ver se há erros de conexão
- **Múltiplos webhooks**: Certifique-se de que não há espaços entre as URLs, apenas vírgulas
