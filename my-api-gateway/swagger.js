const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Microservices API Gateway",
      version: "1.0.0",
      description: "API Gateway for Book and User Services",
      contact: {
        name: "Febry Damatraseta Fairuz",
      },
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Books",
        description: "Book management endpoints",
      },
      {
        name: "Users",
        description: "User management and authentication",
      },
      {
        name: "Health",
        description: "Health check endpoints",
      },
    ],
    components: {
      schemas: {
        Book: {
          type: "object",
          required: ["title", "author", "isbn"],
          properties: {
            id: {
              type: "integer",
              description: "Book ID",
              example: 1,
            },
            title: {
              type: "string",
              description: "Book title",
              example: "The Great Gatsby",
            },
            author: {
              type: "string",
              description: "Book author",
              example: "F. Scott Fitzgerald",
            },
            isbn: {
              type: "string",
              description: "ISBN number",
              example: "978-0-7432-7356-5",
            },
            publishedYear: {
              type: "integer",
              description: "Publication year",
              example: 1925,
            },
          },
        },
        User: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            id: {
              type: "string",
              description: "User ID",
              example: "507f1f77bcf86cd799439011",
            },
            username: {
              type: "string",
              description: "Username",
              example: "johndoe",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              description: "User password",
              example: "password123",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              description: "User role",
              example: "user",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              example: "password123",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            token: {
              type: "string",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            count: {
              type: "integer",
              example: 5,
            },
            data: {
              type: "array",
              items: {
                type: "object",
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            message: {
              type: "string",
              example: "Error message",
            },
          },
        },
      },
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
      },
    },
  },
  apis: ["./swagger-docs.js"],
};

module.exports = swaggerJsdoc(options);
