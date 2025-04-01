# Segurança do Sistema

## 1. Autenticação

### 1.1 Chave de API
- Todas as requisições precisam da chave de API
- Formato: UUID v4
- Exemplo: `6d9bac1b-f685-11ef-a3af-00155d010b18`

### 1.2 Tokens de Autenticação
- Cada operação gera um token único
- Formato: `AUTH-{timestamp}`
- Exemplo: `AUTH-1740889544547`

## 2. Isolamento de Contas

### 2.1 Contas do Sistema
```javascript
ACCOUNTS = {
  USD: '42226',  // Conta para USD
  EUR: '42227'   // Conta para EUR
}
```

### 2.2 Validações
- Cada cliente só acessa sua própria conta
- Validação de moeda x conta
- Validação de saldo antes da transferência
- Confirmação em duas etapas (reserva + confirmação)

## 3. Proteção de Dados

### 3.1 Dados Sensíveis
- Números de conta são mascarados
- Senhas são hasheadas
- Tokens expiram após uso

### 3.2 Logs e Auditoria
- Todas as operações são logadas
- Registro de tentativas de acesso
- Monitoramento de transferências suspeitas

## 4. Boas Práticas

### 4.1 Frontend
- Validação de inputs
- Sanitização de dados
- Proteção contra XSS
- CSRF tokens

### 4.2 APIs
- Rate limiting
- Validação de parâmetros
- Respostas padronizadas
- Tratamento de erros
