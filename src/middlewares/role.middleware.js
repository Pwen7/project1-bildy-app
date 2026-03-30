import AppError from "../utils/AppError.js"

// Use: router.post('/route', authMiddleware, checkRole(['admin']), handler)
const checkRole = (roles) => (req, res, next) => {
    if (!req.user) {
        return next(AppError.unauthorized('Not authenticated'))
    }

    if (!roles.includes(req.user.role)) {
        return next(AppError.forbidden('Your role does not have permission to perform this action'))
    }

    next()
}

export default checkRole
