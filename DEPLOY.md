# Deploy na Hetzner VPS

## Arquivos que você precisa subir para o servidor

```
/opt/diagnosticoapi/
├── dist/                          ← pasta buildada do frontend
├── server/
│   ├── index.js                   ← backend Node.js
│   └── package.json
├── site-api-488321-824e623af78b.json  ← credenciais Google Calendar
└── ecosystem.config.cjs            ← config do PM2
```

## Passo a passo

### 1. Acesse sua VPS via SSH
```bash
ssh root@SEU_IP_HETZNER
```

### 2. Instale Node.js (se ainda não tiver)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### 3. Instale PM2 (gerenciador de processos)
```bash
npm install -g pm2
```

### 4. Crie a pasta e suba os arquivos
No seu computador local, rode:
```bash
# Cria um pacote com tudo necessário
rsync -avz --progress \
  dist/ \
  server/ \
  site-api-488321-824e623af78b.json \
  ecosystem.config.cjs \
  root@SEU_IP_HETZNER:/opt/diagnosticoapi/
```

### 5. No servidor, instale as dependências
```bash
cd /opt/diagnosticoapi/server
npm install --production
```

### 6. Inicie o backend com PM2
```bash
cd /opt/diagnosticoapi
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup  # configura para reiniciar no boot
```

### 7. Configure o Nginx
Adicione este bloco na config do Nginx (provavelmente em `/etc/nginx/sites-available/` ou similar):

```nginx
server {
    listen 80;
    server_name synna.com.br;

    # Frontend + Backend (tudo via Node.js)
    location /diagnosticoapi/ {
        proxy_pass http://127.0.0.1:3001/diagnosticoapi/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

> **Se já tiver um server block para synna.com.br**, adicione só os dois `location` blocks dentro dele.

### 8. Teste e recarregue o Nginx
```bash
nginx -t
systemctl reload nginx
```

### 9. SSL (se ainda não tiver)
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d synna.com.br
```

## Comandos úteis

```bash
# Ver logs do app
pm2 logs diagnosticoapi

# Reiniciar
pm2 restart diagnosticoapi

# Ver status
pm2 status

# Atualizar depois de mudanças
# 1. Suba os novos arquivos via rsync
# 2. pm2 restart diagnosticoapi
```

## URLs finais

- Landing page: https://synna.com.br/diagnosticoapi/
- Formulário: https://synna.com.br/diagnosticoapi/diagnostico-whatsapp
- Confirmação: https://synna.com.br/diagnosticoapi/confirmacao
