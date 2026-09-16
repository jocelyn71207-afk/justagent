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
  it('ask：顯示 reason 與兩顆 data-action 按鈕（build / skip）並帶 data-id', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'ask' } })
    expect(w.text()).toContain('查詢銷售資料＋套用部門報告規範')
    const btns = w.findAll('[data-action]')
    expect(btns.map(b => b.attributes('data-action'))).toEqual(['skill-suggest-build', 'skill-suggest-skip'])
    expect(btns[0].attributes('data-id')).toBe('sg-1')
    expect(btns[0].text()).toBe('是，建立成個人技能')
    expect(btns[1].text()).toBe('不用了')
  })

  it('preview：顯示名稱、觸發條件、編號步驟與「確認並建立」', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'preview' } })
    expect(w.find('.ssg-name').text()).toBe('產品銷售報告整理')
    expect(w.text()).toContain('偵測到銷售整理需求')
    expect(w.findAll('.ssg-step').map(s => s.text())).toEqual(['查詢數據', '套用規範產出'])
    const btn = w.find('[data-action="skill-suggest-confirm"]')
    expect(btn.text()).toBe('確認並建立')
    expect(btn.attributes('data-id')).toBe('sg-1')
  })

  it('saved：顯示已建立文案與兩個連結（AI 賦能 帶 skillId、技能管理）', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'saved', skillId: 'personal-9' } })
    expect(w.text()).toContain('已建立個人技能「產品銷售報告整理」')
    const studio = w.find('[data-action="goto-skill-studio"]')
    expect(studio.attributes('data-value')).toBe('personal-9')
    expect(w.find('[data-action="goto-skill-management"]').exists()).toBe(true)
    expect(w.find('[data-action^="skill-suggest-"]').exists()).toBe(false)
  })

  it('未知 stage：只顯示名稱，不渲染任何按鈕', () => {
    const w = mount(SkillSuggestCard, { props: { suggestion: S, stage: 'skipped' } })
    expect(w.find('[data-action]').exists()).toBe(false)
  })
})
