// loadEnv.js
// Простий завантажувач змінних середовища з .env файлу
// Без використання сторонніх бібліотек

const fs = require('fs');
const path = require('path');

/**
 * Завантажує змінні середовища з .env файлу
 */
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  
  // Перевіряємо, чи існує .env файл
  if (!fs.existsSync(envPath)) {
    console.warn('⚠️  .env file not found. Using system environment variables only.');
    return;
  }
  
  try {
    // Читаємо файл
    const envContent = fs.readFileSync(envPath, 'utf-8');
    
    // Парсимо кожен рядок
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      // Пропускаємо порожні рядки та коментарі
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Парсимо KEY=VALUE
      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }
      
      const key = trimmedLine.substring(0, separatorIndex).trim();
      const value = trimmedLine.substring(separatorIndex + 1).trim();
      
      // Встановлюємо змінну середовища, якщо вона ще не встановлена
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.error(`❌ Error loading .env file: ${error.message}`);
    process.exit(1);
  }
}

// Завантажуємо змінні при імпорті модуля
loadEnv();
