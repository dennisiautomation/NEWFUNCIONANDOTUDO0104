const { User, Account } = require('../pg-models');

// Criar uma nova conta interna
exports.createAccount = async (req, res) => {
  try {
    const { userId, accountType, currency, name, status, initialBalance = 0 } = req.body;

    // Verificar se o usuário existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Gerar número da conta
    const accountNumber = await Account.generateAccountNumber(accountType);

    // Criar conta
    const account = await Account.create({
      accountNumber,
      accountType,
      userId,
      name,
      currency,
      balance: initialBalance,
      isInternal: true,
      status: status || 'active'
    });

    return res.status(201).json({
      status: 'success',
      message: 'Conta interna criada com sucesso',
      data: account
    });
  } catch (error) {
    console.error('Erro ao criar conta interna:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao criar conta interna',
      error: error.message
    });
  }
};

// Listar todas as contas internas
exports.listAccounts = async (req, res) => {
  try {
    const { userId, accountType } = req.query;
    let query = { isInternal: true };

    // Filtrar por usuário se fornecido
    if (userId) query.userId = userId;
    
    // Filtrar por tipo de conta se fornecido
    if (accountType) query.accountType = accountType;

    const accounts = await Account.findAll({
      where: query,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'documentType', 'documentNumber']
      }],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      status: 'success',
      message: 'Contas internas listadas com sucesso',
      data: accounts
    });
  } catch (error) {
    console.error('Erro ao listar contas internas:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao listar contas internas',
      error: error.message
    });
  }
};

// Buscar uma conta interna por ID
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await Account.findOne({
      where: { id, isInternal: true },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'documentType', 'documentNumber']
      }]
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta interna não encontrada'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Conta interna encontrada com sucesso',
      data: account
    });
  } catch (error) {
    console.error('Erro ao buscar conta interna:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao buscar conta interna',
      error: error.message
    });
  }
};

// Atualizar status da conta
exports.updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['active', 'inactive', 'suspended', 'closed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status inválido'
      });
    }

    const account = await Account.findOne({
      where: { id, isInternal: true }
    });

    if (!account) {
      return res.status(404).json({
        status: 'error',
        message: 'Conta interna não encontrada'
      });
    }

    account.status = status;
    await account.save();

    return res.status(200).json({
      status: 'success',
      message: 'Status da conta atualizado com sucesso',
      data: account
    });
  } catch (error) {
    console.error('Erro ao atualizar status da conta:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar status da conta',
      error: error.message
    });
  }
};

// Buscar contas de um usuário
exports.getUserAccounts = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    const accounts = await Account.findAll({
      where: { userId, isInternal: true },
      order: [['accountType', 'ASC']]
    });

    return res.status(200).json({
      status: 'success',
      message: 'Contas do usuário listadas com sucesso',
      data: accounts
    });
  } catch (error) {
    console.error('Erro ao listar contas do usuário:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao listar contas do usuário',
      error: error.message
    });
  }
};
