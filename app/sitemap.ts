import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public'
import { routing } from '@/i18n/routing'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of routing.locales) {
    for (const path of ['', '/map', '/calculator', '/faq']) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        changeFrequency: 'daily',
        priority: path === '' ? 1 : 0.7,
        alternates: {
          languages: Object.fromEntries(routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`])),
        },
      })
    }
  }

  try {
    const supabase = createPublicClient()
    const [{ data: universityRows }, { data: pageRows }] = await Promise.all([
      supabase.from('universities').select('slug, updated_at').eq('is_published', true).is('deleted_at', null),
      supabase.from('static_pages').select('slug, updated_at').eq('is_published', true),
    ])
    const universities = (universityRows ?? []) as { slug: string; updated_at: string }[]
    const pages = (pageRows ?? []) as { slug: string; updated_at: string }[]

    for (const locale of routing.locales) {
      for (const university of universities) {
        entries.push({
          url: `${siteUrl}/${locale}/universities/${university.slug}`,
          lastModified: university.updated_at,
          changeFrequency: 'weekly',
          priority: 0.9,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map((l) => [l, `${siteUrl}/${l}/universities/${university.slug}`]),
            ),
          },
        })
      }
      for (const page of pages) {
        entries.push({
          url: `${siteUrl}/${locale}/${page.slug}`,
          lastModified: page.updated_at,
          changeFrequency: 'monthly',
          priority: 0.3,
        })
      }
    }
  } catch (error) {
    console.error('sitemap build failed', error)
  }

  return entries
}
