// logger.js
// Модуль для логування у форматі варіант 2
// Формат: key="value" key="value" ...

const config = require('./config');

/**
 * Форматує дані у вигляді key="value" через пробіл
 * @param {Object} data - об'єкт з даними для логування
 * @returns {string} - відформатований рядок
 */
function formatLog(data) {
  const parts = [];
  
  // Додаємо час у форматі ISO
  parts.push(`time="${new Date().toISOString()}"`);
  
  // Додаємо всі інші поля
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      // Екрануємо лапки у значенні
      const escapedValue = String(value).replace(/"/g, '\\"');
      parts.push(`${key}="${escapedValue}"`);
    }
  }
  
  return parts.join(' ');
}

/**
 * Логує повідомлення
 * @param {string} level - рівень логу (INFO, ERROR, WARN)
 * @param {Object} data - дані для логування
 */
function log(level, data) {
  const logData = { level, ...data };
  const formatted = formatLog(logData);
  
  if (level === 'ERROR') {
    console.error(formatted);
  } else {
    console.log(formatted);
  }
}

/**
 * Логує HTTP запит
 * @param {Object} req - об'єкт запиту
 * @param {number} statusCode - код статусу відповіді
 * @param {string} message - додаткове повідомлення (опціонально)
 */
function logRequest(req, statusCode, message = '') {
  const method = req.method;
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  
  // Визначаємо чи це помилка
  const isError = statusCode >= 400;
  
  // У development логуємо все, у production - тільки помилки
  if (config.isDevelopment || isError) {
    const level = isError ? 'ERROR' : 'INFO';
    const data = {
      method,
      path,
      status: statusCode,
    };
    
    if (message) {
      data.message = message;
    }
    
    log(level, data);
  }
}

/**
 * Логує інформаційне повідомлення
 */
function logInfo(message, additionalData = {}) {
  log('INFO', { message, ...additionalData });
}

/**
 * Логує помилку
 */
function logError(message, additionalData = {}) {
  log('ERROR', { message, ...additionalData });
}

/**
 * Логує попередження
 */
function logWarn(message, additionalData = {}) {
  log('WARN', { message, ...additionalData });
}

module.exports = {
  logRequest,
  logInfo,
  logError,
  logWarn,
  log,
};
