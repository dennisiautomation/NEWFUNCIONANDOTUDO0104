const { reservationApi, sendApi, confirmationApi } = require('./api');

class TransferService {
  /**
   * Realiza uma transferência
   * @param {Object} params
   * @param {string} params.fromAccount - Conta de origem (42226 para USD, 42227 para EUR)
   * @param {string} params.toAccount - Conta de destino
   * @param {number} params.amount - Valor
   * @param {string} params.currency - Moeda (USD ou EUR)
   */
  async transfer(params) {
    try {
      // 1. Validar se a conta origem corresponde à moeda
      this.validateAccountCurrency(params.fromAccount, params.currency);

      // 2. Criar reserva usando a conta do cliente
      const reserva = await reservationApi.createReservation(params.fromAccount);
      if (!reserva.success) {
        throw new Error(`Erro ao criar reserva: ${reserva.error}`);
      }

      // 3. Enviar transferência
      const transfer = await sendApi.sendTransfer({
        reservationId: reserva.reservationCode,
        account: params.toAccount,      // Conta destino
        amount: params.amount,
        currency: params.currency
      });
      if (!transfer.success) {
        throw new Error(`Erro ao enviar transferência: ${transfer.error}`);
      }

      // 4. Confirmar transferência
      const confirm = await confirmationApi.confirm(reserva.reservationCode);
      if (!confirm.success) {
        throw new Error(`Erro ao confirmar transferência: ${confirm.error}`);
      }

      return {
        success: true,
        message: 'Transferência realizada com sucesso',
        data: {
          fromAccount: params.fromAccount,
          toAccount: params.toAccount,
          amount: params.amount,
          currency: params.currency,
          reservationCode: reserva.reservationCode,
          transferId: transfer.data.transferId,
          dateTime: confirm.data.dateTime
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  /**
   * Valida se a conta corresponde à moeda
   */
  validateAccountCurrency(account, currency) {
    const ACCOUNTS = {
      USD: '42226',
      EUR: '42227'
    };

    if (currency === 'USD' && account !== ACCOUNTS.USD) {
      throw new Error('Para transferências em USD use a conta 42226');
    }

    if (currency === 'EUR' && account !== ACCOUNTS.EUR) {
      throw new Error('Para transferências em EUR use a conta 42227');
    }
  }
}

module.exports = new TransferService();
