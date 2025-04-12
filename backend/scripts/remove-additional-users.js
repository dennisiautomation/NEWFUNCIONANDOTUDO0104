// Script para remover múltiplos usuários e suas contas associadas
const { Sequelize } = require('sequelize');
const models = require('../pg-models');
const { User, Account } = models;
require('dotenv').config();

async function removeUser(email) {
  try {
    console.log(`\n---------------------------------------------`);
    console.log(`Buscando usuário com email: ${email}`);
    
    // Encontrar o usuário pelo email
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.error(`Usuário com email ${email} não encontrado.`);
      return false;
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
    
    return true;
  } catch (error) {
    console.error(`Erro ao excluir usuário ${email}:`, error);
    return false;
  }
}

async function removeMultipleUsers(emailList) {
  console.log(`Iniciando remoção de ${emailList.length} usuários...`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const email of emailList) {
    const result = await removeUser(email);
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n---------------------------------------------`);
  console.log(`Operação finalizada!`);
  console.log(`Usuários removidos com sucesso: ${successCount}`);
  console.log(`Falhas na remoção: ${failCount}`);
  
  // Encerrar conexão
  process.exit(0);
}

// Lista de emails dos usuários a serem removidos
const emailsToRemove = [
  'ddgg@icloud.com',
  'llaa@icloud.com',
  'ddffaaa@icloud.com',
  'ddff@icloud.com',
  'cliente.test@example.com',
  'teste.final@example.com',
  'teste.login@example.com',
  'dcantelii@icloud.com',
  'dcanteli3@icloud.com',
  'dcanteli2@icloud.com',
  'dcanteli1@icloud.com',
  'dcanteli@icloud.com'
];

// Executar a função de remoção
removeMultipleUsers(emailsToRemove);
