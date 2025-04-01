const express = require('express');
const cors = require('cors');
const { User, Account, sequelize } = require('./pg-models');
const bcrypt = require('bcryptjs');
const path = require('path');

// Criar aplicação Express
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Rota de status para verificar se o servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date(),
    version: '1.0.0'
  });
});

// Rota para listar contas
app.get('/api/admin/accounts', async (req, res) => {
  try {
    // Buscar todas as contas com informações do usuário
    const accounts = await Account.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['name', 'email']
      }]
    });

    // Processar os resultados
    const formattedAccounts = accounts.map(account => ({
      id: account.id,
      accountNumber: account.accountNumber || `AC-${account.id}`,
      userId: account.userId,
      userName: account.user ? account.user.name : 'Usuário',
      userEmail: account.user ? account.user.email : 'email@exemplo.com',
      balance: parseFloat(account.balance || 0),
      currency: account.currency || 'USD',
      status: account.status || 'active',
      createdAt: account.createdAt || new Date()
    }));

    return res.json(formattedAccounts);
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao listar contas',
      error: error.message
    });
  }
});

// Rota para criar novo usuário com 3 contas (USD, EUR, USDT)
app.post('/api/admin/accounts', async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { 
      name, 
      email, 
      password, 
      documentType, 
      documentNumber 
    } = req.body;

    // Validar dados
    if (!name || !email || !password || !documentType || !documentNumber) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Todos os campos são obrigatórios: nome, email, senha, tipo de documento e número do documento'
      });
    }

    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ 
      where: { email },
      transaction: t
    });
    
    if (existingUser) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Este email já está em uso'
      });
    }
    
    // Verificar se o documento já está em uso
    const existingDocument = await User.findOne({ 
      where: { documentNumber },
      transaction: t
    });
    
    if (existingDocument) {
      await t.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Este documento já está cadastrado'
      });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar o usuário
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      documentType,
      documentNumber,
      role: 'client',
      status: 'active',
      twoFactorEnabled: false,
      failedLoginAttempts: 0
    }, { transaction: t });

    // Criar conta USD
    const usdAccount = await Account.create({
      accountType: 'internal',
      currency: 'USD',
      userId: user.id,
      name: `Conta USD de ${name}`,
      balance: 0,
      isInternal: true,
      status: 'active',
      dailyTransferLimit: 10000,
      monthlyTransferLimit: 50000,
      accountNumber: `USD-${Date.now().toString().slice(-6)}`
    }, { transaction: t });

    // Criar conta EUR
    const eurAccount = await Account.create({
      accountType: 'internal',
      currency: 'EUR',
      userId: user.id,
      name: `Conta EUR de ${name}`,
      balance: 0,
      isInternal: true,
      status: 'active',
      dailyTransferLimit: 10000,
      monthlyTransferLimit: 50000,
      accountNumber: `EUR-${Date.now().toString().slice(-6)}`
    }, { transaction: t });

    // Criar conta USDT
    const usdtAccount = await Account.create({
      accountType: 'internal',
      currency: 'USDT',
      userId: user.id,
      name: `Conta USDT de ${name}`,
      balance: 0,
      isInternal: true,
      status: 'active',
      dailyTransferLimit: 10000,
      monthlyTransferLimit: 50000,
      accountNumber: `USDT-${Date.now().toString().slice(-6)}`
    }, { transaction: t });

    await t.commit();

    // Retornar resposta
    return res.status(201).json({
      status: 'success',
      message: 'Usuário e contas criados com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          documentType: user.documentType,
          documentNumber: user.documentNumber
        },
        accounts: [
          {
            id: usdAccount.id,
            accountNumber: usdAccount.accountNumber,
            currency: 'USD',
            name: usdAccount.name
          },
          {
            id: eurAccount.id,
            accountNumber: eurAccount.accountNumber,
            currency: 'EUR',
            name: eurAccount.name
          },
          {
            id: usdtAccount.id,
            accountNumber: usdtAccount.accountNumber,
            currency: 'USDT',
            name: usdtAccount.name
          }
        ]
      }
    });
  } catch (error) {
    await t.rollback();
    console.error('Erro ao criar conta:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao criar usuário e contas',
      error: error.message
    });
  }
});

// Rota para servir o frontend React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
