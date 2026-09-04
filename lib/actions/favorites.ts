'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleFavorite(universityId: string): Promise<
  { ok: true; added: boolean } | { ok: false; error: 'unauthorized' | 'failed' }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data: existing } = await supabase
    .from('favorites')
    .select('university_id')
    .eq('user_id', user.id)
    .eq('university_id', universityId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('university_id', universityId)
    if (error) return { ok: false, error: 'failed' }
    revalidatePath('/[locale]/favorites', 'page')
    return { ok: true, added: false }
  }

  const { error } = await supabase.from('favorites').insert({ user_id: user.id, university_id: universityId })
  if (error) return { ok: false, error: 'failed' }
  revalidatePath('/[locale]/favorites', 'page')
  return { ok: true, added: true }
}
