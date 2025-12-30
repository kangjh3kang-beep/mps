import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" }
    },
    extend: {
      // 만파식 디자인 시스템 - Typography
      fontFamily: {
        sans: ["Noto Sans KR", "Inter", "system-ui", "-apple-system", "sans-serif"],
        korean: ["Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      
      // 만파식 컬러 팔레트
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        
        // 수묵화 컬러 (Ink Painting Colors)
        ink: {
          DEFAULT: "hsl(var(--ink))",
          light: "hsl(var(--ink-light))",
          wash: "hsl(var(--ink-wash))",
          mist: "hsl(var(--ink-mist))",
        },
        
        // 단청 컬러 (Dancheong Korean Traditional Colors)
        dancheong: {
          red: "hsl(var(--dancheong-red))",
          blue: "hsl(var(--dancheong-blue))",
          green: "hsl(var(--dancheong-green))",
          yellow: "hsl(var(--dancheong-yellow))",
        },
        
        // 한지 컬러 (Hanji Paper Colors)
        hanji: {
          DEFAULT: "hsl(var(--hanji))",
          warm: "hsl(var(--hanji-warm))",
        },
        
        // 차트 컬러 (오방색 기반)
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      
      // Border Radius
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      
      // Shadows (수묵화 스타일)
      boxShadow: {
        "ink-sm": "0 2px 8px -2px hsl(var(--ink) / 0.08), 0 1px 2px -1px hsl(var(--ink) / 0.04)",
        "ink": "0 4px 16px -4px hsl(var(--ink) / 0.12), 0 2px 4px -2px hsl(var(--ink) / 0.06)",
        "ink-lg": "0 8px 32px -8px hsl(var(--ink) / 0.16), 0 4px 8px -4px hsl(var(--ink) / 0.08)",
        "ink-xl": "0 16px 48px -12px hsl(var(--ink) / 0.20), 0 8px 16px -8px hsl(var(--ink) / 0.10)",
        "dancheong-glow": "0 0 24px -4px hsl(var(--dancheong-red) / 0.25)",
        "hanji": "0 1px 2px hsl(var(--ink) / 0.05), inset 0 1px 0 hsl(var(--hanji) / 0.8)",
        "glass": "0 8px 32px 0 hsl(var(--ink) / 0.1)",
      },
      
      // Backdrop Blur
      backdropBlur: {
        xs: "2px",
        glass: "12px",
        hanji: "8px",
      },
      
      // Animations
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.5s ease-out",
        "fade-in-down": "fadeInDown 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "count-up": "countUp 1s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "typing": "typing 1.4s ease-in-out infinite",
        "bounce-subtle": "bounceSubtle 0.6s ease-out",
        "ink-drop": "inkDrop 0.8s ease-out forwards",
        "ink-spread": "inkSpread 1s ease-out forwards",
        "gentle-float": "gentleFloat 4s ease-in-out infinite",
        "breathe": "breathe 4s ease-in-out infinite",
      },
      
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px hsl(var(--dancheong-red) / 0.2)" },
          "100%": { boxShadow: "0 0 30px hsl(var(--dancheong-red) / 0.4)" },
        },
        typing: {
          "0%": { opacity: "0.2" },
          "20%": { opacity: "1" },
          "100%": { opacity: "0.2" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        inkDrop: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "30%": { transform: "scale(0.4)", opacity: "0.9" },
          "100%": { transform: "scale(1)", opacity: "0.7" },
        },
        inkSpread: {
          "0%": { transform: "scale(0.3)", opacity: "0", filter: "blur(8px)" },
          "50%": { opacity: "0.6", filter: "blur(4px)" },
          "100%": { transform: "scale(1)", opacity: "1", filter: "blur(0)" },
        },
        gentleFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        breathe: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.03)", opacity: "0.7" },
        },
      },
      
      // Background Gradients
      backgroundImage: {
        "ink-gradient": "linear-gradient(135deg, hsl(var(--ink)) 0%, hsl(var(--ink-light)) 100%)",
        "ink-gradient-subtle": "linear-gradient(135deg, hsl(var(--ink) / 0.1) 0%, hsl(var(--ink-light) / 0.1) 100%)",
        "dancheong-gradient": "linear-gradient(135deg, hsl(var(--dancheong-red)) 0%, hsl(var(--dancheong-yellow)) 100%)",
        "hanji-gradient": "linear-gradient(145deg, hsl(var(--hanji)) 0%, hsl(var(--hanji-warm)) 100%)",
        "glass-gradient": "linear-gradient(135deg, hsl(var(--card) / 0.9) 0%, hsl(var(--card) / 0.7) 100%)",
        "mesh-pattern": "radial-gradient(circle at 25% 25%, hsl(var(--ink) / 0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, hsl(var(--dancheong-red) / 0.03) 0%, transparent 50%)",
      },
    }
  },
  plugins: []
} satisfies Config;
