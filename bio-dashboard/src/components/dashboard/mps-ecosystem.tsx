"use client";

import React from "react";

/**
 * MPS Ecosystem Visualization
 * 
 * 만파식 생태계: 모이고 → 가공되어 → 펼쳐지다
 * Collect → Process → Expand
 */
export function MpsEcosystem() {
  return (
    <div className="hanji-card rounded-2xl p-4 lg:p-5 animate-ink-spread">
      <div className="flex flex-col h-full">
        <h3 className="text-responsive-sm font-medium text-muted-foreground mb-3">
          MPS 생태계
        </h3>

        {/* Animated Ecosystem Visualization */}
        <div className="flex-1 flex items-center justify-center min-h-[120px]">
          <svg
            viewBox="0 0 200 120"
            className="w-full h-full max-w-[200px]"
            aria-label="MPS Ecosystem Flow"
          >
            {/* Collect Circle */}
            <g className="animate-breathe" style={{ transformOrigin: "40px 60px" }}>
              <circle
                cx="40"
                cy="60"
                r="25"
                className="fill-dancheong-green/20 stroke-dancheong-green"
                strokeWidth="1.5"
              />
              <text
                x="40"
                y="56"
                textAnchor="middle"
                className="fill-dancheong-green text-[8px] font-medium"
              >
                모이고
              </text>
              <text
                x="40"
                y="67"
                textAnchor="middle"
                className="fill-dancheong-green/70 text-[6px]"
              >
                Collect
              </text>
            </g>

            {/* Process Circle */}
            <g
              className="animate-breathe"
              style={{ transformOrigin: "100px 60px", animationDelay: "0.5s" }}
            >
              <circle
                cx="100"
                cy="60"
                r="25"
                className="fill-dancheong-red/10 stroke-dancheong-red"
                strokeWidth="1"
              />
              <text
                x="100"
                y="56"
                textAnchor="middle"
                className="fill-dancheong-red text-[8px] font-medium"
              >
                가공
              </text>
              <text
                x="100"
                y="67"
                textAnchor="middle"
                className="fill-dancheong-red/70 text-[6px]"
              >
                Process
              </text>
            </g>

            {/* Expand Circle */}
            <g
              className="animate-breathe"
              style={{ transformOrigin: "160px 60px", animationDelay: "1s" }}
            >
              <circle
                cx="160"
                cy="60"
                r="25"
                className="fill-dancheong-blue/10 stroke-dancheong-blue"
                strokeWidth="1"
              />
              <text
                x="160"
                y="56"
                textAnchor="middle"
                className="fill-dancheong-blue text-[8px] font-medium"
              >
                펼쳐지다
              </text>
              <text
                x="160"
                y="67"
                textAnchor="middle"
                className="fill-dancheong-blue/70 text-[6px]"
              >
                Expand
              </text>
            </g>

            {/* Flow Lines */}
            <path
              d="M 65 60 L 75 60"
              className="stroke-ink-wash animate-flow-outward"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
            />
            <path
              d="M 125 60 L 135 60"
              className="stroke-ink-wash animate-flow-outward"
              strokeWidth="2"
              strokeDasharray="4 4"
              fill="none"
              style={{ animationDelay: "0.5s" }}
            />

            {/* Arrows */}
            <polygon points="73,57 78,60 73,63" className="fill-ink-wash" />
            <polygon points="133,57 138,60 133,63" className="fill-ink-wash" />
          </svg>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-responsive-xs text-muted-foreground pt-3 border-t border-ink/6">
          <span>수집: 12,847</span>
          <span>가공: 847</span>
          <span>확산: 15</span>
        </div>
      </div>
    </div>
  );
}

export default MpsEcosystem;
