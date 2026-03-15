# Technology-Framework

Репозиторій для лабораторних робіт з курсу **"Фреймворк технології"**.

---

# Структура репозиторію

Кожна лабораторна робота знаходиться у **відповідній Git-гілці**.

| Лабораторна               | Гілка          | Опис                                         |
| ------------------------- | -------------- | -------------------------------------------- |
| Лабораторна №1            | `Lab_1`        | Базовий REST API сервер                      |
| Лабораторна №2            | `Lab_2`        | Конфігурація, логування та graceful shutdown |
| Лабораторна №3 (CommonJS) | `Lab_3_Common` | REST API з модульною структурою (CommonJS)   |
| Лабораторна №3 (ESM)      | `Lab_3_ESM`    | REST API з використанням ECMAScript Modules  |

---

# Лабораторна робота №3 (CommonJS)

## Опис

REST API сервер для управління студентами, побудований на HTTP сервері Node.js.

У цій версії проєкту використовується **CommonJS модульна система**:

- `require()`
- `module.exports`

Проєкт має модульну архітектуру та поділений на:

- controllers
- services
- routes
- data
- validators
- constants
- utils

---

# Основні можливості

- REST API для управління студентами
- Валідація даних через **AJV**
- Конфігурація через `.env`
- Логування HTTP запитів
- Health check endpoint
- ESLint + Prettier
- npm scripts для перевірки коду

---

# Встановлення

Клонування репозиторію:

```bash
git clone https://github.com/KYNZEK/Technology-Framework.git
cd Technology-Framework
```

Перехід у гілку CommonJS:

```bash
git checkout Lab_3_Common
```

Встановлення залежностей:

```bash
npm install
```

---

# Налаштування

Створіть файл `.env`:

```
PORT=3000
HOSTNAME=localhost
NODE_ENV=development
```

Приклад налаштувань знаходиться у файлі:

```
.env.example
```

---

# Запуск сервера

Запуск:

```bash
npm start
```

або

```bash
node app.js
```

Сервер буде доступний за адресою:

```
http://localhost:3000
```

---

# NPM Scripts

| Команда                | Опис                           |
| ---------------------- | ------------------------------ |
| `npm start`            | запуск сервера                 |
| `npm run dev`          | запуск у режимі розробки       |
| `npm run lint`         | перевірка ESLint               |
| `npm run lint:fix`     | автоматичне виправлення ESLint |
| `npm run format`       | форматування коду Prettier     |
| `npm run format:check` | перевірка форматування         |
| `npm run check`        | ESLint + Prettier              |

---

# API Endpoints

## Health Check

### GET `/health`

Повертає інформацію про стан сервера.

Приклад відповіді:

```json
{
  "pid": 12345,
  "nodeVersion": "v20.0.0",
  "platform": "win32",
  "uptime": 120
}
```

---

# Студенти API

## Отримати всіх студентів

```
GET /students
```

Фільтр по курсу:

```
GET /students?course=2
```

---

## Отримати студента

```
GET /students/:id
```

---

## Створити студента

```
POST /students
```

Body:

```json
{
  "name": "Olena",
  "grades": [5, 4, 5],
  "course": 3
}
```

---

## Оновити студента

```
PUT /students/:id
```

---

## Видалити студента

```
DELETE /students/:id
```

---

# Логування

Формат логування:

```
key="value"
```

Приклад логів:

```
time="2026-03-01T17:22:20.377Z" level="INFO" method="GET" url="/students" status="200"
```

---

# Структура проєкту

```
Lab_3_Common/
├─ app.js                 # Точка входу, створює HTTP сервер
├─ package.json           # Інформація про проєкт та npm-скрипти
├─ eslint.config.mjs      # Конфіг ESLint
├─ README.md              # Документація
├─ config/
│  └─ config.js           # Завантаження та валідація конфігурації
├─ constants/
│  └─ httpStatus.js       # HTTP статуси
├─ controllers/
│  └─ student.controller.js # Обробники HTTP-запитів
├─ services/
│  └─ student.service.js  # Бізнес-логіка для студентів
├─ routes/
│  └─ student.routes.js   # Маршрутизація
├─ data/
│  └─ students.js         # In-memory дані (масив студентів)
├─ utils/
│  └─ logger.js           # Логування
└─ validators/
   ├─ config.schema.js
   ├─ studentBody.schema.js
   ├─ studentParams.schema.js
   └─ studentQuery.schema.js
```

---

# Модульна система

У цій версії використовується **CommonJS**.

Приклад імпорту:

```javascript
const studentService = require('../services/student.service');
```

Приклад експорту:

```javascript
module.exports = {
  getStudents,
};
```

---

# Технології

- Node.js
- CommonJS
- AJV
- ESLint
- Prettier

---
