"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Command,
  Download,
  FileText,
  Key,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Minimize2,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  type ConversationMessage,
  type AgentResponse,
  type AdminUser,
  parseCommand,
  executeCommand,
  generateNaturalResponse,
  getMockAdminUser
} from "@/lib/admin-agent";

export function MasterAdminAgent() {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [messages, setMessages] = React.useState<ConversationMessage[]>([
    {
      id: "welcome",
      role: "agent",
      content: "👋 Hello! I'm the Master Admin Agent. How can I help you manage the system today?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [user, setUser] = React.useState<AdminUser>(getMockAdminUser);
  const [mfaDialogOpen, setMfaDialogOpen] = React.useState(false);
  const [mfaCode, setMfaCode] = React.useState("");
  const [pendingCommand, setPendingCommand] = React.useState<ConversationMessage | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    // Parse command
    const command = parseCommand(input);

    if (command) {
      // Execute command
      const response = await executeCommand(command, user);

      const agentMessage: ConversationMessage = {
        id: `msg_${Date.now()}_agent`,
        role: "agent",
        content: response.message,
        timestamp: new Date().toISOString(),
        response,
        commandParsed: command
      };

      if (response.type === "mfa_required") {
        setPendingCommand(agentMessage);
        setMfaDialogOpen(true);
      }

      setMessages(prev => [...prev, agentMessage]);
    } else {
      // Natural language fallback
      const response = generateNaturalResponse(input);
      const agentMessage: ConversationMessage = {
        id: `msg_${Date.now()}_agent`,
        role: "agent",
        content: response.message,
        timestamp: new Date().toISOString(),
        response
      };
      setMessages(prev => [...prev, agentMessage]);
    }

    setIsProcessing(false);
  };

  const handleMfaVerify = async () => {
    if (mfaCode.length !== 6) return;

    // Simulate MFA verification
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1000));

    // Mock: Accept any 6-digit code for demo
    if (/^\d{6}$/.test(mfaCode)) {
      setUser(prev => ({
        ...prev,
        mfaVerified: true,
        lastMfaAt: new Date().toISOString()
      }));

      // Re-execute the pending command
      if (pendingCommand?.commandParsed) {
        const response = await executeCommand(pendingCommand.commandParsed, {
          ...user,
          mfaVerified: true,
          lastMfaAt: new Date().toISOString()
        });

        const agentMessage: ConversationMessage = {
          id: `msg_${Date.now()}_mfa_success`,
          role: "agent",
          content: response.message,
          timestamp: new Date().toISOString(),
          response
        };
        setMessages(prev => [...prev, agentMessage]);
      }

      setMfaDialogOpen(false);
      setMfaCode("");
      setPendingCommand(null);
    }

    setIsProcessing(false);
  };

  const handleAction = (action: string) => {
    if (action.startsWith("navigate:")) {
      const path = action.replace("navigate:", "");
      router.push(path);
      setIsOpen(false);
    } else if (action.startsWith("download:")) {
      // Simulate download
      const reportId = action.replace("download:", "");
      const blob = new Blob([`Report ${reportId} content`], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (action === "verify_mfa") {
      setMfaDialogOpen(true);
    }
  };

  const quickCommands = [
    { label: "System Health", command: "How is the system health?" },
    { label: "Revenue", command: "Show me the revenue for this week" },
    { label: "Recent Errors", command: "List recent errors" },
    { label: "Help", command: "help" }
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50"
      >
        <Bot className="h-7 w-7" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-6 right-6 w-72 rounded-xl bg-slate-900/98 backdrop-blur-xl border border-slate-700 shadow-2xl z-50 overflow-hidden"
      >
        <div
          className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-purple-400" />
            <span className="font-medium text-sm">Admin Agent</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 w-96 h-[600px] rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-slate-700 shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-sm">Master Admin Agent</div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Badge className="h-4 px-1 text-[9px] bg-purple-500/20 text-purple-400">
                  {user.level}
                </Badge>
                {user.mfaVerified && (
                  <Badge className="h-4 px-1 text-[9px] bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                    MFA
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id}>
                <div
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-4 py-3",
                      msg.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-slate-800 text-slate-200"
                    )}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {msg.content.split("**").map((part, i) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                      )}
                    </div>

                    {/* Render response data */}
                    {msg.response && (
                      <ResponseRenderer
                        response={msg.response}
                        onAction={handleAction}
                      />
                    )}

                    <div className="text-[10px] mt-2 opacity-60">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                    Processing...
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Quick Commands */}
        <div className="px-4 py-2 border-t border-slate-800">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => setInput(cmd.command)}
                className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a command..."
                className="pl-10 bg-slate-800 border-slate-700"
                disabled={isProcessing}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* MFA Dialog */}
      <Dialog open={mfaDialogOpen} onOpenChange={setMfaDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              MFA Verification Required
            </DialogTitle>
            <DialogDescription>
              This action requires multi-factor authentication. Enter your 6-digit code.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="flex justify-center">
              <Input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-48 text-center text-2xl font-mono tracking-widest bg-slate-800 border-slate-700"
                maxLength={6}
              />
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">
              Enter the code from your authenticator app
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMfaDialogOpen(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMfaVerify}
              disabled={mfaCode.length !== 6 || isProcessing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</>
              ) : (
                <><Key className="h-4 w-4 mr-2" /> Verify</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ============================================
 * Response Renderer
 * ============================================ */

function ResponseRenderer({
  response,
  onAction
}: {
  response: AgentResponse;
  onAction: (action: string) => void;
}) {
  if (!response.data && !response.actions && !response.report) return null;

  return (
    <div className="mt-3 space-y-3">
      {/* Chart Data */}
      {response.type === "chart" && response.data && (
        <div className="rounded-lg bg-slate-900 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <BarChart3 className="h-3 w-3" />
            Chart Data
          </div>
          {(response.data as any).labels && (
            <div className="flex items-end justify-between h-20 gap-1">
              {((response.data as any).values as number[]).map((val, idx) => {
                const max = Math.max(...((response.data as any).values as number[]));
                const height = (val / max) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-purple-500 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[8px] text-slate-500">
                      {(response.data as any).labels[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {(response.data as any).total && (
            <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-xs">
              <span className="text-slate-400">Total:</span>
              <span className="font-mono text-emerald-400">
                ₩{((response.data as any).total as number).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Table Data */}
      {response.type === "table" && response.data && (
        <div className="rounded-lg bg-slate-900 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                {((response.data as any).headers as string[]).map((h, idx) => (
                  <th key={idx} className="text-left p-2 text-slate-400 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {((response.data as any).rows as string[][]).map((row, idx) => (
                <tr key={idx} className="border-b border-slate-800/50">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="p-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report */}
      {response.type === "report" && response.report && (
        <div className="rounded-lg bg-slate-900 p-3">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium">{response.report.title}</span>
          </div>
          <div className="text-[10px] text-slate-400 mb-2">
            Generated: {new Date(response.report.generatedAt).toLocaleString()}
          </div>
          <div className="flex flex-wrap gap-1">
            {response.report.sections.map((section, idx) => (
              <Badge key={idx} variant="outline" className="text-[9px] border-slate-700">
                {section.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {response.actions && response.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {response.actions.map((action, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={action.variant === "destructive" ? "destructive" : action.variant === "outline" ? "outline" : "default"}
              onClick={() => onAction(action.action)}
              className={cn(
                "h-7 text-xs",
                action.variant === "default" && "bg-purple-600 hover:bg-purple-700",
                action.variant === "outline" && "border-slate-600"
              )}
            >
              {action.action.startsWith("download:") && <Download className="h-3 w-3 mr-1" />}
              {action.action.startsWith("navigate:") && <ArrowRight className="h-3 w-3 mr-1" />}
              {action.action.startsWith("email") && <Mail className="h-3 w-3 mr-1" />}
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}





