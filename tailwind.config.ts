import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    transparent: "transparent",
    current: "currentColor",
    extend: {
      fontFamily: {
        sans: ['Geist', 'Arial', 'Apple Color Emoji', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },

      colors: {
        // ── Vercel Dark core palette ─────────────────────────────
        vercel: {
          black:   '#000000',   // True black — page canvas
          surface: '#0a0a0a',   // Card surface
          raised:  '#111111',   // Elevated surface
          white:   '#ededed',   // Near-white primary text
          // Workflow accent trio (same in dark as light)
          ship:    '#ff5b4f',   // Ship Red
          preview: '#de1d8d',   // Preview Pink
          develop: '#3b9eff',   // Develop Blue (lightened for dark bg)
          // Neutral scale (dark-mode inverted)
          900:     '#ededed',   // was light-mode text
          600:     '#a1a1a1',
          500:     '#888888',
          400:     '#666666',
          100:     'rgba(255,255,255,0.08)',  // border
          50:      'rgba(255,255,255,0.04)',  // subtle hover
        },

        // ── Shadcn CSS-variable bridge ───────────────────────────
        border:     'var(--border)',
        input:      'var(--input)',
        ring:       'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT:    'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT:    'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT:    'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT:    'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT:    'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT:    'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT:    'var(--card)',
          foreground: 'var(--card-foreground)',
        },

        // ── Tremor dark tokens (Vercel dark palette) ─────────────
        tremor: {
          brand: {
            faint:    'rgba(59,158,255,0.08)',
            muted:    'rgba(59,158,255,0.15)',
            subtle:   '#1a6cc4',
            DEFAULT:  '#3b9eff',
            emphasis: '#60b0ff',
            inverted: '#000000',
          },
          background: {
            muted:    '#111111',
            subtle:   '#0a0a0a',
            DEFAULT:  '#000000',
            emphasis: '#ededed',
          },
          border:  { DEFAULT: 'rgba(255,255,255,0.08)' },
          ring:    { DEFAULT: 'rgba(255,255,255,0.08)' },
          content: {
            subtle:   '#666666',
            DEFAULT:  '#888888',
            emphasis: '#a1a1a1',
            strong:   '#ededed',
            inverted: '#000000',
          },
        },
        'dark-tremor': {
          brand: {
            faint:    'rgba(59,158,255,0.08)',
            muted:    'rgba(59,158,255,0.15)',
            subtle:   '#1a6cc4',
            DEFAULT:  '#3b9eff',
            emphasis: '#60b0ff',
            inverted: '#000000',
          },
          background: {
            muted:    '#111111',
            subtle:   '#0a0a0a',
            DEFAULT:  '#000000',
            emphasis: '#ededed',
          },
          border:  { DEFAULT: 'rgba(255,255,255,0.08)' },
          ring:    { DEFAULT: 'rgba(255,255,255,0.08)' },
          content: {
            subtle:   '#666666',
            DEFAULT:  '#888888',
            emphasis: '#a1a1a1',
            strong:   '#ededed',
            inverted: '#000000',
          },
        },
      },

      // ── Vercel dark shadow system ────────────────────────────────
      // Light mode uses black-tinted shadows; dark mode uses white-tinted
      boxShadow: {
        'v-border':    'rgba(255,255,255,0.08) 0px 0px 0px 1px',
        'v-card':      'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.5) 0px 2px 4px',
        'v-card-full': 'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.6) 0px 4px 12px, rgba(255,255,255,0.03) 0px 0px 0px 1px inset',
        'v-ring':      'rgba(255,255,255,0.12) 0px 0px 0px 1px',
        'v-focus':     '0 0 0 2px hsla(212, 100%, 60%, 1)',
        // Tremor compatibility
        'tremor-input':    'rgba(255,255,255,0.08) 0px 0px 0px 1px',
        'tremor-card':     'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.4) 0px 2px 4px',
        'tremor-dropdown': 'rgba(255,255,255,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.6) 0px 8px 20px',
      },

      // ── Vercel border-radius scale ───────────────────────────────
      borderRadius: {
        none:    '0',
        sm:      '4px',
        DEFAULT: '6px',
        md:      '6px',
        lg:      '8px',
        xl:      '12px',
        '2xl':   '16px',
        '3xl':   '64px',
        full:    '9999px',
        'tremor-small':   '6px',
        'tremor-default': '8px',
        'tremor-full':    '9999px',
      },

      fontSize: {
        'tremor-label':   ['0.75rem',  { lineHeight: '1rem' }],
        'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
        'tremor-title':   ['1rem',     { lineHeight: '1.5rem' }],
        'tremor-metric':  ['3rem',     { lineHeight: '1' }],
      },

      // ── JumpingDots 動畫 ─────────────────────────────────────
      // 每個點跳 4px，0%→80%→100% 靜止，40% 峰值，搭配 150ms stagger
      keyframes: {
        'dot-bounce': {
          '0%, 80%, 100%': { transform: 'translateY(0)' },
          '40%':           { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'dot-bounce': 'dot-bounce 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
