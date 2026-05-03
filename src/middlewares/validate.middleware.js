// Use: router.post('/route', validate(mySchema), handler)
//      router.get('/route', validate(querySchema, 'query'), handler)
//      router.get('/route/:id', validate(paramsSchema, 'params'), handler)
const validate = (schema, target = 'body') => (req, res, next) => {
  try {
    const result = schema.safeParse(req[target])

    if (!result.success) {
      throw result.error
    }

    if (target === 'body') {
      req.body = result.data
    } else {
      Object.assign(req[target], result.data)
    }
    next()
  } catch (error) {
    next(error)
  }
}

export default validate
