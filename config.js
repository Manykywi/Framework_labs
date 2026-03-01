// config.js
// Конфігураційний файл з валідацією змінних середовища

// Завантажуємо змінні середовища з .env файлу
require('./loadEnv');

/**
 * Валідація змінних середовища
 * Якщо параметри відсутні або некоректні, процес завершується з кодом 1
 */

// Отримуємо змінні середовища
const PORT = process.env.PORT;
const HOSTNAME = process.env.HOSTNAME;
const NODE_ENV = process.env.NODE_ENV;

// Масив для накопичення помилок валідації
const errors = [];

// Валідація PORT
if (!PORT) {
  errors.push('PORT is required');
} else {
  const portNumber = parseInt(PORT, 10);
  if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
    errors.push('PORT must be a number between 1 and 65535');
  }
}

// Валідація HOSTNAME
if (!HOSTNAME) {
  errors.push('HOSTNAME is required');
} else if (typeof HOSTNAME !== 'string' || HOSTNAME.trim().length === 0) {
  errors.push('HOSTNAME must be a non-empty string');
}

// Валідація NODE_ENV
if (!NODE_ENV) {
  errors.push('NODE_ENV is required');
} else if (NODE_ENV !== 'development' && NODE_ENV !== 'production') {
  errors.push('NODE_ENV must be either "development" or "production"');
}

// Якщо є помилки валідації, виводимо їх і завершуємо процес
if (errors.length > 0) {
  console.error('❌ Configuration validation failed:');
  errors.forEach(error => console.error(`  - ${error}`));
  console.error('\n💡 Please check your .env file or environment variables.');
  console.error('📄 See .env.example for reference.');
  process.exit(1);
}

// Експортуємо валідовані змінні
module.exports = {
  PORT: parseInt(PORT, 10),
  HOSTNAME,
  NODE_ENV,
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
};
