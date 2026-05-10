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
| Лабораторна №4            | `Lab_4`        | Веб-фреймворк Fastify                        |

---

# ЛАБОРАТОРНА РОБОТА No 4

**Тема:** веб-фреймворк Fastify  
**Мета роботи:** Ознайомлення з архітектурою фреймворку Fastify та набуття практичних навичок розробки веб-сервісів з використанням plugin system, JSON Schema, life cycle hooks та екосистеми офіційних плагінів.

---

# Опис проєкту

REST API сервер для управління студентами, побудований на **Fastify**.

## Основні можливості (Lab 4)

- **Plugin system**: підключення плагінів та модулів через `fastify.register(...)`
- **JSON Schema**: валідація `params`, `querystring`, `body` та типізовані `response` у `schema`
- **Life cycle hooks**: приклади `onRequest`, `onResponse`, `onClose`
- **Офіційні плагіни Fastify**:
  - `@fastify/env` (завантаження/валідація `.env`)
  - `@fastify/sensible` (зручні HTTP-helpers, напр. `reply.notFound()`, `reply.unauthorized()`)
  - `@fastify/cors`
  - `@fastify/helmet`
- Graceful shutdown: обробка `SIGINT`/`SIGTERM` та коректне закриття сервера через `fastify.close()`

---

# Встановлення

Клонування репозиторію:

```bash
git clone https://github.com/KYNZEK/Technology-Framework.git
cd Technology-Framework
```

Перехід у гілку Lab 4:

```bash
git checkout Lab_4
```

Встановлення залежностей:

```bash
npm install
```

---

# Налаштування

Створіть файл `.env` (або скопіюйте з `.env.example`) та заповніть значення:

```
PORT=3000
HOSTNAME=localhost
NODE_ENV=development
ADMIN_API_KEY=your-secret-key

# Обовʼязково лише для production:
# CORS_ORIGIN=https://example.com
```

---

# Запуск сервера

```bash
npm start
```

Сервер буде доступний за адресою (за замовчуванням):

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

## Health

### GET `/health`

Публічний health-check.

### GET `/health/details`

Детальний health-check (потрібен заголовок `x-api-key: <ADMIN_API_KEY>`).

---

## Students

### GET `/students`

Фільтр по курсу:

```
GET /students?course=2
```

### POST `/students`

Body:

```json
{
  "name": "Olena",
  "grades": [5, 4, 5],
  "course": 3
}
```

### PATCH `/students/:id`

### DELETE `/students/:id`

---

# Структура проєкту

```
/
├─ app.js                   # Точка входу, конфіг Fastify + hooks + graceful shutdown
├─ package.json             # Інформація про проєкт та npm-скрипти
├─ eslint.config.mjs        # Конфіг ESLint
├─ README.md                # Документація
├─ config/
│  └─ env.js                # Плагін @fastify/env
├─ constants/
│  └─ errorMessages.js      # Текст помилок API
├─ controllers/
│  ├─ health.controller.js  # Обробники health endpoint-ів
│  └─ student.controller.js # Обробники student endpoint-ів
├─ services/
│  └─ student.service.js    # Бізнес-логіка студентів
├─ routes/
│  ├─ health.routes.js      # Роутер (Fastify plugin)
│  └─ student.routes.js     # Роутер (Fastify plugin)
├─ data/
│  └─ students.js           # In-memory дані (масив студентів)
└─ schemas/
   ├─ env.schema.js
   ├─ healthPublicResponse.schema.js
   ├─ healthResponse.schema.js
   ├─ student.schema.js
   ├─ studentCreateBody.schema.js
   ├─ studentCreatedResponse.schema.js
   ├─ studentParams.schema.js
   ├─ studentPatchBody.schema.js
   ├─ studentQuery.schema.js
   ├─ studentRemovedResponse.schema.js
   ├─ studentsListResponse.schema.js
   └─ studentUpdatedResponse.schema.js
```

---

# Модульна система

Проєкт використовує **ECMAScript Modules (ESM)**.

Приклад імпорту:

```javascript
import Fastify from 'fastify';
```

Приклад експорту:

```javascript
export default studentRoutes;
```

---

# Технології

- Node.js (>= 20)
- Fastify
- `@fastify/env`, `@fastify/sensible`, `@fastify/cors`, `@fastify/helmet`
- JSON Schema / AJV (через Fastify)
- ESLint
- Prettier
