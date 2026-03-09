import express from 'express'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middlewares/error.middleware.js'
import { logger } from './middlewares/logger.js'

const app = express()

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
