import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CareerForge AI Platform API',
      version: '1.0.0',
      description:
        'Production RESTful & SSE API documentation for the CareerForge AI platform. Covers JWT authentication with silent rotation, AI resume generation, advisory streaming, Redis token-bucket rate limiting, Stripe checkout, Google Calendar sync, and Nodemailer notifications.',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide your JWT accessToken in the header: Authorization: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'CONSULTANT'] },
            phone: { type: 'string' },
            profile: {
              type: 'object',
              properties: {
                bio: { type: 'string' },
                headline: { type: 'string' },
                avatarUrl: { type: 'string' },
              },
            },
          },
        },
        Resume: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            templateId: { type: 'string', enum: ['modern', 'ats-classic'] },
            tiptapHtml: { type: 'string' },
            tiptapContent: { type: 'object' },
            personalInfo: {
              type: 'object',
              properties: {
                fullName: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' },
                location: { type: 'string' },
                linkedin: { type: 'string' },
                github: { type: 'string' },
              },
            },
            summary: { type: 'string' },
            experience: { type: 'array', items: { type: 'object' } },
            education: { type: 'array', items: { type: 'object' } },
            skills: {
              type: 'object',
              properties: {
                technical: { type: 'array', items: { type: 'string' } },
                tools: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            candidateId: { type: 'string' },
            consultantId: { type: 'string' },
            candidateName: { type: 'string' },
            candidateEmail: { type: 'string' },
            date: { type: 'string' },
            timeSlot: { type: 'string' },
            agenda: { type: 'string' },
            priceAmount: { type: 'number' },
            currency: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
            },
            calendarEventId: { type: 'string' },
            calendarLink: { type: 'string' },
          },
        },
        ChatSession: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        ChatMessage: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            sessionId: { type: 'string' },
            role: { type: 'string', enum: ['user', 'model'] },
            content: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        StandardResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Platform health status check',
          responses: {
            200: {
              description: 'System healthy',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/StandardResponse' } } },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register a new candidate or consultant',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    password: { type: 'string' },
                    role: { type: 'string', enum: ['USER', 'CONSULTANT'] },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Registration successful' },
            400: { description: 'Validation error' },
            409: { description: 'Email already exists' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login with credential verification and token generation',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful with accessToken and HttpOnly refreshToken' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          tags: ['Authentication'],
          summary: 'Rotate refresh token and issue new access token',
          responses: {
            200: { description: 'Token refreshed' },
            401: { description: 'Refresh token missing or invalid' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout and revoke refresh token',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Logged out successfully' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Authentication'],
          summary: 'Get authenticated user identity',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Current user profile data' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/users/profile': {
        get: {
          tags: ['Users'],
          summary: 'Get user profile details',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'User profile fetched successfully' },
          },
        },
        put: {
          tags: ['Users'],
          summary: 'Update candidate profile information',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    profile: {
                      type: 'object',
                      properties: {
                        headline: { type: 'string' },
                        bio: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Profile updated successfully' },
          },
        },
      },
      '/api/resumes': {
        get: {
          tags: ['Resumes'],
          summary: 'List resumes owned by the authenticated user',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'List of resumes' },
          },
        },
        post: {
          tags: ['Resumes'],
          summary: 'Create a new resume with template assignment',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    templateId: { type: 'string', enum: ['modern', 'ats-classic'] },
                    personalInfo: { type: 'object' },
                    summary: { type: 'string' },
                    experience: { type: 'array', items: { type: 'object' } },
                    education: { type: 'array', items: { type: 'object' } },
                    skills: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Resume created successfully' },
          },
        },
      },
      '/api/resumes/{id}': {
        get: {
          tags: ['Resumes'],
          summary: 'Get single resume by ID',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Resume details' },
            404: { description: 'Resume not found' },
          },
        },
        put: {
          tags: ['Resumes'],
          summary: 'Update resume content and TipTap document state',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    templateId: { type: 'string', enum: ['modern', 'ats-classic'] },
                    tiptapHtml: { type: 'string' },
                    tiptapContent: { type: 'object' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Resume updated' },
          },
        },
        delete: {
          tags: ['Resumes'],
          summary: 'Delete resume by ID',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Resume deleted' },
          },
        },
      },
      '/api/resumes/{id}/duplicate': {
        post: {
          tags: ['Resumes'],
          summary: 'Duplicate an existing resume',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            201: { description: 'Resume duplicated' },
          },
        },
      },
      '/api/resumes/generate-ai': {
        post: {
          tags: ['Resumes'],
          summary: 'Generate AI resume content or bullet points',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['role', 'experience'],
                  properties: {
                    role: { type: 'string' },
                    experience: { type: 'string' },
                    skills: { type: 'string' },
                    model: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'AI generated content' },
          },
        },
      },
      '/api/chat/sessions': {
        get: {
          tags: ['Chat Advisory'],
          summary: 'List user chat advisory sessions',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Sessions list' },
          },
        },
        post: {
          tags: ['Chat Advisory'],
          summary: 'Create a new advisory session thread',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Chat session created' },
          },
        },
      },
      '/api/chat/sessions/{id}': {
        get: {
          tags: ['Chat Advisory'],
          summary: 'Get chat session with historical messages',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Session with message history' },
          },
        },
        patch: {
          tags: ['Chat Advisory'],
          summary: 'Rename chat thread',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { title: { type: 'string' } } } } },
          },
          responses: {
            200: { description: 'Session renamed' },
          },
        },
        delete: {
          tags: ['Chat Advisory'],
          summary: 'Delete advisory chat session',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Session deleted' },
          },
        },
      },
      '/api/chat/sessions/{id}/messages': {
        post: {
          tags: ['Chat Advisory'],
          summary: 'Post message and receive complete AI response (JSON)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string' },
                    model: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Message sent and reply returned' },
          },
        },
      },
      '/api/chat/sessions/{id}/stream': {
        post: {
          tags: ['Chat Advisory'],
          summary: 'Post message and receive streaming SSE response',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string' },
                    model: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Server-Sent Events streaming chunks',
              content: { 'text/event-stream': {} },
            },
          },
        },
      },
      '/api/consultations/consultants': {
        get: {
          tags: ['Consultations'],
          summary: 'List available career consultants',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'List of consultants' },
          },
        },
      },
      '/api/consultations/availability': {
        get: {
          tags: ['Consultations'],
          summary: 'Get consultant time slot availability for a given date',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'consultantId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'date', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Available slot list' },
          },
        },
      },
      '/api/consultations/book': {
        post: {
          tags: ['Consultations'],
          summary: 'Create booking and initialize Stripe checkout session',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['consultantId', 'date', 'timeSlot', 'candidateName', 'candidateEmail'],
                  properties: {
                    consultantId: { type: 'string' },
                    date: { type: 'string' },
                    timeSlot: { type: 'string' },
                    candidateName: { type: 'string' },
                    candidateEmail: { type: 'string' },
                    candidatePhone: { type: 'string' },
                    agenda: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Booking created with Stripe checkout URL' },
          },
        },
      },
      '/api/consultations': {
        get: {
          tags: ['Consultations'],
          summary: 'List bookings for authenticated candidate or consultant',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'List of consultations' },
          },
        },
      },
      '/api/consultations/{id}': {
        get: {
          tags: ['Consultations'],
          summary: 'Get single booking by ID',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Booking details' },
          },
        },
      },
      '/api/consultations/{id}/cancel': {
        patch: {
          tags: ['Consultations'],
          summary: 'Cancel consultation booking and delete Calendar event',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Booking cancelled' },
          },
        },
      },
      '/api/consultations/webhook': {
        post: {
          tags: ['Consultations'],
          summary: 'Stripe Webhook handler for checkout.session.completed',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { type: 'object' } },
            },
          },
          responses: {
            200: { description: 'Webhook processed' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
