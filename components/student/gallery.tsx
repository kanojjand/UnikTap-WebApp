'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import type { UniversityImage } from '@/types/domain'

export function Gallery({ images, alt }: { images: UniversityImage[]; alt: string }) {
  const [active, setActive] = useState<UniversityImage | null>(null)
  if (images.length === 0) return null

  return (
    <>
      <div className="flex gap-3 overflow-x-auto hide-scroll -mx-4 px-4 pb-1">
        {images.map((image) => (
          <button
            key={image.id}
            onClick={() => setActive(image)}
            className="relative w-40 h-28 rounded-xl overflow-hidden shrink-0 bg-gray-100"
          >
            <Image src={image.url} alt={image.caption_ru || alt} fill sizes="160px" className="object-cover" />
          </button>
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <button onClick={() => setActive(null)} aria-label="Закрыть" className="absolute top-6 right-6 text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-3xl aspect-[4/3]">
            <Image src={active.url} alt={active.caption_ru || alt} fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      ) : null}
    </>
  )
}
