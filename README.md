# NewCash Bank System

Sistema bancário completo para NewCash Bank com integração de APIs e funcionalidades administrativas avançadas.

## Visão Geral do Sistema

Este sistema oferece uma plataforma bancária abrangente com duas interfaces principais:
1. **Painel Administrativo** - Gerenciamento de contas, monitoramento de transações e operações administrativas
2. **Portal do Cliente** - Interface para usuários finais gerenciarem suas contas e realizarem transações

## Stack Tecnológica

### Frontend
- React.js
- Material UI
- Redux para gerenciamento de estado
- Axios para comunicação com APIs

### Backend
- Node.js com Express.js
- PostgreSQL como banco de dados (com Sequelize ORM)
- JWT para autenticação
- bcrypt para criptografia de senhas

## Requisitos de Sistema

- Node.js v16.x ou superior
- PostgreSQL 14.x ou superior
- NPM 8.x ou superior
- Porta 3000 disponível para o frontend
- Porta 5000 disponível para o backend

## Estrutura do Projeto

```
newcashbank/
├── frontend/             # Aplicação React frontend
│   ├── public/           # Arquivos estáticos
│   └── src/              # Arquivos fonte
│       ├── components/   # Componentes reutilizáveis
│       ├── pages/        # Componentes de página
│       ├── services/     # Serviços de API
│       ├── store/        # Estado Redux e slices
│       └── utils/        # Funções utilitárias
├── backend/              # Aplicação Node.js backend
│   ├── config/           # Arquivos de configuração
│   ├── controllers/      # Controladores de rota
│   ├── middleware/       # Middleware Express
│   ├── pg-models/        # Modelos PostgreSQL
│   ├── routes/           # Rotas de API
│   └── utils/            # Funções utilitárias
```

## Instruções de Instalação

### Pré-requisitos
1. Instale o Node.js (v16.x ou superior)
2. Instale o PostgreSQL (v14.x ou superior)
3. Clone o repositório: `git clone https://github.com/dennisiautomation/NEWFUNCIONANDOTUDO0104.git`

### Configuração do Banco de Dados
1. Crie um banco de dados PostgreSQL: `CREATE DATABASE newcashbank;`
2. Crie um usuário PostgreSQL:
   ```sql
   CREATE USER newcashuser WITH PASSWORD 'sua_senha';
   GRANT ALL PRIVILEGES ON DATABASE newcashbank TO newcashuser;
   ```
3. Restaure o backup do banco de dados (opcional):
   ```bash
   psql -U newcashuser -d newcashbank -f backend/newcashbank_db_backup_20250331_173255.sql
   ```

### Configuração do Backend
1. Navegue até a pasta backend: `cd backend`
2. Instale as dependências: `npm install`
3. Configure o arquivo .env com seus parâmetros (use .env.example como referência)
   ```
   NODE_ENV=development
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=newcashbank
   DB_USER=newcashuser
   DB_PASSWORD=sua_senha
   JWT_SECRET=newcashbank-jwt-secret-2025
   JWT_EXPIRATION=1d
   JWT_REFRESH_EXPIRATION=7d
   CORS_ORIGIN=http://localhost:3000
   ```
4. Execute as migrações do banco de dados (se não restaurou o backup): `npm run migrate`
5. Inicie o servidor backend: `node server-final.js`

### Configuração do Frontend
1. Navegue até a pasta frontend: `cd frontend`
2. Instale as dependências: `npm install`
3. Configure o arquivo de ambiente:
   - Edite o arquivo `public/env-config.js` para apontar para seu backend:
   ```javascript
   window.ENV = {
     API_URL: 'http://localhost:5000',
     ENV_NAME: 'development'
   };
   ```
4. Inicie o servidor de desenvolvimento: `npm start`

## Acessando o Sistema

### Painel Administrativo
- URL: `http://localhost:3000/admin`
- Credenciais padrão: 
  - Email: admin@newcash.com
  - Senha: admin123

### Portal do Cliente
- URL: `http://localhost:3000`
- Você pode criar novas contas através do link de registro público: `http://localhost:3000/register`
- Ou através do painel administrativo na seção "Gerenciamento de Contas"

## Funcionalidades Principais

### Painel Administrativo
- Gerenciamento completo de usuários e contas
- Criação de novas contas (USD, EUR, USDT)
- Monitoramento de transações
- Geração de relatórios
- Ajuste de limites de transferência

### Portal do Cliente
- Visualização de saldo e extrato
- Transferências entre contas
- Gestão de perfil e segurança
- Acompanhamento de histórico de transações

## Solução de Problemas

### Conexão com o Banco de Dados
Se ocorrerem problemas de conexão com o banco de dados:
- Verifique se o PostgreSQL está rodando: `sudo service postgresql status`
- Confirme as credenciais no arquivo .env
- Verifique as permissões do usuário do banco de dados

### Problemas com o Backend
- Verifique os logs na pasta `/backend/logs`
- Certifique-se de que não há outros serviços usando a porta 5000
- Verifique se todas as dependências foram instaladas: `npm install`

### Problemas com o Frontend
- Limpe o cache do navegador
- Verifique se a URL do backend está correta em `public/env-config.js`
- Reconstrua o frontend: `npm run build`

## Backups e Restauração

### Criando um Backup
```bash
pg_dump -U newcashuser -d newcashbank > newcashbank_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurando um Backup
```bash
psql -U newcashuser -d newcashbank -f backup_file.sql
```

## Segurança

- Todas as senhas são armazenadas com hash bcrypt
- Autenticação JWT com tokens de atualização
- Limite de tentativas de login
- Suporte a autenticação de dois fatores

## Produção

Para implantação em ambiente de produção:

1. Configure o frontend para build:
```bash
cd frontend
npm run build
```

2. Configure servidor web (Nginx) para servir arquivos estáticos do frontend
3. Configure o backend com PM2 para garantir disponibilidade:
```bash
npm install -g pm2
cd backend
pm2 start server-final.js
```

4. Configure HTTPS com certificados SSL

## Suporte

Para suporte adicional, entre em contato com a equipe de desenvolvimento em support@newcashbank.com
