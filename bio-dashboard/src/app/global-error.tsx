'use client';

/**
 * Global Error Handler
 * Catches unhandled errors at the root level
 * Must be in app/ directory (not app/(group)/)
 */

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, Datadog, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Production error reporting
      console.error('[GlobalError] Unhandled error:', {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
      });
      
      // Send to SIEM/Error tracking
      // getSIEMManager().logSecurityEvent({ ... });
    }
  }, [error]);

  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            오류가 발생했습니다
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            죄송합니다. 예기치 않은 오류가 발생했습니다.
            <br />
            문제가 지속되면 고객 지원팀에 문의해주세요.
          </p>

          {/* Error Details (Dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-left overflow-auto">
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 break-all">
                <span className="text-red-600 dark:text-red-400 font-semibold">Error:</span>{' '}
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-slate-500 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
            
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              홈으로
            </a>
          </div>

          {/* Report Bug */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
            <a
              href="mailto:support@manpasik.com?subject=Bug Report"
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors"
            >
              <Bug className="w-4 h-4" />
              버그 신고하기
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}


