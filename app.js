// Імпортуємо функцію createServer з вбудованого модуля Node.js для створення HTTP-сервера
const { createServer } = require("node:http");

// База даних студентів у пам'яті (зберігається тільки під час роботи програми)
let STUDENTS = [
  { id: 1, name: "Ivan", grades: [5, 4, 5], course: 2 },
];

// Налаштування сервера: читаємо з .env файлу або використовуємо значення за замовчуванням
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || "localhost";

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
    return res.end(JSON.stringify({ count: results.length, items: results }));
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
          return res.end(
            JSON.stringify({
              error: "name, course і grades (масив) обов'язкові",
            })
          );
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
        res.end(JSON.stringify({ message: "Created", student: newStudent }));
      } catch {
        // Якщо JSON невалідний, повертаємо помилку
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
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
        return res.end(JSON.stringify({ error: "Student not found" }));
      }

      try {
        // Парсимо JSON з оновленими даними
        const updates = JSON.parse(body);

        // Захист: не дозволяємо змінювати ID студента
        if ("id" in updates) {
          res.statusCode = 400;
          return res.end(JSON.stringify({ error: "Cannot change id" }));
        }

        // Оновлюємо студента: зберігаємо старі дані та перезаписуємо тільки нові поля
        STUDENTS[index] = { ...STUDENTS[index], ...updates };

        // Повертаємо успішну відповідь з оновленим студентом
        res.statusCode = 200;
        res.end(
          JSON.stringify({ message: "Updated", student: STUDENTS[index] })
        );
      } catch {
        // Якщо JSON невалідний
        res.statusCode = 400;
        res.end(JSON.stringify({ error: "Invalid JSON" }));
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
      return res.end(JSON.stringify({ message: "Student removed" }));
    }

    // Якщо довжина не змінилась, значить студента з таким ID не було
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: "Student not found" }));
  }

  // Якщо жоден маршрут не підійшов, повертаємо помилку 404
  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Route not found" }));
});

// Запускаємо сервер на вказаному хості та порту
server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
});