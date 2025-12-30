/**
 * Idea Agora Database Schema
 * 
 * Prisma Schema for Collective Intelligence Platform
 * 
 * To use: Add these models to your schema.prisma file
 */

export const AGORA_PRISMA_SCHEMA = `
// ============================================
// Idea Agora Schema
// Collective Intelligence Platform
// ============================================

// Idea Proposal
model IdeaProposal {
  id              String            @id @default(cuid())
  title           String
  description     String            @db.Text
  category        IdeaCategory
  status          IdeaStatus        @default(SUBMITTED)
  
  // Author
  authorId        String
  author          User              @relation(fields: [authorId], references: [id])
  
  // Engagement
  votes           IdeaVote[]
  comments        IdeaComment[]
  voteCount       Int               @default(0)
  commentCount    Int               @default(0)
  
  // AI Analysis
  aiAnalysis      Json?             // { feasibility, estimatedTime, similarPatents }
  
  // Reward (if implemented)
  rewardPoints    Int?
  royaltyNftId    String?
  
  // Timestamps
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  reviewedAt      DateTime?
  implementedAt   DateTime?
  
  // Indexes
  @@index([authorId])
  @@index([status])
  @@index([category])
  @@index([voteCount])
  @@index([createdAt])
}

enum IdeaCategory {
  NEW_TARGET      // New measurement target (e.g., Vitamin D)
  APP_FEATURE     // App functionality
  DESIGN          // UI/UX design
  HARDWARE        // Hardware improvements
  COMMUNITY       // Community features
}

enum IdeaStatus {
  SUBMITTED       // Just submitted
  UNDER_REVIEW    // Being reviewed by team
  APPROVED        // Approved for development
  IN_PROGRESS     // Currently being developed
  IMPLEMENTED     // Successfully implemented
  REJECTED        // Not feasible / rejected
}

// Vote on Idea
model IdeaVote {
  id              String            @id @default(cuid())
  
  ideaId          String
  idea            IdeaProposal      @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  
  // Points spent on this vote (DAO simulation)
  pointsSpent     Int               @default(1)
  
  createdAt       DateTime          @default(now())
  
  @@unique([ideaId, userId])
  @@index([ideaId])
  @@index([userId])
}

// Comment on Idea
model IdeaComment {
  id              String            @id @default(cuid())
  content         String            @db.Text
  
  ideaId          String
  idea            IdeaProposal      @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  
  authorId        String
  author          User              @relation(fields: [authorId], references: [id])
  
  // Reply to another comment
  parentId        String?
  parent          IdeaComment?      @relation("CommentReplies", fields: [parentId], references: [id])
  replies         IdeaComment[]     @relation("CommentReplies")
  
  // Moderation
  isHidden        Boolean           @default(false)
  hiddenReason    String?
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([ideaId])
  @@index([authorId])
  @@index([parentId])
}

// ============================================
// Learning Academy Schema
// ============================================

// Course
model Course {
  id              String            @id @default(cuid())
  title           String
  titleEn         String?
  description     String            @db.Text
  
  category        CourseCategory
  level           CourseLevel
  
  durationMinutes Int
  pointsReward    Int
  
  // Badge awarded on completion
  badgeId         String?
  badge           Badge?            @relation(fields: [badgeId], references: [id])
  
  modules         CourseModule[]
  enrollments     CourseEnrollment[]
  
  isPublished     Boolean           @default(false)
  order           Int               @default(0)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([category])
  @@index([level])
}

enum CourseCategory {
  BASICS          // Getting started
  HARDWARE        // Device usage
  DATA            // Understanding results
  AI              // AI Coach mastery
  SCIENCE         // Advanced biosensor science
  COMMUNITY       // Community participation
}

enum CourseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

// Course Module
model CourseModule {
  id              String            @id @default(cuid())
  title           String
  content         String            @db.Text      // Markdown or HTML
  
  courseId        String
  course          Course            @relation(fields: [courseId], references: [id], onDelete: Cascade)
  
  // Interactive elements
  videoUrl        String?
  quizQuestions   Json?             // Array of quiz questions
  
  order           Int
  
  completions     ModuleCompletion[]
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([courseId])
}

// Course Enrollment
model CourseEnrollment {
  id              String            @id @default(cuid())
  
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  
  courseId        String
  course          Course            @relation(fields: [courseId], references: [id])
  
  // Progress tracking
  completedModules ModuleCompletion[]
  progress        Float             @default(0)   // 0-100
  
  isCompleted     Boolean           @default(false)
  completedAt     DateTime?
  
  // Points earned
  pointsEarned    Int               @default(0)
  
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}

// Module Completion
model ModuleCompletion {
  id              String            @id @default(cuid())
  
  enrollmentId    String
  enrollment      CourseEnrollment  @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)
  
  moduleId        String
  module          CourseModule      @relation(fields: [moduleId], references: [id])
  
  // Quiz score (if applicable)
  quizScore       Float?
  quizAttempts    Int               @default(0)
  
  completedAt     DateTime          @default(now())
  
  @@unique([enrollmentId, moduleId])
  @@index([enrollmentId])
  @@index([moduleId])
}

// Badge
model Badge {
  id              String            @id @default(cuid())
  name            String
  nameKo          String
  description     String
  emoji           String            // e.g., "🎓"
  
  // Requirements
  type            BadgeType
  requirement     Json?             // Specific requirements based on type
  
  courses         Course[]
  userBadges      UserBadge[]
  
  createdAt       DateTime          @default(now())
}

enum BadgeType {
  COURSE          // Complete a course
  STREAK          // Learning streak
  CONTRIBUTION    // Community contribution
  IDEA            // Idea implementation
  SPECIAL         // Special events
}

// User Badge
model UserBadge {
  id              String            @id @default(cuid())
  
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  
  badgeId         String
  badge           Badge             @relation(fields: [badgeId], references: [id])
  
  earnedAt        DateTime          @default(now())
  
  @@unique([userId, badgeId])
  @@index([userId])
}

// Tutorial Spotlight (Shadow Mode)
model TutorialSpotlight {
  id              String            @id @default(cuid())
  
  // Target page/component
  targetPage      String            // e.g., "/measurement"
  targetSelector  String            // CSS selector for the element
  
  // Content
  title           String
  message         String            @db.Text
  action          String?           // Expected user action
  
  // Reward
  pointsReward    Int               @default(5)
  
  // Sequence
  order           Int
  groupId         String?           // Group related spotlights
  
  isActive        Boolean           @default(true)
  
  createdAt       DateTime          @default(now())
  
  @@index([targetPage])
}
`;

/**
 * TypeScript Types for Agora
 */

export type IdeaCategory = 
  | "new_target" 
  | "app_feature" 
  | "design" 
  | "hardware" 
  | "community";

export type IdeaStatus = 
  | "submitted" 
  | "under_review" 
  | "approved" 
  | "in_progress" 
  | "implemented" 
  | "rejected";

export interface IdeaProposal {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  authorId: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
    level: number;
  };
  voteCount: number;
  commentCount: number;
  aiAnalysis?: {
    feasibility: "high" | "medium" | "low";
    estimatedTime: string;
    similarPatents: number;
  };
  rewardPoints?: number;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  implementedAt?: Date;
}

export interface IdeaVote {
  id: string;
  ideaId: string;
  userId: string;
  pointsSpent: number;
  createdAt: Date;
}

export interface IdeaComment {
  id: string;
  content: string;
  ideaId: string;
  authorId: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  parentId?: string;
  replies?: IdeaComment[];
  isHidden: boolean;
  createdAt: Date;
}

/**
 * Vote Threshold for Official Review
 */
export const VOTE_THRESHOLD_FOR_REVIEW = 10000;

/**
 * Points cost per vote (DAO simulation)
 */
export const POINTS_PER_VOTE = 1;

/**
 * Reward points for implemented ideas
 */
export const IMPLEMENTATION_REWARD = 10000;






