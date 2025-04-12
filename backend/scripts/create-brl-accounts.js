/**
 * Script para criar contas BRL para usuários existentes
 */
const { User, Account, sequelize } = require('../pg-models');

async function createBRLAccounts() {
  console.log('Iniciando criação de contas BRL para usuários existentes');
  
  try {
    // Obter todos os usuários ativos
    const users = await User.findAll({
      where: {
        status: 'active'
      }
    });
    
    console.log(`Encontrados ${users.length} usuários ativos`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    // Para cada usuário, verificar se já tem conta BRL
    for (const user of users) {
      // Verificar se o usuário já tem uma conta BRL
      const existingBRLAccount = await Account.findOne({
        where: {
          userId: user.id,
          currency: 'BRL'
        }
      });
      
      if (existingBRLAccount) {
        console.log(`Usuário ${user.id} (${user.email}) já possui conta BRL. Pulando.`);
        skippedCount++;
        continue;
      }
      
      // Gerar número de conta
      const accountNumber = await Account.generateAccountNumber('standard');
      
      // Criar conta BRL
      await Account.create({
        accountType: 'standard',
        currency: 'BRL',
        userId: user.id,
        name: `Conta BRL de ${user.name}`,
        balance: 0,
        isInternal: false,
        status: 'active',
        dailyTransferLimit: 20000,
        monthlyTransferLimit: 100000,
        accountNumber
      });
      
      console.log(`Conta BRL criada para usuário ${user.id} (${user.email})`);
      createdCount++;
    }
    
    console.log(`Processo concluído. Contas criadas: ${createdCount}. Contas puladas: ${skippedCount}`);
    
  } catch (error) {
    console.error(`Erro ao criar contas BRL: ${error.message}`);
    console.error(error);
  } finally {
    // Fechar conexão com o banco de dados
    await sequelize.close();
  }
}

// Executar o script
createBRLAccounts()
  .then(() => {
    console.log('Script finalizado com sucesso');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro ao executar script:', error);
    process.exit(1);
  });
