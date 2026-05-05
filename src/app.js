import cors from 'cors'
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { createServer } from 'http'
import mongoose from 'mongoose'
import swaggerUi from 'swagger-ui-express'
import swaggerSpecs from './config/swagger.config.js'
import { errorHandler, notFound } from './middlewares/error.middleware.js'
import { logger } from './middlewares/logger.middleware.js'
import routes from './routes/index.js'
import { initSocket } from './services/socket.service.js'

const app = express()
export const httpServer = createServer(app)

initSocket(httpServer)

app.use(cors({ origin: process.env.PUBLIC_URL }))

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc: ["'self'", "ws://localhost:3000", "http://localhost:3000"],
      imgSrc: ["'self'", "data:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    }
  }
}))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: true, message: 'Too many requests, please try again later' }
}))

// Global middlewares
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body)
  if (req.params) req.params = mongoSanitize.sanitize(req.params)
  next()
})
app.use(logger)

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs))

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

export default app
