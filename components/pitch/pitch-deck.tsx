'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Maximize, MessageSquareText, RotateCw } from 'lucide-react'
import { CcLabMark } from '@/components/ui/cclab-badge'
import { cn } from '@/lib/utils'
import { PITCH_SLIDES, type PitchSlide } from './slides'

const NEXT_KEYS = new Set(['ArrowRight', 'PageDown', ' ', 'Enter'])
const PREV_KEYS = new Set(['ArrowLeft', 'PageUp', 'Backspace'])
// Внутри живого сайта стрелки и пробел нужны для набора текста, поэтому там листаем только кнопками кликера
const FRAME_NEXT = new Set(['PageDown'])
const FRAME_PREV = new Set(['PageUp'])

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" fill="currentColor" />
    </svg>
  )
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface DemoFrameProps {
  slide: PitchSlide
  active: boolean
  onKey: (e: KeyboardEvent) => void
}

/** Живая страница сайта внутри слайда: можно кликать, листать, вводить баллы. */
function DemoFrame({ slide, active, onKey }: DemoFrameProps) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [version, setVersion] = useState(0)

  const attach = useCallback(() => {
    try {
      ref.current?.contentWindow?.addEventListener('keydown', onKey)
    } catch {
      /* другой домен — тогда листаем кнопками внизу */
    }
  }, [onKey])

  return (
    <div className={cn('absolute inset-0 flex flex-col', !active && 'invisible pointer-events-none')} aria-hidden={!active}>
      <div className="flex items-center gap-2 h-9 px-3 rounded-t-2xl bg-[#ececE8] border border-b-0 border-black/10">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-3 flex-1 h-6 rounded-md bg-white/80 px-3 text-[12px] leading-6 text-neutral-500 truncate font-mono">
          uniktap.cclab.kz{slide.demo}
        </span>
        <button
          type="button"
          onClick={() => setVersion((v) => v + 1)}
          className="w-7 h-7 rounded-md hover:bg-black/5 flex items-center justify-center text-neutral-500"
          aria-label="Перезагрузить демо"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <a
          href={slide.demo}
          target="_blank"
          rel="noopener"
          className="w-7 h-7 rounded-md hover:bg-black/5 flex items-center justify-center text-neutral-500"
          aria-label="Открыть в новой вкладке"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <iframe
        key={version}
        ref={ref}
        src={slide.demo}
        title={slide.title}
        onLoad={attach}
        className="flex-1 w-full rounded-b-2xl border border-black/10 bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]"
      />
    </div>
  )
}

const PHONE_W = 390
const PHONE_H = 844

/** Телефон с живым сайтом: экран 390×844, уменьшенный под высоту окна. */
function PhoneFrame({ src }: { src: string }) {
  const [scale, setScale] = useState(0.8)
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 200) / PHONE_H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div
      className="rounded-[44px] border-[10px] border-[#0a0a0a] bg-white overflow-hidden shadow-[0_40px_90px_-30px_rgba(0,0,0,0.45)]"
      style={{ width: PHONE_W * scale + 20, height: PHONE_H * scale + 20 }}
    >
      <iframe
        src={src}
        title="UnikTap на телефоне"
        style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      />
    </div>
  )
}

function TextSlide({ slide }: { slide: PitchSlide }) {
  if (slide.id === 'title') {
    return (
      <div className="h-full grid grid-cols-[1fr_auto] items-center gap-12">
        <div className="flex flex-col">
          <p className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.2em] text-[#0B7FC4]">
            <Star className="w-4 h-4" /> {slide.kicker}
          </p>
          <img src="/logo-blue.png" alt="UnikTap" className="mt-8 h-[15vh] w-auto self-start" />
          <p className="mt-8 max-w-[22ch] font-display text-[5vh] leading-[1.1] font-extrabold text-[#0a0a0a]">{slide.text}</p>
        </div>
        <PhoneFrame src="/ru" />
      </div>
    )
  }
  if (slide.id === 'finish') {
    return (
      <div className="h-full grid grid-cols-[1fr_auto] items-center gap-16">
        <div>
          <p className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.2em] text-[#0B7FC4]">
            <Star className="w-4 h-4" /> {slide.kicker}
          </p>
          <p className="mt-6 font-display text-[8vh] leading-none font-extrabold text-[#0a0a0a]">{slide.title}</p>
          <p className="mt-6 text-[3vh] text-neutral-600">{slide.text}</p>
          <p className="mt-12 flex items-center gap-3 text-[2.4vh] font-semibold text-[#0a0a0a]">
            <CcLabMark className="h-[3.4vh]" /> made by CC Lab · cclab.kz
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 border border-black/10 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.3)]">
          <img src="/pitch-qr.svg" alt="QR-код uniktap.cclab.kz" className="w-[34vh] h-[34vh]" />
        </div>
      </div>
    )
  }
  return (
    <div className="h-full flex flex-col justify-center">
      <p className="flex items-center gap-2 text-[15px] font-semibold uppercase tracking-[0.2em] text-[#0B7FC4]">
        <Star className="w-4 h-4" /> {slide.kicker}
      </p>
      <h2 className="mt-6 max-w-[20ch] font-display text-[6vh] leading-[1.05] font-extrabold text-[#0a0a0a]">{slide.title}</h2>
      {slide.points ? (
        <ul className={cn('mt-10 gap-4', slide.id === 'solution' ? 'grid grid-cols-2 max-w-[60vw]' : 'flex flex-col max-w-[52vw]')}>
          {slide.points.map((p) => (
            <li
              key={p}
              className={cn(
                'flex items-start gap-4 text-[2.7vh] leading-snug text-[#1a1a1a]',
                slide.id === 'solution' && 'rounded-2xl bg-white border border-black/10 p-6 font-display font-extrabold text-[3.2vh]',
              )}
            >
              {slide.id !== 'solution' ? <Star className="w-[2.2vh] h-[2.2vh] mt-[0.6vh] shrink-0 text-[#1AA3F0]" /> : null}
              {p}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function PitchDeck() {
  const [index, setIndex] = useState(0)
  const [notes, setNotes] = useState(false)
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]))
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const slide = PITCH_SLIDES[index]
  const total = PITCH_SLIDES.length

  const go = useCallback(
    (delta: number) => {
      setRunning(true)
      setIndex((i) => Math.min(total - 1, Math.max(0, i + delta)))
    },
    [total],
  )

  // Баннеры cookie и «установить приложение» внутри демо не нужны на сцене
  useEffect(() => {
    try {
      localStorage.setItem('vn_cookie_ack', '1')
      localStorage.setItem('vn_install_snooze', String(Date.now() + 30 * 24 * 3600 * 1000))
    } catch {
      /* приватный режим браузера */
    }
  }, [])

  // Демо грузим заранее: текущий и следующий слайд
  useEffect(() => {
    setVisited((prev) => new Set([...prev, index, Math.min(index + 1, total - 1)]))
  }, [index, total])

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [running])

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      // Нажатие внутри живого сайта: у события своё окно (не наше). У синтетических событий view = null.
      const inFrame = e.view != null && e.view !== window
      const target = e.target as HTMLElement | null
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      if (inFrame || typing) {
        if (FRAME_NEXT.has(e.key)) {
          e.preventDefault()
          go(1)
        } else if (FRAME_PREV.has(e.key)) {
          e.preventDefault()
          go(-1)
        }
        return
      }
      if (NEXT_KEYS.has(e.key)) {
        e.preventDefault()
        go(1)
      } else if (PREV_KEYS.has(e.key)) {
        e.preventDefault()
        go(-1)
      } else if (['n', 'N', 'т', 'Т'].includes(e.key)) setNotes((v) => !v)
      else if (['f', 'F', 'а', 'А'].includes(e.key)) void document.documentElement.requestFullscreen?.()
      else if (e.key === 'Home') setIndex(0)
    },
    [go],
  )

  useEffect(() => {
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onKey])

  const planned = PITCH_SLIDES.reduce((s, x) => s + x.seconds, 0)

  return (
    <div className="fixed inset-0 bg-[#F6F6F3] text-[#0a0a0a] overflow-hidden select-none">
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(10,10,10,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,.045) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <header className="absolute top-0 inset-x-0 h-16 px-[4vw] flex items-center justify-between">
        <div className="flex items-center gap-3 text-[14px] font-semibold">
          <img src="/logo-blue.png" alt="UnikTap" className="h-6 w-auto" />
          <span className="text-neutral-400">×</span>
          <CcLabMark className="h-5" />
          <span>CC Lab</span>
        </div>
        {slide.demo ? (
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0B7FC4]">{slide.kicker}</span>
            <span className="font-display font-extrabold text-[20px]">{slide.title}</span>
          </div>
        ) : null}
        <div className="font-mono text-[13px] text-neutral-500">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </header>

      <main className={cn('absolute inset-x-[4vw] top-16', notes ? 'bottom-44' : 'bottom-16')}>
        {!slide.demo ? <TextSlide slide={slide} /> : null}
        {PITCH_SLIDES.map((s, i) =>
          s.demo && visited.has(i) ? <DemoFrame key={s.id} slide={s} active={i === index} onKey={onKey} /> : null,
        )}
      </main>

      {notes ? (
        <aside className="absolute inset-x-[4vw] bottom-16 h-24 rounded-2xl bg-[#0a0a0a] text-white px-6 py-3 overflow-y-auto">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#5cc2ff] mb-1">Говорить · ~{slide.seconds} сек</p>
          <p className="text-[17px] leading-snug">{slide.note}</p>
        </aside>
      ) : null}

      <footer className="absolute bottom-0 inset-x-0 h-16 px-[4vw] flex items-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={index === 0}
          className="w-10 h-10 rounded-full border border-black/15 flex items-center justify-center disabled:opacity-30 hover:bg-white"
          aria-label="Назад"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={index === total - 1}
          className="w-10 h-10 rounded-full bg-[#0B7FC4] text-white flex items-center justify-center disabled:opacity-30 hover:bg-[#086DA8]"
          aria-label="Дальше"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <div className="flex-1 flex gap-1.5">
          {PITCH_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= index ? 'bg-[#1AA3F0]' : 'bg-black/10')}
              aria-label={`Слайд ${i + 1}: ${s.title}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setNotes((v) => !v)}
          className={cn(
            'h-10 px-3 rounded-full border flex items-center gap-2 text-[13px]',
            notes ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]' : 'border-black/15 hover:bg-white',
          )}
        >
          <MessageSquareText className="w-4 h-4" /> Текст (N)
        </button>
        <button
          type="button"
          onClick={() => void document.documentElement.requestFullscreen?.()}
          className="w-10 h-10 rounded-full border border-black/15 flex items-center justify-center hover:bg-white"
          aria-label="Во весь экран (F)"
        >
          <Maximize className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            setElapsed(0)
            setRunning(false)
          }}
          className={cn('font-mono text-[13px] w-24 text-right', elapsed > planned ? 'text-red-600' : 'text-neutral-500')}
          title="Нажмите, чтобы сбросить таймер"
        >
          {formatTime(elapsed)} / {formatTime(planned)}
        </button>
      </footer>
    </div>
  )
}
