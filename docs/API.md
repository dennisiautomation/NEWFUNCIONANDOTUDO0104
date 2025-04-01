# Documentação do Sistema Bancário

## 1. Configuração Base

### 1.1 URL Base
```
http://mytest.ftassetmanagement.com/api
```

### 1.2 Autenticação
Todas as requisições precisam da chave de API (key):
```
key: 6d9bac1b-f685-11ef-a3af-00155d010b18
```

### 1.3 Contas do Sistema
```javascript
ACCOUNTS: {
  USD: '42226',  // Conta para transações em USD
  EUR: '42227'   // Conta para transações em EUR
}
```

## 2. APIs Disponíveis

### 2.1 API de Reserva
**Endpoint:** `/Reservation.asp`  
**Método:** GET  
**Parâmetros:**
- `key` (obrigatório): Chave de API
- `account` (obrigatório): Número da conta (42226 para USD, 42227 para EUR)

**Exemplo de Resposta de Sucesso:**
```json
{
  "Information": {
    "Details": {
      "authToken": "AUTH-1740889544547",
      "resCode": "RES-1740889544547-7wnbf9tsc",
      "dateTime": "2025-03-02T04:25:44.547Z",
      "accountNumber": "42226",
      "amount": "0.00",
      "currency": "USD",
      "status": "pending"
    },
    "Status": "success",
    "Message": "Operação realizada com sucesso",
    "Timestamp": "2025-03-02T04:25:44.547Z"
  }
}
```

**Campos Importantes:**
- `resCode`: Código da reserva (usar para enviar transferência)
- `authToken`: Token de autorização
- `status`: Status da reserva (pending, confirmed, etc)

### 2.2 API de Envio
**Endpoint:** `/Send.asp`  
**Método:** POST  
**Parâmetros:**
- `key` (obrigatório): Chave de API
- `reservation` (obrigatório): Código da reserva (resCode)
- `account` (obrigatório): Conta destino
- `amount` (obrigatório): Valor da transferência
- `currency` (obrigatório): Moeda (USD ou EUR)

**Exemplo de Resposta de Sucesso:**
```json
{
  "Information": {
    "Details": {
      "authToken": "AUTH-1740889581012",
      "resCode": "RES-1740889581012-tk9brqga7",
      "dateTime": "2025-03-02T04:26:21.012Z",
      "accountNumber": "42227",
      "amount": "100.00",
      "currency": "USD",
      "status": "pending"
    },
    "Status": "success",
    "Message": "Operação realizada com sucesso",
    "Timestamp": "2025-03-02T04:26:21.012Z"
  }
}
```

### 2.3 API de Confirmação
**Endpoint:** `/Reservation_confirmation.asp`  
**Método:** GET  
**Parâmetros:**
- `key` (obrigatório): Chave de API
- `reservation` (obrigatório): Código da reserva (resCode)

**Exemplo de Resposta de Sucesso:**
```json
{
  "Information": {
    "Details": {
      "authToken": "UUID-1740889581624",
      "resCode": "UUID-1740889581624",
      "dateTime": "2025-03-02T04:26:21.624Z",
      "accountNumber": "42227",
      "amount": "100.00",
      "currency": "USD",
      "status": "confirmed"
    },
    "Status": "success",
    "Message": "Operação realizada com sucesso",
    "Timestamp": "2025-03-02T04:26:21.624Z"
  }
}
```

### 2.4 API de Recebimento
**Endpoint:** `/receiving.asp`  
**Método:** GET  
**Parâmetros:**
- `key` (obrigatório): Chave de API

**Formato de Resposta Esperado:**
```json
{
  "Receiving": {
    "Details": {
      "authToken": "UUID#",
      "transactionUrl": "URL",
      "accountName": "SENDER ACCOUNT NAME",
      "accountSignatory": "SENDER OWNER",
      "accountNumber": "ACCOUNT NUMBER",
      "currentBalance": "VALUE",
      "amount": "VALUE",
      "fromCurrency": "USD"
    },
    "CashTransfer.v1": {
      "SendingName": "BANK NAME",
      "SendingAccount": "ACCOUNT NUMBER",
      "ReceivingName": "BANK NAME",
      "ReceivingSignatory": "ACCOUNT HOLDER",
      "ReceivingAccount": "ACCOUNT NUMBER",
      "Datetime": "Auto",
      "Amount": "VALUE",
      "ReceivingCurrency": "USD",
      "SendingCurrency": "USD",
      "Description": "Transfer to test",
      "TransferRequestID": "TRANSFER ID",
      "ReceivingInstitution": "FT Asset Management",
      "SendinInstitution": "BANK NAME"
    }
  }
}
```

## 3. Fluxo de Transferência

### 3.1 Passo a Passo
1. **Criar Reserva**
   ```javascript
   const reserva = await reservationApi.getUSDReservations();
   // Guarda o reservationCode
   ```

2. **Enviar Transferência**
   ```javascript
   const transfer = await sendApi.sendTransfer({
     reservationId: reserva.reservationCode,
     account: '42227',
     amount: 100.00,
     currency: 'USD'
   });
   ```

3. **Confirmar Transferência**
   ```javascript
   const confirm = await confirmationApi.confirm(reserva.reservationCode);
   ```

### 3.2 Tratamento de Erros
Todas as APIs retornam um formato padrão de resposta:
```javascript
{
  success: true/false,
  data: { ... },     // Dados da resposta
  message: "...",    // Mensagem de sucesso/erro
  error: "..."       // Mensagem de erro (se houver)
}
```

### 3.3 Status das APIs
✅ **Funcionando:**
- API de Reserva
- API de Envio
- API de Confirmação

❌ **Com Problemas:**
- API de Recebimento (erro 500)

## 4. Códigos de Exemplo

### 4.1 Exemplo Completo de Transferência
```javascript
const handleTransfer = async () => {
  try {
    // 1. Criar reserva
    const reserva = await reservationApi.getUSDReservations();
    if (!reserva.success) {
      throw new Error(reserva.error);
    }

    // 2. Enviar transferência
    const transfer = await sendApi.sendTransfer({
      reservationId: reserva.reservationCode,
      account: '42227',
      amount: 100.00,
      currency: 'USD'
    });
    if (!transfer.success) {
      throw new Error(transfer.error);
    }

    // 3. Confirmar
    const confirm = await confirmationApi.confirm(reserva.reservationCode);
    if (!confirm.success) {
      throw new Error(confirm.error);
    }

    console.log('Transferência realizada com sucesso!');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}
```
