# syntax=docker/dockerfile:1
# Imagen del frontend para EKS (Sprint 4) o para probar el build de producción en local.
# Vite incrusta las variables VITE_ en el build: se pasan como --build-arg, no en tiempo de ejecución.
#   docker build --build-arg VITE_API_BASE_URL=http://localhost:8000/api/v1 -t spa-frontend-web .
#   docker run -p 8080:8080 spa-frontend-web      → http://localhost:8080
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ARG VITE_API_MOCK=false
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_API_MOCK=$VITE_API_MOCK
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
