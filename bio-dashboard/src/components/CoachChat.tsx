"use client";

import * as React from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
};

export function CoachChat({
  messages,
  onSend
}: {
  messages: ChatMsg[];
  onSend: (text: string) => void;
}) {
  const [text, setText] = React.useState("");
  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function submit() {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  }

  return (
    <div className="flex h-[62vh] flex-col">
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-auto rounded-xl border bg-card p-3"
        aria-label="AI Dr. Coach 채팅"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              )}
            >
              {m.text}
            </div>
          </div>
        ))}
        {messages.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            예: “요즘 왜 이렇게 피곤하지?”
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="AI Dr. Coach에게 질문하기…"
          aria-label="질문 입력"
        />
        <Button onClick={submit} size="icon" aria-label="전송">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}







