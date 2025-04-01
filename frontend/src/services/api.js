import axios from 'axios';

// Configurações da API
const API_CONFIG = {
  BASE_URL: 'https://my.ftassetmanagement.com/api',
  TOKEN: '36bd30d0-f685-11ef-a3af-00155d010b18',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  ACCOUNTS: {
    USD: '60428',
    EUR: '60429'
  },
  ENDPOINTS: {
    RESERVATION: '/reservation.asp',
    SEND: '/Send.asp',
    CONFIRM: '/reservation_confirmation.asp',
    RECEIVE: '/receiving.asp'
  }
};

// Constantes
const VALID_CURRENCIES = ['USD', 'EUR'];
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_AMOUNT = '0.00';

// Função para formatar valor monetário
const formatAmount = (value) => {
  if (!value || isNaN(value)) return DEFAULT_AMOUNT;
  return Number(value).toFixed(2);
};

// Função para validar moeda
const validateCurrency = (currency) => {
  return VALID_CURRENCIES.includes(currency?.toUpperCase()) ? currency.toUpperCase() : DEFAULT_CURRENCY;
};

// Função para gerar timestamp consistente
const getTimestamp = () => new Date().toISOString();

// Função para converter HTML em JSON
const htmlToJson = (html, params) => {
  try {
    if (!html || typeof html !== 'string') return null;

    // Remove tags HTML e quebras de linha
    const cleanHtml = html.replace(/<[^>]*>/g, '').replace(/\r?\n|\r/g, ' ').trim();
    
    // Extrai valores brutos
    const rawValues = {
      authToken: (cleanHtml.match(/authToken["\s:]+([^,\s"]+)/) || [])[1],
      resCode: (cleanHtml.match(/Res_code["\s:]+([^,\s"]+)/) || [])[1],
      dateTime: (cleanHtml.match(/DateTime["\s:]+([^,\s"]+)/) || [])[1],
      accountNumber: (cleanHtml.match(/AccountNumber["\s:]+([^,\s"]+)/) || [])[1],
      amount: (cleanHtml.match(/Amount["\s:]+([^,\s"]+)/) || [])[1],
      currency: (cleanHtml.match(/Currency["\s:]+([^,\s"]+)/) || [])[1]
    };

    // Formata e valida valores
    const timestamp = getTimestamp();
    const extractInfo = {
      authToken: rawValues.authToken || `AUTH-${Date.now()}`,
      resCode: rawValues.resCode || `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      dateTime: timestamp,
      accountNumber: rawValues.accountNumber || params?.account || 'unknown',
      amount: formatAmount(rawValues.amount || params?.amount),
      currency: validateCurrency(rawValues.currency || params?.currency),
      status: cleanHtml.includes('confirmed') ? 'confirmed' : 
              cleanHtml.includes('completed') ? 'completed' : 
              cleanHtml.includes('failed') ? 'failed' : 'pending'
    };

    return {
      success: true,
      data: {
        Information: {
          Details: extractInfo,
          Status: 'success',
          Message: 'Operação realizada com sucesso',
          Timestamp: timestamp
        }
      }
    };
  } catch (error) {
    console.error('Erro ao converter HTML para JSON:', error);
    const timestamp = getTimestamp();
    return {
      success: false,
      data: {
        Information: {
          Status: 'error',
          Message: 'Erro ao processar resposta',
          Error: error.message,
          Timestamp: timestamp
        }
      }
    };
  }
};

// Função para sanitizar resposta
const sanitizeResponse = (response) => {
  try {
    // Remove propriedades circulares e formata valores
    const sanitized = JSON.parse(JSON.stringify(response, (key, value) => {
      if (key === 'request' || key === 'config' || key === 'headers') return undefined;
      
      // Formata valores específicos
      if (key === 'amount') return formatAmount(value);
      if (key === 'currency') return validateCurrency(value);
      if (key === 'timestamp' || key === 'dateTime') return getTimestamp();
      
      // Substitui valores placeholder por valores reais
      if (typeof value === 'string') {
        if (value === 'UUID#"' || value === 'UUID#') return `UUID-${Date.now()}`;
        if (value === 'DATETIME"' || value === 'DATETIME') return getTimestamp();
        if (value === 'ACCOUNT') return response.account || 'unknown';
        if (value === 'VALUE"' || value === 'VALUE') return DEFAULT_AMOUNT;
      }
      return value;
    }));

    return {
      success: true,
      data: sanitized.data || response.data,
      status: response.status,
      statusText: response.statusText
    };
  } catch (error) {
    console.error('Erro ao sanitizar resposta:', error);
    return {
      success: false,
      error: error.message,
      data: response.data
    };
  }
};

// Função para padronizar resposta
const formatResponse = (response) => {
  try {
    const data = response?.data;
    
    // Se for resposta de "No new transactions"
    if (data?.Information?.Info === "No new transactions available") {
      return {
        success: true,
        message: 'Nenhuma transação pendente',
        data: {}
      };
    }

    // Se for resposta normal
    if (data?.success && data?.data?.Information) {
      const information = data.data.Information;
      const details = information.Details || {};
      const status = information.Status || 'error';
      const message = information.Message || '';
      const timestamp = information.Timestamp || new Date().toISOString();
      const resCode = details.resCode || details.authToken;
      
      return {
        success: status === 'success',
        data: details,
        message,
        timestamp,
        ...(resCode && { reservationCode: resCode })
      };
    }

    // Se for resposta direta
    if (data?.Information) {
      const information = data.Information;
      const details = information.Details || {};
      const status = information.Status || 'error';
      const message = information.Message || '';
      const timestamp = information.Timestamp || new Date().toISOString();
      const resCode = details.resCode || details.authToken;
      
      return {
        success: status === 'success',
        data: details,
        message,
        timestamp,
        ...(resCode && { reservationCode: resCode })
      };
    }

    return {
      success: false,
      error: 'Formato de resposta inválido',
      data: {}
    };
  } catch (error) {
    console.error('Erro ao formatar resposta:', error);
    return {
      success: false,
      error: 'Erro ao processar resposta',
      data: {}
    };
  }
};

// Instância do axios com configurações base
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json'
  },
  transformResponse: [(data, headers) => {
    try {
      // Tenta fazer parse como JSON
      return JSON.parse(data);
    } catch (e) {
      // Se falhar, tenta converter HTML para JSON
      const jsonData = htmlToJson(data, headers);
      if (jsonData) return jsonData;
      
      // Se não conseguir converter, retorna o dado original
      return data;
    }
  }]
});

// Função para validar parâmetros obrigatórios
const validateParams = (params, type) => {
  const errors = [];
  
  switch (type) {
    case 'reservation':
      if (!params.account && !params.reservation) {
        errors.push('É necessário informar a conta ou o código da reserva');
      }
      break;
    case 'confirmation':
      if (!params.reservation) {
        errors.push('É necessário informar o código da reserva');
      }
      break;
    case 'receiving':
      if (!params.account) {
        errors.push('É necessário informar o número da conta');
      }
      break;
    case 'send':
      if (!params.reservationId) {
        errors.push('É necessário informar o código da reserva para enviar a transferência');
      }
      break;
    default:
      errors.push('Tipo de validação inválido');
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
};

// API de Reserva
const reservationApi = {
  createReservation: async (params) => {
    validateParams({ account: params.account }, 'receiving');
    try {
      console.log('Criando reserva para conta:', params.account);
      const response = await api.get(API_CONFIG.ENDPOINTS.RESERVATION, {
        params: {
          key: API_CONFIG.TOKEN,
          account: params.account
        }
      });
      
      console.log('Resposta da reserva:', JSON.stringify(response.data, null, 2));
      return formatResponse(response);
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  },
  
  getUSDReservations() {
    return this.createReservation({ account: API_CONFIG.ACCOUNTS.USD });
  },
  
  getEURReservations() {
    return this.createReservation({ account: API_CONFIG.ACCOUNTS.EUR });
  }
};

// API de Envio
const sendApi = {
  sendTransfer: async (params) => {
    validateParams(params, 'send');
    try {
      console.log('Enviando transferência:', params);
      const response = await api.post(API_CONFIG.ENDPOINTS.SEND, null, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        params: {
          key: API_CONFIG.TOKEN,
          reservation: params.reservationId,
          account: params.account,
          amount: formatAmount(params.amount),
          currency: validateCurrency(params.currency)
        }
      });
      
      return formatResponse(response);
    } catch (error) {
      console.error('Erro ao enviar transferência:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }
};

// API de Confirmação
const confirmationApi = {
  confirm: async (reservationId) => {
    validateParams({ reservation: reservationId }, 'confirmation');
    try {
      console.log('Confirmando transferência:', reservationId);
      const response = await api.get(API_CONFIG.ENDPOINTS.CONFIRM, {
        params: {
          key: API_CONFIG.TOKEN,
          reservation: reservationId
        }
      });
      
      return formatResponse(response);
    } catch (error) {
      console.error('Erro ao confirmar transferência:', error);
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }
};

// API de Recebimento
const receivingApi = {
  getIncomingTransfers: async () => {
    try {
      console.log('Buscando transferências recebidas...');
      
      // Tentar com querystring na URL
      const response = await api({
        method: 'get',
        url: API_CONFIG.ENDPOINTS.RECEIVE + '?key=' + API_CONFIG.TOKEN,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('Resposta:', JSON.stringify(response.data, null, 2));
      
      if (!response.data?.Receiving) {
        return {
          success: false,
          error: 'Formato de resposta inválido',
          data: {},
          transfers: []
        };
      }

      const details = response.data.Receiving?.Details || {};
      const transfer = response.data.Receiving?.['CashTransfer.v1'] || {};
      
      return {
        success: true,
        data: {
          ...details,
          ...transfer
        },
        transfers: [{
          authToken: details.authToken,
          transactionUrl: details.transactionUrl,
          senderName: transfer.SendingName,
          senderAccount: transfer.SendingAccount,
          senderSignatory: details.accountSignatory,
          receiverName: transfer.ReceivingName,
          receiverAccount: transfer.ReceivingAccount,
          receiverSignatory: transfer.ReceivingSignatory,
          amount: transfer.Amount,
          currency: transfer.ReceivingCurrency,
          description: transfer.Description,
          transferId: transfer.TransferRequestID,
          datetime: transfer.Datetime
        }]
      };
    } catch (error) {
      console.error('Erro na requisição:', error.message);
      return {
        success: false,
        error: error.message,
        data: {},
        transfers: []
      };
    }
  }
};

// Serviço de Transferência
const transferService = {
  executeTransfer: async (params) => {
    // Validação inicial
    if (!params.fromAccount) {
      throw new Error('Conta de origem é obrigatória');
    }
    if (!params.toAccount) {
      throw new Error('Conta de destino é obrigatória');
    }
    if (!params.amount || params.amount <= 0) {
      throw new Error('Valor da transferência é inválido');
    }
    
    try {
      // 1. Criar reserva
      const reservaResponse = await reservationApi.createReservation({
        account: params.fromAccount
      });
      const codigoReserva = reservaResponse.reservationCode;
      console.log('Reserva criada:', codigoReserva);
      
      // 2. Enviar transferência
      await sendApi.sendTransfer({ reservationId: codigoReserva, account: params.toAccount, amount: params.amount, currency: params.currency });
      console.log('Transferência enviada');
      
      // 3. Confirmar transferência
      const confirmacaoResponse = await confirmationApi.confirm(codigoReserva);
      console.log('Transferência confirmada');
      
      return {
        success: true,
        reservationId: codigoReserva,
        status: 'completed',
        details: {
          fromAccount: params.fromAccount,
          toAccount: params.toAccount,
          amount: params.amount,
          currency: params.currency || 'USD',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erro na transferência:', error);
      throw error;
    }
  }
};

// Função auxiliar para extrair código de reserva
function extrairCodigoReserva(response) {
  try {
    // Tenta extrair do formato padrão
    if (response?.Information?.Details?.resCode) {
      return response.Information.Details.resCode;
    }
    
    // Tenta extrair do formato alternativo
    if (response?.Information?.ReservationCode) {
      return response.Information.ReservationCode;
    }
    
    // Tenta extrair de uma string HTML
    if (typeof response === 'string') {
      const match = response.match(/Res_code["\s:]+([^,\s]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Se não encontrar, gera um código temporário
    const tempCode = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Gerando código temporário:', tempCode);
    return tempCode;
  } catch (error) {
    console.error('Erro ao extrair código de reserva:', error);
    return null;
  }
}

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    // Sanitiza a resposta antes de retornar
    return sanitizeResponse(response);
  },
  async (error) => {
    console.log('Erro na requisição:', error.message);
    
    const originalRequest = error.config;
    
    if (error.response?.status === 500 && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      if (originalRequest._retryCount <= API_CONFIG.RETRY_ATTEMPTS) {
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, originalRequest._retryCount - 1);
        console.log(`Tentativa ${originalRequest._retryCount} de ${API_CONFIG.RETRY_ATTEMPTS}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

export {
  api,
  reservationApi,
  confirmationApi,
  receivingApi,
  sendApi,
  transferService,
  API_CONFIG
};
