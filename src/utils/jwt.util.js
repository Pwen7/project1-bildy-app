import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'

export const generateAccessToken = (user) => {
    const secret = process.env.JWT_SECRET
    const expiresIn = process.env.JWT_EXPIRES_IN || '2h'
    return jwt.sign({
        _id: user._id,
        role: user.role
    },
        secret,
        { expiresIn }
    )
}

export const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex')
}

// export const getTokenExpiration = () => {
//     const date = new Date()
//     const days = parseInt(JWT_REFRESH_EXPIRES_IN, 10) || 7

//     date.setDate(date.getDate() + days)
//     return date
// }

export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET)
}
