import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { FaqItem, StaticPage } from '@/types/domain'

export const getStaticPage = cache(async (slug: string): Promise<StaticPage | null> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('static_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  return (data as StaticPage) ?? null
})

export const getStaticPages = cache(async (): Promise<StaticPage[]> => {
  const supabase = await createClient()
  const { data } = await supabase.from('static_pages').select('*').eq('is_published', true)
  return (data ?? []) as StaticPage[]
})

export const getFaq = cache(async (): Promise<FaqItem[]> => {
  const supabase = await createClient()
  const { data } = await supabase.from('faq').select('*').eq('is_published', true).order('sort_order')
  return (data ?? []) as FaqItem[]
})
