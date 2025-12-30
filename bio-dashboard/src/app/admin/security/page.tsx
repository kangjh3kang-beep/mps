'use client';

/**
 * ============================================================
 * SECURITY AUDIT DASHBOARD
 * FDA 21 CFR Part 11 / ISO 27001 Compliance
 * ============================================================
 * 
 * Features:
 * - Immutable Audit Ledger
 * - Real-time Security Monitoring
 * - Compliance Reports
 * - Threat Detection
 * - Disaster Recovery Control
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Unlock,
  Globe,
  Server,
  Database,
  Activity,
  Users,
  Key,
  FileText,
  RefreshCw,
  ChevronRight,
  Zap,
  AlertCircle,
  Clock,
  Hash,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  success: boolean;
  checksum: string;
  details?: string;
}

interface SecurityMetric {
  label: string;
  value: number | string;
  change?: number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

interface ThreatEvent {
  id: string;
  timestamp: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  mitigated: boolean;
}

interface RegionStatus {
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'offline';
  latencyMs: number;
  isPrimary: boolean;
}

// ============================================
// MOCK DATA
// ============================================

const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: new Date().toISOString(),
    userId: 'user-123',
    userEmail: 'doctor.kim@samsung-hospital.com',
    userRole: 'doctor',
    action: 'READ',
    resource: 'health_records',
    resourceId: 'rec-456',
    ipAddress: '210.123.45.67',
    success: true,
    checksum: 'a1b2c3d4e5f6...',
    details: 'Accessed patient vitals',
  },
  {
    id: 'log-002',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    userId: 'user-456',
    userEmail: 'nurse.lee@samsung-hospital.com',
    userRole: 'nurse',
    action: 'CREATE',
    resource: 'measurements',
    resourceId: 'meas-789',
    ipAddress: '210.123.45.68',
    success: true,
    checksum: 'b2c3d4e5f6g7...',
    details: 'Recorded blood pressure',
  },
  {
    id: 'log-003',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    userId: 'unknown',
    userEmail: 'anonymous',
    userRole: 'guest',
    action: 'LOGIN_ATTEMPT',
    resource: 'auth',
    resourceId: 'session-xxx',
    ipAddress: '123.456.78.90',
    success: false,
    checksum: 'c3d4e5f6g7h8...',
    details: 'Invalid credentials (5th attempt)',
  },
];

const mockThreats: ThreatEvent[] = [
  {
    id: 'threat-001',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'SQL_INJECTION',
    severity: 'high',
    source: '123.456.78.90',
    description: 'SQL injection attempt blocked on /api/search',
    mitigated: true,
  },
  {
    id: 'threat-002',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    type: 'RATE_LIMIT',
    severity: 'medium',
    source: '98.76.54.32',
    description: 'Rate limit exceeded on /api/auth (150 req/min)',
    mitigated: true,
  },
  {
    id: 'threat-003',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    type: 'BRUTE_FORCE',
    severity: 'critical',
    source: '11.22.33.44',
    description: 'Brute force login attempt (50 failures in 10 min)',
    mitigated: true,
  },
];

const mockRegions: RegionStatus[] = [
  { id: 'ap-northeast-2', name: 'Seoul (Primary)', status: 'healthy', latencyMs: 12, isPrimary: true },
  { id: 'us-east-1', name: 'Virginia', status: 'healthy', latencyMs: 180, isPrimary: false },
  { id: 'eu-central-1', name: 'Frankfurt', status: 'healthy', latencyMs: 250, isPrimary: false },
];

// ============================================
// COMPONENTS
// ============================================

function MetricCard({ metric }: { metric: SecurityMetric }) {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-amber-600 bg-amber-50 border-amber-200',
    critical: 'text-red-600 bg-red-50 border-red-200',
  };

  return (
    <motion.div
      className={`p-4 rounded-xl border-2 ${statusColors[metric.status]}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-white/50">
          {metric.icon}
        </div>
        {metric.change !== undefined && (
          <span className={`text-xs font-medium ${
            metric.change >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {metric.change >= 0 ? '+' : ''}{metric.change}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold">{metric.value}</div>
        <div className="text-sm opacity-80">{metric.label}</div>
      </div>
    </motion.div>
  );
}

function AuditLogRow({ log }: { log: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className={`border-b border-slate-100 dark:border-slate-800 ${
        !log.success ? 'bg-red-50 dark:bg-red-900/20' : ''
      }`}
      layout
    >
      <div
        className="flex items-center gap-4 py-3 px-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0">
          {log.success ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{log.action}</span>
            <span className="text-xs text-muted-foreground">→</span>
            <span className="text-sm text-muted-foreground">{log.resource}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {log.userEmail} • {log.ipAddress}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-muted-foreground">
            {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            {log.checksum}
          </div>
        </div>
        
        <ChevronRight
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 bg-slate-50 dark:bg-slate-800/30"
          >
            <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
              <div>
                <span className="text-muted-foreground">User ID:</span>
                <span className="ml-2 font-mono">{log.userId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Role:</span>
                <span className="ml-2">{log.userRole}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Resource ID:</span>
                <span className="ml-2 font-mono">{log.resourceId}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Details:</span>
                <span className="ml-2">{log.details}</span>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-white dark:bg-slate-900 rounded-lg">
              <div className="flex items-center gap-2 text-xs">
                <Hash className="w-3 h-3" />
                <span className="text-muted-foreground">Integrity Hash:</span>
                <span className="font-mono">{log.checksum}</span>
                <CheckCircle className="w-3 h-3 text-green-500 ml-auto" />
                <span className="text-green-600">Verified</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ThreatCard({ threat }: { threat: ThreatEvent }) {
  const severityColors = {
    low: 'border-blue-200 bg-blue-50',
    medium: 'border-amber-200 bg-amber-50',
    high: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50',
  };

  const severityIcons = {
    low: <AlertCircle className="w-5 h-5 text-blue-500" />,
    medium: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    high: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    critical: <Zap className="w-5 h-5 text-red-500" />,
  };

  return (
    <motion.div
      className={`p-4 rounded-xl border-2 ${severityColors[threat.severity]}`}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-start gap-3">
        {severityIcons[threat.severity]}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{threat.type}</span>
            {threat.mitigated && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                차단됨
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{threat.description}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {threat.source}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(threat.timestamp).toLocaleTimeString('ko-KR')}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RegionStatusCard({ region }: { region: RegionStatus }) {
  const statusColors = {
    healthy: 'text-green-500',
    degraded: 'text-amber-500',
    offline: 'text-red-500',
  };

  return (
    <div className={`p-4 rounded-xl border ${
      region.isPrimary ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-slate-50/50'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Server className={`w-5 h-5 ${statusColors[region.status]}`} />
          <div>
            <div className="font-medium text-sm">{region.name}</div>
            <div className="text-xs text-muted-foreground">{region.id}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-medium ${statusColors[region.status]}`}>
            {region.status === 'healthy' ? '정상' : 
             region.status === 'degraded' ? '저하' : '오프라인'}
          </div>
          <div className="text-xs text-muted-foreground">{region.latencyMs}ms</div>
        </div>
      </div>
      {region.isPrimary && (
        <div className="mt-2 px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 inline-block">
          Primary Region
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function SecurityDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'threats' | 'dr'>('overview');
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(mockAuditLogs);
  const [threats, setThreats] = useState<ThreatEvent[]>(mockThreats);
  const [regions, setRegions] = useState<RegionStatus[]>(mockRegions);
  const [chaosMode, setChaosMode] = useState(false);

  const metrics: SecurityMetric[] = [
    {
      label: '보안 점수',
      value: '98.5%',
      change: 2.3,
      status: 'good',
      icon: <Shield className="w-5 h-5" />,
    },
    {
      label: '금일 위협 차단',
      value: 156,
      status: 'good',
      icon: <AlertTriangle className="w-5 h-5" />,
    },
    {
      label: '활성 세션',
      value: 1247,
      status: 'good',
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: 'MFA 활성률',
      value: '94.2%',
      change: 5.1,
      status: 'good',
      icon: <Key className="w-5 h-5" />,
    },
    {
      label: '암호화 데이터',
      value: '100%',
      status: 'good',
      icon: <Lock className="w-5 h-5" />,
    },
    {
      label: '감사 무결성',
      value: '검증됨',
      status: 'good',
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new audit log
      const newLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: `user-${Math.floor(Math.random() * 1000)}`,
        userEmail: `user${Math.floor(Math.random() * 100)}@hospital.com`,
        userRole: ['user', 'doctor', 'nurse', 'admin'][Math.floor(Math.random() * 4)],
        action: ['READ', 'CREATE', 'UPDATE'][Math.floor(Math.random() * 3)],
        resource: ['health_records', 'measurements', 'settings'][Math.floor(Math.random() * 3)],
        resourceId: `res-${Math.floor(Math.random() * 10000)}`,
        ipAddress: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        success: Math.random() > 0.1,
        checksum: Math.random().toString(36).substring(2, 15),
      };
      
      setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleChaosTest = () => {
    if (!chaosMode) {
      setChaosMode(true);
      // Simulate region failure
      setRegions(prev => prev.map(r => 
        r.id === 'ap-northeast-2' 
          ? { ...r, status: 'offline' as const }
          : r.id === 'us-east-1'
          ? { ...r, isPrimary: true }
          : r
      ));
      
      // Auto-recover after 5 seconds
      setTimeout(() => {
        setChaosMode(false);
        setRegions(mockRegions);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold">보안 감사 대시보드</h1>
                <p className="text-sm text-muted-foreground">
                  FDA 21 CFR Part 11 / ISO 27001 Compliance
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">시스템 정상</span>
              </div>
              
              <button 
                onClick={() => window.location.reload()}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {[
              { id: 'overview', label: '개요', icon: <Activity className="w-4 h-4" /> },
              { id: 'audit', label: '감사 로그', icon: <FileText className="w-4 h-4" /> },
              { id: 'threats', label: '위협 탐지', icon: <AlertTriangle className="w-4 h-4" /> },
              { id: 'dr', label: '재해 복구', icon: <Server className="w-4 h-4" /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-muted-foreground hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {metrics.map((metric, i) => (
                  <MetricCard key={i} metric={metric} />
                ))}
              </div>

              {/* Two Column Layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Threats */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    최근 위협
                  </h2>
                  <div className="space-y-3">
                    {threats.slice(0, 3).map(threat => (
                      <ThreatCard key={threat.id} threat={threat} />
                    ))}
                  </div>
                </div>

                {/* Region Status */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    글로벌 인프라 상태
                  </h2>
                  <div className="space-y-3">
                    {regions.map(region => (
                      <RegionStatusCard key={region.id} region={region} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'audit' && (
            <motion.div
              key="audit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      변경 불가능 감사 원장
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>체인 무결성 검증됨</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    모든 데이터 접근 및 변경 사항이 암호학적 해시 체인으로 기록됩니다.
                  </p>
                </div>
                
                <div className="max-h-[600px] overflow-y-auto">
                  {auditLogs.map(log => (
                    <AuditLogRow key={log.id} log={log} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'threats' && (
            <motion.div
              key="threats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="grid gap-4">
                {threats.map(threat => (
                  <ThreatCard key={threat.id} threat={threat} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'dr' && (
            <motion.div
              key="dr"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="font-semibold mb-6 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  재해 복구 컨트롤
                </h2>
                
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {regions.map(region => (
                    <RegionStatusCard key={region.id} region={region} />
                  ))}
                </div>
                
                {/* Chaos Button */}
                <div className="p-4 border-2 border-dashed border-amber-300 bg-amber-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-amber-800">Chaos Engineering 테스트</h3>
                      <p className="text-sm text-amber-600 mt-1">
                        Primary Region 장애를 시뮬레이션하여 자동 Failover를 테스트합니다.
                      </p>
                    </div>
                    <button
                      onClick={handleChaosTest}
                      disabled={chaosMode}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        chaosMode
                          ? 'bg-amber-200 text-amber-600 cursor-not-allowed'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      {chaosMode ? '테스트 진행 중...' : '🔥 Chaos 테스트 시작'}
                    </button>
                  </div>
                  
                  {chaosMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 p-3 bg-white rounded-lg border border-amber-200"
                    >
                      <div className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="w-5 h-5 animate-pulse" />
                        <span>Seoul 리전 장애 시뮬레이션 중... Virginia로 Failover 진행</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


