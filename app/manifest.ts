import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UnikTap — университеты Казахстана',
    short_name: 'UnikTap',
    description: 'Университеты Казахстана: проходные баллы, стоимость, отзывы',
    start_url: '/ru',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#1E3A8A',
    background_color: '#F8FAFC',
    lang: 'ru',
    categories: ['education'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-256.png', sizes: '256x256', type: 'image/png' },
      { src: '/icons/icon-384.png', sizes: '384x384', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
