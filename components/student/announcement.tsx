import { Megaphone } from 'lucide-react'
import type { AppSettings } from '@/types/domain'

export function Announcement({ announcement, locale }: { announcement: AppSettings['announcement']; locale: string }) {
  if (!announcement?.enabled) return null
  const text = (locale === 'kk' && announcement.text_kk ? announcement.text_kk : announcement.text_ru) ?? ''
  if (!text) return null

  const content = (
    <span className="flex items-start gap-3">
      <Megaphone className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
      <span>{text}</span>
    </span>
  )

  return (
    <div className="container-app mt-3">
      <div className="rounded-2xl border border-line bg-surface text-body text-[15px] p-4">
        {announcement.link ? (
          <a
            href={announcement.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block underline-offset-4 hover:underline text-primary-ink font-medium"
          >
            {content}
          </a>
        ) : (
          content
        )}
      </div>
    </div>
  )
}
