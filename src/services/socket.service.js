import { Server } from 'socket.io'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import { verifyAccessToken } from '../utils/jwt.util.js'

let io

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.PUBLIC_URL,
      methods: ['GET', 'POST']
    }
  })

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1]

      if (!token) { throw AppError.unauthorized('Authentication required') }

      const payload = verifyAccessToken(token)
      const user = await User.findById(payload._id).select('-password -refreshToken')

      if (!user || user.deleted) throw AppError.unauthorized('User not found')

      socket.user = user
      next()
    } catch (err) {
      next(new Error(err.message || 'Socket auth failed'))
    }
  })

  io.on('connection', (socket) => {
    const { user } = socket

    if (user?.company) {
      socket.join(user.company.toString())
      console.log(`🔌 [Socket] ${user.email} joined room ${user.company}`)
    } else {
      console.log(`🔌 [Socket] ${user.email} connected (no company yet)`)
    }

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket] ${user?.email} disconnected`)
    })
  })
}

export const getIO = () => {
  if (!io) { throw new Error('Socket.IO not initialised - call initSocket first') }
  return io
}

