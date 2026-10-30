import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PersonalSkillGroup from '@/components/Skill/PersonalSkillGroup.vue'
import type { Skill } from '@/stores/skillStore'

function baseSkill(over: Partial<Skill> = {}): Skill {
  return {
    id: 'p1',
    name: '我的技能',
    description: '',
    type: 'extension',
    origin: 'manually_created',
    version: '1.0.0',
    isEnabled: true,
    usageCount: 0,
    testPassRate: 0,
    avgLatencyMs: 0,
    ...over,
  }
}

function mountTile(skill: Skill) {
  return mount(PersonalSkillGroup, { props: { skill } })
}

describe('PersonalSkillGroup：skillIconName（怎麼來的一眼圖示）', () => {
  it('積木組成（composition）：dashboard_customize', () => {
    const w = mountTile(baseSkill({ composition: { sectionIds: ['x'] } } as Partial<Skill>))
    expect(w.find('.tile-icon .material-symbols-outlined').text()).toBe('dashboard_customize')
  })

  it('AI 賦能對話建立（ai_assisted）：forum', () => {
    const w = mountTile(baseSkill({ creationMethod: 'ai_assisted' }))
    expect(w.find('.tile-icon .material-symbols-outlined').text()).toBe('forum')
  })

  it('真的自建（沒有 forkSourceId／derivedFrom）：edit（跟 SkillDetailDrawer「自建」一致）', () => {
    const w = mountTile(baseSkill())
    expect(w.find('.tile-icon .material-symbols-outlined').text()).toBe('edit')
  })

  it('複製副本（有 forkSourceId 或 derivedFrom）：維持原本的 person，不誤判成自建', () => {
    const forked = mountTile(baseSkill({ forkSourceId: 'sys-001' }))
    expect(forked.find('.tile-icon .material-symbols-outlined').text()).toBe('person')

    const derived = mountTile(baseSkill({ derivedFrom: 'sys-002' }))
    expect(derived.find('.tile-icon .material-symbols-outlined').text()).toBe('person')
  })
})

describe('PersonalSkillGroup：狀態文字', () => {
  it('後端技能：狀態只有啟用中／停用中，測過沒另外標註，不顯示版本號', () => {
    const w = mountTile(baseSkill({ backendVersion: { version: 3, tested: true } } as Partial<Skill>))
    expect(w.find('.status-text').text()).toBe('啟用中')
    expect(w.find('.SkillTestMark .stm-label').text()).toBe('已測試')
    expect(w.text()).not.toContain('第 3 版')
  })
})

describe('PersonalSkillGroup：狀態標籤', () => {
  it('草稿不貼「草稿」標籤：狀態「停用中」＋另外標「未測試」（測過沒不算狀態）', () => {
    const w = mountTile(baseSkill({ personalStatus: 'draft', isEnabled: false, aiTestPassRate: null }))
    expect(w.find('.skill-tag').exists()).toBe(false)
    expect(w.text()).not.toContain('草稿')
    expect(w.find('.status-text').text()).toBe('停用中')
    expect(w.find('.SkillTestMark .stm-label').text()).toBe('未測試')
  })

  it('測過但沒啟用：狀態「停用中」＋標「已測試」', () => {
    const w = mountTile(baseSkill({ personalStatus: 'draft', isEnabled: false, aiTestPassRate: 0.5 }))
    expect(w.find('.status-text').text()).toBe('停用中')
    expect(w.find('.SkillTestMark .stm-label').text()).toBe('已測試')
  })

  it('審核中仍然貼「審核中」標籤', () => {
    const w = mountTile(baseSkill({ personalStatus: 'reviewing' }))
    expect(w.find('.skill-tag').text()).toBe('審核中')
  })
})

describe('PersonalSkillGroup：技能代號（skill_name）', () => {
  it('列表磚塊不顯示代號（代號只在點進去的詳情卡片裡顯示）', () => {
    const w = mountTile(baseSkill({ name: '行銷週報快篩', skillCode: 'marketing-weekly-digest' }))
    expect(w.text()).not.toContain('marketing-weekly-digest')
  })
})
