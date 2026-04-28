import mongoose from "mongoose"
import { notifySlack } from '../services/logger.service.js'

// Rutas no encontradas
export const notFound = (req, res) => {
  res.status(404).json({
    error: true,
    message: `Path notFound ${req.method} ${req.originalUrl}`
  })
}

// Errores globales
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message)

  // Error de validación de Mongoose
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({
      error: true,
      message: 'Mongoose validation error',
      details: messages
    })
  }

  // Error de Cast (ID inválido)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      error: true,
      message: `Invalid value for'${err.path}'`
    })
  }

  // Error de duplicado
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return res.status(409).json({
      error: true,
      message: `The record already exists '${field}'`
    })
  }

  // Error de Multer - tamaño
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: true,
      message: 'The file exceeds the maximum size (5MB)'
    })
  }

  // Error de Multer - cantidad
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: true,
      message: 'The maximum file number was exceeded'
    })
  }

  // Error de Zod
  if (err.name === 'ZodError') {
    const errors = err.issues.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }))
    return res.status(400).json({
      error: true,
      message: 'Zod validation error',
      details: errors
    })
  }

  // AppError
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: true,
      message: err.message
    })
  }

  // Error notificar a Slack
  const statusCode = err.status || 500
  if (statusCode >= 500) {
    await notifySlack(err, req)
  }

  res.status(statusCode).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
}
