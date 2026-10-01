import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillCard from '@/components/Skill/SkillCard.vue'
import type { Skill } from '@/stores/skillStore'

function baseSkill(over: Partial<Skill> = {}): Skill {
  return {
    id: 's1',
    name: '測試技能',
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

function mountCard(skill: Skill, isExtension = false) {
  return mount(SkillCard, { props: { skill, isExtension } })
}

describe('SkillCard：skillIconName（怎麼來的一眼圖示）', () => {
  it('積木組成（composition）：dashboard_customize', () => {
    const w = mountCard(baseSkill({ composition: { sectionIds: ['x'] } } as Partial<Skill>))
    expect(w.find('.skill-card-icon .material-symbols-outlined').text()).toBe('dashboard_customize')
  })

  it('AI 賦能對話建立（ai_assisted）：forum', () => {
    const w = mountCard(baseSkill({ creationMethod: 'ai_assisted' }))
    expect(w.find('.skill-card-icon .material-symbols-outlined').text()).toBe('forum')
  })

  it('真的自建（沒有 forkSourceId／derivedFrom）：edit（跟 SkillDetailDrawer「自建」一致）', () => {
    const w = mountCard(baseSkill())
    expect(w.find('.skill-card-icon .material-symbols-outlined').text()).toBe('edit')
  })

  it('有血緣（forkSourceId 或 derivedFrom）：依 isExtension 維持原本的 extension／psychology，不誤判成自建', () => {
    const forked = mountCard(baseSkill({ forkSourceId: 'sys-001' }), true)
    expect(forked.find('.skill-card-icon .material-symbols-outlined').text()).toBe('extension')

    const derived = mountCard(baseSkill({ derivedFrom: 'sys-002' }), false)
    expect(derived.find('.skill-card-icon .material-symbols-outlined').text()).toBe('psychology')
  })
})

describe('SkillCard：強制啟用（aiTestOverridden）的視覺提示', () => {
  it('啟用中且 aiTestOverridden：顯示警示圖示與提示文字，跟全對啟用的技能有區別', () => {
    const w = mountCard(baseSkill({ isEnabled: true, aiTestOverridden: true }))
    const icon = w.find('.status-override-icon')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('title')).toContain('測試沒有全對')
  })

  it('啟用中但 aiTestOverridden 為 false（真的測全對）：不顯示警示圖示', () => {
    const w = mountCard(baseSkill({ isEnabled: true, aiTestOverridden: false, aiTestPassRate: 1 }))
    expect(w.find('.status-override-icon').exists()).toBe(false)
  })

  it('aiTestOverridden 但技能已停用：不顯示警示圖示（這個標記只在「啟用中」才有意義）', () => {
    const w = mountCard(baseSkill({ isEnabled: false, aiTestOverridden: true }))
    expect(w.find('.status-override-icon').exists()).toBe(false)
  })
})
