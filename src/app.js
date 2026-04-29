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
export const httpServer = createServer(app)

initSocket(httpServer)

// Security
app.use(helmet())
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: true, message: 'Too many requests, please try again later' }
}))

// Global middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
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
