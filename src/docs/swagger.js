const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Cambridge Backend API",
    version: "1.0.0",
    description: "Authentication, profile and notification APIs",
  },
  servers: [{ url: "http://localhost:5000" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["firstName", "lastName", "phoneNumber", "email", "password"],
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          phoneNumber: { type: "string" },
          referralCode: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      EmailOtpRequest: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      ForgotPasswordResetRequest: {
        type: "object",
        required: ["email", "otp", "newPassword"],
        properties: {
          email: { type: "string", format: "email" },
          otp: { type: "string" },
          newPassword: { type: "string", format: "password" },
        },
      },
      UpdateProfileRequest: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          phoneNumber: { type: "string" },
        },
      },
      NotificationRequest: {
        type: "object",
        properties: {
          emailNotification: { type: "boolean" },
          smsNotification: { type: "boolean" },
        },
      },
    },
  },
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Start registration and get OTP",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: { 200: { description: "OTP generated" } },
      },
    },
    "/api/auth/register/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend registration OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: { 200: { description: "OTP resent" } },
      },
    },
    "/api/auth/register/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify registration OTP and create account",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/EmailOtpRequest" } } },
        },
        responses: { 201: { description: "Account created" } },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: { 200: { description: "Login successful" } },
      },
    },
    "/api/auth/forgot-password/request-otp": {
      post: {
        tags: ["Auth"],
        summary: "Request forgot-password OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: { 200: { description: "OTP sent" } },
      },
    },
    "/api/auth/forgot-password/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend forgot-password OTP",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email"],
                properties: { email: { type: "string", format: "email" } },
              },
            },
          },
        },
        responses: { 200: { description: "OTP resent" } },
      },
    },
    "/api/auth/forgot-password/reset": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP and reset password",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordResetRequest" } },
          },
        },
        responses: { 200: { description: "Password reset" } },
      },
    },
    "/api/users/profile": {
      get: {
        tags: ["Users"],
        summary: "Get user profile",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Profile fetched" } },
      },
      patch: {
        tags: ["Users"],
        summary: "Update user profile",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateProfileRequest" } } },
        },
        responses: { 200: { description: "Profile updated" } },
      },
    },
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get notification preferences",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Notification settings fetched" } },
      },
      patch: {
        tags: ["Notifications"],
        summary: "Update notification preferences",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/NotificationRequest" } } },
        },
        responses: { 200: { description: "Notification settings updated" } },
      },
    },
  },
};

module.exports = swaggerDocument;
