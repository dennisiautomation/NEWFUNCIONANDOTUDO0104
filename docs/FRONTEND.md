# Documentação do Frontend

## 1. Estrutura de Arquivos

### 1.1 Principais Arquivos
```
frontend/
├── src/
│   ├── services/
│   │   └── api.js         # Configuração e funções das APIs
│   ├── store/
│   │   ├── index.js       # Configuração do Redux
│   │   └── slices/        # Slices do Redux
│   │       ├── authSlice.js
│   │       └── accountSlice.js
│   ├── theme.js           # Tema e estilos globais
│   └── index.js           # Entrada da aplicação
└── public/
    ├── index.html         # HTML principal
    └── manifest.json      # Configurações do PWA
```

### 1.2 Serviços (services/)
O arquivo `api.js` contém:
- Configurações base da API (URL, timeout, etc)
- Funções para cada endpoint
- Tratamento de erros
- Formatação de respostas

### 1.3 Estado Global (store/)
Usando Redux para gerenciar:
- Autenticação (authSlice)
- Dados das contas (accountSlice)
- Histórico de transferências

## 2. APIs do Frontend

### 2.1 API de Reserva
```javascript
// Criar reserva USD
const reserva = await reservationApi.getUSDReservations();

// Criar reserva EUR
const reserva = await reservationApi.getEURReservations();

// Resposta formatada:
{
  success: true,
  data: {
    authToken: "AUTH-123",
    resCode: "RES-123",
    dateTime: "2025-03-02T04:25:44.547Z",
    accountNumber: "42226",
    amount: "0.00",
    currency: "USD",
    status: "pending"
  },
  message: "Operação realizada com sucesso",
  timestamp: "2025-03-02T04:25:44.547Z",
  reservationCode: "RES-123"
}
```

### 2.2 API de Envio
```javascript
// Enviar transferência
const transfer = await sendApi.sendTransfer({
  reservationId: "RES-123",
  account: "42227",
  amount: 100.00,
  currency: "USD"
});

// Resposta formatada:
{
  success: true,
  data: {
    authToken: "AUTH-123",
    resCode: "RES-123",
    dateTime: "2025-03-02T04:26:21.012Z",
    accountNumber: "42227",
    amount: "100.00",
    currency: "USD",
    status: "pending"
  },
  message: "Operação realizada com sucesso",
  timestamp: "2025-03-02T04:26:21.012Z"
}
```

### 2.3 API de Confirmação
```javascript
// Confirmar transferência
const confirm = await confirmationApi.confirm("RES-123");

// Resposta formatada:
{
  success: true,
  data: {
    authToken: "UUID-123",
    resCode: "UUID-123",
    dateTime: "2025-03-02T04:26:21.624Z",
    accountNumber: "42227",
    amount: "100.00",
    currency: "USD",
    status: "confirmed"
  },
  message: "Operação realizada com sucesso",
  timestamp: "2025-03-02T04:26:21.624Z"
}
```

### 2.4 API de Recebimento
```javascript
// Buscar transferências recebidas
const recebidas = await receivingApi.getIncomingTransfers();

// Resposta formatada:
{
  success: true,
  data: {
    authToken: "UUID-123",
    transactionUrl: "URL",
    accountName: "SENDER ACCOUNT",
    accountSignatory: "SENDER NAME",
    // ... outros campos
  },
  transfers: [{
    authToken: "UUID-123",
    transactionUrl: "URL",
    senderName: "BANK NAME",
    senderAccount: "42226",
    senderSignatory: "SENDER NAME",
    receiverName: "FT Asset Management",
    receiverAccount: "42227",
    receiverSignatory: "RECEIVER NAME",
    amount: "100.00",
    currency: "USD",
    description: "Transfer to test",
    transferId: "TRANSFER-123",
    datetime: "2025-03-02T04:26:21.624Z"
  }]
}
```

## 3. Tratamento de Erros

### 3.1 Funções de Validação
```javascript
// Validar parâmetros obrigatórios
const validateParams = (params, type) => {
  const required = {
    receiving: ['account'],
    sending: ['reservationId', 'account', 'amount', 'currency']
  };
  
  const missing = required[type].filter(field => !params[field]);
  if (missing.length > 0) {
    throw new Error(`Campos obrigatórios: ${missing.join(', ')}`);
  }
};
```

### 3.2 Formatação de Respostas
```javascript
// Formatar resposta da API
const formatResponse = (response) => {
  try {
    const data = response?.data;
    
    // Se não tiver transações
    if (data?.Information?.Info === "No new transactions available") {
      return {
        success: true,
        message: 'Nenhuma transação pendente',
        data: {}
      };
    }

    // Resposta normal
    const information = data?.Information;
    if (!information) {
      return {
        success: false,
        error: 'Resposta inválida',
        data: {}
      };
    }

    return {
      success: information.Status === 'success',
      data: information.Details || {},
      message: information.Message,
      timestamp: information.Timestamp
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao processar resposta',
      data: {}
    };
  }
};
```

## 4. Testes

### 4.1 Teste de Transferência
```javascript
// Em: /frontend/src/tests/transfer.test.js
const testarFluxoTransferencia = async () => {
  try {
    // 1. Criar reserva
    const reserva = await reservationApi.getUSDReservations();
    
    // 2. Enviar transferência
    const transfer = await sendApi.sendTransfer({
      reservationId: reserva.reservationCode,
      account: '42227',
      amount: 100.00,
      currency: 'USD'
    });
    
    // 3. Confirmar
    const confirm = await confirmationApi.confirm(reserva.reservationCode);
    
  } catch (error) {
    console.error('Erro:', error.message);
  }
};
```

### 4.2 Teste de Recebimento
```javascript
// Em: /frontend/src/tests/receive.test.js
const testarRecebimento = async () => {
  try {
    const recebimento = await receivingApi.getIncomingTransfers();
    
    if (recebimento.success) {
      recebimento.transfers.forEach(transfer => {
        console.log('ID:', transfer.transferId);
        console.log('Valor:', transfer.amount, transfer.currency);
        console.log('De:', transfer.senderName);
        console.log('Para:', transfer.receiverName);
      });
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
};
```
