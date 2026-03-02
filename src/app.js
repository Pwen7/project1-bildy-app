import express from 'express'
import dbConnect from './config/db.js'
import routes from './routes/index.js'
import { errorHandler, notFound } from './middlewares/error.middleware.js'
import { logger } from './middlewares/logger.js'

const app = express()

// Middleware globales
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(logger)


// API routes
app.use('/api', routes)


// Manejo de errores
app.use(notFound)
app.use(errorHandler)


// Iniciar servidor
const PORT = process.env.PORT || 3000

const startServer = async () => {
    try {
        await dbConnect()
        app.listen(PORT, () => {
            console.log(`🚀 Servidor en http://localhost:${PORT}`)
            console.log(`📚 API en http://localhost:${PORT}/api`)
        })
    } catch (error) {
        console.error('❌ Error al iniciar:', error)
        process.exit(1)
    }
}

startServer()
