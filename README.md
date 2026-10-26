# Spa de Uñas Frontend – React + Vite + Tailwind CSS

Este proyecto corresponde al frontend del sistema de inventario de un spa de uñas, desarrollado con React, Vite y Tailwind CSS, con el objetivo de construir una interfaz moderna, rápida y mantenible para la consulta y actualización del inventario de productos, materiales e insumos.

## 🛠️ Tecnologías utilizadas

* React – Librería para construir interfaces de usuario
* Vite – Herramienta de desarrollo y build rápido
* Tailwind CSS – Framework de estilos utility-first
* JavaScript (ES6+)
* PostCSS
* React Router – Navegación entre páginas
* Axios – Cliente HTTP para consumir el API del backend
* Vitest + Testing Library – Pruebas de componentes

## 🚀 Instalación y ejecución

### 1️⃣ Clonar el repositorio

```
git clone https://github.com/Proyecto-Maestria-Spa-Unas/spa-frontend-web.git
cd spa-frontend-web
git checkout develop
```

### 2️⃣ Instalar dependencias

```
npm install
```

### 3️⃣ Configurar variables de entorno

```
cp .env.example .env
```

En Windows (PowerShell):

```
Copy-Item .env.example .env
```

`.env.example` ya trae dos variables:

| Variable | Valor por defecto | Uso |
|---|---|---|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8000/api/v1` | API local (`docker compose` de spa-backend-api) o la de staging |
| `VITE_API_MOCK` | `true` | Trabaja **sin backend** con datos simulados |

### 🧪 Modo simulado (sin backend)

Con `VITE_API_MOCK=true`, el cliente responde desde `src/mocks/` con la misma forma del contrato, incluidos los errores (`STOCK_INSUFICIENTE`, `VERSION_CONFLICTO`, `SIN_PERMISO`...). Usuarios de prueba, todos con contraseña `spa12345`:

| Correo | Rol |
|---|---|
| `admin@spa.co` | Administrador (todos los permisos) |
| `manicurista@spa.co` | Manicurista (consulta y salidas) |
| `gerente@spa.co` | Gerente (consulta y analítica) |

Cuando el endpoint real esté en staging, cambie a `VITE_API_MOCK=false` y verifique la misma pantalla contra la API.

⚠️ El archivo `.env` no debe subirse al repositorio (ya está incluido en el `.gitignore`). Solo las variables que empiezan con `VITE_` quedan disponibles en el navegador; nunca coloque secretos en ellas.

### 4️⃣ Ejecutar en modo desarrollo

```
npm run dev
```

La aplicación estará disponible en:

```
http://localhost:5173
```

## 📜 Scripts disponibles

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run build` | Build de producción en la carpeta `dist` |
| `npm run preview` | Sirve localmente el build de producción |
| `npm run lint` | Revisión de código con ESLint |
| `npm test` | Pruebas en modo observación |
| `npm run test:ci` | Pruebas con cobertura (lo que ejecuta la integración continua) |

## 🎨 Estilos

Los estilos del proyecto se manejan principalmente con Tailwind CSS, utilizando clases utilitarias directamente en los componentes React.

Esto permite:

* Desarrollo rápido
* Menor cantidad de CSS personalizado
* Consistencia visual
* Fácil mantenimiento

Tailwind se integra mediante PostCSS (`postcss.config.js`) y se importa en `src/index.css`. Los colores de marca y de los 4 estados del inventario son **tokens** en `src/design-system/tokens.css` (`bg-marca-primario`, `text-estado-agotado-texto`...). Ningún componente usa colores hexadecimales sueltos.

## 📁 Organización del proyecto y patrones

El código se organiza por capas y responsabilidades, con patrones que facilitan la reutilización y el mantenimiento.

### Estructura principal

Una carpeta de funcionalidad por pantalla y un cliente HTTP por servicio del backend. Cada carpeta de `features/` tiene un `README.md` con su alcance, sus endpoints y su responsable.

| Carpeta | Uso | Responsable |
|---|---|---|
| `src/api/cliente.js` | Axios con `VITE_API_BASE_URL`, Bearer y errores problem+json → `ErrorApi` con `code` | Plataforma |
| `src/api/identidad.js`, `catalogo.js`, `movimientos.js`, `analitica.js` | Una función por endpoint del contrato (37 en total) | Se cambian solo con un PR de contrato |
| `src/mocks/` | Simulador del backend con datos de ejemplo | Quien construye la pantalla agrega casos |
| `src/features/auth/` | Login, recuperación de contraseña, sesión (`useAuth`), `RutaProtegida` por permiso | Estefa44445 |
| `src/features/usuarios/` | Gestión de usuarios (HU-09) | Estefa44445 |
| `src/features/inventario/` | Categorías, tabla, filtros, detalle y formulario de producto | Gleidy725 |
| `src/features/movimientos/` | Entrada, salida, historial y anulación | Gleidy725 |
| `src/features/tablero/` | Alertas, indicadores, kardex, mapa de proveedores y exportación | Estefa44445 |
| `src/features/proveedores/` | Proveedores georreferenciados (full-stack) | Gleidy725 |
| `src/design-system/` | Tokens de marca y componentes base | Gleidy725 (tokens) y Estefa44445 (componentes) |
| `src/layout/` | Marco con menú filtrado por permisos | Plataforma |
| `src/constants/routes.js` | Rutas y permiso de cada opción del menú | Plataforma |

## 🧪 Pruebas y calidad

Los mismos comandos que ejecuta la integración continua:

```
npm run lint
npm run test:ci
npm run build
```

Las pruebas se ubican junto al archivo que prueban con el sufijo `.test.jsx` o `.test.js`. Se ejecutan siempre en modo simulado; `src/api/api.test.js` recorre los 37 endpoints.

## 🐳 Docker

```
docker build --build-arg VITE_API_BASE_URL=http://localhost:8000/api/v1 -t spa-frontend-web .
docker run -p 8080:8080 spa-frontend-web
```

Sirve el build de producción con nginx sin privilegios en http://localhost:8080. Es la imagen que se usará en EKS (Sprint 4). Para desarrollar, use `npm run dev`.

## ☁️ Despliegue

El despliegue se realiza en Vercel, conectado a este repositorio:

* `main` → producción.
* Cada Pull Request → Preview Deployment con URL propia.
* Variable requerida en Vercel: `VITE_API_BASE_URL` (Production y Preview). `VITE_API_MOCK` no se define en Vercel.

## 🔀 Flujo de trabajo

1. Crear la rama desde `develop`: `git checkout -b feature/HU-03-consultar-inventario`.
2. Hacer commits con Conventional Commits y firma: `git commit -s -m "feat(inventario): tabla de existencias (HU-03)"`.
3. Abrir un Pull Request hacia `develop` y completar la plantilla (Definición de terminado).
4. El PR solo se puede fusionar cuando pasan los checks `politica / pr`, `calidad / pipeline`, `seguridad / scan` (y `qa-gate / qa` cuando QA esté activo) y lo aprueba un integrante del equipo responsable.
