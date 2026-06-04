import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.3",
  info: {
    title: "Zuklo API",
    description: "Real estate property index and contract management API",
    version: "0.1.0",
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      description: "API server",
    },
  ],
  paths: {
    "/api/auth": {
      get: {
        summary: "Get current session",
        description: "Returns the authenticated user's session data.",
        tags: ["Auth"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Session data" },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        summary: "Sign in / Sign up",
        description: "Authenticate a user or create a new account.",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Session created" },
          "400": { description: "Invalid request" },
        },
      },
    },
    "/api/filters": {
      get: {
        summary: "List saved filters",
        description: "Returns all saved property search filters for the user.",
        tags: ["Filters"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Array of filters" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
      post: {
        summary: "Create a filter",
        description: "Save a new property search filter.",
        tags: ["Filters"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  criteria: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Filter created" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/contracts": {
      get: {
        summary: "List contracts",
        description: "Returns all contracts for the authenticated user.",
        tags: ["Contracts"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Array of contracts" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
      post: {
        summary: "Create a contract",
        description: "Create a new rental contract with auto-calculated indices.",
        tags: ["Contracts"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "baseAmount", "startDate"],
                properties: {
                  title: { type: "string" },
                  baseAmount: { type: "number" },
                  startDate: { type: "string", format: "date" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Contract created with summary" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/maintenance": {
      get: {
        summary: "List maintenance requests",
        description: "Returns maintenance requests for the user's properties.",
        tags: ["Maintenance"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Array of maintenance requests" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
      post: {
        summary: "Create a maintenance request",
        description: "Submit a new maintenance request for a property.",
        tags: ["Maintenance"],
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Request created" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/profile": {
      get: {
        summary: "Get user profile",
        description: "Returns the authenticated user's profile.",
        tags: ["Profile"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "User profile" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
      put: {
        summary: "Update user profile",
        description: "Update the authenticated user's profile information.",
        tags: ["Profile"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Profile updated" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/billing": {
      get: {
        summary: "Get billing info",
        description: "Returns the user's current plan, invoices, and subscription status.",
        tags: ["Billing"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Billing information" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/scrape": {
      post: {
        summary: "Trigger property scrape",
        description: "Queue a scraping job for the specified real estate portal.",
        tags: ["Scraping"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["portal", "filters"],
                properties: {
                  portal: { type: "string", description: "Portal identifier (e.g. zonaprop, argenprop)" },
                  filters: { type: "object", description: "Search filters for the scrape" },
                },
              },
            },
          },
        },
        responses: {
          "202": { description: "Scrape job queued" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/jobs": {
      get: {
        summary: "List background jobs",
        description: "Returns status of background scraping jobs for the user.",
        tags: ["Jobs"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Array of jobs with status" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/notifications": {
      get: {
        summary: "List notifications",
        description: "Returns notifications for the authenticated user.",
        tags: ["Notifications"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Array of notifications" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
      post: {
        summary: "Register push subscription",
        description: "Register a Firebase Cloud Messaging subscription for push notifications.",
        tags: ["Notifications"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  endpoint: { type: "string" },
                  keys: { type: "object" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Subscription registered" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/tokens": {
      get: {
        summary: "Get FCM VAPID key",
        description: "Returns the public VAPID key for push notification subscription.",
        tags: ["Tokens"],
        responses: {
          "200": { description: "VAPID public key" },
        },
      },
    },
    "/api/pdf": {
      post: {
        summary: "Generate PDF",
        description: "Generate a PDF document for a contract or report.",
        tags: ["PDF"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contractId"],
                properties: {
                  contractId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "PDF file" },
          "401": { description: "Unauthorized" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/index": {
      get: {
        summary: "Get index values",
        description: "Returns IPC/ICL index values for contract calculations.",
        tags: ["Index"],
        responses: {
          "200": { description: "Index data" },
          "429": { description: "Rate limit exceeded" },
        },
      },
    },
    "/api/webhook": {
      post: {
        summary: "Stripe webhook",
        description: "Handles Stripe webhook events for subscription lifecycle.",
        tags: ["Webhook"],
        responses: {
          "200": { description: "Event processed" },
          "400": { description: "Invalid signature" },
        },
      },
    },
    "/api/health": {
      get: {
        summary: "Health check",
        description: "Returns service health status. No auth required.",
        tags: ["Health"],
        responses: {
          "200": { description: "Health status" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "Supabase JWT",
      },
    },
  },
  tags: [
    { name: "Auth", description: "Authentication and session management" },
    { name: "Filters", description: "Saved property search filters" },
    { name: "Contracts", description: "Rental contracts with index calculations" },
    { name: "Maintenance", description: "Property maintenance requests" },
    { name: "Profile", description: "User profile management" },
    { name: "Billing", description: "Subscription and payment info" },
    { name: "Scraping", description: "Property scraping jobs" },
    { name: "Jobs", description: "Background job status" },
    { name: "Notifications", description: "Push notification management" },
    { name: "Tokens", description: "FCM VAPID tokens" },
    { name: "PDF", description: "PDF document generation" },
    { name: "Index", description: "IPC/ICL index data" },
    { name: "Webhook", description: "Stripe webhook receiver" },
    { name: "Health", description: "Service health checks" },
  ],
};

export async function GET() {
  return NextResponse.json(spec);
}
