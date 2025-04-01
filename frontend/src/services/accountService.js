const { receivingApi } = require('./api');

class AccountService {
  constructor() {
    // Dados do cliente logado
    this.currentUser = null;
  }

  /**
   * Define o usuário atual
   */
  setCurrentUser(user) {
    this.currentUser = user;
  }

  /**
   * Valida se o usuário pode acessar uma conta
   */
  validateAccountAccess(accountNumber) {
    if (!this.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Verifica se a conta pertence ao usuário
    if (this.currentUser.accountNumber !== accountNumber) {
      throw new Error('Acesso não autorizado a esta conta');
    }
  }

  /**
   * Busca transferências recebidas do usuário atual
   */
  async getIncomingTransfers() {
    try {
      if (!this.currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Busca transferências
      const result = await receivingApi.getIncomingTransfers();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Filtra apenas transferências da conta do usuário
      const userTransfers = result.transfers.filter(transfer => 
        transfer.receiverAccount === this.currentUser.accountNumber
      );

      return {
        success: true,
        transfers: userTransfers
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        transfers: []
      };
    }
  }

  /**
   * Busca saldo da conta
   */
  async getBalance(accountNumber) {
    try {
      // Valida acesso
      this.validateAccountAccess(accountNumber);

      // TODO: Implementar chamada à API de saldo
      return {
        success: true,
        balance: {
          available: 1000.00,
          currency: this.currentUser.accountNumber === '42226' ? 'USD' : 'EUR'
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        balance: null
      };
    }
  }
}

module.exports = new AccountService();
