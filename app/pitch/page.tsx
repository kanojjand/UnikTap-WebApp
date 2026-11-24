import type { Metadata } from 'next'
import { PitchDeck } from '@/components/pitch/pitch-deck'

export const metadata: Metadata = {
  title: 'UnikTap — презентация',
  robots: { index: false, follow: false },
}

/**
 * Презентация для выступления: слайды + живой сайт внутри слайдов.
 * Управление: → / PageDown — дальше, ← / PageUp — назад, N — текст выступления, F — во весь экран.
 */
export default function PitchPage() {
  return <PitchDeck />
}
