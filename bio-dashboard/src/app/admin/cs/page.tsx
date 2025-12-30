"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  Eye,
  Headphones,
  Loader2,
  MessageCircle,
  Package,
  RefreshCw,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Truck,
  User,
  X,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  type CSTicket,
  type AIResolution,
  generateMockTickets,
  generateMockQCRecords,
  generateMockOrders,
  processCSTicket
} from "@/lib/commerce-ai";

export default function CSAgentPage() {
  const [tickets, setTickets] = React.useState<(CSTicket & { aiResolution?: AIResolution })[]>([]);
  const [selectedTicket, setSelectedTicket] = React.useState<CSTicket | null>(null);
  const [processing, setProcessing] = React.useState<string | null>(null);
  const [approvalModal, setApprovalModal] = React.useState<CSTicket | null>(null);

  // Load tickets
  React.useEffect(() => {
    const mockTickets = generateMockTickets();
    const qcRecords = generateMockQCRecords();
    const orders = generateMockOrders();

    // Process each ticket with AI
    const processedTickets = mockTickets.map(ticket => {
      const resolution = processCSTicket(ticket, qcRecords, orders);
      return { ...ticket, aiResolution: resolution };
    });

    setTickets(processedTickets);
  }, []);

  const handleApprove = async (ticket: CSTicket) => {
    setProcessing(ticket.id);
    await new Promise(r => setTimeout(r, 1500));

    setTickets(prev => prev.map(t =>
      t.id === ticket.id
        ? { ...t, status: "resolved" as const, aiResolution: { ...t.aiResolution!, autoExecuted: true, executedAt: new Date().toISOString() } }
        : t
    ));

    setProcessing(null);
    setApprovalModal(null);
  };

  const handleEscalate = async (ticket: CSTicket) => {
    setProcessing(ticket.id);
    await new Promise(r => setTimeout(r, 1000));

    setTickets(prev => prev.map(t =>
      t.id === ticket.id
        ? { ...t, status: "escalated" as const }
        : t
    ));

    setProcessing(null);
  };

  const openCount = tickets.filter(t => t.status === "open").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;
  const autoResolvedCount = tickets.filter(t => t.aiResolution?.autoExecuted).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-cyan-400" />
            CS Automation Agent
          </h1>
          <p className="text-slate-400 text-sm">AI-powered customer service with automatic resolution</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
            <Zap className="h-3 w-3 mr-1" />
            {autoResolvedCount} Auto-resolved
          </Badge>
          <Badge variant="outline" className="border-amber-500/50 text-amber-400">
            <Clock className="h-3 w-3 mr-1" />
            {openCount} Pending
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tickets"
          value={tickets.length}
          icon={<MessageCircle className="h-5 w-5" />}
          color="slate"
        />
        <StatCard
          title="Open"
          value={openCount}
          icon={<Clock className="h-5 w-5" />}
          color="amber"
          alert={openCount > 0}
        />
        <StatCard
          title="Auto-Resolved"
          value={autoResolvedCount}
          icon={<Zap className="h-5 w-5" />}
          color="emerald"
        />
        <StatCard
          title="Avg Resolution"
          value="< 5 min"
          icon={<CheckCircle className="h-5 w-5" />}
          color="cyan"
          isText
        />
      </div>

      {/* Auto-Resolution Banner */}
      {tickets.some(t => t.aiResolution?.action === "approve" && !t.aiResolution.autoExecuted) && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-emerald-400" />
            <div>
              <div className="font-medium text-emerald-300">
                {tickets.filter(t => t.aiResolution?.action === "approve" && !t.aiResolution.autoExecuted).length} Tickets Can Be Auto-Resolved
              </div>
              <div className="text-sm text-emerald-400/80">
                AI detected matching refund/shipping policies
              </div>
            </div>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              tickets
                .filter(t => t.aiResolution?.action === "approve" && !t.aiResolution.autoExecuted)
                .forEach(t => handleApprove(t));
            }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Execute All
          </Button>
        </div>
      )}

      {/* Ticket List */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Headphones className="h-4 w-4 text-cyan-400" />
              Customer Tickets
            </CardTitle>
            <Button variant="outline" size="sm" className="border-slate-700">
              <RefreshCw className="h-3 w-3 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className={cn(
                  "p-4 hover:bg-slate-800/30 transition-colors",
                  ticket.status === "open" && ticket.priority === "high" && "bg-rose-500/5"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <TicketTypeIcon type={ticket.type} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{ticket.subject}</span>
                        <PriorityBadge priority={ticket.priority} />
                        <StatusBadge status={ticket.status} />
                      </div>
                      <p className="text-sm text-slate-400 mb-2 line-clamp-2">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(ticket.createdAt).toLocaleString()}
                        </span>
                        {ticket.orderId && (
                          <span className="font-mono">{ticket.orderId}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AI Resolution Panel */}
                  {ticket.aiResolution && (
                    <div className="ml-4 w-64 shrink-0">
                      <AIResolutionCard
                        resolution={ticket.aiResolution}
                        ticket={ticket}
                        onApprove={() => setApprovalModal(ticket)}
                        onEscalate={() => handleEscalate(ticket)}
                        isProcessing={processing === ticket.id}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Rules Panel */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-purple-400" />
            Automation Rules
          </CardTitle>
          <CardDescription>
            AI rules for automatic ticket resolution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RuleCard
              title="QC Error Auto-Refund"
              description="If cartridge has recorded QC error, approve refund instantly"
              triggerCount={15}
              successRate={98}
              active
            />
            <RuleCard
              title="Shipping Auto-Response"
              description="Provide tracking info for in-transit orders automatically"
              triggerCount={42}
              successRate={95}
              active
            />
            <RuleCard
              title="High Priority Escalation"
              description="Escalate high priority tickets to human agents"
              triggerCount={8}
              successRate={100}
              active
            />
            <RuleCard
              title="FAQ Auto-Response"
              description="Answer common questions using knowledge base"
              triggerCount={127}
              successRate={89}
              active
            />
          </div>
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog open={!!approvalModal} onOpenChange={() => setApprovalModal(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
              Confirm AI Resolution
            </DialogTitle>
            <DialogDescription>
              Review and approve the AI's recommended action for ticket {approvalModal?.id}
            </DialogDescription>
          </DialogHeader>

          {approvalModal?.aiResolution && (
            <div className="py-4 space-y-4">
              <div className="rounded-lg bg-slate-800 p-4">
                <div className="text-sm font-medium mb-2">AI Recommendation</div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400">
                    {approvalModal.aiResolution.action.toUpperCase()}
                  </Badge>
                  <span className="text-sm">
                    Confidence: {Math.round(approvalModal.aiResolution.confidence * 100)}%
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {approvalModal.aiResolution.reasoning}
                </p>
              </div>

              {approvalModal.aiResolution.response && (
                <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-4">
                  <div className="text-sm font-medium text-cyan-400 mb-2">Auto-Response</div>
                  <p className="text-sm text-slate-300">
                    {approvalModal.aiResolution.response}
                  </p>
                </div>
              )}

              {approvalModal.aiResolution.refundAmount && (
                <div className="flex items-center gap-2 text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                  <span>Refund Amount: ₩{approvalModal.aiResolution.refundAmount.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApprovalModal(null)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={() => approvalModal && handleApprove(approvalModal)}
              disabled={processing === approvalModal?.id}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processing === approvalModal?.id ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" /> Approve & Execute</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================
 * Sub-components
 * ============================================ */

function StatCard({
  title,
  value,
  icon,
  color,
  alert,
  isText
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  alert?: boolean;
  isText?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    amber: "text-amber-400",
    slate: "text-slate-400"
  };

  return (
    <Card className={cn("bg-slate-900 border-slate-800", alert && "border-amber-500/50")}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={colorClasses[color]}>{icon}</span>
        </div>
        <div className={cn("font-bold", isText ? "text-lg" : "text-2xl")}>{value}</div>
        <div className="text-xs text-slate-400 mt-1">{title}</div>
      </CardContent>
    </Card>
  );
}

function TicketTypeIcon({ type }: { type: CSTicket["type"] }) {
  const configs: Record<string, { color: string; icon: React.ReactNode }> = {
    refund: { color: "bg-emerald-500/20", icon: <DollarSign className="h-5 w-5 text-emerald-400" /> },
    shipping: { color: "bg-cyan-500/20", icon: <Truck className="h-5 w-5 text-cyan-400" /> },
    quality: { color: "bg-amber-500/20", icon: <Package className="h-5 w-5 text-amber-400" /> },
    general: { color: "bg-slate-500/20", icon: <MessageCircle className="h-5 w-5 text-slate-400" /> }
  };

  const config = configs[type];

  return (
    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", config.color)}>
      {config.icon}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: CSTicket["priority"] }) {
  const configs: Record<string, string> = {
    high: "bg-rose-500/20 text-rose-400",
    medium: "bg-amber-500/20 text-amber-400",
    low: "bg-slate-500/20 text-slate-400"
  };

  return (
    <Badge className={configs[priority]}>
      {priority}
    </Badge>
  );
}

function StatusBadge({ status }: { status: CSTicket["status"] }) {
  const configs: Record<string, { color: string; label: string }> = {
    open: { color: "bg-amber-500/20 text-amber-400", label: "Open" },
    processing: { color: "bg-cyan-500/20 text-cyan-400", label: "Processing" },
    resolved: { color: "bg-emerald-500/20 text-emerald-400", label: "Resolved" },
    escalated: { color: "bg-purple-500/20 text-purple-400", label: "Escalated" }
  };

  const config = configs[status];

  return (
    <Badge variant="outline" className={config.color}>
      {config.label}
    </Badge>
  );
}

function AIResolutionCard({
  resolution,
  ticket,
  onApprove,
  onEscalate,
  isProcessing
}: {
  resolution: AIResolution;
  ticket: CSTicket;
  onApprove: () => void;
  onEscalate: () => void;
  isProcessing: boolean;
}) {
  const actionColors: Record<string, { bg: string; text: string; border: string }> = {
    approve: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
    deny: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
    escalate: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
    respond: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" }
  };

  const colors = actionColors[resolution.action];

  return (
    <div className={cn("rounded-lg border p-3", colors.bg, colors.border)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Bot className={cn("h-4 w-4", colors.text)} />
          <span className="text-xs font-medium">AI Recommendation</span>
        </div>
        <Badge className={cn(colors.bg, colors.text, "text-[10px]")}>
          {Math.round(resolution.confidence * 100)}%
        </Badge>
      </div>

      <div className={cn("text-sm font-medium mb-1", colors.text)}>
        {resolution.action.charAt(0).toUpperCase() + resolution.action.slice(1)}
      </div>

      <p className="text-[10px] text-slate-400 mb-3 line-clamp-2">
        {resolution.reasoning}
      </p>

      {resolution.autoExecuted ? (
        <div className="flex items-center gap-1 text-[10px] text-emerald-400">
          <CheckCircle className="h-3 w-3" />
          Auto-executed {resolution.executedAt && `at ${new Date(resolution.executedAt).toLocaleTimeString()}`}
        </div>
      ) : ticket.status === "escalated" ? (
        <div className="flex items-center gap-1 text-[10px] text-purple-400">
          <ArrowUpRight className="h-3 w-3" />
          Escalated to human agent
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={onApprove}
            disabled={isProcessing}
            className="flex-1 h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <ThumbsUp className="h-3 w-3" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onEscalate}
            disabled={isProcessing}
            className="flex-1 h-7 text-xs border-slate-600"
          >
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

function RuleCard({
  title,
  description,
  triggerCount,
  successRate,
  active
}: {
  title: string;
  description: string;
  triggerCount: number;
  successRate: number;
  active: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border p-4",
      active
        ? "border-emerald-500/30 bg-emerald-500/5"
        : "border-slate-700 bg-slate-800/50"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm">{title}</span>
        <Badge className={active ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}>
          {active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <p className="text-xs text-slate-400 mb-3">{description}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Triggered: {triggerCount} times</span>
        <span className="text-emerald-400">{successRate}% success</span>
      </div>
    </div>
  );
}






