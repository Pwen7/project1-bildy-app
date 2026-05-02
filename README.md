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

## Variables de entorno

Ver `.env.example`.

---

## 📁 Folder structure
```
└── 📁project1-bildy-app
    └── 📁.github
        └── 📁workflow
            ├── test.yml
    └── 📁src
        └── 📁config
            ├── db.config.js
            ├── swagger.config.js
        └── 📁controllers
            ├── client.controller.js
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
        ├── deliverynote.test.js
        ├── firma.jpg
        ├── logo.png
        ├── project.test.js
        ├── request.http
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
    └── README.md
```
