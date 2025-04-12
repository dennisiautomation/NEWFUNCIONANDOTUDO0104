/**
 * Configurações padrão para as contas do usuário
 * Este arquivo define valores padrão para as contas quando os dados não estão disponíveis
 */

const accountDefaults = {
  // Contas padrão por moeda
  accounts: {
    USD: {
      name: 'Conta Dólar',
      accountNumber: '10001',
      currency: 'USD',
      balance: 0.00
    },
    EUR: {
      name: 'Conta Euro',
      accountNumber: '10002',
      currency: 'EUR',
      balance: 0.00
    },
    USDT: {
      name: 'Conta USDT',
      accountNumber: '10003',
      currency: 'USDT',
      balance: 0.00
    }
  },
  
  // Função para obter os valores padrão de uma conta
  getAccountDefaults(currency) {
    return this.accounts[currency] || this.accounts.USD;
  },
  
  // Função para preencher valores ausentes em uma conta
  fillAccountDefaults(account) {
    if (!account) return null;
    
    const defaults = this.getAccountDefaults(account.currency);
    
    return {
      ...defaults,
      ...account,
      name: account.name || defaults.name,
      accountNumber: account.accountNumber || defaults.accountNumber,
      balance: account.balance !== undefined ? account.balance : defaults.balance
    };
  }
};

export default accountDefaults;
