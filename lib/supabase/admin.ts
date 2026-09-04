import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Сервисный клиент — обходит RLS. Использовать ТОЛЬКО в Server Actions
 * и route handlers, никогда не импортировать в клиентские компоненты.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY не задан')

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
