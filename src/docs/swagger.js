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
      PropertyContacts: {
        type: "object",
        properties: {
          phone: { type: "string" },
          whatsapp: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      PropertyCreateRequest: {
        type: "object",
        required: ["title", "description", "location"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          location: { type: "string" },
          initialDepositAllowed: { type: "boolean" },
          amenities: {
            type: "array",
            items: { type: "string" },
            description: "For multipart/form-data, send as JSON string",
          },
          contacts: {
            $ref: "#/components/schemas/PropertyContacts",
            description: "For multipart/form-data, send as JSON string",
          },
          soldPlots: { type: "number", description: "Auto-computed from unit statuses" },
          reservedPlots: { type: "number", description: "Auto-computed from unit statuses" },
          availablePlots: { type: "number", description: "Auto-computed from unit statuses" },
          numberOfInvestors: { type: "number" },
          completionRate: { type: "number" },
          totalInvestment: { type: "number" },
          images: {
            type: "array",
            items: { type: "string", format: "binary" },
          },
          documents: {
            type: "array",
            items: { type: "string", format: "binary" },
          },
          propertyVideoTour: { type: "string", format: "binary" },
          propertyLayoutImage: { type: "string", format: "binary" },
        },
      },
      PropertyUpdateRequest: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          location: { type: "string" },
          initialDepositAllowed: { type: "boolean" },
          amenities: { type: "array", items: { type: "string" } },
          contacts: { $ref: "#/components/schemas/PropertyContacts" },
          numberOfInvestors: { type: "number" },
          completionRate: { type: "number" },
          totalInvestment: { type: "number" },
        },
      },
      PropertyUnitItemRequest: {
        type: "object",
        required: ["name", "price", "landmass"],
        properties: {
          name: { type: "string" },
          price: { type: "number" },
          landmass: { type: "number" },
          status: { type: "string", enum: ["available", "reserved", "sold"] },
          investButtonLabel: { type: "string" },
        },
      },
      PropertyUnitsCreateRequest: {
        type: "object",
        required: ["units"],
        properties: {
          units: {
            type: "array",
            items: { $ref: "#/components/schemas/PropertyUnitItemRequest" },
          },
        },
      },
      PropertyUnitUpdateRequest: {
        type: "object",
        properties: {
          name: { type: "string" },
          price: { type: "number" },
          landmass: { type: "number" },
          status: { type: "string", enum: ["available", "reserved", "sold"] },
          investButtonLabel: { type: "string" },
        },
      },
      PropertyUnitStatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["available", "reserved", "sold"] },
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
    "/api/properties": {
      get: {
        tags: ["Properties"],
        summary: "List properties (supports pagination and search)",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Properties fetched successfully" } },
      },
      post: {
        tags: ["Properties"],
        summary: "Create property listing with media uploads",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": { schema: { $ref: "#/components/schemas/PropertyCreateRequest" } },
          },
        },
        responses: { 201: { description: "Property created successfully" } },
      },
    },
    "/api/properties/{propertyId}": {
      get: {
        tags: ["Properties"],
        summary: "Get property details including units and grouped unit lists",
        parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Property fetched successfully" } },
      },
      patch: {
        tags: ["Properties"],
        summary: "Update property metadata",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PropertyUpdateRequest" } } },
        },
        responses: { 200: { description: "Property updated successfully" } },
      },
      delete: {
        tags: ["Properties"],
        summary: "Delete property and all associated units",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Property and associated units deleted successfully" } },
      },
    },
    "/api/properties/{propertyId}/units": {
      post: {
        tags: ["Property Units"],
        summary: "Create units for a property",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "propertyId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/PropertyUnitsCreateRequest" } },
          },
        },
        responses: { 201: { description: "Property units created successfully" } },
      },
    },
    "/api/properties/{propertyId}/units/{unitId}": {
      patch: {
        tags: ["Property Units"],
        summary: "Update a property unit",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "propertyId", in: "path", required: true, schema: { type: "string" } },
          { name: "unitId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/PropertyUnitUpdateRequest" } },
          },
        },
        responses: { 200: { description: "Unit updated successfully" } },
      },
      delete: {
        tags: ["Property Units"],
        summary: "Delete a property unit",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "propertyId", in: "path", required: true, schema: { type: "string" } },
          { name: "unitId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { 200: { description: "Unit deleted successfully" } },
      },
    },
    "/api/properties/{propertyId}/units/{unitId}/status": {
      patch: {
        tags: ["Property Units"],
        summary: "Update only unit status",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "propertyId", in: "path", required: true, schema: { type: "string" } },
          { name: "unitId", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PropertyUnitStatusUpdateRequest" },
            },
          },
        },
        responses: { 200: { description: "Unit status updated successfully" } },
      },
    },
  },
};

module.exports = swaggerDocument;
