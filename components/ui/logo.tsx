import Image from 'next/image'
import { cn } from '@/lib/utils'

/** Синий логотип на светлой теме, белый — на тёмной (переключение в globals.css). */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <>
      <Image
        src="/logo-blue.png"
        alt="UnikTap"
        width={900}
        height={262}
        priority={priority}
        className={cn('logo-light h-7 w-auto', className)}
      />
      <Image
        src="/logo-white.png"
        alt="UnikTap"
        width={900}
        height={262}
        className={cn('logo-dark h-7 w-auto', className)}
      />
    </>
  )
}
