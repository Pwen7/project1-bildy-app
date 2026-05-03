import mongoose from "mongoose"

const dbConnect = async () => {
  const DB_URI = process.env.DB_URI

  if (!DB_URI) {
    console.error('❌ DB_URI no definida en .env')
    process.exit(1)
  }

  try {
    await mongoose.connect(DB_URI)
    console.log('✅ Conectado a MongoDB')
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message)
    process.exit(1)
  }
}

// Connection events
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Desconectado de MongoDB')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Error en MongoDB:', err.message)
})

export default dbConnect
