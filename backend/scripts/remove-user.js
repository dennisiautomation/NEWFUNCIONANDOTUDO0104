// Script para remover um usuário e suas contas associadas
const { Sequelize } = require('sequelize');
const models = require('../pg-models');
const { User, Account } = models;
require('dotenv').config();

async function removeUser(email) {
  try {
    console.log(`Buscando usuário com email: ${email}`);
    
    // Encontrar o usuário pelo email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.error(`Usuário com email ${email} não encontrado.`);
      return;
    }
    
    console.log(`Usuário encontrado: ID=${user.id}, Nome=${user.name}, Email=${user.email}`);
    
    // Encontrar todas as contas associadas a este usuário
    const accounts = await Account.findAll({ where: { userId: user.id } });
    
    console.log(`Encontradas ${accounts.length} contas associadas a este usuário:`);
    for (const account of accounts) {
      console.log(`Conta: ID=${account.id}, Número=${account.accountNumber}, Tipo=${account.currency}, Saldo=${account.balance}`);
    }
    
    console.log('Iniciando exclusão de contas...');
    
    // Excluir todas as contas associadas
    for (const account of accounts) {
      await account.destroy();
      console.log(`Conta ${account.accountNumber} excluída.`);
    }
    
    console.log('Todas as contas foram excluídas.');
    
    // Excluir o usuário
    await user.destroy();
    console.log(`Usuário ${user.name} (${user.email}) excluído com sucesso.`);
    
    console.log('Operação de exclusão concluída com sucesso.');
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
  } finally {
    // Encerrar conexão
    process.exit(0);
  }
}

// Email do usuário a ser removido
const userEmail = 'ncan@ncan.com.br';

// Executar a função de remoção
removeUser(userEmail);
