'use client';

/**
 * Community Post Detail Page
 * View individual discussion posts in Agora
 */

import React from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  BookmarkPlus,
  MoreHorizontal,
  ThumbsUp,
  Flag,
  User,
  Clock,
  Eye,
} from 'lucide-react';

// Mock post data
const mockPosts: Record<string, {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    level: string;
  };
  createdAt: string;
  views: number;
  likes: number;
  comments: {
    id: string;
    author: string;
    content: string;
    createdAt: string;
    likes: number;
  }[];
  tags: string[];
}> = {
  '1': {
    id: '1',
    title: '혈당 측정 시 가장 정확한 시간대는 언제인가요?',
    content: `안녕하세요, 만파식 사용자입니다.

혈당 측정을 매일 하고 있는데요, 아침 공복, 식후 2시간, 취침 전 중 어느 시점이 가장 유의미한 데이터를 제공하는지 궁금합니다.

특히 AI 분석의 정확도를 높이려면 어떤 시간대에 측정하는 것이 좋을까요?

경험 있으신 분들의 조언 부탁드립니다!`,
    author: {
      name: '건강러버',
      level: 'Member',
    },
    createdAt: '2024-12-28T10:30:00Z',
    views: 342,
    likes: 28,
    comments: [
      {
        id: 'c1',
        author: '닥터킴',
        content: '전문가 의견으로는, 공복 혈당과 식후 2시간 혈당 모두 중요합니다. 공복 혈당은 기저 인슐린 상태를, 식후 혈당은 인슐린 반응성을 반영합니다.',
        createdAt: '2024-12-28T11:15:00Z',
        likes: 15,
      },
      {
        id: 'c2',
        author: '당뇨관리3년차',
        content: '저는 아침 공복과 저녁 식후 2시간을 주로 측정합니다. AI 분석에 따르면 이 두 시점의 데이터가 패턴 분석에 가장 유용하다고 하더라고요.',
        createdAt: '2024-12-28T12:00:00Z',
        likes: 8,
      },
    ],
    tags: ['혈당', '측정팁', 'AI분석'],
  },
  '2': {
    id: '2',
    title: '카트리지 보관 온도에 대해 질문드립니다',
    content: `여름철에 카트리지 보관이 걱정됩니다.
    
실온 보관이라고 되어 있는데, 여름에 실내 온도가 30도 이상 올라가면 괜찮을까요?

냉장고에 보관해도 될까요?`,
    author: {
      name: '신규사용자',
      level: 'Associate',
    },
    createdAt: '2024-12-27T15:00:00Z',
    views: 156,
    likes: 12,
    comments: [
      {
        id: 'c3',
        author: 'MPS공식',
        content: '안녕하세요, 만파식 공식 계정입니다. 카트리지는 15-25°C 실온 보관을 권장합니다. 30°C 이상의 고온이나 냉장 보관은 센서 성능에 영향을 줄 수 있으니 피해주세요. 서늘하고 직사광선이 닿지 않는 곳에 보관해주시면 됩니다.',
        createdAt: '2024-12-27T16:30:00Z',
        likes: 25,
      },
    ],
    tags: ['카트리지', '보관방법', '공식답변'],
  },
};

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  
  const [isLiked, setIsLiked] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [commentText, setCommentText] = React.useState('');
  
  const post = mockPosts[postId];
  
  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/school/agora"
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <BookmarkPlus className={`w-5 h-5 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

          {/* Author Info */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium">{post.author.name}</div>
                <div className="text-xs text-muted-foreground">{post.author.level}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatDate(post.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            {post.content.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between py-4 border-y border-border mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isLiked ? 'bg-red-100 text-red-600' : 'hover:bg-muted'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{post.likes + (isLiked ? 1 : 0)}</span>
              </button>
              <span className="flex items-center gap-2 text-muted-foreground">
                <MessageCircle className="w-5 h-5" />
                <span>{post.comments.length}</span>
              </span>
            </div>
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Flag className="w-4 h-4" />
              신고
            </button>
          </div>

          {/* Comments */}
          <section>
            <h2 className="font-semibold mb-4">
              댓글 {post.comments.length}개
            </h2>

            {/* Comment Form */}
            <div className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 작성해주세요..."
                className="w-full p-4 bg-muted rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={!commentText.trim()}
                >
                  댓글 작성
                </button>
              </div>
            </div>

            {/* Comment List */}
            <div className="space-y-4">
              {post.comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-4 bg-card rounded-xl border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{comment.author}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {comment.content}
                  </p>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <ThumbsUp className="w-3 h-3" />
                    {comment.likes}
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        </motion.article>
      </main>
    </div>
  );
}


