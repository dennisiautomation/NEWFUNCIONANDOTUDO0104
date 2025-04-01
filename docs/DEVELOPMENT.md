# Guia de Desenvolvimento

## 1. Ambiente de Desenvolvimento

### 1.1 Requisitos
- Node.js 18+
- npm ou yarn
- Git

### 1.2 Configuração
```bash
# Clonar repositório
git clone https://github.com/seu-usuario/FTNEWCASHDE.git

# Instalar dependências do frontend
cd frontend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
```

## 2. Estrutura do Código

### 2.1 Padrões de Código
- ESLint para linting
- Prettier para formatação
- TypeScript para tipagem
- Jest para testes

### 2.2 Convenções
- Nomes de arquivos em PascalCase para componentes
- Nomes de arquivos em camelCase para utilitários
- Funções em camelCase
- Classes em PascalCase

## 3. Fluxo de Desenvolvimento

### 3.1 Branches
- `main`: Produção
- `develop`: Desenvolvimento
- `feature/*`: Novas features
- `bugfix/*`: Correções
- `release/*`: Releases

### 3.2 Commits
```
feat: nova feature
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção
```

## 4. Testes

### 4.1 Testes Unitários
```bash
# Rodar todos os testes
npm test

# Rodar teste específico
npm test transfer.test.js

# Coverage
npm test -- --coverage
```

### 4.2 O que Testar
- APIs e serviços
- Componentes React
- Funções utilitárias
- Redux actions/reducers

## 5. Deploy

### 5.1 Ambiente de Produção
```bash
# Build do frontend
cd frontend
npm run build

# Variáveis de ambiente
NODE_ENV=production
API_URL=http://mytest.ftassetmanagement.com/api
```

### 5.2 Checklist
- ✅ Testes passando
- ✅ Build sem erros
- ✅ Variáveis de ambiente
- ✅ Documentação atualizada

## 6. Troubleshooting

### 6.1 Problemas Comuns
- **404 na API**: Verificar URL e key
- **500 na API**: Log do servidor
- **Erro de CORS**: Configurar headers
- **Redux error**: Verificar actions

### 6.2 Debugging
- Chrome DevTools
- React DevTools
- Redux DevTools
- VS Code Debugger
