/**
 * Action Agent: AI Function Calling Implementation
 * Allows the AI Coach to control the app, not just answer text.
 */

import type { ChatContext } from "@/components/dashboard/AICoachChat";

/* ============================================
 * Tool Definitions
 * ============================================ */

export type ToolCall =
  | { tool: "Maps_to"; args: { page: "store" | "result" | "settings" | "measure"; analyte?: string } }
  | { tool: "start_measurement"; args: { mode?: string } }
  | { tool: "change_setting"; args: { key: "darkMode" | "fontScale" | "seniorMode"; value: unknown } }
  | { tool: "fetch_data"; args: { metric: "lactate" | "glucose"; range: "last_month" | "last_week" | "today" } };

export type AgentPlan = {
  toolCalls: ToolCall[];
  response: string;
  /** If true, agent should speak the response aloud (for voice input) */
  speakResponse?: boolean;
};

/* ============================================
 * Natural Language Parsing
 * ============================================ */

function pickAnalyte(text: string): "glucose" | "lactate" | "unknown" {
  const t = text.toLowerCase();
  if (t.includes("glucose") || t.includes("포도당") || t.includes("혈당")) return "glucose";
  if (t.includes("lactate") || t.includes("젖산")) return "lactate";
  return "unknown";
}

/**
 * Parse natural language input into a list of tool calls.
 * Returns an empty array if no action is recognized (falls back to normal chat).
 */
export function parseNaturalLanguageToTools(text: string): ToolCall[] {
  const t = text.trim().toLowerCase();
  if (!t) return [];

  const calls: ToolCall[] = [];

  // Navigation
  if (t.includes("스토어") || t.includes("store") || t.includes("쇼핑") || t.includes("mall")) {
    calls.push({ tool: "Maps_to", args: { page: "store" } });
  }
  if (t.includes("결과") || t.includes("result") || t.includes("리포트") || t.includes("report")) {
    calls.push({ tool: "Maps_to", args: { page: "result" } });
  }
  if (
    t.includes("설정") ||
    t.includes("settings") ||
    t.includes("마이페이지") ||
    t.includes("my page")
  ) {
    calls.push({ tool: "Maps_to", args: { page: "settings" } });
  }

  // Senior mode
  if (t.includes("시니어") || t.includes("senior")) {
    const off = t.includes("끄") || t.includes("off") || t.includes("해제");
    calls.push({ tool: "change_setting", args: { key: "seniorMode", value: !off } });
  }

  // Dark mode
  if (t.includes("다크") || t.includes("dark mode") || t.includes("dark")) {
    if (t.includes("켜") || t.includes("on") || t.includes("enable")) {
      calls.push({ tool: "change_setting", args: { key: "darkMode", value: true } });
    } else if (t.includes("끄") || t.includes("off") || t.includes("disable")) {
      calls.push({ tool: "change_setting", args: { key: "darkMode", value: false } });
    }
  }

  // Font size
  if (t.includes("글씨") || t.includes("폰트") || t.includes("font")) {
    if (t.includes("크게") || t.includes("larger") || t.includes("big")) {
      calls.push({ tool: "change_setting", args: { key: "fontScale", value: 1.25 } });
    }
    if (t.includes("작게") || t.includes("smaller") || t.includes("small")) {
      calls.push({ tool: "change_setting", args: { key: "fontScale", value: 1.0 } });
    }
  }

  // Fetch data
  if (
    (t.includes("지난달") || t.includes("last month") || t.includes("한달")) &&
    (t.includes("젖산") || t.includes("lactate"))
  ) {
    calls.push({ tool: "fetch_data", args: { metric: "lactate", range: "last_month" } });
  } else if (
    (t.includes("최근") || t.includes("last") || t.includes("주") || t.includes("week")) &&
    (t.includes("7일") || t.includes("일주일") || t.includes("week")) &&
    (t.includes("젖산") || t.includes("lactate"))
  ) {
    calls.push({ tool: "fetch_data", args: { metric: "lactate", range: "last_week" } });
  }

  // Measurement intent
  if (
    t.includes("측정") ||
    t.includes("measure") ||
    t.includes("재기") ||
    t.includes("재 줘") ||
    t.includes("지금")
  ) {
    let analyte: string | undefined;
    if (t.includes("glucose") || t.includes("혈당") || t.includes("포도당")) analyte = "glucose";
    if (t.includes("lactate") || t.includes("젖산")) analyte = "lactate";

    if (analyte) {
      calls.push({ tool: "Maps_to", args: { page: "measure", analyte } });
      calls.push({ tool: "start_measurement", args: { mode: analyte } });
    } else {
      calls.push({ tool: "Maps_to", args: { page: "measure" } });
    }
  }

  return calls;
}

/**
 * Higher-level planner: returns an AgentPlan with both tool calls and a response.
 * This is used for voice/microphone input where we want spoken feedback.
 */
export function planFromNaturalLanguage(input: string, ctx: ChatContext): AgentPlan | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;

  // Navigation
  if (t.includes("스토어") || t.includes("store") || t.includes("쇼핑")) {
    return {
      toolCalls: [{ tool: "Maps_to", args: { page: "store" } }],
      response: "스토어로 이동할게요.",
      speakResponse: true
    };
  }
  if (t.includes("결과") || t.includes("result") || t.includes("리포트")) {
    return {
      toolCalls: [{ tool: "Maps_to", args: { page: "result" } }],
      response: "최근 결과 화면으로 이동할게요.",
      speakResponse: true
    };
  }
  if (t.includes("설정") || t.includes("settings")) {
    // Dark mode toggles
    if (t.includes("다크") && (t.includes("켜") || t.includes("on"))) {
      return {
        toolCalls: [
          { tool: "change_setting", args: { key: "darkMode", value: true } },
          { tool: "Maps_to", args: { page: "settings" } }
        ],
        response: "다크 모드를 켜고 설정 화면으로 이동할게요.",
        speakResponse: true
      };
    }
    if (t.includes("다크") && (t.includes("끄") || t.includes("off"))) {
      return {
        toolCalls: [
          { tool: "change_setting", args: { key: "darkMode", value: false } },
          { tool: "Maps_to", args: { page: "settings" } }
        ],
        response: "다크 모드를 끄고 설정 화면으로 이동할게요.",
        speakResponse: true
      };
    }
    // Senior mode toggles
    if (t.includes("시니어") || t.includes("senior")) {
      const on = t.includes("켜") || t.includes("on") || t.includes("활성");
      const off = t.includes("끄") || t.includes("off") || t.includes("해제");
      const value = off ? false : on ? true : true;
      return {
        toolCalls: [
          { tool: "change_setting", args: { key: "seniorMode", value } },
          { tool: "Maps_to", args: { page: "settings" } }
        ],
        response: value
          ? "시니어 모드를 켰어요. 글씨를 더 크게 보여드릴게요."
          : "시니어 모드를 껐어요.",
        speakResponse: true
      };
    }
    return {
      toolCalls: [{ tool: "Maps_to", args: { page: "settings" } }],
      response: "설정 화면으로 이동할게요.",
      speakResponse: true
    };
  }

  // Measurement intent
  if (
    t.includes("측정") ||
    t.includes("measure") ||
    t.includes("재기") ||
    t.includes("재 줘") ||
    t.includes("지금")
  ) {
    const analyte = pickAnalyte(t);
    return {
      toolCalls: [
        { tool: "Maps_to", args: { page: "measure" } },
        { tool: "start_measurement", args: { mode: analyte !== "unknown" ? analyte : undefined } }
      ],
      response: `측정 화면으로 이동합니다. ${analyte === "glucose" ? "포도당(혈당)" : analyte === "lactate" ? "젖산" : "대상"} 카트리지를 삽입해 주세요.`,
      speakResponse: true
    };
  }

  // Fetch data
  if (
    (t.includes("lactate") || t.includes("젖산")) &&
    (t.includes("한달") || t.includes("month") || t.includes("지난달"))
  ) {
    return {
      toolCalls: [{ tool: "fetch_data", args: { metric: "lactate", range: "last_month" } }],
      response: "지난 한 달 젖산 데이터를 조회할게요.",
      speakResponse: true
    };
  }
  if (
    (t.includes("lactate") || t.includes("젖산")) &&
    (t.includes("주") || t.includes("week"))
  ) {
    return {
      toolCalls: [{ tool: "fetch_data", args: { metric: "lactate", range: "last_week" } }],
      response: "지난 일주일 젖산 데이터를 조회할게요.",
      speakResponse: true
    };
  }

  // No action; let normal chat answer handle it
  return null;
}

/* ============================================
 * Senior Mode Response Simplification
 * ============================================ */

/**
 * Simplify AI response text for Senior Mode.
 * Uses shorter sentences, simpler vocabulary, and avoids technical jargon.
 */
export function simplifySeniorResponse(text: string): string {
  // Replace technical terms with simpler alternatives
  let simplified = text
    .replace(/젖산 수치/g, "피로 지수")
    .replace(/lactate/gi, "피로 지수")
    .replace(/mmol\/L/g, "")
    .replace(/농도/g, "수치")
    .replace(/chronoamperometry/gi, "측정")
    .replace(/potentiostat/gi, "센서")
    .replace(/impedance/gi, "저항")
    .replace(/calibration/gi, "보정")
    .replace(/algorithm/gi, "계산")
    .replace(/coefficient/g, "값");

  // Break long sentences
  simplified = simplified
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => {
      if (sentence.length > 50) {
        return sentence.replace(/,\s*/g, ".\n");
      }
      return sentence;
    })
    .join(" ");

  return simplified;
}

/**
 * Generate voice-friendly response for text-to-speech
 */
export function generateVoiceResponse(text: string, seniorMode: boolean): string {
  let voiceText = text;

  if (seniorMode) {
    voiceText = simplifySeniorResponse(voiceText);
  }

  // Remove markdown formatting
  voiceText = voiceText
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove emojis for cleaner TTS
  voiceText = voiceText.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    ""
  );

  return voiceText.trim();
}
