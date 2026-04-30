import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BildyApp API',
      version: '1.0.0',
      description: 'REST API for deliverynote management - BildyApp'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Development' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      responses: {
        BadRequest: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: true, message: 'Invalid request data' }
            }
          }
        },
        ValidationError: {
          description: 'Validation failed — field-level errors returned',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
              example: {
                error: true,
                message: 'Zod validation error',
                details: [
                  { field: 'email', message: 'Invalid email format' },
                  { field: 'password', message: 'String must contain at least 8 character(s)' }
                ]
              }
            }
          }
        },
        Unauthorized: {
          description: 'Missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: true, message: 'Token not provided or invalid' }
            }
          }
        },
        Forbidden: {
          description: 'Not enough permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: true, message: 'Access denied' }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: true, message: 'Resource not found' }
            }
          }
        },
        Conflict: {
          description: 'Resource already exists',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: true, message: 'The record already exists' }
            }
          }
        },
        TooManyRequests: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: true, message: 'Too many attempts. Try again later.' }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: { error: true, message: 'Internal server error' }
            }
          }
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Mensaje de error' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Zod validation error' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid email format' }
                }
              }
            }
          }
        },
        Address: {
          type: 'object',
          properties: {
            street: { type: 'string', example: 'Calle Mayor' },
            number: { type: 'string', example: '42' },
            postal: { type: 'string', example: '28001' },
            city: { type: 'string', example: 'Madrid' },
            province: { type: 'string', example: 'Madrid' }
          }
        },
        CreateClient: {
          type: 'object',
          required: ['name', 'cif'],
          properties: {
            name: { type: 'string', example: 'Construcciones Garcia SA' },
            cif: { type: 'string', example: 'B12345678' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string', example: '+34600000001' },
            address: { $ref: '#/components/schemas/Address' }
          }
        },
        CreateProject: {
          type: 'object',
          required: ['name', 'projectCode', 'client'],
          properties: {
            name: { type: 'string', example: 'Reforma Oficinas 2025' },
            projectCode: { type: 'string', example: 'PRJ-001' },
            client: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            address: { $ref: '#/components/schemas/Address' },
            email: { type: 'string', format: 'email' },
            notes: { type: 'string' },
            active: { type: 'boolean', default: true }
          }
        },
        CreateDeliveryNote: {
          type: 'object',
          required: ['project', 'client', 'format', 'workDate'],
          properties: {
            project: { type: 'string', example: '65f8b3a2c9d1e20012345678' },
            client: { type: 'string', example: '65f8b3a2c9d1e20012345679' },
            format: { type: 'string', enum: ['material', 'hours'] },
            description: { type: 'string' },
            workDate: { type: 'string', format: 'date', example: '2025-06-15' },
            material: { type: 'string', example: 'Cemento Portland' },
            quantity: { type: 'number', example: 50 },
            unit: { type: 'string', example: 'kg' },
            hours: { type: 'number', example: 8 },
            workers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  hours: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
}

export default swaggerJsdoc(options)
