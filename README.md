Technology-Framework

Репозиторій містить лабораторні роботи з дисципліни «Фреймворк технології».

Структура проєкту

Кожна лабораторна реалізована в окремій Git-гілці:

Лабораторна	Гілка	Опис
ЛР №1	Lab_1	Базовий REST API сервер
ЛР №2	Lab_2	Конфігурація, логування, graceful shutdown
ЛР №3 (CommonJS)	Lab_3_Common	REST API з модульною структурою (CommonJS)
ЛР №3 (ESM)	Lab_3_ESM	REST API на ECMAScript Modules
ЛР №4	Lab_4	Веб-фреймворк Fastify
ЛАБОРАТОРНА РОБОТА №4
Тема

Веб-фреймворк Fastify

Мета

Ознайомлення з архітектурою Fastify та набуття практичних навичок створення веб-сервісів із використанням:

plugin system
JSON Schema
lifecycle hooks
офіційних плагінів екосистеми Fastify
Опис проєкту

Реалізовано REST API сервер для керування студентами на базі Fastify.

Основні можливості (Lab 4)
Plugin system — підключення модулів через fastify.register(...)
JSON Schema — валідація params, query, body, а також типізовані відповіді
Lifecycle hooks — приклади onRequest, onResponse, onClose
Офіційні плагіни Fastify:
@fastify/env — робота з .env та його валідація
@fastify/sensible — зручні HTTP-хелпери (наприклад reply.notFound())
@fastify/cors — налаштування CORS
@fastify/helmet — базова безпека HTTP
Graceful shutdown — коректне завершення роботи сервера через обробку SIGINT / SIGTERM і fastify.close()
Встановлення

Клонування репозиторію:

git clone https://github.com/KYNZEK/Technology-Framework.git
cd Technology-Framework

Перехід у гілку:

git checkout Lab_4

Встановлення залежностей:

npm install
Налаштування

Створіть .env (або скопіюйте з .env.example) і заповніть:

PORT=3000
HOSTNAME=localhost
NODE_ENV=development
ADMIN_API_KEY=your-secret-key

Для production додатково:

CORS_ORIGIN=https://example.com
Запуск
npm start

Сервер запускається за адресою:

http://localhost:3000
NPM скрипти
Команда	Опис
npm start	запуск сервера
npm run dev	режим розробки
npm run lint	перевірка ESLint
npm run lint:fix	автоматичне виправлення помилок
npm run format	форматування Prettier
npm run format:check	перевірка форматування
npm run check	ESLint + Prettier
API Endpoints
Health
GET /health — публічний health-check
GET /health/details — детальна перевірка (потрібен x-api-key: <ADMIN_API_KEY>)
Students
GET /students — список студентів
фільтр: ?course=2
POST /students
{
  "name": "Olena",
  "grades": [5, 4, 5],
  "course": 3
}
PATCH /students/:id — оновлення студента
DELETE /students/:id — видалення студента
Структура проєкту
/
├─ app.js
├─ package.json
├─ eslint.config.mjs
├─ README.md
├─ config/
│  └─ env.js
├─ constants/
│  └─ errorMessages.js
├─ controllers/
├─ services/
├─ routes/
├─ data/
└─ schemas/
Модульна система

Проєкт використовує ECMAScript Modules (ESM).

Приклад:

import Fastify from 'fastify';
export default studentRoutes;
Технології
Node.js (>= 20)
Fastify
@fastify/env, @fastify/sensible, @fastify/cors, @fastify/helmet
JSON Schema (AJV через Fastify)
ESLint
Prettier
