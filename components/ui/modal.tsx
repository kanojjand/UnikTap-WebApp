'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BaseProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

/**
 * Esc, фокус-ловушка и блокировка прокрутки для диалогов.
 *
 * Важно: эффект зависит только от `open`. Раньше в зависимостях был `onClose`,
 * который родитель пересоздаёт на каждый рендер, — из-за этого при вводе каждого
 * символа эффект перезапускался и возвращал фокус на первую кнопку диалога.
 */
function useDialogBehaviour(open: boolean, onClose: () => void, ref: React.RefObject<HTMLDivElement | null>) {
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement as HTMLElement | null

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !ref.current) return
      const focusable = ref.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Фокус ставим один раз при открытии — на поле ввода, если оно есть
    const target =
      ref.current?.querySelector<HTMLElement>('input:not([type="checkbox"]), textarea') ??
      ref.current?.querySelector<HTMLElement>('button, select, a[href]')
    target?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      trigger?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

export function Modal({ open, onClose, title, children, className }: BaseProps) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogBehaviour(open, onClose, ref)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'bg-surface text-ink w-full max-w-lg rounded-2xl shadow-modal overflow-hidden max-h-[90dvh] flex flex-col',
          className,
        )}
      >
        {title ? (
          <div className="px-6 py-4 border-b border-line flex justify-between items-center gap-3 shrink-0">
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <CloseButton onClick={onClose} />
          </div>
        ) : null}
        <div className="overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  )
}

/** На телефоне выезжает снизу (удобно большим пальцем), на компьютере — окно по центру. */
export function BottomSheet({ open, onClose, title, children, className }: BaseProps) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogBehaviour(open, onClose, ref)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in md:p-4"
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'bg-surface text-ink w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-modal max-h-[88dvh] flex flex-col',
          'animate-sheet-up md:animate-fade-in',
          className,
        )}
      >
        <div className="pt-2.5 pb-1 flex justify-center shrink-0 md:hidden">
          <span className="h-1.5 w-10 rounded-full bg-line" aria-hidden />
        </div>
        {title ? (
          <div className="pl-5 pr-2 pt-1 md:pt-3 pb-2 flex items-center justify-between gap-3 shrink-0">
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <CloseButton onClick={onClose} />
          </div>
        ) : (
          <div className="hidden md:flex justify-end px-2 pt-2 shrink-0">
            <CloseButton onClick={onClose} />
          </div>
        )}
        <div
          className="overflow-y-auto overscroll-contain px-5"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Закрыть"
      className="w-11 h-11 -my-1 rounded-full flex items-center justify-center text-muted hover:bg-subtle hover:text-ink transition-colors shrink-0"
    >
      <X className="w-5 h-5" aria-hidden />
    </button>
  )
}
