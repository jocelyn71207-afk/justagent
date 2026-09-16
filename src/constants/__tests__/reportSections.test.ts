import { describe, it, expect } from 'vitest'
import { REPORT_CATEGORIES, REPORT_SECTIONS, SECTION_MAP, sectionsByCategory } from '@/constants/reportSections'

describe('reportSections', () => {
  it('三類、順序為 TA 用戶畫像 / 行銷活動成效 / 渠道績效', () => {
    expect(REPORT_CATEGORIES.map(c => c.label)).toEqual(['TA 用戶畫像', '行銷活動成效', '渠道績效'])
  })
  it('21 個章節、id 唯一、每章都屬於既有分類', () => {
    expect(REPORT_SECTIONS).toHaveLength(21)
    expect(new Set(REPORT_SECTIONS.map(s => s.id)).size).toBe(21)
    const catIds = new Set(REPORT_CATEGORIES.map(c => c.id))
    expect(REPORT_SECTIONS.every(s => catIds.has(s.categoryId))).toBe(true)
  })
  it('分類章節數：TA 9、活動成效 7、渠道 5；SECTION_MAP 可查', () => {
    expect(sectionsByCategory('ta')).toHaveLength(9)
    expect(sectionsByCategory('promo')).toHaveLength(7)
    expect(sectionsByCategory('channel')).toHaveLength(5)
    expect(SECTION_MAP.promo_kpi.name).toBe('促銷核心 KPI')
    expect(sectionsByCategory('nope')).toEqual([])
  })
})
