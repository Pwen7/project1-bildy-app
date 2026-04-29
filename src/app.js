import express from 'express'
import { createServer } from 'http'
import swaggerUi from 'swagger-ui-express'
import swaggerSpecs from './config/swagger.config.js'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middlewares/error.middleware.js'
import { logger } from './middlewares/logger.middleware.js'
import { initSocket } from './services/socket.service.js'
import mongoose from 'mongoose'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const app = express()
const httpServer = createServer(app)

initSocket(httpServer)

// Seguridad
app.use(helmet())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 100,
  message: { error: true, message: 'Too many requests, please try again later' }
}))

// Middleware globales
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(logger)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs))

// Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  })
})

// API routes
app.use('/api', routes)

// Manejo de errores
app.use(notFound)
app.use(errorHandler)

export default httpServer
