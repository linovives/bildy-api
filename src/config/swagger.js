import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BildyApp API',
      version: '1.0.0',
      description: 'API REST para la gestión de albaranes entre clientes y proveedores'
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            number: { type: 'string' },
            postal: { type: 'string' },
            city: { type: 'string' },
            province: { type: 'string' }
          }
        },
        Client: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            cif: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { $ref: '#/components/schemas/Address' },
            deleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            projectCode: { type: 'string' },
            client: { type: 'string' },
            email: { type: 'string' },
            address: { $ref: '#/components/schemas/Address' },
            notes: { type: 'string' },
            active: { type: 'boolean' },
            deleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        DeliveryNote: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            project: { type: 'string' },
            client: { type: 'string' },
            format: { type: 'string', enum: ['material', 'hours'] },
            description: { type: 'string' },
            workDate: { type: 'string', format: 'date-time' },
            material: { type: 'string' },
            quantity: { type: 'number' },
            unit: { type: 'string' },
            hours: { type: 'number' },
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
            signed: { type: 'boolean' },
            signedAt: { type: 'string', format: 'date-time' },
            signatureUrl: { type: 'string' },
            pdfUrl: { type: 'string' },
            deleted: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js']
};

export const swaggerSpec = swaggerJsdoc(options);
