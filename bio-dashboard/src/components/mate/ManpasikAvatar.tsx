"use client";

/**
 * ============================================================
 * MANPASIK MATE - ANIMATED AVATAR
 * SVG-based face with emotional expressions
 * ============================================================
 */

import * as React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export type AvatarExpression = 
  | 'neutral'
  | 'happy'
  | 'worried'
  | 'thinking'
  | 'excited'
  | 'sleepy'
  | 'dizzy'
  | 'thirsty';

interface ManpasikAvatarProps {
  expression?: AvatarExpression;
  healthScore?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSpeaking?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 200,
};

// Expression configurations
const expressions: Record<AvatarExpression, {
  eyeType: 'normal' | 'happy' | 'worried' | 'closed' | 'spiral';
  mouthType: 'smile' | 'neutral' | 'worried' | 'open' | 'o';
  blush: boolean;
  sweat: boolean;
  sparkle: boolean;
}> = {
  neutral: { eyeType: 'normal', mouthType: 'neutral', blush: false, sweat: false, sparkle: false },
  happy: { eyeType: 'happy', mouthType: 'smile', blush: true, sweat: false, sparkle: true },
  worried: { eyeType: 'worried', mouthType: 'worried', blush: false, sweat: true, sparkle: false },
  thinking: { eyeType: 'normal', mouthType: 'neutral', blush: false, sweat: false, sparkle: false },
  excited: { eyeType: 'happy', mouthType: 'open', blush: true, sweat: false, sparkle: true },
  sleepy: { eyeType: 'closed', mouthType: 'neutral', blush: false, sweat: false, sparkle: false },
  dizzy: { eyeType: 'spiral', mouthType: 'o', blush: false, sweat: true, sparkle: false },
  thirsty: { eyeType: 'worried', mouthType: 'o', blush: false, sweat: true, sparkle: false },
};

// Animation variants
const floatVariants: Variants = {
  float: {
    y: [0, -5, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const blinkVariants: Variants = {
  open: { scaleY: 1 },
  closed: { scaleY: 0.1 },
};

const speakVariants: Variants = {
  idle: { scaleY: 1 },
  speak: {
    scaleY: [1, 0.5, 1, 0.3, 1],
    transition: {
      duration: 0.3,
      repeat: Infinity,
    },
  },
};

export function ManpasikAvatar({
  expression: propExpression,
  healthScore,
  size = 'md',
  isSpeaking = false,
  onClick,
  className,
}: ManpasikAvatarProps) {
  const [isBlinking, setIsBlinking] = React.useState(false);
  const [internalExpression, setInternalExpression] = React.useState<AvatarExpression>('neutral');
  
  // Determine expression based on health score if not explicitly set
  const expression = propExpression ?? (
    healthScore !== undefined
      ? healthScore > 90 ? 'excited'
        : healthScore > 75 ? 'happy'
        : healthScore > 60 ? 'neutral'
        : healthScore > 40 ? 'worried'
        : 'thirsty'
      : internalExpression
  );

  const config = expressions[expression];
  const svgSize = sizeMap[size];
  const center = svgSize / 2;
  const scale = svgSize / 100; // Base design is 100x100

  // Blinking effect
  React.useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.7 && config.eyeType !== 'closed') {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 2000);

    return () => clearInterval(blinkInterval);
  }, [config.eyeType]);

  // Easter egg: Shake detection (simplified)
  React.useEffect(() => {
    let shakeCount = 0;
    let lastX = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const x = event.accelerationIncludingGravity?.x ?? 0;
      if (Math.abs(x - lastX) > 15) {
        shakeCount++;
        if (shakeCount > 3) {
          setInternalExpression('dizzy');
          setTimeout(() => setInternalExpression('neutral'), 2000);
          shakeCount = 0;
        }
      }
      lastX = x;
    };

    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleMotion);
      return () => window.removeEventListener('devicemotion', handleMotion);
    }
  }, []);

  // Handle tap -> wink
  const handleClick = () => {
    setInternalExpression('happy');
    setTimeout(() => setInternalExpression('neutral'), 500);
    onClick?.();
  };

  // Eye component
  const Eye = ({ x, y }: { x: number; y: number }) => {
    const eyeSize = 8 * scale;
    const pupilSize = 4 * scale;

    switch (config.eyeType) {
      case 'happy':
        return (
          <motion.path
            d={`M ${x - eyeSize} ${y} Q ${x} ${y - eyeSize * 1.5} ${x + eyeSize} ${y}`}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={2 * scale}
            strokeLinecap="round"
          />
        );
      case 'worried':
        return (
          <>
            <circle cx={x} cy={y} r={eyeSize} fill="white" stroke="#1a1a1a" strokeWidth={1 * scale} />
            <motion.circle cx={x} cy={y + 2 * scale} r={pupilSize} fill="#1a1a1a" />
            <motion.path
              d={`M ${x - eyeSize} ${y - eyeSize * 1.2} Q ${x} ${y - eyeSize * 0.5} ${x + eyeSize} ${y - eyeSize * 1.2}`}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={1.5 * scale}
            />
          </>
        );
      case 'closed':
        return (
          <motion.path
            d={`M ${x - eyeSize} ${y} L ${x + eyeSize} ${y}`}
            stroke="#1a1a1a"
            strokeWidth={2 * scale}
            strokeLinecap="round"
          />
        );
      case 'spiral':
        return (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          >
            <circle cx={x} cy={y} r={eyeSize} fill="white" stroke="#1a1a1a" strokeWidth={1 * scale} />
            <path
              d={`M ${x} ${y} 
                  a ${eyeSize * 0.2} ${eyeSize * 0.2} 0 0 1 ${eyeSize * 0.4} 0
                  a ${eyeSize * 0.3} ${eyeSize * 0.3} 0 0 1 0 ${eyeSize * 0.6}
                  a ${eyeSize * 0.4} ${eyeSize * 0.4} 0 0 1 -${eyeSize * 0.8} 0`}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth={1 * scale}
            />
          </motion.g>
        );
      default: // normal
        return (
          <motion.g
            variants={blinkVariants}
            animate={isBlinking ? 'closed' : 'open'}
            style={{ transformOrigin: `${x}px ${y}px` }}
          >
            <circle cx={x} cy={y} r={eyeSize} fill="white" stroke="#1a1a1a" strokeWidth={1 * scale} />
            <circle cx={x + 1 * scale} cy={y - 1 * scale} r={pupilSize} fill="#1a1a1a" />
            <circle cx={x + 2 * scale} cy={y - 2 * scale} r={1.5 * scale} fill="white" />
          </motion.g>
        );
    }
  };

  // Mouth component
  const Mouth = () => {
    const mouthY = center + 15 * scale;
    const mouthWidth = 12 * scale;

    switch (config.mouthType) {
      case 'smile':
        return (
          <motion.path
            d={`M ${center - mouthWidth} ${mouthY} Q ${center} ${mouthY + 10 * scale} ${center + mouthWidth} ${mouthY}`}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={2 * scale}
            strokeLinecap="round"
            variants={speakVariants}
            animate={isSpeaking ? 'speak' : 'idle'}
          />
        );
      case 'worried':
        return (
          <motion.path
            d={`M ${center - mouthWidth} ${mouthY + 5 * scale} Q ${center} ${mouthY - 5 * scale} ${center + mouthWidth} ${mouthY + 5 * scale}`}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth={2 * scale}
            strokeLinecap="round"
          />
        );
      case 'open':
        return (
          <motion.ellipse
            cx={center}
            cy={mouthY + 2 * scale}
            rx={mouthWidth * 0.8}
            ry={8 * scale}
            fill="#ff6b6b"
            stroke="#1a1a1a"
            strokeWidth={1.5 * scale}
            variants={speakVariants}
            animate={isSpeaking ? 'speak' : 'idle'}
          />
        );
      case 'o':
        return (
          <motion.circle
            cx={center}
            cy={mouthY + 2 * scale}
            r={5 * scale}
            fill="#ff6b6b"
            stroke="#1a1a1a"
            strokeWidth={1.5 * scale}
          />
        );
      default: // neutral
        return (
          <motion.path
            d={`M ${center - mouthWidth * 0.7} ${mouthY} L ${center + mouthWidth * 0.7} ${mouthY}`}
            stroke="#1a1a1a"
            strokeWidth={2 * scale}
            strokeLinecap="round"
            variants={speakVariants}
            animate={isSpeaking ? 'speak' : 'idle'}
          />
        );
    }
  };

  return (
    <motion.div
      className={cn("cursor-pointer select-none", className)}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      variants={floatVariants}
      animate="float"
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background glow */}
        <defs>
          <radialGradient id="avatar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="face-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff9e6" />
            <stop offset="100%" stopColor="#ffe4b5" />
          </linearGradient>
        </defs>

        {/* Glow effect */}
        <circle cx={center} cy={center} r={center * 0.95} fill="url(#avatar-glow)" />

        {/* Face circle */}
        <circle
          cx={center}
          cy={center}
          r={center * 0.8}
          fill="url(#face-gradient)"
          stroke="#e6c88a"
          strokeWidth={2 * scale}
        />

        {/* Eyes */}
        <Eye x={center - 15 * scale} y={center - 5 * scale} />
        <Eye x={center + 15 * scale} y={center - 5 * scale} />

        {/* Mouth */}
        <Mouth />

        {/* Blush */}
        <AnimatePresence>
          {config.blush && (
            <>
              <motion.ellipse
                cx={center - 22 * scale}
                cy={center + 8 * scale}
                rx={6 * scale}
                ry={3 * scale}
                fill="#ffb3ba"
                opacity={0.6}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
              />
              <motion.ellipse
                cx={center + 22 * scale}
                cy={center + 8 * scale}
                rx={6 * scale}
                ry={3 * scale}
                fill="#ffb3ba"
                opacity={0.6}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Sweat drop */}
        <AnimatePresence>
          {config.sweat && (
            <motion.path
              d={`M ${center + 30 * scale} ${center - 20 * scale} 
                  Q ${center + 33 * scale} ${center - 10 * scale} ${center + 30 * scale} ${center - 5 * scale}
                  Q ${center + 27 * scale} ${center - 10 * scale} ${center + 30 * scale} ${center - 20 * scale}`}
              fill="#87ceeb"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            />
          )}
        </AnimatePresence>

        {/* Sparkles */}
        <AnimatePresence>
          {config.sparkle && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.g
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    scale: [0.5, 1, 0.5],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.5 
                  }}
                  style={{
                    transformOrigin: `${center + (i - 1) * 25 * scale}px ${center - 35 * scale}px`
                  }}
                >
                  <path
                    d={`M ${center + (i - 1) * 25 * scale} ${center - 38 * scale}
                        L ${center + (i - 1) * 25 * scale + 2 * scale} ${center - 35 * scale}
                        L ${center + (i - 1) * 25 * scale} ${center - 32 * scale}
                        L ${center + (i - 1) * 25 * scale - 2 * scale} ${center - 35 * scale} Z`}
                    fill="#ffd700"
                  />
                </motion.g>
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Thinking animation */}
        {expression === 'thinking' && (
          <motion.g
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={center + 28 * scale + i * 6 * scale}
                cy={center - 25 * scale - i * 4 * scale}
                r={(3 - i) * scale}
                fill="#9ca3af"
              />
            ))}
          </motion.g>
        )}
      </svg>
    </motion.div>
  );
}






