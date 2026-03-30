import express from 'express'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middlewares/error.middleware.js'
import { logger } from './middlewares/logger.middleware.js'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const app = express()

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

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'))

// API routes
app.use('/api', routes)

// Manejo de errores
app.use(notFound)
app.use(errorHandler)

export default app
