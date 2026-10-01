import type { Metadata, Viewport } from 'next'
import { getLocale } from 'next-intl/server'
import { inter } from './fonts'
import { Analytics } from '@vercel/analytics/next'
import { ServiceWorkerRegister } from '@/components/student/sw-register'
import { AppToaster } from '@/components/ui/app-toaster'
import { THEME_SCRIPT } from '@/lib/theme'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'UnikTap — университеты Казахстана',
    template: '%s · UnikTap',
  },
  description:
    'Каталог университетов Казахстана: проходные баллы на грант, стоимость обучения, специальности, отзывы студентов и контакты приёмных комиссий.',
  applicationName: 'UnikTap',
  appleWebApp: { capable: true, title: 'UnikTap', statusBarStyle: 'default' },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F7FA' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1220' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    // Класс темы ставит THEME_SCRIPT до гидратации — поэтому suppressHydrationWarning
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <AppToaster />
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
