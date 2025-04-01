/**
 * Validates an email address format
 * @param {string} email - The email to validate
 * @returns {boolean} True if email format is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength 
 * @param {string} password - The password to validate
 * @returns {Object} Validation result with isValid flag and message
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Password is required' };
  }
  
  // Check length
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  
  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  // Check for numbers
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  
  // Check for special characters
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character' };
  }
  
  return { isValid: true, message: 'Password is strong' };
};

/**
 * Validates password strength (simplified version of validatePassword)
 * @param {string} password - The password to validate
 * @returns {boolean} True if password meets minimum requirements
 */
export const isValidPassword = (password) => {
  if (!password || password.length < 8) {
    return false;
  }
  
  // Check for uppercase letters, lowercase letters, numbers, and special characters
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
};

/**
 * Validates a phone number format
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if phone format is valid
 */
export const isValidPhone = (phone) => {
  // Aceita formatos brasileiros como (11) 98765-4321, 11987654321, etc.
  // Também aceita formatos internacionais como +55 11 98765-4321
  const phoneRegex = /^(\+?55)?[-.\s]?(?:\(?([1-9][0-9])\)?[-.\s]?)?(?:9[-.\s]?)?([0-9]{4})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone);
};

/**
 * Validates an account number format
 * @param {string} accountNumber - The account number to validate
 * @returns {boolean} True if account number format is valid
 */
export const isValidAccountNumber = (accountNumber) => {
  // This can be customized based on your system's account number format
  // For example, a 10-digit number
  const accountRegex = /^\d{10}$/;
  return accountRegex.test(accountNumber);
};

/**
 * Validates a transfer amount
 * @param {number|string} amount - The amount to validate
 * @param {number} minAmount - Minimum allowed amount
 * @param {number} maxAmount - Maximum allowed amount 
 * @param {number} balance - Current balance (optional)
 * @returns {Object} Validation result with isValid flag and message
 */
export const validateAmount = (amount, minAmount = 0.01, maxAmount = Number.MAX_SAFE_INTEGER, balance = null) => {
  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number
  if (isNaN(numAmount)) {
    return { isValid: false, message: 'Please enter a valid amount' };
  }
  
  // Check minimum amount
  if (numAmount < minAmount) {
    return { isValid: false, message: `Amount must be at least ${minAmount}` };
  }
  
  // Check maximum amount
  if (numAmount > maxAmount) {
    return { isValid: false, message: `Amount cannot exceed ${maxAmount}` };
  }
  
  // Check if amount is greater than balance (if balance is provided)
  if (balance !== null && numAmount > balance) {
    return { isValid: false, message: `Amount cannot exceed your balance of ${balance}` };
  }
  
  return { isValid: true, message: 'Amount is valid' };
};

/**
 * Validate a date is not in the past
 * @param {Date|string} date - Date to validate
 * @returns {boolean} True if date is valid and not in the past
 */
export const isDateNotInPast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  return checkDate >= today;
};

/**
 * Validate a form field is not empty
 * @param {string} value - The field value
 * @param {string} fieldName - Name of the field for error message
 * @returns {Object} Validation result with isValid flag and message
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, message: `${fieldName} is required` };
  }
  return { isValid: true, message: '' };
};

/**
 * Validates a personal ID number format (e.g., SSN, Tax ID, etc.)
 * @param {string} idNumber - The ID number to validate
 * @param {string} idType - Type of ID (SSN, Tax ID, etc.)
 * @returns {boolean} True if ID format is valid
 */
export const isValidPersonalId = (idNumber, idType = 'SSN') => {
  // Customize regex based on ID type
  let idRegex;
  
  switch (idType.toLowerCase()) {
    case 'ssn':
      // Format: 123-45-6789
      idRegex = /^\d{3}-\d{2}-\d{4}$/;
      break;
    case 'tax id':
    case 'ein':
      // Format: 12-3456789
      idRegex = /^\d{2}-\d{7}$/;
      break;
    default:
      // Generic alphanumeric ID
      idRegex = /^[a-zA-Z0-9-]{5,20}$/;
  }
  
  return idRegex.test(idNumber);
};

/**
 * Format a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format a date string
 * @param {Date|string} date - Date to format
 * @param {string} format - Output format ('short', 'medium', 'long', 'full')
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'medium', locale = 'en-US') => {
  const dateObj = new Date(date);
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: format,
  }).format(dateObj);
};

/**
 * Format a datetime string
 * @param {Date|string} datetime - Datetime to format
 * @param {string} format - Output format ('short', 'medium', 'long', 'full')
 * @param {string} locale - Locale for formatting (default: en-US)
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (datetime, format = 'medium', locale = 'en-US') => {
  const dateObj = new Date(datetime);
  
  return new Intl.DateTimeFormat(locale, {
    dateStyle: format,
    timeStyle: format,
  }).format(dateObj);
};
