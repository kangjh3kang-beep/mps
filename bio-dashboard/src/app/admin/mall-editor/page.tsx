"use client";

import * as React from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Eye,
  Image,
  Loader2,
  MessageSquare,
  Palette,
  Pencil,
  RefreshCw,
  Rocket,
  Send,
  Sparkles,
  Type,
  Wand2,
  X,
  Zap
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  type MallUIState,
  type DesignCommand,
  type PromptAnalysis,
  getDefaultMallState,
  parseDesignPrompt
} from "@/lib/commerce-ai";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  analysis?: PromptAnalysis;
}

export default function MallEditorPage() {
  const [currentState, setCurrentState] = React.useState<MallUIState>(getDefaultMallState);
  const [previewState, setPreviewState] = React.useState<MallUIState | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "안녕하세요! 저는 Mall AI Designer입니다. 자연어로 몰 디자인을 변경할 수 있어요.\n\n예시:\n• \"크리스마스 테마로 바꿔줘\"\n• \"배너 슬로건을 'Gift Health'로 변경\"\n• \"공지 바를 추가해: Holiday Sale!\"\n\n무엇을 도와드릴까요?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [pendingCommand, setPendingCommand] = React.useState<DesignCommand | null>(null);
  const [publishStatus, setPublishStatus] = React.useState<"idle" | "publishing" | "published">("idle");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    // Simulate AI processing
    await new Promise(r => setTimeout(r, 1500));

    // Parse the prompt
    const analysis = parseDesignPrompt(input, currentState);
    const primaryCommand = analysis.commands[0];

    // Generate response
    let responseContent = "";
    if (primaryCommand.confidence > 0.7) {
      responseContent = `✅ **요청을 분석했습니다**\n\n📋 **의도:** ${analysis.intent.replace(/_/g, " ")}\n🎯 **신뢰도:** ${Math.round(primaryCommand.confidence * 100)}%\n\n💭 **분석:**\n${primaryCommand.reasoning}\n\n미리보기를 확인하시고 **적용** 버튼을 눌러주세요.`;
      setPreviewState(primaryCommand.preview);
      setPendingCommand(primaryCommand);
    } else {
      responseContent = `🤔 **요청을 정확히 이해하지 못했어요.**\n\n${primaryCommand.reasoning}\n\n다음 형식으로 시도해보세요:\n• "크리스마스 테마로 변경"\n• "배너 제목을 '새해 건강 프로모션'으로"\n• "빨간색 테마로 바꿔줘"`;
    }

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}_ai`,
      role: "assistant",
      content: responseContent,
      timestamp: new Date().toISOString(),
      analysis
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsProcessing(false);
  };

  const applyChanges = () => {
    if (previewState) {
      setCurrentState(previewState);
      setPreviewState(null);
      setPendingCommand(null);
      
      const confirmMessage: ChatMessage = {
        id: `msg_${Date.now()}_confirm`,
        role: "assistant",
        content: "✅ **변경사항이 적용되었습니다!**\n\n스테이징 환경에 반영됐어요. **Publish** 버튼을 눌러 라이브에 배포하세요.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, confirmMessage]);
    }
  };

  const cancelChanges = () => {
    setPreviewState(null);
    setPendingCommand(null);
    
    const cancelMessage: ChatMessage = {
      id: `msg_${Date.now()}_cancel`,
      role: "assistant",
      content: "변경을 취소했습니다. 다른 요청이 있으시면 말씀해주세요!",
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, cancelMessage]);
  };

  const handlePublish = async () => {
    setPublishStatus("publishing");
    await new Promise(r => setTimeout(r, 2000));
    setPublishStatus("published");
    
    const publishMessage: ChatMessage = {
      id: `msg_${Date.now()}_publish`,
      role: "assistant",
      content: "🚀 **라이브 배포 완료!**\n\n모든 변경사항이 프로덕션에 반영되었습니다.",
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, publishMessage]);
    
    setTimeout(() => setPublishStatus("idle"), 3000);
  };

  const displayState = previewState ?? currentState;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="h-6 w-6 text-purple-400" />
            AI Commerce Manager
          </h1>
          <p className="text-slate-400 text-sm">Generative UI Designer & No-Code Mall Editor</p>
        </div>
        <div className="flex items-center gap-3">
          {previewState && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 animate-pulse">
              <Eye className="h-3 w-3 mr-1" />
              Preview Mode
            </Badge>
          )}
          <Button
            onClick={handlePublish}
            disabled={publishStatus !== "idle" || !!previewState}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {publishStatus === "publishing" ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing...</>
            ) : publishStatus === "published" ? (
              <><Check className="h-4 w-4 mr-2" /> Published!</>
            ) : (
              <><Rocket className="h-4 w-4 mr-2" /> Publish to Live</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat Panel */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              Prompt-to-UI Designer
            </CardTitle>
            <CardDescription>
              자연어로 몰 디자인을 변경하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map(msg => (
                  <div
                    key={msg.id}
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
                      <div className="text-[10px] mt-2 opacity-60">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        AI가 디자인을 분석중...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Action Buttons (when preview is active) */}
            {pendingCommand && (
              <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-800/50">
                <span className="text-sm text-slate-400">
                  변경사항을 적용하시겠습니까?
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelChanges}
                    className="border-slate-600"
                  >
                    <X className="h-4 w-4 mr-1" />
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={applyChanges}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    적용
                  </Button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="예: 크리스마스 테마로 바꿔줘..."
                  className="bg-slate-800 border-slate-700"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick Commands */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: "🎄 Christmas Theme", prompt: "크리스마스 테마로 변경해줘" },
                  { label: "🎆 New Year", prompt: "새해 테마로 바꿔줘 with 'Happy New Year' slogan" },
                  { label: "💙 Blue Theme", prompt: "의료용 블루 테마로 리셋" },
                  { label: "📢 Add Sale", prompt: "공지 바 추가: 'Winter Sale - 20% OFF'" }
                ].map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInput(cmd.prompt)}
                    className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Eye className="h-4 w-4 text-cyan-400" />
                Live Preview
              </CardTitle>
              <Badge variant="outline" className={cn(
                previewState ? "border-amber-500/50 text-amber-400" : "border-slate-600 text-slate-400"
              )}>
                {previewState ? "Staging" : "Current Live"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mini Mall Preview */}
            <div 
              className="rounded-lg overflow-hidden m-4"
              style={{ 
                backgroundColor: displayState.theme.backgroundColor,
                fontFamily: displayState.theme.fontFamily
              }}
            >
              {/* Announcement Bar */}
              {displayState.announcementBar.enabled && (
                <div 
                  className="px-4 py-2 text-center text-sm"
                  style={{
                    backgroundColor: displayState.announcementBar.backgroundColor,
                    color: displayState.announcementBar.textColor
                  }}
                >
                  {displayState.announcementBar.text}
                </div>
              )}
              
              {/* Header */}
              <div 
                className="px-4 py-3 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${displayState.theme.primaryColor}20` }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: displayState.theme.primaryColor }}
                  >
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span 
                    className="font-bold"
                    style={{ color: displayState.theme.textColor }}
                  >
                    Manpasik Mall
                  </span>
                </div>
                <div className="flex gap-4 text-sm" style={{ color: displayState.theme.textColor }}>
                  <span>Shop</span>
                  <span>Cart</span>
                  <span>My</span>
                </div>
              </div>

              {/* Hero Banner */}
              <div 
                className="relative h-48 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${displayState.theme.primaryColor}40, ${displayState.theme.secondaryColor}40)`
                }}
              >
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundColor: displayState.heroBanner.overlayColor,
                    opacity: displayState.heroBanner.overlayOpacity
                  }}
                />
                <div className="relative z-10 text-center px-6">
                  <h2 
                    className="text-2xl font-bold mb-2"
                    style={{ 
                      color: displayState.heroBanner.theme === "dark" ? "#ffffff" : displayState.theme.textColor 
                    }}
                  >
                    {displayState.heroBanner.headline}
                  </h2>
                  <p 
                    className="text-sm mb-4 opacity-80"
                    style={{ 
                      color: displayState.heroBanner.theme === "dark" ? "#ffffff" : displayState.theme.textColor 
                    }}
                  >
                    {displayState.heroBanner.subheadline}
                  </p>
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: displayState.theme.accentColor }}
                  >
                    {displayState.heroBanner.ctaText}
                  </button>
                </div>
              </div>

              {/* Featured Products Placeholder */}
              <div className="p-4">
                <h3 
                  className="text-sm font-medium mb-3"
                  style={{ color: displayState.theme.textColor }}
                >
                  Featured Products
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(i => (
                    <div 
                      key={i}
                      className="rounded-lg p-3 text-center"
                      style={{ 
                        backgroundColor: `${displayState.theme.primaryColor}10`,
                        borderRadius: displayState.theme.borderRadius
                      }}
                    >
                      <div 
                        className="w-8 h-8 rounded mx-auto mb-2"
                        style={{ backgroundColor: `${displayState.theme.primaryColor}30` }}
                      />
                      <div className="text-[10px]" style={{ color: displayState.theme.textColor }}>
                        Product {i}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Theme Details */}
            <div className="p-4 border-t border-slate-800">
              <div className="text-xs font-medium text-slate-400 mb-3">Current Theme Settings</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: displayState.theme.primaryColor }}
                  />
                  <span className="text-slate-400">Primary:</span>
                  <span className="font-mono">{displayState.theme.primaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: displayState.theme.secondaryColor }}
                  />
                  <span className="text-slate-400">Secondary:</span>
                  <span className="font-mono">{displayState.theme.secondaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: displayState.theme.accentColor }}
                  />
                  <span className="text-slate-400">Accent:</span>
                  <span className="font-mono">{displayState.theme.accentColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-400">Font:</span>
                  <span>{displayState.theme.fontFamily.split(",")[0]}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DALL-E Integration */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Image className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium">AI Image Generator</div>
                <div className="text-xs text-slate-400">DALL-E Integration (Mock)</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              배너 이미지를 자연어로 생성합니다. 예: "건강한 가족이 웃고 있는 크리스마스 배너"
            </p>
            <Button variant="outline" size="sm" className="w-full border-slate-700">
              Generate Banner Image
            </Button>
          </CardContent>
        </Card>

        {/* A/B Testing */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium">A/B Testing</div>
                <div className="text-xs text-slate-400">Compare design variants</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              두 디자인을 비교하고 전환율이 높은 버전을 자동 선택합니다.
            </p>
            <Button variant="outline" size="sm" className="w-full border-slate-700">
              Create A/B Test
            </Button>
          </CardContent>
        </Card>

        {/* Version History */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-medium">Version History</div>
                <div className="text-xs text-slate-400">Rollback anytime</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              모든 변경사항이 저장됩니다. 이전 버전으로 즉시 롤백 가능합니다.
            </p>
            <Button variant="outline" size="sm" className="w-full border-slate-700">
              View History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






