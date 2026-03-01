// Імпортуємо функцію createServer з вбудованого модуля Node.js для створення HTTP-сервера
const { createServer } = require("node:http");
// Імпортуємо конфігурацію (з валідацією змінних середовища)
const config = require('./config');
// Імпортуємо logger для логування запитів
const { logRequest, logInfo, logError } = require('./logger');

// База даних студентів у пам'яті (зберігається тільки під час роботи програми)
let STUDENTS = [
  { id: 1, name: "Ivan", grades: [5, 4, 5], course: 2 },
];

// Час запуску сервера (для uptime)
const startTime = Date.now();

// Створюємо HTTP-сервер, який обробляє всі вхідні запити
const server = createServer((req, res) => {
  // Отримуємо HTTP-метод запиту (GET, POST, PATCH, DELETE)
  const method = req.method;
  // Парсимо URL запиту для отримання шляху та параметрів
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  // Отримуємо тільки шлях без параметрів (наприклад, "/students")
  const pathname = parsedUrl.pathname;

  // Встановлюємо заголовок відповіді: повертаємо JSON з UTF-8 кодуванням
  // Встановлюємо заголовок відповіді: повертаємо JSON з UTF-8 кодуванням
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // ===== GET /health: перевірка стану сервера =====
  if (method === "GET" && pathname === "/health") {
    const healthData = {
      pid: process.pid,
      nodeVersion: process.version,
      platform: process.platform,
      uptime: Math.floor((Date.now() - startTime) / 1000), // в секундах
      memoryUsage: process.memoryUsage(),
    };
    
    res.statusCode = 200;
    const response = JSON.stringify(healthData);
    logRequest(req, res.statusCode);
    return res.end(response);
  }

  // ===== GET: отримати список студентів (з можливістю фільтрації по курсу) =====
  if (method === "GET" && pathname === "/students") {
    // Отримуємо параметр "course" з URL (наприклад, /students?course=2)
    const course = parsedUrl.searchParams.get("course");

    // Створюємо копію масиву STUDENTS, щоб не змінювати оригінал
    let results = [...STUDENTS];

    // Якщо передано параметр course, фільтруємо студентів за курсом
    if (course) {
      results = results.filter(
        (s) => String(s.course) === String(course)
      );
    }

    // Повертаємо успішну відповідь (200 OK) з кількістю та списком студентів
    res.statusCode = 200;
    const response = JSON.stringify({ count: results.length, items: results });
    logRequest(req, res.statusCode);
    return res.end(response);
  }

  // ===== POST: додати нового студента =====
  if (method === "POST" && pathname === "/students") {
    // Змінна для накопичення даних з body запиту
    let body = "";

    // Подія "data" викликається кожен раз, коли приходить частина даних
    // Накопичуємо всі частини в змінну body
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    // Подія "end" викликається, коли всі дані отримано
    req.on("end", () => {
      try {
        // Парсимо JSON з body запиту
        const data = JSON.parse(body);

        // Валідація: перевіряємо наявність обов'язкових полів
        if (!data.name || !data.course || !Array.isArray(data.grades)) {
          res.statusCode = 400; // 400 Bad Request - невалідні дані
          const response = JSON.stringify({
            error: "name, course і grades (масив) обов'язкові",
          });
          logRequest(req, res.statusCode, "Validation failed");
          return res.end(response);
        }

        // Генеруємо новий ID: беремо ID останнього студента + 1
        const lastId =
          STUDENTS.length > 0 ? STUDENTS[STUDENTS.length - 1].id : 0;

        // Створюємо об'єкт нового студента
        const newStudent = {
          id: lastId + 1,
          name: data.name,
          course: data.course,
          grades: data.grades,
        };

        // Додаємо студента в масив
        STUDENTS.push(newStudent);

        // Повертаємо успішну відповідь (201 Created)
        res.statusCode = 201;
        const response = JSON.stringify({ message: "Created", student: newStudent });
        logRequest(req, res.statusCode);
        res.end(response);
      } catch {
        // Якщо JSON невалідний, повертаємо помилку
        res.statusCode = 400;
        const response = JSON.stringify({ error: "Invalid JSON" });
        logRequest(req, res.statusCode, "Invalid JSON");
        res.end(response);
      }
    });
    return;
  }

  // ===== PATCH: оновити дані студента (часткове оновлення) =====
  if (method === "PATCH" && pathname.startsWith("/students/")) {
    // Витягуємо ID студента з URL (наприклад, /students/1 -> id = 1)
    const id = parseInt(pathname.split("/")[2]);

    // Змінна для накопичення даних з body запиту
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));

    // Коли всі дані отримано
    req.on("end", () => {
      // Шукаємо індекс студента в масиві за ID
      const index = STUDENTS.findIndex((s) => s.id === id);

      // Якщо студента з таким ID не знайдено
      if (index === -1) {
        res.statusCode = 404; // 404 Not Found
        const response = JSON.stringify({ error: "Student not found" });
        logRequest(req, res.statusCode, "Student not found");
        return res.end(response);
      }

      try {
        // Парсимо JSON з оновленими даними
        const updates = JSON.parse(body);

        // Захист: не дозволяємо змінювати ID студента
        if ("id" in updates) {
          res.statusCode = 400;
          const response = JSON.stringify({ error: "Cannot change id" });
          logRequest(req, res.statusCode, "Cannot change id");
          return res.end(response);
        }

        // Оновлюємо студента: зберігаємо старі дані та перезаписуємо тільки нові поля
        STUDENTS[index] = { ...STUDENTS[index], ...updates };

        // Повертаємо успішну відповідь з оновленим студентом
        res.statusCode = 200;
        const response = JSON.stringify({ message: "Updated", student: STUDENTS[index] });
        logRequest(req, res.statusCode);
        res.end(response);
      } catch {
        // Якщо JSON невалідний
        res.statusCode = 400;
        const response = JSON.stringify({ error: "Invalid JSON" });
        logRequest(req, res.statusCode, "Invalid JSON");
        res.end(response);
      }
    });
    return;
  }

  // ===== DELETE: видалити студента =====
  if (method === "DELETE" && pathname.startsWith("/students/")) {
    // Витягуємо ID студента з URL
    const id = parseInt(pathname.split("/")[2]);

    // Запам'ятовуємо початкову довжину масиву
    const originalLength = STUDENTS.length;
    // Фільтруємо масив: залишаємо всіх студентів крім того, що має вказаний ID
    STUDENTS = STUDENTS.filter((s) => s.id !== id);

    // Якщо довжина масиву зменшилась, значить студента знайдено і видалено
    if (STUDENTS.length < originalLength) {
      res.statusCode = 200;
      const response = JSON.stringify({ message: "Student removed" });
      logRequest(req, res.statusCode);
      return res.end(response);
    }

    // Якщо довжина не змінилась, значить студента з таким ID не було
    res.statusCode = 404;
    const response = JSON.stringify({ error: "Student not found" });
    logRequest(req, res.statusCode, "Student not found");
    return res.end(response);
  }

  // Якщо жоден маршрут не підійшов, повертаємо помилку 404
  res.statusCode = 404;
  const response = JSON.stringify({ error: "Route not found" });
  logRequest(req, res.statusCode, "Route not found");
  res.end(response);
});

// Функція для graceful shutdown
function gracefulShutdown(signal) {
  logInfo(`${signal} received. Starting graceful shutdown...`);
  
  // Таймаут для примусового завершення (10 секунд)
  const forceShutdownTimeout = setTimeout(() => {
    logError('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
  
  // Закриваємо HTTP сервер
  server.close((err) => {
    clearTimeout(forceShutdownTimeout);
    
    if (err) {
      logError('Error during shutdown', { error: err.message });
      process.exit(1);
    }
    
    logInfo('Server closed successfully');
    process.exit(0);
  });
}

// Обробка сигналів SIGINT (Ctrl+C) та SIGTERM
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Глобальні обробники помилок
process.on('uncaughtException', (err) => {
  logError('Uncaught Exception', { error: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', { reason: String(reason), promise: String(promise) });
  gracefulShutdown('unhandledRejection');
});

// Запускаємо сервер на вказаному хості та порту
server.listen(config.PORT, config.HOSTNAME, () => {
  logInfo(`Server running at http://${config.HOSTNAME}:${config.PORT}/`, { 
    nodeEnv: config.NODE_ENV,
    pid: process.pid,
  });
});