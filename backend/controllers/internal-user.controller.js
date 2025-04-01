const { User, Account } = require('../pg-models');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Registrar um novo usuário para contas internas
exports.register = async (req, res) => {
  try {
    const { name, email, password, documentType, documentNumber } = req.body;

    // Verificar se o e-mail já está em uso
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Este e-mail já está em uso'
      });
    }

    // Criar o usuário
    const user = await User.create({
      name,
      email,
      password, // A senha será hash automaticamente pelo hook beforeCreate
      documentType,
      documentNumber,
      role: 'client', // Garantir que novos registros sejam sempre 'client'
      status: 'active'
    });

    return res.status(201).json({
      status: 'success',
      message: 'Usuário registrado com sucesso',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        documentType: user.documentType,
        documentNumber: user.documentNumber
      }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao registrar usuário',
      error: error.message
    });
  }
};

// Login para usuários internos
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar o e-mail
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se a conta está bloqueada
    if (user.status === 'locked') {
      return res.status(401).json({
        status: 'error',
        message: 'Conta bloqueada. Entre em contato com o suporte.'
      });
    }

    // Verificar se a conta está inativa
    if (user.status === 'inactive') {
      return res.status(401).json({
        status: 'error',
        message: 'Conta inativa. Entre em contato com o suporte.'
      });
    }

    // Verificar a senha
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Incrementar tentativas de login falhas
      await user.incrementLoginAttempts();

      return res.status(401).json({
        status: 'error',
        message: 'Credenciais inválidas'
      });
    }

    // Resetar tentativas de login falhas
    await user.resetLoginAttempts();

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          documentType: user.documentType,
          documentNumber: user.documentNumber
        }
      }
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao realizar login',
      error: error.message
    });
  }
};

// Obter perfil do usuário autenticado
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'twoFactorSecret'] },
      include: [
        { 
          model: Account, 
          as: 'accounts',
          where: { isInternal: true },
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Perfil obtido com sucesso',
      data: user
    });
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao obter perfil',
      error: error.message
    });
  }
};

// Atualizar perfil do usuário
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, documentType, documentNumber } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar apenas os campos permitidos
    if (name) user.name = name;
    if (documentType) user.documentType = documentType;
    if (documentNumber) user.documentNumber = documentNumber;

    // Verificar se o e-mail já está em uso por outro usuário
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists) {
        return res.status(400).json({
          status: 'error',
          message: 'Este e-mail já está em uso'
        });
      }
      user.email = email;
    }

    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Perfil atualizado com sucesso',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        documentType: user.documentType,
        documentNumber: user.documentNumber
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar perfil',
      error: error.message
    });
  }
};

// Alterar senha
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao alterar senha',
      error: error.message
    });
  }
};
