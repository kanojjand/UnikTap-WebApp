import { getTranslations } from 'next-intl/server'
import { Badge } from '@/components/ui/badge'
import type { Chance } from '@/lib/ent'

const TONES = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
  below_threshold: 'neutral',
} as const

export async function ChanceBadge({ chance, mini }: { chance: Chance; mini?: boolean }) {
  const t = await getTranslations('chance')
  return (
    <Badge tone={TONES[chance]} mini={mini}>
      {t(chance)}
    </Badge>
  )
}
