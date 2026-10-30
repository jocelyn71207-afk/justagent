import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SkillDetailDrawer from '@/components/Skill/SkillDetailDrawer.vue'
import type { Skill } from '@/stores/skillStore'

// 草稿不另外貼標籤（草稿就是「尚未測試／停用中」），跟我的技能卡片一致
function personal(over: Partial<Skill>): Skill {
  return {
    id: 'p-draft', name: '複製的技能', description: '', type: 'extension', origin: 'custom_version',
    version: '1.0.0', isEnabled: false, usageCount: 0, testPassRate: 0, avgLatencyMs: 0,
    zone: 'personal', aiTestPassRate: null, ...over,
  }
}

describe('SkillDetailDrawer：個人技能狀態標籤', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('沒在審核的個人技能（含草稿）不貼狀態標籤，不出現「草稿」「可使用」', () => {
    const w = mount(SkillDetailDrawer, { props: { skill: personal({ personalStatus: 'draft' }) }, global: { stubs: { Teleport: true } } })
    expect(w.find('.tag--draft').exists()).toBe(false)
    expect(w.find('.tag--available').exists()).toBe(false)
    expect(w.text()).not.toContain('可使用')
    expect(w.find('.dh-status').text()).toBe('停用中')
    expect(w.find('.SkillTestMark .stm-label').text()).toBe('未測試')
  })

  it('停用狀態一律叫「停用中」', () => {
    const w = mount(SkillDetailDrawer, { props: { skill: personal({ personalStatus: 'available', aiTestPassRate: 0.8 }) }, global: { stubs: { Teleport: true } } })
    expect(w.text()).toContain('停用中')
    expect(w.text()).not.toContain('已停用')
  })

  it('審核中仍顯示「審核中」', () => {
    const w = mount(SkillDetailDrawer, { props: { skill: personal({ personalStatus: 'reviewing' }) }, global: { stubs: { Teleport: true } } })
    expect(w.find('.tag--reviewing').text()).toBe('審核中')
  })
})
