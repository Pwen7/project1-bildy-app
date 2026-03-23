class AppError extends Error {
    constructor(message, statusCode = 500, code = null) {
        super(message)
        this.statusCode = statusCode
        this.code = code
        this.isOperational = true // errors controlled by bugs

        Error.captureStackTrace(this, this.constructor)
    }

    // Factory errors
    static badRequest(message = 'Invalid request', code = 'BAD_REQUEST') {
        return new AppError(message, 400, code)
    }

    static unauthorized(message = 'Unauthorized request', code = 'UNAUTHORIZED') {
        return new AppError(message, 401, code)
    }

    static forbidden(message = 'Forbidden request', code = 'FORBIDDEN') {
        return new AppError(message, 403, code)
    }

    static notFound(resource = 'Resource not found', code = 'NOT_FOUND') {
        return new AppError(`${resource} no encontrado`, 404, code)
    }

    static conflict(message = 'Conflict with existing resource', code = 'CONFLICT') {
        return new AppError(message, 409, code)
    }

    static validation(message = 'Validation error', details = []) {
        const error = new AppError(message, 400, 'VALIDATION_ERROR')
        error.details = details
        return error
    }

    static tooManyRequests(message = 'Too Many requests', code = 'RATE_LIMIT') {
        return new AppError(message, 429, code)
    }

    static internal(message = 'Internal Server error', code = 'INTERNAL_ERROR') {
        return new AppError(message, 500, code)
    }
}

export default AppError
