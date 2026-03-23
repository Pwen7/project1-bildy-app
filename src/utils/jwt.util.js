import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export const generateAccessToken = (user) => {
    return jwt.sign(
        {
            _id: user._id,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    )
}

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex')
}

export const getTokenExpiration = () => {
    const date = new Date()
    date.setDate(date.getDate() + JWT_REFRESH_EXPIRES_IN)
    return date
}

export const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (error) {
        // console.error(`Verification token error ${error}`)
        return null
    }
}
