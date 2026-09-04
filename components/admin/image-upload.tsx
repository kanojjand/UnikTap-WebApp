'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { uploadUniversityMedia } from '@/lib/actions/uploads'
import { cn } from '@/lib/utils'

/**
 * Загрузка файла в бакет university-media. Возвращает публичный URL.
 * Ограничения: 5 МБ, JPG/PNG/WEBP — проверяются и на клиенте, и на сервере.
 */
export function ImageUpload({
  universityId,
  value,
  onChange,
  label,
  aspect = 'landscape',
  hint,
}: {
  universityId: string
  value?: string
  onChange: (url: string) => void
  label: string
  aspect?: 'landscape' | 'square'
  hint?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [dragging, setDragging] = useState(false)

  function upload(file: File | undefined) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return toast.error('Файл больше 5 МБ')

    const formData = new FormData()
    formData.set('file', file)
    formData.set('university_id', universityId)

    startTransition(async () => {
      const result = await uploadUniversityMedia(formData)
      if (result.ok) {
        onChange(result.url)
        toast.success('Файл загружен')
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div>
      <p className="block text-sm font-bold text-gray-700 mb-1">{label}</p>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          upload(event.dataTransfer.files?.[0])
        }}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-colors overflow-hidden bg-slateBg',
          aspect === 'square' ? 'aspect-square max-w-[180px]' : 'aspect-[16/7]',
          dragging ? 'border-corpBlue bg-softBlue' : 'border-gray-200',
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="absolute inset-0 w-full h-full object-cover" />
        ) : null}

        <button
          type="button"
          onClick={() => input.current?.click()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-gray-500 hover:text-corpBlue"
        >
          {pending ? (
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden />
          ) : value ? (
            <span className="bg-white/90 rounded-xl px-3 py-1.5 text-xs font-medium shadow-card">Заменить</span>
          ) : (
            <>
              <ImagePlus className="w-6 h-6" aria-hidden />
              <span className="text-xs text-center px-2">Перетащите файл или нажмите</span>
            </>
          )}
        </button>

        {value && !pending ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Убрать"
            className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 text-gray-500 hover:text-red-600 shadow-card"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}

        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            upload(event.target.files?.[0])
            event.target.value = ''
          }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{hint ?? 'JPG, PNG или WEBP, до 5 МБ'}</p>
    </div>
  )
}
