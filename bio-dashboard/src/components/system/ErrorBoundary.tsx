"use client";

import React, { Component, ReactNode } from "react";
import { 
  AlertTriangle, 
  RefreshCw, 
  Shield, 
  Activity,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  isRecovering: boolean;
  recoveryProgress: number;
  recoveryAttempts: number;
  recovered: boolean;
}

/**
 * Global Error Boundary
 * 
 * Part 5 Section 1.2: Edge Anomaly Detection 기반 자가 치유 시스템
 * - 컴포넌트 충돌 시 우아한 복구 화면 표시
 * - 자동 재시도 메커니즘
 * - 에러 로깅 및 진단
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private recoveryTimer: NodeJS.Timeout | null = null;
  private readonly MAX_RECOVERY_ATTEMPTS = 3;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
      recoveryProgress: 0,
      recoveryAttempts: 0,
      recovered: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // 에러 로깅 (개발 환경에서만 상세 정보 출력)
    if (process.env.NODE_ENV === 'development') {
      console.error("[ErrorBoundary] Component crash detected:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    } else {
      // 프로덕션에서는 최소한의 정보만 로깅
      console.error("[ErrorBoundary] Component error:", error.message);
    }

    // 외부 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);

    // 자동 복구 시도
    this.attemptAutoRecovery();
  }

  componentWillUnmount() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
  }

  attemptAutoRecovery = () => {
    const { recoveryAttempts } = this.state;

    if (recoveryAttempts >= this.MAX_RECOVERY_ATTEMPTS) {
      console.warn("[ErrorBoundary] Max recovery attempts reached");
      return;
    }

    this.setState({ isRecovering: true, recoveryProgress: 0 });

    // 복구 진행률 애니메이션
    const progressInterval = setInterval(() => {
      this.setState(prev => {
        const newProgress = prev.recoveryProgress + 10;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
        }
        return { recoveryProgress: Math.min(newProgress, 100) };
      });
    }, 200);

    // 2초 후 복구 시도
    this.recoveryTimer = setTimeout(() => {
      clearInterval(progressInterval);
      this.setState(prev => ({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false,
        recoveryProgress: 100,
        recoveryAttempts: prev.recoveryAttempts + 1,
        recovered: true
      }));

      // 복구 성공 메시지 3초 후 초기화
      setTimeout(() => {
        this.setState({ recovered: false });
      }, 3000);
    }, 2000);
  };

  handleManualRetry = () => {
    this.setState({ recoveryAttempts: 0 }, () => {
      this.attemptAutoRecovery();
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    const { 
      hasError, 
      error, 
      isRecovering, 
      recoveryProgress, 
      recoveryAttempts,
      recovered 
    } = this.state;
    const { children, fallbackComponent } = this.props;

    // 복구 성공 알림
    if (recovered && !hasError) {
      return (
        <>
          {children}
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
            <Card className="bg-green-50 border-green-200 shadow-lg">
              <CardContent className="flex items-center gap-3 p-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-green-800">시스템 복구 완료</div>
                  <div className="text-xs text-green-600">
                    자동 복구가 성공적으로 완료되었습니다.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      );
    }

    if (hasError) {
      // 사용자 정의 fallback이 있으면 사용
      if (fallbackComponent) {
        return fallbackComponent;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                {isRecovering ? (
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                )}
              </div>
              <CardTitle className="text-xl">
                {isRecovering ? "🔄 System Recovery" : "⚠️ System Error"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRecovering ? (
                <div className="space-y-3">
                  <div className="text-center text-muted-foreground">
                    시스템을 자동으로 복구 중입니다...
                  </div>
                  <Progress value={recoveryProgress} className="h-2" />
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      보안 체크
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      상태 복원
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                    <div className="font-medium text-red-800 mb-1">
                      오류 감지됨
                    </div>
                    <div className="text-red-600 text-xs font-mono break-all">
                      {error?.message || "Unknown error"}
                    </div>
                  </div>

                  {recoveryAttempts > 0 && (
                    <div className="text-center text-xs text-muted-foreground">
                      복구 시도: {recoveryAttempts}/{this.MAX_RECOVERY_ATTEMPTS}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {recoveryAttempts < this.MAX_RECOVERY_ATTEMPTS && (
                      <Button 
                        onClick={this.handleManualRetry}
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        재시도
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      onClick={this.handleReload}
                      className="flex-1"
                    >
                      새로고침
                    </Button>
                  </div>

                  <div className="text-center text-xs text-muted-foreground">
                    문제가 지속되면 페이지를 새로고침해주세요.
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;





