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
