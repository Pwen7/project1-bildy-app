// Use: router.post('/route', validate(mySchema), handler)
const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
        // ZodError -> error.middleware.js/errorHandler
        return next(result.error)
    }

    req.body = result.data
    next()
}

export default validate
