import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillSuggestCard from '@/components/AiViewer/SkillSuggestCard.vue'
import type { SkillSuggestion } from '@/composables/useSkillSuggestion'

const S: SkillSuggestion = {
  id: 'sg-1',
  name: '產品銷售報告整理',
  description: '查詢並產出報告',
  triggerHint: '偵測到銷售整理需求',
  steps: ['查詢數據', '套用規範產出'],
  reason: '查詢銷售資料＋套用部門報告規範',
}

describe('SkillSuggestCard', () => {
  it('ask：顯示 reason 與 build / skip 兩顆按鈕並帶 data-id', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'ask' } })
    expect(w.text()).toContain('查詢銷售資料＋套用部門報告規範')
    const btns = w.findAll('[data-action]')
    expect(btns.map(b => b.attributes('data-action'))).toEqual(['skill-suggest-build', 'skill-suggest-skip'])
    expect(btns[0].attributes('data-id')).toBe('sg-1')
    expect(btns[0].text()).toBe('是，建立成個人技能')
    expect(btns[1].text()).toBe('不用了')
  })

  it('placed：顯示已放上區塊文案與「前往區塊」連結（data-value = blockId）', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'placed', blockId: 'skillbuilder-9' } })
    expect(w.text()).toContain('已在畫布放上「產品銷售報告整理」的技能建立工具')
    const link = w.find('[data-action="pan-to-block"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('data-value')).toBe('skillbuilder-9')
    expect(link.text()).toContain('前往區塊')
    expect(w.find('[data-action^="skill-suggest-"]').exists()).toBe(false)
  })

  it('未知 stage：只顯示名稱，不渲染任何按鈕', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'skipped' } })
    expect(w.text()).toContain('產品銷售報告整理')
    expect(w.find('[data-action]').exists()).toBe(false)
  })
})
