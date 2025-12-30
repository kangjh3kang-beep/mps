"use client";

/**
 * ============================================================
 * MANPASIK GLOBAL CONNECT - DEMO PAGE
 * Real-Time Translation & Global Expert Matching
 * ============================================================
 */

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Globe, 
  Languages, 
  Video, 
  MessageSquare, 
  Search,
  Filter,
  Sparkles,
  Star
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlobalExpertCard } from "@/components/global-connect/GlobalExpertCard";
import { TranslatedChat } from "@/components/global-connect/TranslatedChat";
import { LiveTranslationSettings } from "@/components/global-connect/LiveTranslationSettings";
import { VideoCallOverlay } from "@/components/global-connect/VideoCallOverlay";
import type { 
  GlobalExpert, 
  SupportedLanguage, 
  TranslatedMessage,
  TranslationMode 
} from "@/lib/global-connect/translation-types";

// Mock Experts Data
const mockExperts: GlobalExpert[] = [
  {
    id: 'exp_001',
    name: 'Dr. Sarah Johnson',
    title: '내분비학 전문의',
    specialties: ['당뇨병', '갑상선', '대사질환'],
    nativeLanguage: 'en-US',
    supportedLanguages: ['en-US', 'en-GB'],
    hasAITranslation: true,
    rating: 4.9,
    reviewCount: 342,
    avatarUrl: '',
    isOnline: true,
    timezone: 'EST (미국)',
    hourlyRate: 150,
    currency: 'USD',
  },
  {
    id: 'exp_002',
    name: 'Dr. Kenji Tanaka',
    title: '심장내과 전문의',
    specialties: ['심장질환', '고혈압', '부정맥'],
    nativeLanguage: 'ja-JP',
    supportedLanguages: ['ja-JP', 'en-US'],
    hasAITranslation: true,
    rating: 4.8,
    reviewCount: 256,
    avatarUrl: '',
    isOnline: true,
    timezone: 'JST (일본)',
    hourlyRate: 180000,
    currency: 'KRW',
  },
  {
    id: 'exp_003',
    name: 'Dr. Maria Garcia',
    title: '영양학 전문의',
    specialties: ['영양상담', '체중관리', '스포츠영양'],
    nativeLanguage: 'es-ES',
    supportedLanguages: ['es-ES', 'en-US'],
    hasAITranslation: true,
    rating: 4.7,
    reviewCount: 189,
    avatarUrl: '',
    isOnline: false,
    timezone: 'CET (스페인)',
    hourlyRate: 120,
    currency: 'USD',
  },
  {
    id: 'exp_004',
    name: 'Coach Mike Thompson',
    title: '피트니스 코치',
    specialties: ['웨이트트레이닝', 'HIIT', '재활운동'],
    nativeLanguage: 'en-GB',
    supportedLanguages: ['en-GB', 'en-US'],
    hasAITranslation: true,
    rating: 4.9,
    reviewCount: 521,
    avatarUrl: '',
    isOnline: true,
    timezone: 'GMT (영국)',
    hourlyRate: 80,
    currency: 'USD',
  },
];

// Mock Messages
const mockMessages: TranslatedMessage[] = [
  {
    id: 'msg_001',
    senderId: 'exp_001',
    senderName: 'Dr. Sarah Johnson',
    originalText: 'Hello! How are you feeling today? I see your glucose levels have been a bit elevated.',
    originalLanguage: 'en-US',
    translatedText: '안녕하세요! 오늘 컨디션은 어떠세요? 혈당 수치가 조금 높게 나온 것 같네요.',
    targetLanguage: 'ko-KR',
    timestamp: new Date(Date.now() - 300000),
    isVerified: true,
    medicalNotes: ['Glucose levels: 혈당 수치'],
  },
  {
    id: 'msg_002',
    senderId: 'user_001',
    senderName: '나',
    originalText: '네, 요즘 스트레스를 많이 받아서 그런 것 같아요.',
    originalLanguage: 'ko-KR',
    translatedText: 'Yes, I think it\'s because I\'ve been under a lot of stress lately.',
    targetLanguage: 'en-US',
    timestamp: new Date(Date.now() - 240000),
    isVerified: false,
  },
  {
    id: 'msg_003',
    senderId: 'exp_001',
    senderName: 'Dr. Sarah Johnson',
    originalText: 'That makes sense. Cortisol, the stress hormone, can significantly impact blood sugar regulation. Let me suggest some strategies.',
    originalLanguage: 'en-US',
    translatedText: '그렇군요. 스트레스 호르몬인 코르티솔이 혈당 조절에 상당한 영향을 미칠 수 있어요. 몇 가지 전략을 제안해 드릴게요.',
    targetLanguage: 'ko-KR',
    timestamp: new Date(Date.now() - 180000),
    isVerified: true,
    medicalNotes: ['Cortisol: 코르티솔 (스트레스 호르몬)'],
  },
];

export default function GlobalConnectPage() {
  const [userLanguage, setUserLanguage] = React.useState<SupportedLanguage>('ko-KR');
  const [translationMode, setTranslationMode] = React.useState<TranslationMode>('subtitles');
  const [originalVolume, setOriginalVolume] = React.useState(0.1);
  const [selectedExpert, setSelectedExpert] = React.useState<GlobalExpert | null>(null);
  const [showVideoCall, setShowVideoCall] = React.useState(false);
  const [messages, setMessages] = React.useState<TranslatedMessage[]>(mockMessages);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSettings, setShowSettings] = React.useState(false);

  const handleSendMessage = (text: string) => {
    const newMessage: TranslatedMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'user_001',
      senderName: '나',
      originalText: text,
      originalLanguage: userLanguage,
      translatedText: `[Translated]: ${text}`, // Mock translation
      targetLanguage: selectedExpert?.nativeLanguage || 'en-US',
      timestamp: new Date(),
      isVerified: false,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleStartVideoCall = (expert: GlobalExpert) => {
    setSelectedExpert(expert);
    setShowVideoCall(true);
  };

  const handleStartChat = (expert: GlobalExpert) => {
    setSelectedExpert(expert);
  };

  const filteredExperts = mockExperts.filter(expert =>
    expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expert.specialties.some(s => s.includes(searchQuery))
  );

  if (showVideoCall && selectedExpert) {
    return (
      <div className="h-screen">
        <VideoCallOverlay
          expert={selectedExpert}
          userLanguage={userLanguage}
          onEndCall={() => setShowVideoCall(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Globe className="w-8 h-8 text-primary" />
                Global Connect
              </h1>
              <p className="text-muted-foreground mt-1">
                전 세계 전문가와 실시간 AI 번역으로 소통하세요
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Settings */}
              <LiveTranslationSettings
                userLanguage={userLanguage}
                remoteLanguage="en-US"
                mode={translationMode}
                originalVolume={originalVolume}
                onUserLanguageChange={setUserLanguage}
                onRemoteLanguageChange={() => {}}
                onModeChange={setTranslationMode}
                onVolumeChange={setOriginalVolume}
                isOpen={showSettings}
                onOpenChange={setShowSettings}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            {[
              { label: '전문가', value: '1,234+', icon: Star, color: 'text-amber-500' },
              { label: '지원 언어', value: '16개', icon: Languages, color: 'text-primary' },
              { label: '화상 상담', value: '24/7', icon: Video, color: 'text-green-500' },
              { label: '번역 정확도', value: '98.5%', icon: Sparkles, color: 'text-purple-500' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.label} className="text-center p-4">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs defaultValue="experts" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="experts">
              <Globe className="w-4 h-4 mr-2" />
              전문가 찾기
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              채팅
            </TabsTrigger>
          </TabsList>

          {/* Experts Tab */}
          <TabsContent value="experts">
            {/* Search */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="전문가 또는 전문 분야 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                  </Button>
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2 mt-3">
                  {['당뇨병', '심장질환', '영양', '피트니스', 'AI 번역 지원'].map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                      onClick={() => setSearchQuery(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Translation Notice */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-4 mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Languages className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">AI 실시간 번역 활성화됨</h3>
                <p className="text-sm text-muted-foreground">
                  모든 전문가와 <span className="font-medium">한국어</span>로 소통할 수 있습니다.
                  상대방이 어떤 언어를 사용하든 AI가 실시간으로 번역합니다.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                설정
              </Button>
            </div>

            {/* Experts Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
              {filteredExperts.map((expert) => (
                <GlobalExpertCard
                  key={expert.id}
                  expert={expert}
                  userLanguage={userLanguage}
                  onVideoCall={() => handleStartVideoCall(expert)}
                  onChat={() => handleStartChat(expert)}
                  onBook={() => {}}
                />
              ))}
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Expert Selection Sidebar */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm">대화 중인 전문가</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockExperts.filter(e => e.isOnline).map((expert) => (
                    <button
                      key={expert.id}
                      onClick={() => setSelectedExpert(expert)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedExpert?.id === expert.id 
                          ? 'bg-primary/10 border border-primary' 
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {expert.name[0]}
                      </div>
                      <div className="text-left flex-1">
                        <p className="text-sm font-medium">{expert.name}</p>
                        <p className="text-xs text-muted-foreground">{expert.title}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    </button>
                  ))}
                </CardContent>
              </Card>

              {/* Chat Area */}
              <div className="lg:col-span-2 h-[600px]">
                {selectedExpert ? (
                  <TranslatedChat
                    messages={messages}
                    userLanguage={userLanguage}
                    remoteLanguage={selectedExpert.nativeLanguage}
                    remoteName={selectedExpert.name}
                    onSendMessage={handleSendMessage}
                    className="h-full"
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>대화할 전문가를 선택하세요</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}






