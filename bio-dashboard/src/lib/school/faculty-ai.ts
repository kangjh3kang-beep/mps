/**
 * Faculty AI - Automated School Management
 * 
 * The Librarian: Auto-generates tutorials from updates
 * The Moderator: Sentiment analysis and content moderation
 */

/**
 * Content Update Types
 */
export interface ContentUpdate {
  type: "firmware" | "feature" | "fix" | "security";
  version: string;
  title: string;
  description: string;
  changes: string[];
  date: Date;
}

/**
 * Generated Tutorial from Update
 */
export interface GeneratedTutorial {
  id: string;
  title: string;
  content: string;
  category: string;
  relatedUpdate: string;
  createdAt: Date;
  isReviewed: boolean;
}

/**
 * Moderation Result
 */
export interface ModerationResult {
  action: "approve" | "flag" | "hide" | "alert_admin";
  reason?: string;
  confidence: number;
  sentiment: {
    score: number; // -1 to 1
    label: "negative" | "neutral" | "positive";
  };
  toxicity: {
    score: number; // 0 to 1
    categories: string[];
  };
}

/**
 * The Librarian - Auto Content Generator
 */
export class LibrarianAI {
  /**
   * Generate tutorial content from a firmware/feature update
   */
  static generateTutorialFromUpdate(update: ContentUpdate): GeneratedTutorial {
    const tutorialTemplates: Record<ContentUpdate["type"], (update: ContentUpdate) => string> = {
      firmware: (u) => `
# ${u.title}

새로운 펌웨어 버전 ${u.version}이 출시되었습니다!

## 주요 변경사항

${u.changes.map(c => `- ${c}`).join('\n')}

## 업데이트 방법

1. 앱 설정에서 '시스템 업데이트' 메뉴로 이동합니다
2. '새 업데이트 확인' 버튼을 탭합니다
3. 화면의 지시에 따라 업데이트를 설치합니다
4. 업데이트 완료 후 기기가 자동으로 재시작됩니다

⚠️ **주의**: 업데이트 중에는 기기를 끄지 마세요!
      `.trim(),
      
      feature: (u) => `
# ${u.title} 사용법

새로운 기능이 추가되었습니다! 🎉

## 소개

${u.description}

## 사용 방법

${u.changes.map((c, i) => `### ${i + 1}. ${c}`).join('\n\n')}

## 팁

이 기능을 최대한 활용하려면:
- 최신 버전의 앱을 사용하세요
- 안정적인 인터넷 연결을 확인하세요
- 궁금한 점은 AI 코치에게 물어보세요!
      `.trim(),
      
      fix: (u) => `
# 버그 수정 안내

버전 ${u.version}에서 다음 문제들이 수정되었습니다:

${u.changes.map(c => `- ✅ ${c}`).join('\n')}

## 수정 사항 적용

앱을 업데이트하면 자동으로 적용됩니다.

문제가 계속되면 고객센터에 문의해주세요.
      `.trim(),
      
      security: (u) => `
# 보안 업데이트

⚠️ **중요**: 이 보안 업데이트를 즉시 적용해주세요.

## 보안 강화 내용

${u.changes.map(c => `- 🔒 ${c}`).join('\n')}

## 업데이트 방법

1. 앱 스토어에서 최신 버전으로 업데이트
2. 앱 재시작
3. 필요시 다시 로그인

귀하의 건강 데이터 보안을 위해 항상 최신 버전을 유지해주세요.
      `.trim()
    };
    
    const template = tutorialTemplates[update.type];
    const content = template(update);
    
    return {
      id: `auto-${Date.now()}`,
      title: update.title,
      content,
      category: update.type,
      relatedUpdate: update.version,
      createdAt: new Date(),
      isReviewed: false
    };
  }

  /**
   * Generate notification for users
   */
  static generateUserNotification(update: ContentUpdate): {
    title: string;
    body: string;
    priority: "low" | "normal" | "high";
  } {
    const priorities: Record<ContentUpdate["type"], "low" | "normal" | "high"> = {
      firmware: "normal",
      feature: "normal",
      fix: "low",
      security: "high"
    };
    
    return {
      title: update.type === "security" 
        ? "🔒 중요 보안 업데이트" 
        : `✨ ${update.title}`,
      body: update.description.slice(0, 100) + (update.description.length > 100 ? "..." : ""),
      priority: priorities[update.type]
    };
  }
}

/**
 * The Moderator - Content Moderation AI
 */
export class ModeratorAI {
  private static toxicPatterns = [
    /욕설|비속어|혐오/i,
    /spam|스팸/i,
    /광고|홍보/i,
    /(바보|멍청|짜증|열받|화남)/i
  ];
  
  private static goldenPatterns = [
    /좋은 아이디어/i,
    /도움이 됐/i,
    /감사합니다/i,
    /훌륭한|대단한|멋진/i
  ];

  /**
   * Analyze content for moderation
   */
  static async analyzeContent(content: string): Promise<ModerationResult> {
    // Simple rule-based analysis (in production, use ML model)
    const sentiment = this.analyzeSentiment(content);
    const toxicity = this.analyzeToxicity(content);
    
    let action: ModerationResult["action"] = "approve";
    let reason: string | undefined;
    
    if (toxicity.score > 0.8) {
      action = "hide";
      reason = "Toxic content detected";
    } else if (toxicity.score > 0.5) {
      action = "flag";
      reason = "Potentially inappropriate content";
    } else if (sentiment.score > 0.8 && content.length > 50) {
      action = "alert_admin";
      reason = "Golden idea candidate";
    }
    
    return {
      action,
      reason,
      confidence: Math.max(sentiment.score, toxicity.score),
      sentiment,
      toxicity
    };
  }

  /**
   * Simple sentiment analysis
   */
  private static analyzeSentiment(content: string): {
    score: number;
    label: "negative" | "neutral" | "positive";
  } {
    let score = 0;
    
    // Positive indicators
    const positiveWords = ["좋", "훌륭", "감사", "도움", "멋", "대단", "최고"];
    const negativeWords = ["나쁜", "싫", "짜증", "화", "문제", "오류", "버그"];
    
    positiveWords.forEach(word => {
      if (content.includes(word)) score += 0.2;
    });
    
    negativeWords.forEach(word => {
      if (content.includes(word)) score -= 0.2;
    });
    
    // Golden pattern bonus
    if (this.goldenPatterns.some(p => p.test(content))) {
      score += 0.3;
    }
    
    // Clamp between -1 and 1
    score = Math.max(-1, Math.min(1, score));
    
    return {
      score,
      label: score > 0.2 ? "positive" : score < -0.2 ? "negative" : "neutral"
    };
  }

  /**
   * Simple toxicity detection
   */
  private static analyzeToxicity(content: string): {
    score: number;
    categories: string[];
  } {
    let score = 0;
    const categories: string[] = [];
    
    this.toxicPatterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        score += 0.3;
        const categoryNames = ["profanity", "spam", "advertisement", "mild_negative"];
        categories.push(categoryNames[index] || "unknown");
      }
    });
    
    // Clamp between 0 and 1
    score = Math.min(1, score);
    
    return { score, categories };
  }

  /**
   * Handle moderation action
   */
  static async handleModerationAction(
    contentId: string,
    result: ModerationResult,
    onAlert?: (message: string) => void
  ): Promise<void> {
    switch (result.action) {
      case "approve":
        console.log(`[Moderator] Content ${contentId} approved`);
        break;
        
      case "flag":
        console.log(`[Moderator] Content ${contentId} flagged: ${result.reason}`);
        // Add to review queue
        break;
        
      case "hide":
        console.log(`[Moderator] Content ${contentId} hidden: ${result.reason}`);
        // Mark as hidden in database
        break;
        
      case "alert_admin":
        console.log(`[Moderator] Golden idea found: ${contentId}`);
        onAlert?.(`🌟 Golden Idea Detected! Content ID: ${contentId}`);
        break;
    }
  }
}

/**
 * Community Health Monitor
 */
export class CommunityHealthMonitor {
  private static readonly HEALTH_THRESHOLDS = {
    toxicityRate: 0.1, // 10% max toxic content
    engagementRate: 0.5, // 50% min engagement
    responseTime: 24, // 24 hours max response time
  };

  /**
   * Calculate community health score
   */
  static calculateHealthScore(metrics: {
    totalPosts: number;
    toxicPosts: number;
    activeUsers: number;
    totalUsers: number;
    avgResponseTimeHours: number;
  }): {
    score: number;
    status: "healthy" | "warning" | "critical";
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let score = 100;
    
    // Toxicity penalty
    const toxicityRate = metrics.toxicPosts / metrics.totalPosts;
    if (toxicityRate > this.HEALTH_THRESHOLDS.toxicityRate) {
      score -= 30;
      recommendations.push("독성 콘텐츠 비율이 높습니다. 모더레이션을 강화하세요.");
    }
    
    // Engagement bonus/penalty
    const engagementRate = metrics.activeUsers / metrics.totalUsers;
    if (engagementRate < this.HEALTH_THRESHOLDS.engagementRate) {
      score -= 20;
      recommendations.push("참여율이 낮습니다. 이벤트나 인센티브를 고려하세요.");
    } else if (engagementRate > 0.7) {
      score += 10;
    }
    
    // Response time penalty
    if (metrics.avgResponseTimeHours > this.HEALTH_THRESHOLDS.responseTime) {
      score -= 15;
      recommendations.push("평균 응답 시간이 깁니다. 더 많은 모더레이터가 필요할 수 있습니다.");
    }
    
    // Clamp score
    score = Math.max(0, Math.min(100, score));
    
    return {
      score,
      status: score >= 70 ? "healthy" : score >= 40 ? "warning" : "critical",
      recommendations
    };
  }
}

/**
 * Auto-Update Trigger
 * Watches for system updates and triggers tutorial generation
 */
export class AutoUpdateTrigger {
  private static listeners: Array<(tutorial: GeneratedTutorial) => void> = [];

  /**
   * Register listener for new tutorials
   */
  static onTutorialGenerated(callback: (tutorial: GeneratedTutorial) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Process a new update and generate tutorial
   */
  static async processUpdate(update: ContentUpdate): Promise<GeneratedTutorial> {
    // Generate tutorial
    const tutorial = LibrarianAI.generateTutorialFromUpdate(update);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(tutorial));
    
    // Generate user notification
    const notification = LibrarianAI.generateUserNotification(update);
    console.log(`[AutoUpdate] Notification generated:`, notification);
    
    return tutorial;
  }
}






