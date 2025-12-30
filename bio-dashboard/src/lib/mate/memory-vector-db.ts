/**
 * ============================================================
 * MANPASIK MATE - MEMORY VECTOR DATABASE
 * Personal Context Storage with Vector Embeddings
 * ============================================================
 */

export type MemoryType = 
  | 'preference'      // 좋아하는/싫어하는 것
  | 'event'          // 일어난 사건
  | 'health_pattern' // 건강 패턴
  | 'social'         // 인간관계
  | 'habit'          // 습관
  | 'goal';          // 목표

export interface UserMemory {
  id: string;
  type: MemoryType;
  content: string;
  tags: string[];
  emotion?: 'positive' | 'negative' | 'neutral';
  importance: number; // 0.0 - 1.0
  createdAt: Date;
  lastRecalledAt?: Date;
  recallCount: number;
  embedding?: number[]; // Vector embedding for similarity search
  context?: {
    trigger?: string;
    source?: string;
    relatedMemories?: string[];
  };
}

export interface MemorySearchResult {
  memory: UserMemory;
  similarity: number;
}

// Simple in-memory storage (in production, use IndexedDB or server)
const STORAGE_KEY = 'manpasik_mate_memories';

class MemoryVectorDBClass {
  private memories: Map<string, UserMemory> = new Map();
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserMemory[];
        parsed.forEach(m => {
          m.createdAt = new Date(m.createdAt);
          if (m.lastRecalledAt) m.lastRecalledAt = new Date(m.lastRecalledAt);
          this.memories.set(m.id, m);
        });
      }
      this.initialized = true;
    } catch (error) {
      console.error('[MemoryDB] Failed to load from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const array = Array.from(this.memories.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
    } catch (error) {
      console.error('[MemoryDB] Failed to save to storage:', error);
    }
  }

  /**
   * Generate a simple text embedding (in production, use OpenAI/Cohere API)
   * This is a placeholder using TF-IDF-like approach
   */
  private generateEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vocab = new Set(words);
    const embedding: number[] = new Array(128).fill(0);
    
    words.forEach((word, i) => {
      const hash = this.hashString(word);
      const idx = Math.abs(hash) % 128;
      embedding[idx] += 1 / (i + 1); // Position weighting
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (magnitude > 0) {
      return embedding.map(v => v / magnitude);
    }
    return embedding;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }

  /**
   * Store a new memory
   */
  store(memory: Omit<UserMemory, 'id' | 'createdAt' | 'recallCount' | 'embedding'>): UserMemory {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const embedding = this.generateEmbedding(memory.content + ' ' + memory.tags.join(' '));
    
    const newMemory: UserMemory = {
      ...memory,
      id,
      createdAt: new Date(),
      recallCount: 0,
      embedding,
    };

    this.memories.set(id, newMemory);
    this.saveToStorage();
    
    console.log('[MemoryDB] Stored memory:', newMemory.content);
    return newMemory;
  }

  /**
   * Extract and store memory from conversation
   */
  extractAndStore(userMessage: string): UserMemory | null {
    const lowerMsg = userMessage.toLowerCase();

    // Pattern matching for memory extraction
    const patterns = [
      // Preferences
      { 
        regex: /(싫어|안 좋아|못 먹|알레르기|안 먹)/,
        type: 'preference' as MemoryType,
        emotion: 'negative' as const,
        extractor: (msg: string) => {
          const foods = ['당근', '브로콜리', '양파', '마늘', '고수', '셀러리', '버섯'];
          for (const food of foods) {
            if (msg.includes(food)) return `${food}을(를) 싫어함`;
          }
          return null;
        }
      },
      { 
        regex: /(좋아|사랑|최고|맛있)/,
        type: 'preference' as MemoryType,
        emotion: 'positive' as const,
        extractor: (msg: string) => {
          const foods = ['치킨', '피자', '초콜릿', '커피', '녹차', '사과'];
          for (const food of foods) {
            if (msg.includes(food)) return `${food}을(를) 좋아함`;
          }
          return null;
        }
      },
      // Events
      {
        regex: /(싸웠|다퉜|화났|스트레스|짜증)/,
        type: 'event' as MemoryType,
        emotion: 'negative' as const,
        extractor: (msg: string) => {
          if (msg.includes('상사') || msg.includes('직장') || msg.includes('회사')) {
            return '직장에서 스트레스 받음';
          }
          if (msg.includes('가족') || msg.includes('부모') || msg.includes('배우자')) {
            return '가족과 갈등';
          }
          return '스트레스 상황 발생';
        }
      },
      // Health patterns
      {
        regex: /(운동|헬스|조깅|달리기|요가|필라테스)/,
        type: 'habit' as MemoryType,
        emotion: 'positive' as const,
        extractor: (msg: string) => {
          const exercises = ['헬스', '조깅', '달리기', '요가', '필라테스', '수영', '등산'];
          for (const ex of exercises) {
            if (msg.includes(ex)) return `${ex}을(를) 함`;
          }
          return '운동을 함';
        }
      },
      // Goals
      {
        regex: /(목표|하고 싶|빼고 싶|되고 싶)/,
        type: 'goal' as MemoryType,
        emotion: 'positive' as const,
        extractor: (msg: string) => {
          if (msg.includes('체중') || msg.includes('살') || msg.includes('다이어트')) {
            return '체중 감량이 목표';
          }
          if (msg.includes('근육')) {
            return '근육 증가가 목표';
          }
          return '건강 개선이 목표';
        }
      },
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(lowerMsg)) {
        const content = pattern.extractor(lowerMsg);
        if (content) {
          return this.store({
            type: pattern.type,
            content,
            tags: this.extractTags(userMessage),
            emotion: pattern.emotion,
            importance: 0.7,
          });
        }
      }
    }

    return null;
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const keywords = ['운동', '음식', '스트레스', '수면', '직장', '가족', '취미', '건강'];
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return tags;
  }

  /**
   * Search memories by text similarity
   */
  search(query: string, limit = 5): MemorySearchResult[] {
    const queryEmbedding = this.generateEmbedding(query);
    const results: MemorySearchResult[] = [];

    this.memories.forEach(memory => {
      if (memory.embedding) {
        const similarity = this.cosineSimilarity(queryEmbedding, memory.embedding);
        results.push({ memory, similarity });
      }
    });

    // Sort by similarity descending
    results.sort((a, b) => b.similarity - a.similarity);

    // Update recall counts for top results
    results.slice(0, limit).forEach(r => {
      r.memory.recallCount++;
      r.memory.lastRecalledAt = new Date();
    });
    this.saveToStorage();

    return results.slice(0, limit);
  }

  /**
   * Get memories by type
   */
  getByType(type: MemoryType): UserMemory[] {
    return Array.from(this.memories.values()).filter(m => m.type === type);
  }

  /**
   * Get recent memories
   */
  getRecent(days = 7): UserMemory[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return Array.from(this.memories.values())
      .filter(m => m.createdAt >= cutoff)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get memories relevant to current health state
   */
  getRelevantToHealth(healthContext: { 
    isStressed?: boolean; 
    isLowEnergy?: boolean;
    isHighGlucose?: boolean;
  }): UserMemory[] {
    const relevant: UserMemory[] = [];

    if (healthContext.isStressed) {
      // Find recent stress-related memories
      relevant.push(...this.search('스트레스 직장 싸움', 3).map(r => r.memory));
    }

    if (healthContext.isLowEnergy) {
      // Find sleep/exercise patterns
      relevant.push(...this.getByType('habit').filter(m => 
        m.tags.includes('운동') || m.tags.includes('수면')
      ));
    }

    if (healthContext.isHighGlucose) {
      // Find food preferences for dietary advice
      relevant.push(...this.getByType('preference'));
    }

    return relevant;
  }

  /**
   * Generate a contextual recall for conversation
   */
  generateRecallPhrase(context: string): string | null {
    const results = this.search(context, 1);
    
    if (results.length > 0 && results[0].similarity > 0.3) {
      const memory = results[0].memory;
      const daysSince = Math.floor(
        (Date.now() - memory.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (memory.type === 'event' && memory.emotion === 'negative') {
        if (daysSince <= 7) {
          return `혹시 며칠 전 ${memory.content.replace('스트레스 받음', '').trim()} 때문에 그런 건 아닌가요?`;
        }
      }

      if (memory.type === 'preference' && memory.emotion === 'negative') {
        return `참, ${memory.content}이시죠? 기억하고 있어요.`;
      }
    }

    return null;
  }

  /**
   * Delete a memory
   */
  delete(id: string): boolean {
    const deleted = this.memories.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Clear all memories
   */
  clear() {
    this.memories.clear();
    this.saveToStorage();
  }

  /**
   * Get all memories
   */
  getAll(): UserMemory[] {
    return Array.from(this.memories.values());
  }

  /**
   * Get memory stats
   */
  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      byType: {
        preference: all.filter(m => m.type === 'preference').length,
        event: all.filter(m => m.type === 'event').length,
        health_pattern: all.filter(m => m.type === 'health_pattern').length,
        social: all.filter(m => m.type === 'social').length,
        habit: all.filter(m => m.type === 'habit').length,
        goal: all.filter(m => m.type === 'goal').length,
      },
      avgImportance: all.length > 0 
        ? all.reduce((sum, m) => sum + m.importance, 0) / all.length 
        : 0,
    };
  }
}

export const MemoryVectorDB = typeof window !== 'undefined' 
  ? new MemoryVectorDBClass() 
  : null;






