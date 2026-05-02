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
        },
        Pagination: {
          type: 'object',
          properties: {
            totalItems: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
            currentPage: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 }
          }
        },
        Company: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345670' },
            name: { type: 'string', example: 'Construcciones Bildy SL' },
            cif: { type: 'string', example: 'B87654321' },
            address: { $ref: '#/components/schemas/Address' },
            logo: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/logo.webp' },
            isFreelance: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345671' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            name: { type: 'string', example: 'Ana' },
            lastName: { type: 'string', example: 'García' },
            nif: { type: 'string', example: '12345678A' },
            role: { type: 'string', enum: ['admin', 'guest'], example: 'admin' },
            status: { type: 'string', enum: ['pending', 'verified'], example: 'verified' },
            company: { $ref: '#/components/schemas/Company' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Client: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345672' },
            name: { type: 'string', example: 'Construcciones Garcia SA' },
            cif: { type: 'string', example: 'B12345678' },
            email: { type: 'string', format: 'email', example: 'client@example.com' },
            phone: { type: 'string', example: '+34600000001' },
            address: { $ref: '#/components/schemas/Address' },
            company: { type: 'string', example: '65f8b3a2c9d1e20012345670' },
            deleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345673' },
            name: { type: 'string', example: 'Reforma Oficinas 2025' },
            projectCode: { type: 'string', example: 'PRJ-001' },
            client: { $ref: '#/components/schemas/Client' },
            address: { $ref: '#/components/schemas/Address' },
            email: { type: 'string', format: 'email' },
            notes: { type: 'string' },
            active: { type: 'boolean', example: true },
            deleted: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        DeliveryNote: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '65f8b3a2c9d1e20012345674' },
            user: { $ref: '#/components/schemas/User' },
            client: { $ref: '#/components/schemas/Client' },
            project: { $ref: '#/components/schemas/Project' },
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
            },
            signed: { type: 'boolean', example: false },
            signedAt: { type: 'string', format: 'date-time' },
            signatureUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/image/upload/sig.webp' },
            pdfUrl: { type: 'string', example: 'https://res.cloudinary.com/demo/raw/upload/note.pdf' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
}

export default swaggerJsdoc(options)
