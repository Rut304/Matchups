import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Premium dark theme - BOLD electric colors
        background: {
          DEFAULT: '#050508',      // Near black
          secondary: '#0c0c12',    // Dark charcoal  
          tertiary: '#141420',     // Slightly lighter
          elevated: '#1c1c2a',     // Card hover
        },
        // Primary accent - ELECTRIC ORANGE/GOLD (eye-catching)
        accent: {
          DEFAULT: '#FF6B00',      // Vibrant orange
          light: '#FF8534',        // Lighter orange
          dark: '#CC5500',         // Darker orange
          muted: '#994000',        // Muted for backgrounds
        },
        // Secondary accent - ELECTRIC BLUE (not teal)
        highlight: {
          DEFAULT: '#00A8FF',      // Electric blue
          light: '#33BBFF',        // Lighter blue
          dark: '#0088CC',         // Darker blue
          muted: '#005580',        // Muted blue
        },
        // HOT colors for emphasis
        hot: {
          DEFAULT: '#FF3366',      // Hot pink/magenta
          light: '#FF5588',
          dark: '#CC2952',
        },
        // Semantic colors - BRIGHT and clear
        win: '#00FF88',            // Neon green
        loss: '#FF4455',           // Bright red
        push: '#888899',           // Gray
        // Text colors - High contrast
        text: {
          primary: '#FFFFFF',      // Pure white
          secondary: '#A0A0B0',    // Light gray
          muted: '#606070',        // Muted gray
        },
        // Border colors
        border: {
          DEFAULT: '#252530',
          light: '#353545',
          accent: '#FF6B00',
        },
        // Gradient stops
        glow: {
          orange: 'rgba(255, 107, 0, 0.5)',
          blue: 'rgba(0, 168, 255, 0.5)',
          pink: 'rgba(255, 51, 102, 0.5)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 30px rgba(255, 107, 0, 0.4)',
        'glow-highlight': '0 0 30px rgba(0, 168, 255, 0.4)',
        'glow-hot': '0 0 30px rgba(255, 51, 102, 0.4)',
        'glow-win': '0 0 20px rgba(0, 255, 136, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 107, 0, 0.15), transparent)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'marquee': 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 107, 0, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 107, 0, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
