FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p uploads && addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
