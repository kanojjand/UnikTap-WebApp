'use client'

import { Toaster } from 'sonner'
import { useThemePreference } from './theme-switcher'

/** Уведомления в цвет выбранной темы, а не системной. */
export function AppToaster() {
  const theme = useThemePreference() ?? 'system'
  return <Toaster position="top-center" richColors closeButton theme={theme} offset={16} mobileOffset={16} />
}
