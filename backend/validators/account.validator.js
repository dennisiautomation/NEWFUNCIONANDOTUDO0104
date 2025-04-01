const ApiError = require('../utils/ApiError');

/**
 * Validadores para operações relacionadas a contas
 */
const accountValidator = {
  /**
   * Valida informações de criação de conta
   * @param {Object} accountData - Dados da conta a ser criada
   * @throws {ApiError} - Erro em caso de dados inválidos
   */
  validateAccountCreation: (accountData) => {
    const { userId, accountType, name, currency } = accountData;

    if (!userId) {
      throw new ApiError(400, 'ID do usuário é obrigatório');
    }

    if (!accountType) {
      throw new ApiError(400, 'Tipo de conta é obrigatório');
    }

    if (!['internal', 'external', 'crypto'].includes(accountType)) {
      throw new ApiError(400, 'Tipo de conta deve ser internal, external ou crypto');
    }

    if (!name) {
      throw new ApiError(400, 'Nome da conta é obrigatório');
    }

    if (!currency) {
      throw new ApiError(400, 'Moeda da conta é obrigatória');
    }

    if (!['USD', 'EUR', 'USDT'].includes(currency)) {
      throw new ApiError(400, 'Moeda deve ser USD, EUR ou USDT');
    }
  },

  /**
   * Valida limites de transferência de uma conta
   * @param {Object} limitData - Dados dos limites a serem validados
   * @throws {ApiError} - Erro em caso de limites inválidos
   */
  validateLimits: (limitData) => {
    const { dailyTransferLimit, monthlyTransferLimit } = limitData;

    // Verificar se os limites foram fornecidos
    if (dailyTransferLimit === undefined || dailyTransferLimit === null) {
      throw new ApiError(400, 'Limite diário de transferência é obrigatório');
    }

    if (monthlyTransferLimit === undefined || monthlyTransferLimit === null) {
      throw new ApiError(400, 'Limite mensal de transferência é obrigatório');
    }

    // Verificar se os limites são números válidos
    if (isNaN(parseFloat(dailyTransferLimit))) {
      throw new ApiError(400, 'Limite diário de transferência deve ser um número válido');
    }

    if (isNaN(parseFloat(monthlyTransferLimit))) {
      throw new ApiError(400, 'Limite mensal de transferência deve ser um número válido');
    }

    // Verificar se os limites são positivos
    if (parseFloat(dailyTransferLimit) < 0) {
      throw new ApiError(400, 'Limite diário de transferência não pode ser negativo');
    }

    if (parseFloat(monthlyTransferLimit) < 0) {
      throw new ApiError(400, 'Limite mensal de transferência não pode ser negativo');
    }

    // Verificar se o limite mensal é maior ou igual ao diário
    if (parseFloat(monthlyTransferLimit) < parseFloat(dailyTransferLimit)) {
      throw new ApiError(400, 'Limite mensal de transferência deve ser maior ou igual ao limite diário');
    }
  },

  /**
   * Valida informações de atualização de conta
   * @param {Object} accountData - Dados da conta a ser atualizada
   * @throws {ApiError} - Erro em caso de dados inválidos
   */
  validateAccountUpdate: (accountData) => {
    const { name, status, dailyTransferLimit, monthlyTransferLimit } = accountData;

    // Verificar se pelo menos um campo foi fornecido
    if (!name && !status && !dailyTransferLimit && !monthlyTransferLimit) {
      throw new ApiError(400, 'Nenhum campo para atualização foi fornecido');
    }

    // Validar status, se fornecido
    if (status && !['active', 'inactive', 'blocked'].includes(status)) {
      throw new ApiError(400, 'Status deve ser active, inactive ou blocked');
    }

    // Validar limites, se fornecidos
    if ((dailyTransferLimit !== undefined && dailyTransferLimit !== null) || 
        (monthlyTransferLimit !== undefined && monthlyTransferLimit !== null)) {
      
      const limitData = {
        dailyTransferLimit: dailyTransferLimit !== undefined && dailyTransferLimit !== null ? 
                            dailyTransferLimit : 0,
        monthlyTransferLimit: monthlyTransferLimit !== undefined && monthlyTransferLimit !== null ? 
                              monthlyTransferLimit : 0
      };
      
      accountValidator.validateLimits(limitData);
    }
  }
};

module.exports = accountValidator;
