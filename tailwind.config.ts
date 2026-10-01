import type { Config } from 'tailwindcss'

/** Семантический цвет из CSS-переменной (значения и тёмная тема — в app/globals.css). */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Семантическая палитра: сами переключаются в тёмной теме
        canvas: token('canvas'),
        surface: token('surface'),
        subtle: token('subtle'),
        line: token('line'),
        ink: token('ink'),
        body: token('body'),
        muted: token('muted'),
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          ink: token('primary-ink'),
          soft: token('primary-soft'),
        },
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warning: { DEFAULT: token('warning'), soft: token('warning-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft'), solid: token('danger-solid') },

        // Фирменные цвета — остаются для админки
        corpBlue: '#1E3A8A',
        corpBlueHover: '#1E40AF',
        softBlue: '#EFF6FF',
        slateBg: '#F8FAFC',
        whatsapp: '#25D366',
        whatsappHover: '#1EBE5A',
      },
      borderRadius: {
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.04)',
        lift: '0 4px 16px -4px rgb(15 23 42 / 0.12)',
        bar: '0 -4px 16px rgb(15 23 42 / 0.06)',
        modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'sheet-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'sheet-up': 'sheet-up 220ms cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 150ms ease-out',
        pop: 'pop 300ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
