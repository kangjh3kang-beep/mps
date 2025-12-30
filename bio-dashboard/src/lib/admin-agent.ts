/**
 * Master Admin Agent
 * Unified command interface for all system management
 */

/* ============================================
 * Types
 * ============================================ */

export type AdminLevel = "viewer" | "operator" | "manager" | "admin" | "root";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  level: AdminLevel;
  mfaVerified: boolean;
  lastMfaAt?: string;
}

export interface AgentCommand {
  id: string;
  category: "analytics" | "commerce" | "aiops" | "users" | "devices" | "security" | "system" | "reports";
  action: string;
  parameters: Record<string, unknown>;
  requiredLevel: AdminLevel;
  requiresMfa: boolean;
  description: string;
}

export interface AgentResponse {
  success: boolean;
  type: "text" | "chart" | "table" | "action" | "report" | "error" | "mfa_required";
  message: string;
  data?: unknown;
  actions?: AgentAction[];
  report?: GeneratedReport;
}

export interface AgentAction {
  label: string;
  action: string;
  variant: "default" | "destructive" | "outline";
  requiresConfirm?: boolean;
}

export interface GeneratedReport {
  id: string;
  title: string;
  format: "pdf" | "csv" | "json";
  sections: ReportSection[];
  generatedAt: string;
  downloadUrl?: string;
}

export interface ReportSection {
  title: string;
  type: "text" | "chart" | "table" | "metrics";
  content: unknown;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: string;
  response?: AgentResponse;
  commandParsed?: AgentCommand;
}

/* ============================================
 * Permission Levels
 * ============================================ */

const LEVEL_HIERARCHY: Record<AdminLevel, number> = {
  viewer: 1,
  operator: 2,
  manager: 3,
  admin: 4,
  root: 5
};

export function hasPermission(userLevel: AdminLevel, requiredLevel: AdminLevel): boolean {
  return LEVEL_HIERARCHY[userLevel] >= LEVEL_HIERARCHY[requiredLevel];
}

export function checkMfaRequired(command: AgentCommand, user: AdminUser): boolean {
  if (!command.requiresMfa) return false;
  
  // MFA valid for 15 minutes
  if (user.mfaVerified && user.lastMfaAt) {
    const mfaAge = Date.now() - new Date(user.lastMfaAt).getTime();
    if (mfaAge < 15 * 60 * 1000) return false;
  }
  
  return true;
}

/* ============================================
 * Command Registry
 * ============================================ */

const COMMAND_PATTERNS: {
  pattern: RegExp;
  command: Omit<AgentCommand, "id" | "parameters">;
  extractParams: (match: RegExpMatchArray) => Record<string, unknown>;
}[] = [
  // Analytics
  {
    pattern: /show\s+(?:me\s+)?(?:the\s+)?revenue\s+(?:for\s+)?(.+)/i,
    command: {
      category: "analytics",
      action: "get_revenue",
      requiredLevel: "viewer",
      requiresMfa: false,
      description: "Retrieve revenue data"
    },
    extractParams: (m) => ({ period: m[1] })
  },
  {
    pattern: /(?:show|get)\s+(?:me\s+)?(?:the\s+)?(?:active\s+)?users?\s+(?:count|stats|statistics)/i,
    command: {
      category: "analytics",
      action: "get_user_stats",
      requiredLevel: "viewer",
      requiresMfa: false,
      description: "Get user statistics"
    },
    extractParams: () => ({})
  },
  {
    pattern: /(?:show|get)\s+(?:me\s+)?(?:the\s+)?(?:sales|order)\s+(?:data|report)/i,
    command: {
      category: "analytics",
      action: "get_sales",
      requiredLevel: "viewer",
      requiresMfa: false,
      description: "Get sales data"
    },
    extractParams: () => ({})
  },

  // Commerce/Design
  {
    pattern: /design\s+(?:a\s+)?(.+?)(?:\s+landing)?\s*page/i,
    command: {
      category: "commerce",
      action: "design_page",
      requiredLevel: "manager",
      requiresMfa: false,
      description: "Design a landing page"
    },
    extractParams: (m) => ({ theme: m[1] })
  },
  {
    pattern: /change\s+(?:the\s+)?(?:mall\s+)?theme\s+to\s+(.+)/i,
    command: {
      category: "commerce",
      action: "change_theme",
      requiredLevel: "manager",
      requiresMfa: false,
      description: "Change mall theme"
    },
    extractParams: (m) => ({ theme: m[1] })
  },
  {
    pattern: /create\s+(?:a\s+)?(?:new\s+)?promotion\s+(?:for\s+)?(.+)/i,
    command: {
      category: "commerce",
      action: "create_promotion",
      requiredLevel: "manager",
      requiresMfa: false,
      description: "Create a promotion"
    },
    extractParams: (m) => ({ target: m[1] })
  },

  // AIOps/Diagnosis
  {
    pattern: /why\s+is\s+(?:the\s+)?(.+?)\s+(?:high|slow|failing|down)/i,
    command: {
      category: "aiops",
      action: "diagnose",
      requiredLevel: "operator",
      requiresMfa: false,
      description: "Diagnose system issue"
    },
    extractParams: (m) => ({ metric: m[1] })
  },
  {
    pattern: /(?:show|list)\s+(?:me\s+)?(?:the\s+)?(?:recent\s+)?errors?/i,
    command: {
      category: "aiops",
      action: "list_errors",
      requiredLevel: "operator",
      requiresMfa: false,
      description: "List recent errors"
    },
    extractParams: () => ({})
  },
  {
    pattern: /(?:fix|heal)\s+(?:the\s+)?error\s+(.+)/i,
    command: {
      category: "aiops",
      action: "auto_fix",
      requiredLevel: "admin",
      requiresMfa: true,
      description: "Trigger auto-fix for error"
    },
    extractParams: (m) => ({ errorId: m[1] })
  },

  // User Management
  {
    pattern: /ban\s+user\s+(?:id\s+)?(\w+)(?:\s+(?:due\s+to|for|because)\s+(.+))?/i,
    command: {
      category: "users",
      action: "ban_user",
      requiredLevel: "admin",
      requiresMfa: true,
      description: "Ban a user"
    },
    extractParams: (m) => ({ userId: m[1], reason: m[2] ?? "No reason provided" })
  },
  {
    pattern: /unban\s+user\s+(?:id\s+)?(\w+)/i,
    command: {
      category: "users",
      action: "unban_user",
      requiredLevel: "admin",
      requiresMfa: true,
      description: "Unban a user"
    },
    extractParams: (m) => ({ userId: m[1] })
  },
  {
    pattern: /(?:show|get)\s+(?:me\s+)?user\s+(?:info|details|profile)\s+(?:for\s+)?(\w+)/i,
    command: {
      category: "users",
      action: "get_user",
      requiredLevel: "operator",
      requiresMfa: false,
      description: "Get user information"
    },
    extractParams: (m) => ({ userId: m[1] })
  },

  // Device Management
  {
    pattern: /lock\s+device\s+(.+)/i,
    command: {
      category: "devices",
      action: "lock_device",
      requiredLevel: "admin",
      requiresMfa: true,
      description: "Lock a device"
    },
    extractParams: (m) => ({ deviceId: m[1] })
  },
  {
    pattern: /(?:update|push)\s+firmware\s+(?:to\s+)?device\s+(.+)/i,
    command: {
      category: "devices",
      action: "update_firmware",
      requiredLevel: "admin",
      requiresMfa: true,
      description: "Push firmware update"
    },
    extractParams: (m) => ({ deviceId: m[1] })
  },

  // Security
  {
    pattern: /drop\s+database/i,
    command: {
      category: "security",
      action: "drop_database",
      requiredLevel: "root",
      requiresMfa: true,
      description: "Drop database (DANGEROUS)"
    },
    extractParams: () => ({})
  },
  {
    pattern: /(?:show|view)\s+(?:the\s+)?audit\s+logs?/i,
    command: {
      category: "security",
      action: "view_audit",
      requiredLevel: "admin",
      requiresMfa: false,
      description: "View audit logs"
    },
    extractParams: () => ({})
  },
  {
    pattern: /revoke\s+(?:all\s+)?(?:access|tokens)\s+(?:for\s+)?user\s+(\w+)/i,
    command: {
      category: "security",
      action: "revoke_access",
      requiredLevel: "admin",
      requiresMfa: true,
      description: "Revoke user access"
    },
    extractParams: (m) => ({ userId: m[1] })
  },

  // Reports
  {
    pattern: /(?:how\s+is|what(?:'s| is))\s+(?:the\s+)?system\s+health/i,
    command: {
      category: "reports",
      action: "system_health_report",
      requiredLevel: "viewer",
      requiresMfa: false,
      description: "Generate system health report"
    },
    extractParams: () => ({})
  },
  {
    pattern: /generate\s+(?:a\s+)?(.+?)\s+report/i,
    command: {
      category: "reports",
      action: "generate_report",
      requiredLevel: "manager",
      requiresMfa: false,
      description: "Generate custom report"
    },
    extractParams: (m) => ({ reportType: m[1] })
  },
  {
    pattern: /email\s+(?:the\s+)?report\s+to\s+(.+)/i,
    command: {
      category: "reports",
      action: "email_report",
      requiredLevel: "manager",
      requiresMfa: false,
      description: "Email report to stakeholder"
    },
    extractParams: (m) => ({ recipient: m[1] })
  },

  // System
  {
    pattern: /restart\s+(?:the\s+)?(.+?)\s+service/i,
    command: {
      category: "system",
      action: "restart_service",
      requiredLevel: "admin",
      requiresMfa: true,
      description: "Restart a service"
    },
    extractParams: (m) => ({ service: m[1] })
  },
  {
    pattern: /(?:clear|flush)\s+(?:the\s+)?cache/i,
    command: {
      category: "system",
      action: "clear_cache",
      requiredLevel: "operator",
      requiresMfa: false,
      description: "Clear system cache"
    },
    extractParams: () => ({})
  }
];

/* ============================================
 * Command Parser
 * ============================================ */

export function parseCommand(input: string): AgentCommand | null {
  const normalizedInput = input.trim().toLowerCase();
  
  for (const { pattern, command, extractParams } of COMMAND_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      return {
        id: `cmd_${Date.now()}`,
        ...command,
        parameters: extractParams(match)
      };
    }
  }
  
  return null;
}

/* ============================================
 * Command Executor
 * ============================================ */

export async function executeCommand(
  command: AgentCommand,
  user: AdminUser
): Promise<AgentResponse> {
  // Permission check
  if (!hasPermission(user.level, command.requiredLevel)) {
    return {
      success: false,
      type: "error",
      message: `Permission denied. This action requires "${command.requiredLevel}" level or higher. Your level: "${user.level}".`
    };
  }

  // MFA check
  if (checkMfaRequired(command, user)) {
    return {
      success: false,
      type: "mfa_required",
      message: `This action requires MFA verification. Please authenticate to proceed.`,
      actions: [
        { label: "Verify MFA", action: "verify_mfa", variant: "default" }
      ]
    };
  }

  // Execute based on category and action
  switch (command.category) {
    case "analytics":
      return executeAnalyticsCommand(command);
    case "commerce":
      return executeCommerceCommand(command);
    case "aiops":
      return executeAIOpsCommand(command);
    case "users":
      return executeUserCommand(command);
    case "devices":
      return executeDeviceCommand(command);
    case "security":
      return executeSecurityCommand(command);
    case "reports":
      return executeReportCommand(command);
    case "system":
      return executeSystemCommand(command);
    default:
      return {
        success: false,
        type: "error",
        message: "Unknown command category"
      };
  }
}

/* ============================================
 * Category Executors
 * ============================================ */

async function executeAnalyticsCommand(command: AgentCommand): Promise<AgentResponse> {
  await simulateDelay();

  switch (command.action) {
    case "get_revenue":
      const period = command.parameters.period as string;
      return {
        success: true,
        type: "chart",
        message: `📊 Revenue data for ${period}`,
        data: {
          type: "bar",
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          values: [12500000, 14200000, 11800000, 15600000, 18900000, 22100000, 19500000],
          total: 114600000,
          currency: "KRW",
          change: "+12.5%"
        }
      };

    case "get_user_stats":
      return {
        success: true,
        type: "table",
        message: "📈 Current User Statistics",
        data: {
          headers: ["Metric", "Value", "Change"],
          rows: [
            ["Active Users", "12,458", "+5.2%"],
            ["New Signups (Today)", "234", "+12%"],
            ["Avg Session Duration", "8m 42s", "-2%"],
            ["Retention Rate", "78.5%", "+1.5%"]
          ]
        }
      };

    case "get_sales":
      return {
        success: true,
        type: "chart",
        message: "💰 Sales Overview",
        data: {
          totalOrders: 1247,
          totalRevenue: 156800000,
          avgOrderValue: 125741,
          topProducts: ["Immunity Cartridge", "Glucose Monitor", "Vitamin Bundle"]
        }
      };

    default:
      return { success: false, type: "error", message: "Unknown analytics command" };
  }
}

async function executeCommerceCommand(command: AgentCommand): Promise<AgentResponse> {
  await simulateDelay();

  switch (command.action) {
    case "design_page":
      const theme = command.parameters.theme as string;
      return {
        success: true,
        type: "action",
        message: `🎨 Designing "${theme}" landing page...`,
        data: {
          previewUrl: "/admin/mall-editor?preview=true",
          theme,
          components: ["Hero Banner", "Product Grid", "CTA Section", "Footer"]
        },
        actions: [
          { label: "Open Editor", action: "navigate:/admin/mall-editor", variant: "default" },
          { label: "Preview", action: "preview_page", variant: "outline" }
        ]
      };

    case "change_theme":
      return {
        success: true,
        type: "action",
        message: `✅ Theme changed to "${command.parameters.theme}"`,
        actions: [
          { label: "View Changes", action: "navigate:/admin/mall-editor", variant: "default" },
          { label: "Publish", action: "publish_theme", variant: "outline" }
        ]
      };

    case "create_promotion":
      return {
        success: true,
        type: "action",
        message: `🎉 Creating promotion for "${command.parameters.target}"...`,
        data: {
          promotionId: `promo_${Date.now()}`,
          target: command.parameters.target,
          suggestedDiscount: "20%",
          suggestedDuration: "7 days"
        },
        actions: [
          { label: "Configure Details", action: "navigate:/admin/promotions/new", variant: "default" }
        ]
      };

    default:
      return { success: false, type: "error", message: "Unknown commerce command" };
  }
}

async function executeAIOpsCommand(command: AgentCommand): Promise<AgentResponse> {
  await simulateDelay();

  switch (command.action) {
    case "diagnose":
      const metric = command.parameters.metric as string;
      return {
        success: true,
        type: "text",
        message: `🔍 **Diagnosing: ${metric}**\n\n**Root Cause Analysis:**\n• Database connection pool exhausted (85% capacity)\n• Query optimization needed for /api/analyze endpoint\n• Redis cache miss rate increased to 23%\n\n**Recommended Actions:**\n1. Scale up database connections (current: 50 → recommended: 100)\n2. Add index on measurements.user_id column\n3. Increase Redis TTL for frequently accessed data`,
        actions: [
          { label: "Apply Recommendations", action: "apply_recommendations", variant: "default" },
          { label: "View Details", action: "navigate:/admin/aiops", variant: "outline" }
        ]
      };

    case "list_errors":
      return {
        success: true,
        type: "table",
        message: "🐛 Recent Errors (Last 24h)",
        data: {
          headers: ["ID", "Type", "Severity", "Count", "Status"],
          rows: [
            ["err_001", "Database", "Critical", "47", "Analyzing"],
            ["err_002", "Auth", "High", "12", "Resolved"],
            ["err_003", "Frontend", "Medium", "5", "Patching"],
            ["err_004", "Network", "High", "23", "New"]
          ]
        },
        actions: [
          { label: "View All Errors", action: "navigate:/admin/aiops", variant: "outline" }
        ]
      };

    case "auto_fix":
      return {
        success: true,
        type: "action",
        message: `🔧 Initiating auto-fix for error ${command.parameters.errorId}...\n\n**Status:** Analyzing code context...\n**ETA:** ~2 minutes`,
        actions: [
          { label: "Watch Progress", action: "navigate:/admin/aiops", variant: "default" }
        ]
      };

    default:
      return { success: false, type: "error", message: "Unknown AIOps command" };
  }
}

async function executeUserCommand(command: AgentCommand): Promise<AgentResponse> {
  await simulateDelay();

  switch (command.action) {
    case "ban_user":
      return {
        success: true,
        type: "action",
        message: `⛔ User ${command.parameters.userId} has been banned.\n\n**Reason:** ${command.parameters.reason}\n**Effective:** Immediately\n**Sessions terminated:** 3`,
        data: {
          userId: command.parameters.userId,
          action: "banned",
          timestamp: new Date().toISOString()
        }
      };

    case "unban_user":
      return {
        success: true,
        type: "action",
        message: `✅ User ${command.parameters.userId} has been unbanned and can now access the system.`
      };

    case "get_user":
      return {
        success: true,
        type: "table",
        message: `👤 User Profile: ${command.parameters.userId}`,
        data: {
          headers: ["Field", "Value"],
          rows: [
            ["User ID", command.parameters.userId],
            ["Name", "Kim Minsu"],
            ["Email", "kim.minsu@example.com"],
            ["Status", "Active"],
            ["Registered", "2024-06-15"],
            ["Last Login", "2025-01-20 14:32"],
            ["Total Measurements", "156"],
            ["Health Score (Avg)", "78"]
          ]
        }
      };

    default:
      return { success: false, type: "error", message: "Unknown user command" };
  }
}

async function executeDeviceCommand(command: AgentCommand): Promise<AgentResponse> {
  await simulateDelay();

  switch (command.action) {
    case "lock_device":
      return {
        success: true,
        type: "action",
        message: `🔒 Device ${command.parameters.deviceId} has been remotely locked.\n\n**Status:** Locked\n**Location:** Last known: Seoul, Korea\n**Owner notified:** Yes`,
        actions: [
          { label: "Unlock Device", action: `unlock_device:${command.parameters.deviceId}`, variant: "outline" },
          { label: "View Device", action: "navigate:/admin/devices", variant: "outline" }
        ]
      };

    case "update_firmware":
      return {
        success: true,
        type: "action",
        message: `📦 Firmware update queued for device ${command.parameters.deviceId}\n\n**Version:** v2.4.1 → v2.5.0\n**Status:** Waiting for device connection\n**Estimated time:** 5-10 minutes`
      };

    default:
      return { success: false, type: "error", message: "Unknown device command" };
  }
}

async function executeSecurityCommand(command: AgentCommand): Promise<AgentResponse> {
  await simulateDelay();

  switch (command.action) {
    case "drop_database":
      return {
        success: false,
        type: "error",
        message: "🚫 **BLOCKED: Destructive Operation**\n\nThe 'DROP DATABASE' command is disabled in the Admin Agent for safety.\n\nIf you need to perform database maintenance, please:\n1. Contact the DBA team\n2. Submit a change request through the proper channel\n3. Schedule during maintenance window",
        actions: [
          { label: "Contact DBA", action: "mailto:dba@manpasik.com", variant: "outline" }
        ]
      };

    case "view_audit":
      return {
        success: true,
        type: "action",
        message: "📋 Opening Audit Logs...",
        actions: [
          { label: "View Full Audit", action: "navigate:/admin/audit", variant: "default" }
        ]
      };

    case "revoke_access":
      return {
        success: true,
        type: "action",
        message: `🔑 Access revoked for user ${command.parameters.userId}\n\n**Actions taken:**\n• All active sessions terminated\n• API tokens invalidated\n• Refresh tokens revoked\n\nUser will need to re-authenticate on next login.`
      };

    default:
      return { success: false, type: "error", message: "Unknown security command" };
  }
}

async function executeReportCommand(command: AgentCommand): Promise<AgentResponse> {
  await simulateDelay(2000);

  switch (command.action) {
    case "system_health_report":
      const report = generateSystemHealthReport();
      return {
        success: true,
        type: "report",
        message: "📄 System Health Report generated",
        report,
        actions: [
          { label: "Download PDF", action: `download:${report.id}`, variant: "default" },
          { label: "Email Report", action: `email_report:${report.id}`, variant: "outline" }
        ]
      };

    case "generate_report":
      const customReport: GeneratedReport = {
        id: `report_${Date.now()}`,
        title: `${command.parameters.reportType} Report`,
        format: "pdf",
        sections: [
          { title: "Summary", type: "text", content: `Generated ${command.parameters.reportType} report` },
          { title: "Metrics", type: "metrics", content: { items: 15, dataPoints: 1250 } }
        ],
        generatedAt: new Date().toISOString()
      };
      return {
        success: true,
        type: "report",
        message: `📄 ${command.parameters.reportType} Report generated`,
        report: customReport,
        actions: [
          { label: "Download", action: `download:${customReport.id}`, variant: "default" }
        ]
      };

    case "email_report":
      return {
        success: true,
        type: "action",
        message: `✉️ Report sent to ${command.parameters.recipient}\n\n**Status:** Delivered\n**Time:** ${new Date().toLocaleTimeString()}`
      };

    default:
      return { success: false, type: "error", message: "Unknown report command" };
  }
}

async function executeSystemCommand(command: AgentCommand): Promise<AgentResponse> {
  await simulateDelay();

  switch (command.action) {
    case "restart_service":
      return {
        success: true,
        type: "action",
        message: `🔄 Restarting ${command.parameters.service} service...\n\n**Status:** Service restarted successfully\n**Downtime:** 3.2 seconds\n**Health check:** Passed`
      };

    case "clear_cache":
      return {
        success: true,
        type: "action",
        message: "🧹 Cache cleared successfully\n\n**Redis:** 2.4GB freed\n**CDN:** Purged 156 objects\n**App Cache:** Reset"
      };

    default:
      return { success: false, type: "error", message: "Unknown system command" };
  }
}

/* ============================================
 * Report Generator
 * ============================================ */

function generateSystemHealthReport(): GeneratedReport {
  return {
    id: `health_report_${Date.now()}`,
    title: "System Health Report",
    format: "pdf",
    sections: [
      {
        title: "Executive Summary",
        type: "text",
        content: "Overall system health is GOOD. 99.8% uptime in the last 7 days. 2 minor incidents auto-resolved by AIOps."
      },
      {
        title: "Server Metrics",
        type: "metrics",
        content: {
          cpu: { avg: "45%", peak: "78%" },
          memory: { avg: "62%", peak: "81%" },
          disk: { used: "234GB", total: "500GB" },
          network: { in: "1.2TB", out: "3.4TB" }
        }
      },
      {
        title: "API Performance",
        type: "chart",
        content: {
          avgLatency: "45ms",
          p95Latency: "120ms",
          p99Latency: "280ms",
          errorRate: "0.02%",
          requestsPerSecond: 1250
        }
      },
      {
        title: "Database Health",
        type: "table",
        content: {
          connectionPool: "45/100 active",
          slowQueries: "3 in last hour",
          replicationLag: "0.2s",
          backupStatus: "Healthy"
        }
      },
      {
        title: "Security Status",
        type: "metrics",
        content: {
          failedLogins: 23,
          suspiciousActivity: 0,
          lastSecurityScan: "2h ago",
          vulnerabilities: "None detected"
        }
      },
      {
        title: "Financial Summary",
        type: "metrics",
        content: {
          dailyRevenue: "₩18,500,000",
          weeklyRevenue: "₩114,600,000",
          activeSubscriptions: 2845,
          churnRate: "2.1%"
        }
      }
    ],
    generatedAt: new Date().toISOString(),
    downloadUrl: `/api/reports/download/health_report_${Date.now()}.pdf`
  };
}

/* ============================================
 * Natural Language Fallback
 * ============================================ */

export function generateNaturalResponse(input: string): AgentResponse {
  const lowerInput = input.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|안녕|하이)/i.test(lowerInput)) {
    return {
      success: true,
      type: "text",
      message: "👋 Hello! I'm the Master Admin Agent. How can I help you today?\n\n**Some things I can do:**\n• Show revenue, user stats, sales data\n• Design landing pages, change themes\n• Diagnose system issues, list errors\n• Manage users, devices, security\n• Generate and email reports\n\nJust ask naturally!"
    };
  }

  // Help
  if (/^(help|도움말|뭐\s*할\s*수)/i.test(lowerInput)) {
    return {
      success: true,
      type: "text",
      message: `🤖 **Master Admin Agent Commands**\n
**Analytics:**
• "Show me the revenue for last week"
• "Get user stats"
• "Show sales data"

**Commerce:**
• "Design a Black Friday landing page"
• "Change theme to Christmas"

**AIOps:**
• "Why is the server latency high?"
• "List recent errors"
• "Fix error err_001"

**Users:**
• "Ban user ID 1234"
• "Show user info for user_123"

**Reports:**
• "How is the system health?"
• "Generate a sales report"
• "Email the report to ceo@company.com"

**Security:**
• "View audit logs"
• "Revoke access for user 1234"`
    };
  }

  // Unknown command
  return {
    success: false,
    type: "error",
    message: `🤔 I'm not sure how to handle that request.\n\nTry saying:\n• "Show me the revenue for last week"\n• "Why is the server latency high?"\n• "How is the system health?"\n\nOr type "help" to see all available commands.`
  };
}

/* ============================================
 * Helpers
 * ============================================ */

function simulateDelay(ms: number = 1000): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/* ============================================
 * Mock Admin User
 * ============================================ */

export function getMockAdminUser(): AdminUser {
  return {
    id: "admin_001",
    name: "System Admin",
    email: "admin@manpasik.com",
    level: "admin",
    mfaVerified: false,
    lastMfaAt: undefined
  };
}






