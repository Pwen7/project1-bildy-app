// Use: router.post('/route', validate(mySchema), handler)
const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      throw result.error
    }

    req.body = result.data
    next()
  } catch (error) {
    next(error)
  }
}

export default validate
