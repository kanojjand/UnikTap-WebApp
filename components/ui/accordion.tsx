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
    <div className={cn('border border-line rounded-2xl overflow-hidden bg-surface', className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          if (!open) onOpen?.()
          setOpen((value) => !value)
        }}
        className="w-full p-4 min-h-[56px] flex justify-between items-center gap-3 text-left hover:bg-subtle/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <span className="flex-1 min-w-0">{header}</span>
        <ChevronDown
          className={cn('w-5 h-5 text-muted transition-transform shrink-0', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? <div className="px-4 pb-4 pt-3 border-t border-line animate-fade-in">{children}</div> : null}
    </div>
  )
}
