import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Profile, University } from '@/types/domain'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return (data as Profile) ?? null
})

export const isSuperadmin = cache(async (): Promise<boolean> => {
  const profile = await getCurrentProfile()
  return profile?.role === 'superadmin' && !profile.is_blocked
})

export async function getFavorites(userId: string): Promise<University[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('favorites')
    .select('created_at, university:universities(*, city:cities(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return ((data ?? []) as unknown as { university: University | null }[])
    .map((row) => row.university)
    .filter((u): u is University => Boolean(u))
}

export async function getFavoriteIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient()
  const { data } = await supabase.from('favorites').select('university_id').eq('user_id', userId)
  return new Set((data ?? []).map((row: { university_id: string }) => row.university_id))
}
