'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { UniversityImage } from '@/types/domain'

/** Лента фото на телефоне, сетка на компьютере; по нажатию — просмотр на весь экран. */
export function Gallery({ images, alt }: { images: UniversityImage[]; alt: string }) {
  const [index, setIndex] = useState<number | null>(null)
  const open = index !== null

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIndex(null)
      if (event.key === 'ArrowRight') setIndex((i) => (i === null ? i : (i + 1) % images.length))
      if (event.key === 'ArrowLeft') setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length))
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [open, images.length])

  if (images.length === 0) return null
  const active = index !== null ? images[index] : null

  return (
    <>
      <div className="flex gap-3 overflow-x-auto hide-scroll -mx-4 px-4 pb-1 snap-x md:grid md:grid-cols-3 md:mx-0 md:px-0 md:overflow-visible">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${alt} — ${i + 1} / ${images.length}`}
            className="relative w-56 h-36 md:w-auto md:h-auto md:aspect-[4/3] rounded-xl overflow-hidden shrink-0 bg-subtle snap-start hover:opacity-90 transition-opacity"
          >
            <Image
              src={image.url}
              alt={image.caption_ru || alt}
              fill
              sizes="(min-width: 768px) 33vw, 224px"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setIndex(null)}
        >
          <button
            type="button"
            onClick={() => setIndex(null)}
            aria-label="Закрыть"
            className="absolute right-3 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center z-10"
            style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <X className="w-6 h-6" aria-hidden />
          </button>

          <div className="relative w-full max-w-4xl aspect-[4/3] mx-4" onClick={(event) => event.stopPropagation()}>
            <Image src={active.url} alt={active.caption_ru || alt} fill sizes="100vw" className="object-contain" />
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Назад"
                onClick={(event) => {
                  event.stopPropagation()
                  setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length))
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center"
              >
                <ChevronLeft className="w-6 h-6" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Вперёд"
                onClick={(event) => {
                  event.stopPropagation()
                  setIndex((i) => (i === null ? i : (i + 1) % images.length))
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center"
              >
                <ChevronRight className="w-6 h-6" aria-hidden />
              </button>
              <p className="absolute bottom-6 inset-x-0 text-center text-white/80 text-sm" aria-live="polite">
                {(index ?? 0) + 1} / {images.length}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
