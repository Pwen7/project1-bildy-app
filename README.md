# Gestión de Usuarios – BildyApp

# BildyApp API

Backend completo para la gestión digital de albaranes entre clientes y proveedores.

## Stack

- **Node.js 22** + Express 5
- **MongoDB** + Mongoose
- **Socket.IO** — eventos en tiempo real
- **Swagger/OpenAPI 3.0** — documentación en `/api-docs`
- **Jest + Supertest + mongodb-memory-server** — testing
- **Docker** + GitHub Actions — CI/CD
- **Cloudinary** + **Sharp** — almacenamiento y optimización de imágenes
- **pdfkit** — generación de PDFs
- **Nodemailer** — emails de verificación
- **Slack Webhooks** — alertas de errores 5XX

## Instalación

```bash
npm install
cp .env.example .env   # edita con tus credenciales
npm run dev
```

La API arranca en `http://localhost:3000`.
Documentación Swagger en `http://localhost:3000/api-docs`.

## Docker

```bash
docker compose up
```

## Tests

```bash
npm test                # ejecutar todos los tests
npm run test:coverage   # con informe de cobertura
npm run test:watch      # modo watch
```

## Endpoints

| Recurso | Base URL |
|---------|----------|
| Usuarios | `POST /api/user/register` · `POST /api/user/login` · ... |
| Clientes | `/api/client` |
| Proyectos | `/api/project` |
| Albaranes | `/api/deliverynote` |
| Health | `GET /health` |
| Docs | `GET /api-docs` |

Ver `requests.http` para ejemplos completos de cada endpoint.

## Socket.io Test Client

A browser-based test client is available at:

```
http://localhost:3000/index.html
```

**How to use:**
1. Start the server (`npm run dev`)
2. Open the URL above in your browser
3. Get a JWT token from `POST /api/user/login` (via `/api-docs` or `requests.http`)
4. Paste the token and click **Connect**
5. Perform API actions (create clients, projects, delivery notes) in another tab to see events arrive in real time

**Events you can monitor:**

| Event | Triggered when |
|-------|---------------|
| `client:new` | A new client is created in your company |
| `project:new` | A new project is created in your company |
| `deliverynote:new` | A new delivery note is created in your company |
| `deliverynote:signed` | A delivery note is signed (PDF generated and uploaded) |

All events are scoped to your company's room — you only receive events from your own company. Use the **Simulate** buttons in the event table to preview what each event looks like without making real API calls.

---

## Variables de entorno

Ver `.env.example`.

---

## 📁 Folder structure
```
└── 📁PWEB2-bildy-app
    └── 📁.github
        └── 📁workflows
            ├── test.yml
    └── 📁public
        ├── index.html
    └── 📁src
        └── 📁config
            ├── db.config.js
            ├── swagger.config.js
        └── 📁controllers
            ├── client.controller.js
            ├── dashboard.controller.js
            ├── deliverynote.controller.js
            ├── project.controller.js
            ├── user.controller.js
        └── 📁middlewares
            ├── auth.middleware.js
            ├── error.middleware.js
            ├── logger.middleware.js
            ├── role.middleware.js
            ├── upload.middleware.js
            ├── validate.middleware.js
        └── 📁models
            ├── address.model.js
            ├── Client.js
            ├── Company.js
            ├── DeliveryNote.js
            ├── Project.js
            ├── User.js
        └── 📁routes
            ├── client.routes.js
            ├── dashboard.routes.js
            ├── deliverynote.routes.js
            ├── index.js
            ├── project.routes.js
            ├── user.routes.js
        └── 📁services
            ├── logger.service.js
            ├── mail.service.js
            ├── pdf.service.js
            ├── socket.service.js
            ├── storage.service.js
        └── 📁utils
            ├── AppError.js
            ├── jwt.util.js
            ├── password.util.js
        └── 📁validators
            └── 📁shared
                ├── fields.js
                ├── query.js
            ├── client.validator.js
            ├── company.validator.js
            ├── deliverynote.validator.js
            ├── project.validator.js
            ├── user.validator.js
        ├── app.js
        ├── index.js
    └── 📁test
        └── 📁__mocks__
            ├── mail.service.js
        ├── auth.test.js
        ├── client.test.js
        ├── dashboard.test.js
        ├── deliverynote.test.js
        ├── error.middleware.test.js
        ├── firma.jpg
        ├── logo.png
        ├── logo.test.js
        ├── pdf.service.test.js
        ├── project.test.js
        ├── setup.js
        ├── socket.service.test.js
        ├── storage.service.test.js
    ├── .env.example
    ├── .gitignore
    ├── docker-compose.yml
    ├── Dockerfile
    ├── jest.config.js
    ├── package-lock.json
    ├── package.json
    ├── README.md
    └── requests.http
```
