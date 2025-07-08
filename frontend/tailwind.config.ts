import type { Config } from 'tailwindcss';

const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.stories.@(js|jsx|ts|tsx)', // Storybook stories
    './.storybook/**/*.{js,ts,jsx,tsx}', // Storybook config
  ],
  darkMode: 'class',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          hover: 'var(--primary-hover)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        glow: {
          primary: 'var(--glow-primary)',
          secondary: 'var(--glow-secondary)',
          accent: 'var(--glow-accent)',
        },
        shadow: 'var(--shadow-color)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-in-from-top': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-bottom': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'slide-in-from-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-in-from-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
          },
          '50%': {
            opacity: '0.8',
            boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
          },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'gradient-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'neon-flow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '25%': { backgroundPosition: '100% 0%' },
          '50%': { backgroundPosition: '100% 100%' },
          '75%': { backgroundPosition: '0% 100%' },
        },
        'electric-pulse': {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
            filter: 'brightness(1)',
          },
          '50%': {
            backgroundPosition: '100% 50%',
            filter: 'brightness(1.2)',
          },
        },
        'float-glow': {
          '0%, 100%': {
            transform: 'translateY(0px)',
            filter: 'drop-shadow(0 0 10px hsl(var(--glow-primary)))',
          },
          '50%': {
            transform: 'translateY(-20px)',
            filter: 'drop-shadow(0 0 20px hsl(var(--glow-primary)))',
          },
        },
        'pulse-electric': {
          '0%, 100%': { boxShadow: '0 0 5px hsl(var(--glow-accent))' },
          '50%': {
            boxShadow:
              '0 0 20px hsl(var(--glow-accent)), 0 0 30px hsl(var(--glow-accent))',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'text-glow-pulse': {
          '0%, 100%': {
            textShadow:
              '0 0 10px hsl(var(--glow-primary)), 0 0 20px hsl(var(--glow-primary))',
            transform: 'scale(1)',
          },
          '50%': {
            textShadow:
              '0 0 20px hsl(var(--glow-primary)), 0 0 30px hsl(var(--glow-primary)), 0 0 40px hsl(var(--glow-primary))',
            transform: 'scale(1.02)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'fade-out': 'fade-out 0.2s ease-out',
        'slide-in-from-top': 'slide-in-from-top 0.2s ease-out',
        'slide-in-from-bottom': 'slide-in-from-bottom 0.2s ease-out',
        'slide-in-from-left': 'slide-in-from-left 0.2s ease-out',
        'slide-in-from-right': 'slide-in-from-right 0.2s ease-out',
        float: 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease-in-out infinite',
        'gradient-flow': 'gradient-flow 8s ease-in-out infinite',
        'neon-flow': 'neon-flow 3s ease-in-out infinite',
        'electric-pulse': 'electric-pulse 2s ease-in-out infinite',
        'float-glow': 'float-glow 4s ease-in-out infinite',
        'pulse-electric': 'pulse-electric 2s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'text-glow': 'text-glow-pulse 3s ease-in-out infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
