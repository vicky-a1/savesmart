import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'base': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: '#F8FAFC',
        foreground: '#0F172A',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#1A56DB',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: '#059669',
          light: '#ECFDF5',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
          foreground: '#FFFFFF',
        },
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
          foreground: '#FFFFFF',
        },
        info: {
          DEFAULT: '#1A56DB',
          light: '#EFF6FF',
          foreground: '#FFFFFF',
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background, 255 255 255))",
          foreground: "hsl(var(--sidebar-foreground, 15 23 42))",
          primary: "hsl(var(--sidebar-primary, 26 86 219))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground, 255 255 255))",
          accent: "hsl(var(--sidebar-accent, 248 250 252))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground, 15 23 42))",
          border: "hsl(var(--sidebar-border, 226 232 240))",
          ring: "hsl(var(--sidebar-ring, 26 86 219))",
        },
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        elevated: '0 4px 16px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
