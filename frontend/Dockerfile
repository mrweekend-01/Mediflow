# ── Etapa 1: Build de React ───────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# URL base de la API — en Docker se sirve via nginx en /api
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Etapa 2: Servir con Nginx ─────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
