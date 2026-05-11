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
      PropertyUnitPeriodicPayment: {
        type: "object",
        properties: {
          installmentAmount: { type: "number", description: "Amount per period for this interval" },
        },
      },
      PropertyUnitFinancing: {
        type: "object",
        description:
          "Installment terms for this plot. Required fields on the unit for each paymentInterval you allow (except outright).",
        properties: {
          initialDepositAmount: { type: "number" },
          interestRatePercent: { type: "number", description: "Annual or agreed % — business-defined" },
          termMonths: { type: "number", example: 24 },
          installmentTotalPayable: {
            type: "number",
            description: "Total payable on installment path (optional reference total)",
          },
          periodicPayments: {
            type: "object",
            properties: {
              daily: { $ref: "#/components/schemas/PropertyUnitPeriodicPayment" },
              weekly: { $ref: "#/components/schemas/PropertyUnitPeriodicPayment" },
              monthly: { $ref: "#/components/schemas/PropertyUnitPeriodicPayment" },
            },
          },
        },
      },
      PropertyUnitItemRequest: {
        type: "object",
        required: ["name", "landmass"],
        description:
          "Send outrightAmount (preferred) or legacy price for the full outright amount. financing configures installment options.",
        properties: {
          name: { type: "string", example: "Plot A-12" },
          outrightAmount: { type: "number", example: 2031174 },
          price: { type: "number", description: "Legacy alias for outrightAmount" },
          landmass: { type: "number", description: "Plot size (e.g. sqm)", example: 450 },
          financing: { $ref: "#/components/schemas/PropertyUnitFinancing" },
          status: { type: "string", enum: ["available", "reserved", "sold"] },
          investButtonLabel: { type: "string" },
        },
        example: {
          name: "Plot A-12",
          outrightAmount: 2031174,
          landmass: 450,
          financing: {
            initialDepositAmount: 200000,
            interestRatePercent: 12,
            termMonths: 24,
            installmentTotalPayable: 4149484,
            periodicPayments: {
              daily: { installmentAmount: 3204 },
              weekly: { installmentAmount: 22248 },
              monthly: { installmentAmount: 97457 },
            },
          },
          status: "available",
          investButtonLabel: "Invest now",
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
        description:
          "Partial update. Same fields as create (outrightAmount or legacy price, landmass, financing). financing merges into the existing object by field; JSON body may set financing to null to clear installment config.",
        properties: {
          name: { type: "string" },
          price: { type: "number" },
          outrightAmount: { type: "number" },
          landmass: { type: "number" },
          financing: {
            $ref: "#/components/schemas/PropertyUnitFinancing",
            description: "Merged patch; send the key financing with JSON null to clear",
          },
          status: { type: "string", enum: ["available", "reserved", "sold"] },
          investButtonLabel: { type: "string" },
        },
        example: {
          outrightAmount: 2100000,
          landmass: 460,
          financing: {
            initialDepositAmount: 220000,
            interestRatePercent: 12,
            termMonths: 24,
            installmentTotalPayable: 4200000,
            periodicPayments: {
              monthly: { installmentAmount: 99000 },
            },
          },
        },
      },
      InvestmentCreateRequest: {
        type: "object",
        required: ["propertyId", "propertyUnitId", "paymentInterval"],
        properties: {
          propertyId: { type: "string", example: "674a1b2c3d4e5f6789012345" },
          propertyUnitId: { type: "string", example: "674a1b2c3d4e5f6789012346" },
          paymentInterval: {
            type: "string",
            enum: ["outright", "daily", "weekly", "monthly"],
            example: "monthly",
          },
          note: { type: "string", example: "Prefer reminders on Fridays." },
        },
        example: {
          propertyId: "674a1b2c3d4e5f6789012345",
          propertyUnitId: "674a1b2c3d4e5f6789012346",
          paymentInterval: "monthly",
          note: "Prefer reminders on Fridays.",
        },
      },
      AdminCreateRequest: {
        type: "object",
        required: ["firstName", "lastName", "phoneNumber", "email", "password"],
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          phoneNumber: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      AdminUpdateRequest: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          phoneNumber: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", format: "password" },
        },
      },
      AdminChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", format: "password" },
          newPassword: { type: "string", format: "password" },
        },
      },
      AdminNotificationItem: {
        type: "object",
        properties: {
          _id: { type: "string" },
          adminId: { type: "string" },
          type: {
            type: "string",
            enum: ["user_registered", "password_reset_requested", "investment_created"],
          },
          title: { type: "string" },
          message: { type: "string" },
          metadata: {
            type: "object",
            properties: {
              userId: { type: "string", nullable: true },
              propertyId: { type: "string", nullable: true },
              propertyUnitId: { type: "string", nullable: true },
              investmentId: { type: "string", nullable: true },
              email: { type: "string", nullable: true },
            },
          },
          isRead: { type: "boolean" },
          readAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
        summary: "Request forgot-password OTP (user/admin account)",
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
        summary: "Resend forgot-password OTP (user/admin account)",
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
        summary: "Verify OTP and reset password (user/admin account)",
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
        summary: "Update a property unit (pricing, plot size, financing, status)",
        description:
          "Supports outrightAmount/price (kept in sync), landmass, merged financing (initial deposit, interest %, term, periodic daily/weekly/monthly amounts), and other unit fields. Omit fields you do not change.",
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
    "/api/admins": {
      get: {
        tags: ["Admins"],
        summary: "List admins",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { 200: { description: "Admins fetched successfully" } },
      },
    },
    "/api/admins/register": {
      post: {
        tags: ["Admins"],
        summary: "Initiate admin registration and send OTP",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AdminCreateRequest" } } },
        },
        responses: { 200: { description: "Admin registration initiated" } },
      },
    },
    "/api/admins/register/resend-otp": {
      post: {
        tags: ["Admins"],
        summary: "Resend admin registration OTP",
        security: [{ bearerAuth: [] }],
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
        responses: { 200: { description: "Admin registration OTP resent" } },
      },
    },
    "/api/admins/register/verify-otp": {
      post: {
        tags: ["Admins"],
        summary: "Verify OTP and create admin account",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/EmailOtpRequest" } } },
        },
        responses: { 201: { description: "Admin account verified and created" } },
      },
    },
    "/api/admins/users": {
      get: {
        tags: ["Admins"],
        summary: "List all users (admin utility)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Users fetched successfully" } },
      },
    },
    "/api/admins/notifications": {
      get: {
        tags: ["Admins"],
        summary: "List notifications for logged-in admin",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          {
            name: "unreadOnly",
            in: "query",
            schema: { type: "boolean", default: false },
            description: "Set true to fetch only unread notifications",
          },
        ],
        responses: { 200: { description: "Admin notifications fetched successfully" } },
      },
    },
    "/api/admins/notifications/read-all": {
      patch: {
        tags: ["Admins"],
        summary: "Mark all notifications as read for logged-in admin",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "All notifications marked as read" } },
      },
    },
    "/api/admins/notifications/{notificationId}/read": {
      patch: {
        tags: ["Admins"],
        summary: "Mark one notification as read",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "notificationId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Notification marked as read" } },
      },
    },
    "/api/admins/me/password": {
      patch: {
        tags: ["Admins"],
        summary: "Change current admin password",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AdminChangePasswordRequest" } },
          },
        },
        responses: { 200: { description: "Admin password changed successfully" } },
      },
    },
    "/api/admins/{adminId}": {
      get: {
        tags: ["Admins"],
        summary: "Get admin by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Admin fetched successfully" } },
      },
      patch: {
        tags: ["Admins"],
        summary: "Update admin info",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AdminUpdateRequest" } } },
        },
        responses: { 200: { description: "Admin updated successfully" } },
      },
      delete: {
        tags: ["Admins"],
        summary: "Delete admin",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Admin deleted successfully" } },
      },
    },
    "/api/investments": {
      get: {
        tags: ["Investments"],
        summary: "List all investments (admin view)",
        description: "Returns all confirmed/cancelled investments, newest first.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { 200: { description: "Investments fetched successfully" } },
      },
      post: {
        tags: ["Investments"],
        summary: "Confirm investment (amounts taken from property unit snapshot)",
        description:
          "Plot size and all monetary fields are resolved from the property unit at confirmation time and stored on the investment snapshot. Client sends only propertyId, propertyUnitId, paymentInterval, and optional note.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/InvestmentCreateRequest" } },
          },
        },
        responses: {
          201: { description: "Investment confirmed; response includes snapshot from unit" },
          400: { description: "Missing fields, wrong interval, or unit missing financing for that interval" },
        },
      },
    },
  },
};

module.exports = swaggerDocument;
