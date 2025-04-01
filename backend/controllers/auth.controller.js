const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { User } = require('../pg-models'); 
const { logger } = require('../config/logger'); 
const { sendEmail } = require('../utils/email');

// Helper function to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'newcashbank-jwt-secret-2025',
    { expiresIn: process.env.JWT_EXPIRATION || '1d' }
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'newcashbank-jwt-secret-2025',
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    console.log('Dados de registro recebidos:', req.body);
    
    const { firstName, lastName, email, password, role, documentType, documentNumber } = req.body;

    // Check if email already exists (PostgreSQL)
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already in use'
      });
    }

    // Only admin can create another admin
    if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized to create admin user'
      });
    }

    // Converter tipos de documento para o formato esperado pelo banco de dados
    let formattedDocType = 'CPF'; // Padrão
    if (documentType) {
      if (documentType.toLowerCase() === 'cpf') formattedDocType = 'CPF';
      else if (documentType.toLowerCase() === 'cnpj') formattedDocType = 'CNPJ';
      else if (documentType.toLowerCase() === 'passport') formattedDocType = 'Passaporte';
    }

    // NÃO vamos pré-hashar a senha - deixar o hook do modelo fazer isso
    // exatamente como o painel admin faz (que funciona)
    
    // Criar nome completo para compatibilidade com o painel admin
    const fullName = `${firstName} ${lastName}`;
    
    console.log('Criando usuário com os seguintes dados:');
    console.log('- Nome completo:', fullName);
    console.log('- Status: active');

    // Create new user (PostgreSQL) - USAR O MESMO FORMATO DO ADMIN PANEL
    const user = await User.create({
      name: fullName,  // Campo principal usado pelo admin panel
      firstName,
      lastName,
      email,
      password: password, // Senha em texto puro, o hook do modelo vai hashar
      role: role || 'client',
      documentType: formattedDocType,
      documentNumber: documentNumber || '',
      failedLoginAttempts: 0,
      accountLocked: false,
      status: 'active' // Forçar status como ativo
    });

    // Criar automaticamente três contas (USD, EUR, USDT) para o usuário
    try {
      // Usar diretamente o modelo de Conta para garantir que tudo seja criado corretamente
      const { Account } = require('../pg-models');
      
      // Gerar números de conta únicos
      const usdAccountNumber = await Account.generateAccountNumber('internal');
      const eurAccountNumber = await Account.generateAccountNumber('internal');
      const usdtAccountNumber = await Account.generateAccountNumber('internal');
      
      // Criar as três contas diretamente - usar o mesmo método que funciona no admin
      const accounts = [
        {
          userId: user.id,
          accountType: 'internal',
          currency: 'USD',
          accountNumber: usdAccountNumber,
          balance: 0.00,
          isInternal: true,
          status: 'active',
          name: `Conta USD de ${user.name}`,
          dailyTransferLimit: 10000.00,
          monthlyTransferLimit: 50000.00
        },
        {
          userId: user.id,
          accountType: 'internal',
          currency: 'EUR',
          accountNumber: eurAccountNumber,
          balance: 0.00,
          isInternal: true,
          status: 'active',
          name: `Conta EUR de ${user.name}`,
          dailyTransferLimit: 8000.00,
          monthlyTransferLimit: 40000.00
        },
        {
          userId: user.id,
          accountType: 'internal',
          currency: 'USDT',
          accountNumber: usdtAccountNumber,
          balance: 0.00,
          isInternal: true,
          status: 'active',
          name: `Conta USDT de ${user.name}`,
          dailyTransferLimit: 15000.00,
          monthlyTransferLimit: 75000.00
        }
      ];
      
      // Criar contas em paralelo usando o modelo diretamente
      const createdAccounts = await Promise.all(
        accounts.map(account => Account.create(account))
      );
      
      console.log(`Registro público: Criadas ${createdAccounts.length} contas para usuário ${user.id} com status ativo e números de conta`);
      logger.info(`Created accounts for user: ${user.id} via public register`);
    } catch (accountError) {
      logger.error(`Failed to create accounts: ${accountError.message}`);
      // Não falhar o registro se a criação de contas falhar
    }

    // Send welcome email
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to NewCash Bank',
        text: `Hello ${firstName} ${lastName},\n\nWelcome to NewCash Bank! Your account has been created successfully.\n\nBest regards,\nNewCash Bank Team`
      });
    } catch (emailError) {
      logger.error(`Failed to send welcome email: ${emailError.message}`);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Função auxiliar para criar contas para um novo usuário
const createClientAccounts = async (userId) => {
  try {
    // Verificar se já existem modelos para Account no banco de dados
    let Account;
    try {
      Account = require('../pg-models').Account;
    } catch (err) {
      // Se o modelo não existir, vamos usar a API direta
      logger.warn(`Account model not found, using direct API calls: ${err.message}`);
      
      // Criar contas diretamente pela rota
      const axios = require('axios');
      const API_URL = process.env.API_URL || 'http://localhost:3001/api';
      
      // Gerar números de conta para consistência
      const baseAccountNumber = '3' + Math.floor(10000000000 + Math.random() * 90000000000);
      
      const accounts = [
        {
          userId: userId,
          accountType: 'internal', // Corrigido de 'type' para 'accountType'
          currency: 'USD',
          balance: 0,
          status: 'active',
          name: 'Conta Dólar',
          accountNumber: baseAccountNumber + '1',
          isInternal: true, // Garantir que seja uma conta interna
          dailyTransferLimit: 10000,
          monthlyTransferLimit: 50000
        },
        {
          userId: userId,
          accountType: 'internal', // Corrigido de 'type' para 'accountType'
          currency: 'EUR',
          balance: 0,
          status: 'active',
          name: 'Conta Euro',
          accountNumber: baseAccountNumber + '2',
          isInternal: true, // Garantir que seja uma conta interna
          dailyTransferLimit: 8000,
          monthlyTransferLimit: 40000
        },
        {
          userId: userId,
          accountType: 'internal', // Corrigido de 'type' para 'accountType'
          currency: 'USDT',
          balance: 0,
          status: 'active',
          name: 'Conta USDT',
          accountNumber: baseAccountNumber + '3',
          isInternal: true, // Garantir que seja uma conta interna
          dailyTransferLimit: 15000,
          monthlyTransferLimit: 75000
        }
      ];
      
      // Verificar se a URL da API já inclui o prefixo /api
      const apiUrlPrefix = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
      
      // Criar contas em paralelo
      const accountPromises = accounts.map(account => {
        return axios.post(`${apiUrlPrefix}/accounts`, account)
          .catch(error => {
            logger.error(`Error creating account via API: ${error.message}`);
            return null;
          });
      });
      
      await Promise.all(accountPromises);
      return;
    }
    
    // Se o modelo Account existir, usar diretamente
    // Usar o mesmo método de geração de números que o painel admin
    const usdAccountNumber = await Account.generateAccountNumber('internal');
    const eurAccountNumber = await Account.generateAccountNumber('internal');
    const usdtAccountNumber = await Account.generateAccountNumber('internal');
    
    // Criar as três contas
    const accounts = [
      {
        userId: userId,
        type: 'CHECKING',
        accountNumber: usdAccountNumber,
        balance: 0.00,
        currency: 'USD',
        dailyTransferLimit: 10000.00,
        dailyTransferTotal: 0,
        monthlyTransferLimit: 50000.00,
        monthlyTransferTotal: 0,
        status: 'active',
        name: 'Conta Dólar',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: userId,
        type: 'CHECKING',
        accountNumber: eurAccountNumber,
        balance: 0.00,
        currency: 'EUR',
        dailyTransferLimit: 8000.00,
        dailyTransferTotal: 0,
        monthlyTransferLimit: 40000.00,
        monthlyTransferTotal: 0,
        status: 'active',
        name: 'Conta Euro',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        userId: userId,
        type: 'CHECKING',
        accountNumber: usdtAccountNumber,
        balance: 0.00,
        currency: 'USDT',
        dailyTransferLimit: 15000.00,
        dailyTransferTotal: 0,
        monthlyTransferLimit: 75000.00,
        monthlyTransferTotal: 0,
        status: 'active',
        name: 'Conta USDT',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Criar contas em paralelo
    const createdAccounts = await Promise.all(
      accounts.map(account => Account.create(account))
    );
    
    logger.info(`Created ${createdAccounts.length} accounts for user ${userId}`);
    return createdAccounts;
  } catch (error) {
    logger.error(`Error creating client accounts: ${error.message}`);
    throw error;
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Tentativa de login para:', email);

    // Find user by email (PostgreSQL)
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists
    if (!user) {
      console.log('Usuário não encontrado:', email);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    console.log('Usuário encontrado:', {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName
    });

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.update({
        failedLoginAttempts: user.failedLoginAttempts + 1
      });
      
      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        await user.update({ accountLocked: true });
      }
      
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.accountLocked) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is locked. Please contact support for assistance.'
      });
    }

    // Check if account is inactive
    if (user.status === 'inactive') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is inactive. Please contact support to activate your account.'
      });
    }

    // Reset failed login attempts on successful login
    await user.update({ 
      failedLoginAttempts: 0,
      status: 'active' // Garantir que o status seja ativo para contas criadas pelo registration link
    });

    // Check if two-factor authentication is enabled
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        status: 'success',
        message: 'Two-factor authentication required',
        data: {
          userId: user.id,
          requireTwoFactor: true
        }
      });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Extrair nome e sobrenome do campo name se firstName/lastName não existirem
    let firstName = user.firstName;
    let lastName = user.lastName;
    
    if (!firstName && user.name) {
      const nameParts = user.name.split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.slice(1).join(' ') || '';
    }

    console.log('Dados retornados para autenticação:', {
      id: user.id,
      name: user.name,
      firstName: firstName,
      lastName: lastName,
      role: user.role
    });

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          firstName: firstName,
          lastName: lastName,
          name: user.name || `${firstName} ${lastName}`,
          email: user.email,
          role: user.role
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Verify two-factor authentication
exports.verifyTwoFactor = async (req, res) => {
  try {
    const { userId, token } = req.body;

    // Find user (PostgreSQL)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 time step drift (30 seconds before/after)
    });

    if (!verified) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid verification code'
      });
    }

    // Generate JWT token
    const jwtToken = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    res.status(200).json({
      status: 'success',
      message: 'Two-factor verification successful',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        },
        token: jwtToken,
        refreshToken
      }
    });
  } catch (error) {
    logger.error(`Two-factor verification error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error during two-factor verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_SECRET || 'newcashbank-jwt-secret-2025', async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid refresh token'
        });
      }

      // Find user (PostgreSQL)
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Generate new access token
      const newAccessToken = generateToken(user.id, user.role);
      const newRefreshToken = generateRefreshToken(user.id);

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          token: newAccessToken,
          refreshToken: newRefreshToken
        }
      });
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error refreshing token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Logout
exports.logout = async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email (PostgreSQL)
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save token to user (PostgreSQL)
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(resetTokenExpiry)
    });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'https://app.newcashbank.com'}/reset-password/${resetToken}`;

    // Send password reset email
    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste it into your browser to complete the process:\n\n
          ${resetUrl}\n\n
          This link will expire in 1 hour.\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      });

      res.status(200).json({
        status: 'success',
        message: 'Password reset link sent to email'
      });
    } catch (emailError) {
      logger.error(`Failed to send password reset email: ${emailError.message}`);
      
      // Revert token if email fails
      await user.update({
        resetPasswordToken: null,
        resetPasswordExpires: null
      });

      return res.status(500).json({
        status: 'error',
        message: 'Could not send password reset email'
      });
    }
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error processing password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Find user by reset token (PostgreSQL)
    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { [Op.gt]: new Date() } // Token not expired
      }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired password reset token'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password (PostgreSQL)
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
      passwordChangedAt: new Date()
    });

    // Send password change confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your password has been changed',
        text: `This is a confirmation that the password for your account ${user.email} has just been changed.\n`
      });
    } catch (emailError) {
      logger.error(`Failed to send password change confirmation email: ${emailError.message}`);
      // Don't fail reset if confirmation email fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful'
    });
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Change password (for logged-in users)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user (PostgreSQL)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password (PostgreSQL)
    await user.update({
      password: hashedPassword,
      passwordChangedAt: new Date()
    });

    // Send password change notification email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your password has been changed',
        text: `This is a confirmation that the password for your account ${user.email} has just been changed.\n`
      });
    } catch (emailError) {
      logger.error(`Failed to send password change notification email: ${emailError.message}`);
      // Don't fail the password change if notification email fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate two-factor authentication secret
exports.generateTwoFactorSecret = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user (PostgreSQL)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate new secret
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `NewCash Bank (${user.email})`
    });

    // Save secret to user (PostgreSQL)
    await user.update({
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false // Not enabled until user confirms
    });

    // Create QR code URL
    const otpAuthUrl = secret.otpauth_url;

    res.status(200).json({
      status: 'success',
      message: 'Two-factor secret generated',
      data: {
        secret: secret.base32,
        otpAuthUrl
      }
    });
  } catch (error) {
    logger.error(`Generate 2FA secret error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error generating two-factor secret',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Enable two-factor authentication
exports.enableTwoFactor = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    // Find user (PostgreSQL)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 time step drift (30 seconds before/after)
    });

    if (!verified) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid verification code'
      });
    }

    // Enable two-factor authentication (PostgreSQL)
    await user.update({
      twoFactorEnabled: true
    });

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Two-Factor Authentication Enabled',
        text: `Two-factor authentication has been enabled for your account. If you did not make this change, please contact our support team immediately.\n`
      });
    } catch (emailError) {
      logger.error(`Failed to send 2FA enabled notification: ${emailError.message}`);
      // Don't fail the enabling process if notification email fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication enabled'
    });
  } catch (error) {
    logger.error(`Enable 2FA error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error enabling two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Disable two-factor authentication
exports.disableTwoFactor = async (req, res) => {
  try {
    const { token, password } = req.body;
    const userId = req.user.id;

    // Find user (PostgreSQL)
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Password is incorrect'
      });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 time step drift (30 seconds before/after)
    });

    if (!verified) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid verification code'
      });
    }

    // Disable two-factor authentication (PostgreSQL)
    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null
    });

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Two-Factor Authentication Disabled',
        text: `Two-factor authentication has been disabled for your account. If you did not make this change, please contact our support team immediately.\n`
      });
    } catch (emailError) {
      logger.error(`Failed to send 2FA disabled notification: ${emailError.message}`);
      // Don't fail the disabling process if notification email fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Two-factor authentication disabled'
    });
  } catch (error) {
    logger.error(`Disable 2FA error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Error disabling two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
