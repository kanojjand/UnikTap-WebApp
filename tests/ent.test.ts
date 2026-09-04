import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS, cardCompleteness, clampScore, getChance, getThreshold,
  rankMajorsByChance, relevanceScore, resolveThresholdCategory, sumEntSections,
} from '../lib/ent'
import type { UniversityMajor } from '../types/domain'

describe('getChance', () => {
  const threshold = 50

  it('ниже порога — грант недоступен', () => {
    expect(getChance(45, 80, threshold)).toBe('below_threshold')
    expect(getChance(49, 40, threshold)).toBe('below_threshold')
  })

  it('высокий шанс при запасе от 5 баллов', () => {
    expect(getChance(100, 95, threshold)).toBe('high')
    expect(getChance(95, 95, threshold)).toBe('medium')
    expect(getChance(99, 95, threshold)).toBe('medium')
  })

  it('средний шанс в коридоре ±5', () => {
    expect(getChance(90, 95, threshold)).toBe('medium')
    expect(getChance(89, 95, threshold)).toBe('low')
  })

  it('без данных о проходном балле не пугаем пользователя', () => {
    expect(getChance(60, null, threshold)).toBe('medium')
  })

  it('границы порога включительно', () => {
    expect(getChance(50, 50, threshold)).toBe('medium')
    expect(getChance(50, 40, threshold)).toBe('high')
  })

  it('учитывает пользовательские границы из настроек', () => {
    expect(getChance(100, 95, threshold, { high: 10, medium: -10 })).toBe('medium')
    expect(getChance(105, 95, threshold, { high: 10, medium: -10 })).toBe('high')
  })
})

describe('resolveThresholdCategory + getThreshold', () => {
  const thresholds = DEFAULT_SETTINGS.ent_thresholds

  it('педагогика — 75', () => {
    const category = resolveThresholdCategory({ direction: 'Педагогические науки' })
    expect(getThreshold(thresholds, category)).toBe(75)
  })

  it('право — 75', () => {
    expect(getThreshold(thresholds, resolveThresholdCategory({ direction: 'Юридические науки' }))).toBe(75)
  })

  it('медицина — 70', () => {
    expect(getThreshold(thresholds, resolveThresholdCategory({ direction: 'Здравоохранение' }))).toBe(70)
  })

  it('национальный университет — 65', () => {
    expect(getThreshold(thresholds, resolveThresholdCategory({ universityType: 'national' }))).toBe(65)
  })

  it('колледж — 25', () => {
    expect(getThreshold(thresholds, resolveThresholdCategory({ degree: 'college' }))).toBe(25)
  })

  it('по умолчанию — 50', () => {
    expect(getThreshold(thresholds, resolveThresholdCategory({ direction: 'Инженерные науки' }))).toBe(50)
  })
})

describe('баллы', () => {
  it('сумма секций', () => {
    expect(sumEntSections({ history: 18, reading: 9, math_literacy: 8, subject_1: 38, subject_2: 35 })).toBe(108)
  })

  it('обрезает вне диапазона', () => {
    expect(clampScore(200)).toBe(140)
    expect(clampScore(-5)).toBe(0)
    expect(clampScore(Number.NaN)).toBe(0)
  })
})

describe('ранжирование', () => {
  const major = (id: string, grant: number | null, direction = 'Инженерные науки'): UniversityMajor =>
    ({
      id,
      university_id: 'u1',
      specialty_id: 1,
      degree: 'bachelor',
      study_forms: ['full_time'],
      languages: ['ru'],
      duration_years: 4,
      fee_per_year: 0,
      grant_score: grant,
      paid_min_score: null,
      grants_count: null,
      description_ru: '',
      description_kk: '',
      is_published: true,
      sort_order: 100,
      created_at: '',
      updated_at: '',
      deleted_at: null,
      specialty: {
        id: 1, code: 'B057', group_code: '', name_ru: '', name_kk: '',
        direction_ru: direction, direction_kk: '', subject_1_id: null, subject_2_id: null, is_active: true,
      },
    }) as UniversityMajor

  it('сначала высокий шанс', () => {
    const rows = rankMajorsByChance([major('a', 110), major('b', 60), major('c', 90)], 95, DEFAULT_SETTINGS)
    expect(rows.map((row) => row.major.id)).toEqual(['b', 'c', 'a'])
    expect(rows[0].chance).toBe('high')
    expect(rows[2].chance).toBe('low')
  })

  it('медицинский порог отсекает грант', () => {
    const rows = rankMajorsByChance([major('m', 60, 'Здравоохранение')], 65, DEFAULT_SETTINGS)
    expect(rows[0].chance).toBe('below_threshold')
  })

  it('релевантность учитывает рейтинг и рекомендованность', () => {
    const better = relevanceScore({ rating: 4.8, views_count: 100, is_featured: true }, { maxViews: 100 })
    const worse = relevanceScore({ rating: 3.1, views_count: 10, is_featured: false }, { maxViews: 100 })
    expect(better).toBeGreaterThan(worse)
  })

  it('полнота карточки считается по ключевым полям', () => {
    expect(cardCompleteness({})).toBe(0)
    expect(
      cardCompleteness({
        description_ru: 'a', history_ru: 'b', address_ru: 'c', whatsapp: '7700', email: 'a@b.kz',
        website: 'https://a', admission_url: 'https://b', logo_url: 'l', cover_url: 'c',
        founded_year: 1990, students_count: 100, lat: 43.2,
      }),
    ).toBe(1)
  })
})
