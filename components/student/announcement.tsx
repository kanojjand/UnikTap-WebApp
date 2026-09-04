import { Megaphone } from 'lucide-react'
import type { AppSettings } from '@/types/domain'

export function Announcement({ announcement, locale }: { announcement: AppSettings['announcement']; locale: string }) {
  if (!announcement?.enabled) return null
  const text = (locale === 'kk' && announcement.text_kk ? announcement.text_kk : announcement.text_ru) ?? ''
  if (!text) return null

  const content = (
    <span className="flex items-start gap-2">
      <Megaphone className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
      {text}
    </span>
  )

  return (
    <div className="mx-4 mt-4 rounded-2xl bg-softBlue text-corpBlue text-sm p-4 font-medium">
      {announcement.link ? (
        <a href={announcement.link} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  )
}
