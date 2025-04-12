/**
 * Migração para adicionar contas BRL para usuários específicos que não possuem
 */
const { sequelize } = require('../config/database');
const { User, Account } = require('../pg-models');

async function addMissingBRLAccounts() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Iniciando migração para adicionar contas BRL para clientes específicos');
    
    // 1. Encontrar os usuários específicos pelo email
    const users = await User.findAll({
      where: {
        email: ['souzarene@outlook.com', 'elos.agro@gmail.com']
      },
      include: [
        {
          model: Account,
          as: 'accounts'
        }
      ],
      transaction
    });
    
    if (!users || users.length === 0) {
      console.log('Nenhum dos usuários específicos foi encontrado');
      return;
    }
    
    console.log(`Encontrados ${users.length} usuários para adicionar contas BRL`);
    
    // 2. Para cada usuário, verificar se já tem conta BRL e criar se não tiver
    for (const user of users) {
      const hasBRLAccount = user.accounts.some(acc => acc.currency === 'BRL');
      
      if (hasBRLAccount) {
        console.log(`Usuário ${user.email} já possui conta BRL`);
        continue;
      }
      
      // Gerar número de conta para BRL
      const brlAccountNumber = await Account.generateAccountNumber('internal');
      
      // Criar conta BRL
      const brlAccount = await Account.create({
        accountType: 'internal',
        currency: 'BRL',
        userId: user.id,
        name: `Conta BRL de ${user.name}`,
        balance: 0,
        isInternal: true,
        status: 'active',
        dailyTransferLimit: 10000,
        monthlyTransferLimit: 50000,
        accountNumber: brlAccountNumber
      }, { transaction });
      
      console.log(`Conta BRL criada para ${user.email} - Número: ${brlAccountNumber}`);
    }
    
    // Commit das alterações
    await transaction.commit();
    console.log('Migração concluída com sucesso!');
    
  } catch (error) {
    // Rollback em caso de erro
    await transaction.rollback();
    console.error('Erro durante a migração:', error);
    throw error;
  }
}

// Executar a migração
addMissingBRLAccounts()
  .then(() => {
    console.log('Migração para adicionar contas BRL finalizada com sucesso');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  });
