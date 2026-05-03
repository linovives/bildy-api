# BildyApp API

Backend completo para la gestión de albaranes digitales. API REST con Node.js y Express que permite gestionar clientes, proyectos y albaranes (partes de horas o materiales) con firma digital, generación de PDF y subida a la nube.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933)
![Express](https://img.shields.io/badge/Express-5-000000)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248)
![Jest](https://img.shields.io/badge/Tests-Jest%20%2B%20Supertest-C21325)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

## Tech Stack

| Categoría | Tecnología |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Base de datos | MongoDB + Mongoose |
| Validación | Zod |
| Autenticación | JWT + bcryptjs |
| Subida de archivos | Multer + Cloudinary |
| Imágenes | Sharp |
| Generación de PDF | pdfkit |
| Email | Nodemailer + Mailtrap |
| Documentación | Swagger / OpenAPI 3.0 |
| Testing | Jest + Supertest + mongodb-memory-server |
| Notificaciones | Slack Incoming Webhooks (errores 5XX) |
| Seguridad | Helmet + rate limiting + mongo-sanitize |
| Contenedores | Docker + Docker Compose |
| CI/CD | GitHub Actions |

## Instalación y ejecución

1. Clona el repositorio e instala dependencias:

        git clone https://github.com/LinoVives16/bildy-api.git
        cd bildy-api
        npm install

2. Crea el fichero de variables de entorno:

        cp .env.example .env

   Rellena las variables en `.env` (ver sección Variables de entorno).

3. Arranca el servidor:

        npm run dev    # desarrollo (auto-restart)

## Ejecución con Docker

Levanta la aplicación junto con MongoDB con un solo comando:

        docker compose up --build

La API quedará disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (por defecto 3000) |
| `NODE_ENV` | Entorno (`development` / `test` / `production`) |
| `MONGO_URL` | URI de conexión a MongoDB |
| `JWT_SECRET` | Clave secreta para firmar JWT |
| `JWT_EXPIRES_IN` | Duración del access token (ej. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Duración del refresh token (ej. `7d`) |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `SLACK_WEBHOOK` | URL del Incoming Webhook de Slack |
| `MAIL_HOST` | Host SMTP (ej. `sandbox.smtp.mailtrap.io`) |
| `MAIL_PORT` | Puerto SMTP (ej. `2525`) |
| `MAIL_USER` | Usuario SMTP |
| `MAIL_PASS` | Contraseña SMTP |

## Ejecutar los tests

        npm test              # ejecuta todos los tests
        npm run test:watch    # modo watch
        npm run test:coverage # con reporte de cobertura

Los tests usan `mongodb-memory-server` (base de datos en memoria) y no requieren conexión a MongoDB ni a servicios externos.

Cobertura actual: **~87% statements / ~88% lines** (113+ tests).

## Documentación Swagger

Con el servidor arrancado, accede a la UI interactiva en:

        http://localhost:3000/api-docs

## Health check

        GET /health

Devuelve el estado del servidor, la conexión a MongoDB y el uptime del proceso.

## API Endpoints

### Usuarios

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/user/register` | Registrar usuario (envía código por email) | — |
| PUT | `/api/user/validation` | Validar email con código de 6 dígitos | JWT |
| POST | `/api/user/login` | Login — devuelve access + refresh token | — |
| PUT | `/api/user/register` | Actualizar datos personales | JWT |
| PATCH | `/api/user/company` | Crear o unirse a una compañía | JWT |
| PATCH | `/api/user/logo` | Subir logo de la compañía | JWT |
| GET | `/api/user` | Obtener perfil del usuario autenticado | JWT |
| PUT | `/api/user/password` | Cambiar contraseña | JWT |
| POST | `/api/user/refresh` | Renovar access token | — |
| POST | `/api/user/logout` | Cerrar sesión | JWT |
| DELETE | `/api/user` | Eliminar usuario (`?soft=true` para archivar) | JWT |
| POST | `/api/user/invite` | Invitar usuario a la compañía (admin) | JWT |

### Clientes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/client` | Crear cliente | JWT |
| PUT | `/api/client/:id` | Actualizar cliente | JWT |
| GET | `/api/client` | Listar clientes (`?page`, `?limit`, `?name`, `?sort`) | JWT |
| GET | `/api/client/:id` | Obtener cliente por ID | JWT |
| DELETE | `/api/client/:id` | Eliminar (`?soft=true` para archivar) | JWT |
| GET | `/api/client/archived` | Listar clientes archivados | JWT |
| PATCH | `/api/client/:id/restore` | Restaurar cliente archivado | JWT |

### Proyectos

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/project` | Crear proyecto | JWT |
| PUT | `/api/project/:id` | Actualizar proyecto | JWT |
| GET | `/api/project` | Listar proyectos (`?page`, `?limit`, `?client`, `?name`, `?active`, `?sort`) | JWT |
| GET | `/api/project/:id` | Obtener proyecto por ID | JWT |
| DELETE | `/api/project/:id` | Eliminar (`?soft=true` para archivar) | JWT |
| GET | `/api/project/archived` | Listar proyectos archivados | JWT |
| PATCH | `/api/project/:id/restore` | Restaurar proyecto archivado | JWT |

### Albaranes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/deliverynote` | Crear albarán (horas o material) | JWT |
| GET | `/api/deliverynote` | Listar albaranes (`?page`, `?limit`, `?project`, `?client`, `?format`, `?signed`, `?from`, `?to`, `?sort`) | JWT |
| GET | `/api/deliverynote/:id` | Obtener albarán con datos populados | JWT |
| GET | `/api/deliverynote/pdf/:id` | Descargar albarán en PDF | JWT |
| PATCH | `/api/deliverynote/:id/sign` | Firmar albarán (sube firma a Cloudinary y genera PDF) | JWT |
| DELETE | `/api/deliverynote/:id` | Eliminar albarán (solo si no está firmado) | JWT |

## Pruebas con api.http

El fichero `api.http` incluye ejemplos de todos los endpoints con variables que capturan tokens automáticamente.

1. Ejecuta `Register` — el código de verificación llega al email configurado.
2. Pega el código en `Validation`.
3. Ejecuta `Login` — actualiza `{{login_token}}` y `{{refresh_token}}` automáticamente.
4. El resto de peticiones usan los tokens guardados sin copiar manualmente.
