import { Montserrat, Onest } from 'next/font/google'

// Шрифты фирменного стиля CC Lab. Оба покрывают весь казахский алфавит
// (Ә Ғ Қ Ң Ө Ұ Ү Һ І) — для этого нужен поднабор cyrillic-ext.
export const onest = Onest({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  variable: '--font-onest',
})

export const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic', 'cyrillic-ext'],
  weight: ['700', '800'],
  display: 'swap',
  variable: '--font-montserrat',
})
