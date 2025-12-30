/**
 * ============================================================
 * MANPASIK DEVELOPER API
 * OpenAPI 3.0 Specification for External Developers
 * ============================================================
 * 
 * Generated from 41-Persona Simulation
 * Addressing: User #38 (AI 스타트업 CEO)
 * Issue: "API 문서 없음, 외부 개발자 통합 불가"
 */

// ============================================
// OPENAPI SPECIFICATION
// ============================================

export const OPENAPI_SPEC = {
  openapi: "3.0.3",
  info: {
    title: "Manpasik Developer API",
    description: `
# Manpasik Health Platform API

Welcome to the Manpasik Developer API. This API allows you to integrate 
bio-signal analysis and health monitoring into your applications.

## Authentication
All API requests require Bearer token authentication. 
Obtain your API key from the [Developer Portal](https://developer.manpasik.com).

## Rate Limits
- Free tier: 100 requests/day
- Developer tier: 10,000 requests/day
- Enterprise: Unlimited

## Webhooks
Set up webhooks to receive real-time updates on measurement results.
    `,
    version: "1.0.0",
    contact: {
      name: "Manpasik Developer Support",
      email: "api@manpasik.com",
      url: "https://developer.manpasik.com"
    }
  },
  servers: [
    {
      url: "https://api.manpasik.com/v1",
      description: "Production"
    },
    {
      url: "https://sandbox.api.manpasik.com/v1",
      description: "Sandbox (Test)"
    }
  ],
  paths: {
    "/measurements": {
      get: {
        summary: "List measurements",
        description: "Retrieve a list of measurements for the authenticated user",
        tags: ["Measurements"],
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 20 }
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 }
          },
          {
            name: "from",
            in: "query",
            schema: { type: "string", format: "date-time" }
          },
          {
            name: "to",
            in: "query",
            schema: { type: "string", format: "date-time" }
          }
        ],
        responses: {
          "200": {
            description: "List of measurements",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { type: "array", items: { $ref: "#/components/schemas/Measurement" } },
                    pagination: { $ref: "#/components/schemas/Pagination" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create measurement",
        description: "Submit raw sensor data for analysis",
        tags: ["Measurements"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MeasurementInput" }
            }
          }
        },
        responses: {
          "201": {
            description: "Measurement created and analyzed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Measurement" }
              }
            }
          }
        }
      }
    },
    "/measurements/{id}": {
      get: {
        summary: "Get measurement",
        description: "Retrieve a specific measurement by ID",
        tags: ["Measurements"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Measurement details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Measurement" }
              }
            }
          }
        }
      }
    },
    "/health-score": {
      get: {
        summary: "Get current health score",
        description: "Retrieve the user's current health score and trend",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Health score data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthScore" }
              }
            }
          }
        }
      }
    },
    "/ai/predict": {
      post: {
        summary: "Predict health trajectory",
        description: "Use AI to predict future health states",
        tags: ["AI"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  horizon_days: { type: "integer", default: 7 },
                  include_interventions: { type: "boolean", default: false }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Health trajectory prediction",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Prediction" }
              }
            }
          }
        }
      }
    },
    "/ai/recommend": {
      get: {
        summary: "Get AI recommendations",
        description: "Get personalized health recommendations",
        tags: ["AI"],
        responses: {
          "200": {
            description: "Personalized recommendations",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Recommendation" }
                }
              }
            }
          }
        }
      }
    },
    "/webhooks": {
      post: {
        summary: "Register webhook",
        description: "Register a webhook URL for real-time updates",
        tags: ["Webhooks"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  url: { type: "string", format: "uri" },
                  events: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["measurement.created", "health_score.changed", "alert.triggered"]
                    }
                  },
                  secret: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Webhook registered"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Measurement: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          created_at: { type: "string", format: "date-time" },
          biomarkers: {
            type: "object",
            properties: {
              lactate: { type: "number", description: "mmol/L" },
              glucose: { type: "number", description: "mg/dL" },
              ketone: { type: "number", description: "mmol/L" }
            }
          },
          health_score: { type: "integer", minimum: 0, maximum: 100 },
          raw_signal: {
            type: "object",
            properties: {
              cv_curve: { type: "array", items: { type: "number" } },
              eis_spectrum: { type: "array", items: { type: "number" } },
              swv_response: { type: "array", items: { type: "number" } }
            }
          },
          metadata: {
            type: "object",
            properties: {
              device_id: { type: "string" },
              cartridge_id: { type: "string" },
              temperature: { type: "number" },
              humidity: { type: "number" }
            }
          }
        }
      },
      MeasurementInput: {
        type: "object",
        required: ["device_id", "raw_signal"],
        properties: {
          device_id: { type: "string" },
          cartridge_id: { type: "string" },
          raw_signal: {
            type: "object",
            properties: {
              cv_curve: { type: "array", items: { type: "number" } },
              eis_spectrum: { type: "array", items: { type: "number" } },
              swv_response: { type: "array", items: { type: "number" } }
            }
          },
          environment: {
            type: "object",
            properties: {
              temperature: { type: "number" },
              humidity: { type: "number" }
            }
          }
        }
      },
      HealthScore: {
        type: "object",
        properties: {
          score: { type: "integer", minimum: 0, maximum: 100 },
          trend: { type: "string", enum: ["improving", "stable", "declining"] },
          last_updated: { type: "string", format: "date-time" },
          factors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                impact: { type: "string", enum: ["positive", "neutral", "negative"] },
                value: { type: "number" }
              }
            }
          }
        }
      },
      Prediction: {
        type: "object",
        properties: {
          horizon_days: { type: "integer" },
          predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date" },
                health_score: { type: "integer" },
                confidence: { type: "number" }
              }
            }
          },
          risk_factors: { type: "array", items: { type: "string" } }
        }
      },
      Recommendation: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["nutrition", "exercise", "lifestyle", "product"] },
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          product_id: { type: "string", nullable: true }
        }
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer" },
          limit: { type: "integer" },
          offset: { type: "integer" },
          has_more: { type: "boolean" }
        }
      }
    },
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      ApiKey: {
        type: "apiKey",
        in: "header",
        name: "X-API-Key"
      }
    }
  },
  security: [
    { BearerAuth: [] },
    { ApiKey: [] }
  ]
};

// ============================================
// SDK CODE EXAMPLES
// ============================================

export const SDK_EXAMPLES = {
  javascript: `
// Manpasik JavaScript SDK
import { ManpasikClient } from '@manpasik/sdk';

const client = new ManpasikClient({
  apiKey: process.env.MANPASIK_API_KEY
});

// Get measurements
const measurements = await client.measurements.list({
  limit: 10,
  from: '2024-01-01'
});

// Get health score
const healthScore = await client.health.getScore();
console.log(\`Current score: \${healthScore.score}\`);

// Get AI recommendations
const recommendations = await client.ai.getRecommendations();

// Register webhook
await client.webhooks.register({
  url: 'https://yourapp.com/webhook',
  events: ['measurement.created', 'alert.triggered']
});
`,

  python: `
# Manpasik Python SDK
from manpasik import ManpasikClient

client = ManpasikClient(api_key=os.environ['MANPASIK_API_KEY'])

# Get measurements
measurements = client.measurements.list(limit=10)

# Get health score
health_score = client.health.get_score()
print(f"Current score: {health_score['score']}")

# Predict health trajectory
prediction = client.ai.predict(horizon_days=7)

# Export data (GDPR compliant)
export = client.data.export(format='json', anonymized=True)
`,

  curl: `
# Get health score
curl -X GET "https://api.manpasik.com/v1/health-score" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# Submit measurement
curl -X POST "https://api.manpasik.com/v1/measurements" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "device_id": "MPS-001",
    "raw_signal": {
      "cv_curve": [0.1, 0.2, 0.3, ...],
      "eis_spectrum": [100, 200, 300, ...]
    }
  }'

# Get AI predictions
curl -X POST "https://api.manpasik.com/v1/ai/predict" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"horizon_days": 7}'
`
};

// ============================================
// WEBHOOK PAYLOAD EXAMPLES
// ============================================

export const WEBHOOK_PAYLOADS = {
  "measurement.created": {
    event: "measurement.created",
    timestamp: "2024-01-15T10:30:00Z",
    data: {
      id: "meas-123",
      health_score: 82,
      biomarkers: {
        lactate: 1.8,
        glucose: 95
      }
    }
  },
  "health_score.changed": {
    event: "health_score.changed",
    timestamp: "2024-01-15T10:30:00Z",
    data: {
      previous_score: 75,
      current_score: 82,
      change: 7,
      factors: ["improved_sleep", "regular_exercise"]
    }
  },
  "alert.triggered": {
    event: "alert.triggered",
    timestamp: "2024-01-15T10:30:00Z",
    data: {
      type: "anomaly",
      severity: "warning",
      message: "Lactate levels higher than usual",
      recommended_action: "Consider rest and hydration"
    }
  }
};






