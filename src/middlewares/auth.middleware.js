import AppError from '../utils/AppError.js'
import { verifyAccessToken } from '../utils/jwt.util.js'
import User from '../models/User.js'

/* Extracts token Bearer from the Authorization header, verifies it,
and appends the full user to req.user for the following handlers */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(AppError.unauthorized('No token provided'))
        }

        const token = authHeader.split(' ')[1]
        let payload

        try {
            payload = verifyAccessToken(token)
        } catch {
            return next(AppError.unauthorized('Invalid or expired token'))
        }

        const user = await User.findById(payload._id).select('-password -refreshToken')

        if (!user || user.deleted) {
            return next(AppError.unauthorized('User not found'))
        }

        req.user = user
        next()
    } catch (error) {
        next(error)
    }
}

export default authMiddleware
