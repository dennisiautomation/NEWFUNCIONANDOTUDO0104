/**
 * Arquivo de configuração global para o frontend do NewCash Bank System
 */

// API URLs
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
export const AUTH_API_URL = `${API_BASE_URL}/auth`;
export const USERS_API_URL = `${API_BASE_URL}/users`;
export const ACCOUNTS_API_URL = `${API_BASE_URL}/accounts`;
export const TRANSACTIONS_API_URL = `${API_BASE_URL}/transactions`;
export const STATEMENTS_API_URL = `${API_BASE_URL}/statements`;
export const ADMIN_REPORTS_API_URL = `${API_BASE_URL}/admin-reports`;

// Configurações de paginação
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];

// Configurações de formato
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';
export const CURRENCY_FORMAT = {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2
};

// Configurações de timeout
export const API_TIMEOUT = 30000; // 30 segundos

// Configurações de segurança
export const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000; // 14 minutos (em milissegundos)
export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutos (em milissegundos)

// Configurações de upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

// Configurações de relatórios
export const REPORT_TYPES = {
  TRANSACTION: 'transaction',
  ACCOUNT: 'account',
  STATEMENT: 'statement',
  ACTIVITY: 'activity'
};

// Configurações de notificação
export const TOAST_AUTO_CLOSE = 5000; // 5 segundos
export const TOAST_POSITION = 'top-right';

export default {
  API_BASE_URL,
  AUTH_API_URL,
  USERS_API_URL,
  ACCOUNTS_API_URL,
  TRANSACTIONS_API_URL,
  STATEMENTS_API_URL,
  ADMIN_REPORTS_API_URL,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  DATE_FORMAT,
  DATETIME_FORMAT,
  CURRENCY_FORMAT,
  API_TIMEOUT,
  TOKEN_REFRESH_INTERVAL,
  SESSION_TIMEOUT,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  REPORT_TYPES,
  TOAST_AUTO_CLOSE,
  TOAST_POSITION
};
