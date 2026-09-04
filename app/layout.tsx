import type { Metadata, Viewport } from 'next'
import { getLocale } from 'next-intl/server'
import { inter } from './fonts'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { ServiceWorkerRegister } from '@/components/student/sw-register'
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
  themeColor: '#1E3A8A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()

  return (
    <html lang={locale} className={inter.variable}>
      <body className="bg-[#E2E8F0] md:bg-[#E2E8F0]">
        {children}
        <Toaster position="top-center" richColors closeButton />
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
