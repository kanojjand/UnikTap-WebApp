import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Клиент без cookie — для кэшируемых публичных запросов и sitemap.
 * Работает с анонимным ключом, поэтому видит только опубликованные данные (RLS).
 * Таймаут 8 секунд: если база недоступна, страница отдаёт пустой список,
 * а не висит до таймаута платформы.
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder',
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input as RequestInfo, { ...init, signal: AbortSignal.timeout(8000) }),
      },
    },
  )
}
