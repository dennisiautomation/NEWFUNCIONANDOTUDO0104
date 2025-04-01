# Guia de Implantação do NewCash Bank System

Este documento contém instruções para implantar o NewCash Bank System em um servidor VPS.

## Pré-requisitos

- Acesso SSH ao servidor VPS
- Node.js e npm instalados na máquina local
- rsync instalado na máquina local

## Passos para Implantação

### 1. Preparação Local

Antes de iniciar a implantação, certifique-se de que todos os arquivos estão prontos e que você fez as alterações necessárias nos arquivos de configuração:

- Verifique o arquivo `.env` na pasta `backend` para garantir que as configurações estão corretas
- Certifique-se de que o frontend está funcionando corretamente
- Verifique se os scripts `deploy.sh` e `setup-mongodb.sh` têm permissão de execução:
  ```bash
  chmod +x deploy.sh setup-mongodb.sh
  ```

### 2. Executar o Script de Implantação

O script `deploy.sh` automatiza todo o processo de implantação. Execute-o com o seguinte comando:

```bash
./deploy.sh
```

Este script irá:

1. Verificar a conexão SSH com o servidor
2. Construir o frontend para produção usando a flag `--legacy-peer-deps` para evitar conflitos de dependências
3. Transferir os arquivos para o servidor
4. Configurar o MongoDB no servidor usando o script `setup-mongodb.sh`
5. Configurar o Nginx como proxy reverso
6. Iniciar a aplicação usando PM2

### 3. Verificar a Implantação

Após a conclusão do script, você pode acessar a aplicação através do navegador:

```
http://77.37.43.78
```

### 4. Gerenciamento da Aplicação

O script configura o PM2 para gerenciar o processo Node.js. Você pode usar os seguintes comandos para gerenciar a aplicação:

- Ver logs: `pm2 logs newcash-bank`
- Reiniciar: `pm2 restart newcash-bank`
- Parar: `pm2 stop newcash-bank`
- Iniciar: `pm2 start newcash-bank`
- Status: `pm2 status`

### 5. Solução de Problemas

#### Problema de Conexão com MongoDB

Se encontrar problemas de conexão com o MongoDB, você pode:

1. Verificar se o MongoDB está em execução:
   ```bash
   systemctl status mongod
   ```

2. Reiniciar o MongoDB:
   ```bash
   systemctl restart mongod
   ```

3. Verificar os logs do MongoDB:
   ```bash
   cat /var/log/mongodb/mongod.log
   ```

4. Executar o script de configuração do MongoDB manualmente:
   ```bash
   cd /var/www/newcash-bank
   ./setup-mongodb.sh
   ```

5. Ativar o modo offline temporariamente:
   - Edite o arquivo `.env` na pasta `backend`:
     ```
     MONGODB_OFFLINE_MODE=true
     ```
   - Reinicie a aplicação:
     ```bash
     pm2 restart newcash-bank
     ```

#### Problemas com Dependências do NPM

Se encontrar problemas com dependências durante a instalação:

1. Use a flag `--legacy-peer-deps` para ignorar conflitos de dependências:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Se o problema persistir, limpe o cache do npm:
   ```bash
   npm cache clean --force
   npm install --legacy-peer-deps
   ```

3. Verifique se a versão do Node.js é compatível (recomendado v14 ou superior):
   ```bash
   node -v
   ```

#### Problemas com o Nginx

1. Verificar a configuração do Nginx:
   ```bash
   nginx -t
   ```

2. Reiniciar o Nginx:
   ```bash
   systemctl restart nginx
   ```

3. Verificar os logs do Nginx:
   ```bash
   cat /var/log/nginx/error.log
   ```

### 6. Configuração do MongoDB em Diferentes Sistemas Operacionais

O script `setup-mongodb.sh` foi projetado para funcionar em diferentes distribuições Linux:

#### Ubuntu/Debian
```bash
# Instalar MongoDB
apt-get update
apt-get install -y gnupg curl
curl -fsSL https://pgp.mongodb.com/server-6.0.asc | gpg -o /usr/share/keyrings/mongodb-server-6.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-6.0.gpg ] http://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt-get update
apt-get install -y mongodb-org
```

#### CentOS/RHEL
```bash
# Instalar MongoDB
cat > /etc/yum.repos.d/mongodb-org-6.0.repo << EOF
[mongodb-org-6.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/6.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-6.0.asc
EOF
yum install -y mongodb-org
```

## Notas Importantes

- O sistema está configurado para usar o MongoDB local no servidor VPS
- O sistema pode funcionar em modo offline se o MongoDB não estiver disponível
- O script `start-production.js` verifica automaticamente a conexão com o MongoDB e tenta iniciar o serviço se necessário
- As credenciais padrão são:
  - Admin: admin@newcash.com / Admin@123
  - Cliente: cliente@newcash.com / Cliente@123
- Todas as rotas da API estão disponíveis em `/api`
- O frontend está configurado para acessar a API através do proxy do Nginx

## Segurança

Após a implantação inicial, recomenda-se:

1. Alterar as senhas padrão
2. Configurar HTTPS usando Let's Encrypt
3. Configurar um firewall (UFW)
4. Implementar backups regulares do banco de dados
5. Alterar a senha do usuário do MongoDB no arquivo `.env` e no banco de dados

## Monitoramento

Para monitorar o desempenho da aplicação:

1. Configure o monitoramento do PM2:
   ```bash
   pm2 install pm2-logrotate
   pm2 set pm2-logrotate:max_size 10M
   pm2 set pm2-logrotate:retain 7
   ```

2. Configure alertas para problemas de conexão com o MongoDB:
   ```bash
   pm2 install pm2-slack
   pm2 set pm2-slack:slack_url <seu_webhook_do_slack>
   pm2 set pm2-slack:servername "NewCash Bank VPS"
   ```

3. Verifique regularmente os logs da aplicação:
   ```bash
   pm2 logs newcash-bank --lines 100
   ```
