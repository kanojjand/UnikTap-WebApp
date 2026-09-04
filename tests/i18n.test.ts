import { describe, expect, it } from 'vitest'
import ru from '../messages/ru.json'
import kk from '../messages/kk.json'

function paths(object: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(object).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null
      ? paths(value as Record<string, unknown>, path)
      : [path]
  })
}

describe('локализация', () => {
  it('ключи ru и kk совпадают', () => {
    const ruPaths = paths(ru).sort()
    const kkPaths = paths(kk).sort()
    expect(kkPaths).toEqual(ruPaths)
  })

  it('нет пустых значений', () => {
    for (const messages of [ru, kk]) {
      const empty = paths(messages).filter((path) => {
        const value = path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)[key], messages)
        return typeof value === 'string' && value.trim().length === 0
      })
      expect(empty).toEqual([])
    }
  })
})
