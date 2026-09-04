import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomSheet } from '@/components/ui/modal'

/**
 * Регрессия: при вводе текста в диалоге фокус улетал на первую кнопку,
 * и пользователь мог напечатать только один символ за раз.
 */
function Harness() {
  const [open, setOpen] = useState(true)
  const [value, setValue] = useState('')

  return (
    <BottomSheet open={open} onClose={() => setOpen(false)} title="Оставить отзыв">
      <button type="button">Оценка</button>
      <textarea aria-label="Текст отзыва" value={value} onChange={(event) => setValue(event.target.value)} />
    </BottomSheet>
  )
}

describe('диалог с формой', () => {
  afterEach(cleanup)

  it('не отбирает фокус у поля при перерисовке', () => {
    render(<Harness />)
    const field = screen.getByLabelText('Текст отзыва') as HTMLTextAreaElement

    field.focus()
    expect(document.activeElement).toBe(field)

    // один символ → состояние родителя меняется → диалог перерисовывается
    fireEvent.change(field, { target: { value: 'О' } })

    expect(field.value).toBe('О')
    expect(document.activeElement).toBe(field)
  })

  it('принимает длинный текст целиком', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const field = screen.getByLabelText('Текст отзыва') as HTMLTextAreaElement

    await user.click(field)
    await user.type(field, 'Отличный вуз, сильные преподаватели')

    expect(field.value).toBe('Отличный вуз, сильные преподаватели')
    expect(document.activeElement).toBe(field)
  })

  it('закрывается по Esc', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByRole('dialog')).toBeDefined()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
