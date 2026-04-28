import AppError from "../utils/AppError.js"

// Use: router.post('/route', authMiddleware, checkRole(['admin']), handler)
const checkRole = (roles) => (req, res, next) => {
  try {
    if (!req.user) {
      throw AppError.unauthorized('Not authenticated')
    }

    if (!roles.includes(req.user.role)) {
      throw AppError.forbidden('Your role does not have permission to perform this action')
    }

    next()
  } catch (error) {
    next(error)
  }
}

export default checkRole
