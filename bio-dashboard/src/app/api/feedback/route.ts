import { NextRequest, NextResponse } from "next/server";
import { feedbackStore, adaptiveCoaching, type FeedbackEntry } from "@/lib/learning";

/**
 * POST /api/feedback
 * 
 * Part 5 Section 7.2: Coaching Quality Feedback
 * 사용자 피드백을 수집하여 코칭 품질 개선에 활용
 * 
 * Request Body:
 * {
 *   messageId: string;
 *   feedbackType: "positive" | "negative";
 *   context?: {
 *     question: string;
 *     response: string;
 *     healthScore: number;
 *     concentration: number;
 *   };
 * }
 */

type FeedbackRequest = {
  messageId: string;
  feedbackType: "positive" | "negative";
  context?: {
    question: string;
    response: string;
    healthScore: number;
    concentration: number;
  };
};

function isValidRequest(body: unknown): body is FeedbackRequest {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;

  if (typeof obj.messageId !== "string" || obj.messageId.length === 0) return false;
  if (obj.feedbackType !== "positive" && obj.feedbackType !== "negative") return false;

  // context는 선택적
  if (obj.context !== undefined) {
    const ctx = obj.context as Record<string, unknown>;
    if (typeof ctx !== "object" || ctx === null) return false;
    if (typeof ctx.question !== "string") return false;
    if (typeof ctx.response !== "string") return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    // 1. Validation
    if (!isValidRequest(body)) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          expected: {
            messageId: "string",
            feedbackType: "'positive' | 'negative'",
            context: "(optional) { question, response, healthScore, concentration }"
          }
        },
        { status: 400 }
      );
    }

    const { messageId, feedbackType, context } = body;

    // 2. Create feedback entry
    const feedback: FeedbackEntry = {
      id: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      messageId,
      feedbackType,
      timestamp: Date.now(),
      context
    };

    // 3. Store feedback
    feedbackStore.add(feedback);

    // 4. Update adaptive coaching based on feedback
    adaptiveCoaching.recordUserResponse(true, feedbackType);

    // 5. Simulate weight update
    const weightDelta = feedbackType === "positive" ? 0.1 : -0.1;
    console.log(`[Feedback API] Weight updated: ${weightDelta > 0 ? "+" : ""}${weightDelta}`);
    console.log(`[Feedback API] Coaching personality: ${adaptiveCoaching.getPersonality()}`);

    // 6. Response
    const response = {
      success: true,
      feedbackId: feedback.id,
      message: `Feedback recorded: ${feedbackType}`,
      learningStatus: {
        totalFeedbacks: feedbackStore.length,
        positiveRate: Number((feedbackStore.getPositiveRate() * 100).toFixed(1)),
        currentPersonality: adaptiveCoaching.getPersonality(),
        engagement: adaptiveCoaching.getState().userEngagementScore
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[Feedback API] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback
 * 피드백 통계 조회
 */
export async function GET() {
  const recentFeedbacks = feedbackStore.getRecent(10);
  const restAdvicePattern = feedbackStore.analyzePattern("휴식");
  
  return NextResponse.json({
    totalCount: feedbackStore.length,
    positiveRate: Number((feedbackStore.getPositiveRate() * 100).toFixed(1)),
    recentFeedbacks: recentFeedbacks.map(f => ({
      id: f.id,
      type: f.feedbackType,
      timestamp: new Date(f.timestamp).toISOString()
    })),
    patterns: {
      restAdvice: restAdvicePattern
    },
    coaching: {
      personality: adaptiveCoaching.getPersonality(),
      state: adaptiveCoaching.getState()
    }
  });
}






