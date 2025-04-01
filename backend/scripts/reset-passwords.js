const bcrypt = require('bcryptjs');
const { User } = require('../pg-models');
const { logger } = require('../config/logger');

// Senha padrão para todos os usuários
const DEFAULT_PASSWORD = '123456';

// Função para resetar as senhas
async function resetAllPasswords() {
  try {
    // Hash da senha padrão
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);
    
    console.log('Iniciando reset de senhas...');
    
    // Buscar todos os usuários
    const users = await User.findAll();
    console.log(`Encontrados ${users.length} usuários.`);
    
    // Lista para armazenar resultados
    const results = [];
    
    // Atualizar a senha de cada usuário
    for (const user of users) {
      // Atualizar a senha
      await user.update({ 
        password: hashedPassword,
        status: 'active',
        failedLoginAttempts: 0
      });
      
      // Registrar informações para exibição
      results.push({
        id: user.id,
        email: user.email,
        role: user.role,
        status: 'Senha resetada com sucesso'
      });
      
      console.log(`Senha resetada para ${user.email} (${user.role})`);
    }
    
    // Exibir tabela com resultados
    console.table(results);
    console.log('\nTodas as senhas foram resetadas para:', DEFAULT_PASSWORD);
    console.log('Agora você pode logar com as contas usando a senha padrão.');
    
    // Exibir instruções para login
    console.log('\nExemplo para login de administrador:');
    const adminUser = users.find(u => u.role === 'admin');
    if (adminUser) {
      console.log(`Email: ${adminUser.email}`);
      console.log(`Senha: ${DEFAULT_PASSWORD}`);
    }
    
    console.log('\nExemplo para login de cliente:');
    const clientUser = users.find(u => u.role === 'client');
    if (clientUser) {
      console.log(`Email: ${clientUser.email}`);
      console.log(`Senha: ${DEFAULT_PASSWORD}`);
    }
    
  } catch (error) {
    console.error('Erro ao resetar senhas:', error.message);
  } finally {
    // Encerrar conexão
    process.exit(0);
  }
}

// Executar a função
resetAllPasswords();
