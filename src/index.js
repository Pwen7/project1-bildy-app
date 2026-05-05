import 'dotenv/config'
import mongoose from 'mongoose'
import { httpServer } from './app.js'
import dbConnect from './config/db.config.js'
import { getIO } from './services/socket.service.js'

const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await dbConnect()
    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor en http://localhost:${PORT}`)
      console.log(`- API en http://localhost:${PORT}/api`)
      console.log(`- Docs en http://localhost:${PORT}/api-docs`)
      console.log(`- Socket en http://localhost:${PORT}/index.html`)
    })
  } catch (error) {
    console.error('❌ Error al iniciar:', error)
    process.exit(1)
  }
}

const shutdown = async (signal) => {
  console.log(`\n🛑 ${signal} recibido. Cerrando servidor...`)
  try {
    await new Promise((resolve) => httpServer.close(resolve))
    console.log('✅ Servidor HTTP cerrado')

    getIO().close()
    console.log('✅ Socket.IO cerrado')

    await mongoose.connection.close()
    console.log('✅ Conexión a MongoDB cerrada')

    process.exit(0)
  } catch (err) {
    console.error('❌ Error durante el shutdown:', err)
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

startServer()
