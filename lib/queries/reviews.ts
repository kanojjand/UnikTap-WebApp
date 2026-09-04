import { createClient } from '@/lib/supabase/server'
import type { Review } from '@/types/domain'

export type ReviewSort = 'helpful' | 'new' | 'high' | 'low'

export async function getUniversityReviews(
  universityId: string,
  sort: ReviewSort = 'helpful',
): Promise<Review[]> {
  const supabase = await createClient()
  let query = supabase
    .from('reviews')
    .select('*')
    .eq('university_id', universityId)
    .eq('status', 'approved')
    .is('deleted_at', null)

  if (sort === 'new') query = query.order('created_at', { ascending: false })
  else if (sort === 'high') query = query.order('rating', { ascending: false })
  else if (sort === 'low') query = query.order('rating', { ascending: true })
  else query = query.order('helpful_count', { ascending: false }).order('created_at', { ascending: false })

  const { data } = await query.limit(100)
  return (data ?? []) as Review[]
}

export interface ReviewSummary {
  count: number
  average: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
  criteria: { teaching: number; facilities: number; dormitory: number; career: number; social: number }
}

export function summarizeReviews(reviews: Review[]): ReviewSummary {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
  const totals = { teaching: [0, 0], facilities: [0, 0], dormitory: [0, 0], career: [0, 0], social: [0, 0] }

  for (const review of reviews) {
    distribution[Math.min(5, Math.max(1, review.rating)) as 1 | 2 | 3 | 4 | 5] += 1
    const pairs: [keyof typeof totals, number | null][] = [
      ['teaching', review.rating_teaching],
      ['facilities', review.rating_facilities],
      ['dormitory', review.rating_dormitory],
      ['career', review.rating_career],
      ['social', review.rating_social],
    ]
    for (const [key, value] of pairs) {
      if (value != null) {
        totals[key][0] += value
        totals[key][1] += 1
      }
    }
  }

  const avg = (pair: number[]) => (pair[1] === 0 ? 0 : Math.round((pair[0] / pair[1]) * 10) / 10)

  return {
    count: reviews.length,
    average:
      reviews.length === 0
        ? 0
        : Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10,
    distribution,
    criteria: {
      teaching: avg(totals.teaching),
      facilities: avg(totals.facilities),
      dormitory: avg(totals.dormitory),
      career: avg(totals.career),
      social: avg(totals.social),
    },
  }
}

export async function getMyReview(universityId: string, userId: string): Promise<Review | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('university_id', universityId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .maybeSingle()
  return (data as Review) ?? null
}

export async function getMyReviews(userId: string): Promise<Review[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reviews')
    .select('*, university:universities(id, slug, name_ru)')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown as Review[]
}

export async function getMyVotes(userId: string, reviewIds: string[]): Promise<Set<string>> {
  if (reviewIds.length === 0) return new Set()
  const supabase = await createClient()
  const { data } = await supabase
    .from('review_votes')
    .select('review_id')
    .eq('user_id', userId)
    .in('review_id', reviewIds)
  return new Set((data ?? []).map((row: { review_id: string }) => row.review_id))
}
