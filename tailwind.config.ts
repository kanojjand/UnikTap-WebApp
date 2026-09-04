import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        corpBlue: '#1E3A8A',
        corpBlueHover: '#1E40AF',
        softBlue: '#EFF6FF',
        slateBg: '#F8FAFC',
        whatsapp: '#25D366',
        whatsappHover: '#20BD5A',
      },
      borderRadius: {
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        bar: '0 -10px 20px rgb(0 0 0 / 0.05)',
        modal: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        'sheet-up': { '0%': { transform: 'translateY(100%)' }, '100%': { transform: 'translateY(0)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        'sheet-up': 'sheet-up 200ms ease-out',
        'fade-in': 'fade-in 150ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config
