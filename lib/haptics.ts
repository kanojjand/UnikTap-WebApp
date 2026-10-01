/** Короткая вибрация как подтверждение успешного действия (Android; iOS молча игнорирует). */
export function haptic(pattern: number | number[] = 12) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* не поддерживается */
  }
}
