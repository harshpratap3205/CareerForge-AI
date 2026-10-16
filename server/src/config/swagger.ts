import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CareerForge AI Platform API',
      version: '1.0.0',
      description: 'Production Microservice & Modular Backend API for AI-Powered Career Platform',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'CONSULTANT'] },
          },
        },
        Resume: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            templateId: { type: 'string', enum: ['modern', 'ats-classic'] },
            summary: { type: 'string' },
            skills: { type: 'object' },
            experience: { type: 'array' },
            education: { type: 'array' },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            consultantId: { type: 'string' },
            date: { type: 'string' },
            timeSlot: { type: 'string' },
            status: { type: 'string', enum: ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] },
          },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.routes.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
