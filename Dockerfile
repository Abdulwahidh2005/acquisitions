FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY drizzle.config.js ./
COPY drizzle ./drizzle
COPY src ./src

EXPOSE 3000

CMD ["node", "start"]
