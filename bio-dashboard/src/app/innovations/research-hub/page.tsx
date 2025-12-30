"use client";

/**
 * Research Data Hub Page
 * 연구 데이터 허브 - 익명화 데이터셋 API
 */

import * as React from "react";
import { motion } from "framer-motion";
import { 
  Database, 
  FileJson, 
  Download, 
  Key, 
  BookOpen,
  Search,
  Filter,
  ExternalLink,
  Copy,
  CheckCircle2,
  Lock,
  Unlock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  researchDataHub, 
  AVAILABLE_DATASETS,
  type AnonymizedDataset,
  type DataAccessTier 
} from "@/lib/innovations";

export default function ResearchHubPage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTier, setSelectedTier] = React.useState<DataAccessTier | 'all'>('all');
  const [copiedKey, setCopiedKey] = React.useState(false);
  const [apiKey] = React.useState('mps_sk_live_abc123xyz789def456ghi');

  const filteredDatasets = AVAILABLE_DATASETS.filter(ds => {
    const matchesSearch = ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ds.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = selectedTier === 'all' || ds.accessTier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const getTierBadge = (tier: DataAccessTier) => {
    switch (tier) {
      case 'free':
        return <Badge variant="secondary" className="bg-green-100 text-green-700">무료</Badge>;
      case 'academic':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">학술용</Badge>;
      case 'enterprise':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-700">기업용</Badge>;
      case 'partner':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700">파트너</Badge>;
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Research Data Hub</h1>
              <p className="text-muted-foreground">익명화된 건강 데이터셋 API</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="datasets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="datasets">
              <Database className="w-4 h-4 mr-2" />
              데이터셋
            </TabsTrigger>
            <TabsTrigger value="api">
              <Key className="w-4 h-4 mr-2" />
              API 키
            </TabsTrigger>
            <TabsTrigger value="docs">
              <BookOpen className="w-4 h-4 mr-2" />
              문서
            </TabsTrigger>
          </TabsList>

          {/* Datasets Tab */}
          <TabsContent value="datasets">
            {/* Search & Filter */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="데이터셋 검색..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(['all', 'free', 'academic', 'enterprise'] as const).map((tier) => (
                      <Button
                        key={tier}
                        variant={selectedTier === tier ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTier(tier)}
                      >
                        {tier === 'all' ? '전체' : tier === 'free' ? '무료' : tier === 'academic' ? '학술용' : '기업용'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dataset Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {filteredDatasets.map((dataset) => (
                <motion.div
                  key={dataset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{dataset.name}</CardTitle>
                          <CardDescription className="mt-1">{dataset.description}</CardDescription>
                        </div>
                        {getTierBadge(dataset.accessTier)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">레코드</p>
                          <p className="font-bold text-sm">{(dataset.recordCount / 1000).toFixed(0)}K</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">크기</p>
                          <p className="font-bold text-sm">{dataset.downloadSize}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-center">
                          <p className="text-xs text-muted-foreground">포맷</p>
                          <p className="font-bold text-sm uppercase">{dataset.format}</p>
                        </div>
                      </div>

                      {/* Features */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">주요 변수</p>
                        <div className="flex flex-wrap gap-1">
                          {dataset.features.slice(0, 4).map((feature) => (
                            <Badge key={feature.name} variant="outline" className="text-xs">
                              {feature.name}
                            </Badge>
                          ))}
                          {dataset.features.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{dataset.features.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Anonymization */}
                      <div className="flex items-center gap-2 text-sm">
                        <Lock className="w-4 h-4 text-green-500" />
                        <span className="text-muted-foreground">
                          {dataset.anonymizationLevel.replace('_', '-')} 익명화
                        </span>
                      </div>

                      {/* Time Range */}
                      <div className="text-xs text-muted-foreground">
                        📅 {dataset.timeRange.start.toLocaleDateString('ko-KR')} ~ {dataset.timeRange.end.toLocaleDateString('ko-KR')}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1" size="sm">
                          <FileJson className="w-4 h-4 mr-2" />
                          스키마 보기
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          다운로드
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* API Key Tab */}
          <TabsContent value="api">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    API 키 관리
                  </CardTitle>
                  <CardDescription>데이터 접근을 위한 API 키</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-slate-900 rounded-xl">
                    <p className="text-xs text-slate-400 mb-2">Live API Key</p>
                    <div className="flex items-center gap-2">
                      <code className="text-green-400 text-sm flex-1 font-mono">
                        {apiKey.slice(0, 15)}...{apiKey.slice(-8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyKey}
                        className="text-white hover:text-white hover:bg-slate-800"
                      >
                        {copiedKey ? (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">액세스 티어</span>
                      <Badge>Academic</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">월간 할당량</span>
                      <span>2,340 / 10,000 요청</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">리셋 날짜</span>
                      <span>2025년 1월 1일</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    티어 업그레이드
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">사용량 통계</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">이번 달 요청</span>
                        <span className="text-2xl font-bold">2,340</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23.4%' }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">할당량의 23.4% 사용</p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium">최근 쿼리</p>
                      {[
                        { dataset: 'Glucose Monitoring', time: '2분 전', records: 100 },
                        { dataset: 'Athletic Lactate', time: '1시간 전', records: 500 },
                        { dataset: 'Public Stats', time: '3시간 전', records: 50 },
                      ].map((query, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium">{query.dataset}</p>
                            <p className="text-xs text-muted-foreground">{query.time}</p>
                          </div>
                          <Badge variant="outline">{query.records}건</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  API 문서
                </CardTitle>
                <CardDescription>Manpasik Research Data Hub API v1</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Base URL */}
                <div>
                  <h3 className="font-medium mb-2">Base URL</h3>
                  <code className="block p-3 bg-slate-900 text-green-400 rounded-lg text-sm font-mono">
                    https://api.manpasik.com/research/v1
                  </code>
                </div>

                {/* Authentication */}
                <div>
                  <h3 className="font-medium mb-2">인증</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    모든 요청에 Bearer 토큰을 포함해야 합니다:
                  </p>
                  <code className="block p-3 bg-slate-900 text-green-400 rounded-lg text-sm font-mono">
                    Authorization: Bearer mps_sk_live_...
                  </code>
                </div>

                {/* Endpoints */}
                <div>
                  <h3 className="font-medium mb-3">엔드포인트</h3>
                  <div className="space-y-3">
                    {[
                      { method: 'GET', path: '/datasets', desc: '데이터셋 목록 조회' },
                      { method: 'GET', path: '/datasets/{id}/schema', desc: '스키마 조회' },
                      { method: 'POST', path: '/datasets/{id}/query', desc: '데이터 쿼리' },
                      { method: 'GET', path: '/datasets/{id}/download', desc: '전체 다운로드' },
                      { method: 'GET', path: '/usage', desc: '사용량 조회' },
                    ].map((endpoint, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <Badge className={
                          endpoint.method === 'GET' ? 'bg-green-500' : 'bg-blue-500'
                        }>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono flex-1">{endpoint.path}</code>
                        <span className="text-sm text-muted-foreground">{endpoint.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rate Limits */}
                <div>
                  <h3 className="font-medium mb-2">Rate Limits</h3>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { tier: 'Free', limit: '100/시간' },
                      { tier: 'Academic', limit: '1,000/시간' },
                      { tier: 'Enterprise', limit: '10,000/시간' },
                      { tier: 'Partner', limit: '무제한' },
                    ].map((rate, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">{rate.tier}</p>
                        <p className="font-bold text-sm">{rate.limit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Button className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  전체 문서 보기
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}




