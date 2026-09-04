'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Accordion({
  header,
  children,
  defaultOpen = false,
  onOpen,
  className,
}: {
  header: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  onOpen?: () => void
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={cn('border border-gray-100 rounded-xl overflow-hidden bg-white', className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (!open) onOpen?.()
          setOpen((value) => !value)
        }}
        className="w-full p-4 bg-white flex justify-between items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corpBlue"
      >
        <span className="flex-1">{header}</span>
        <ChevronDown
          className={cn('w-5 h-5 text-gray-400 transition-transform shrink-0', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? <div className="px-4 pb-4 bg-slateBg pt-2 border-t border-gray-50">{children}</div> : null}
    </div>
  )
}
