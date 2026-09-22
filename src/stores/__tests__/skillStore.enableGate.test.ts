import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillStore, canEnableSkill, describeAiTestGateReason } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'

function baseSkill(overrides: Partial<Skill> = {}): Skill {
  return {
    id: 'x', name: 'x', description: '', type: 'extension', origin: 'manually_created',
    version: '初始版本', isEnabled: false, usageCount: 0, testPassRate: 0, avgLatencyMs: 0,
    zone: 'personal',
    ...overrides,
  }
}

describe('canEnableSkill', () => {
  it('從沒測過（aiTestPassRate 是 undefined）：不能啟用', () => {
    expect(canEnableSkill(baseSkill())).toBe(false)
  })

  it('aiTestPassRate 是 1（全對）：可以啟用', () => {
    expect(canEnableSkill(baseSkill({ aiTestPassRate: 1 }))).toBe(true)
  })

  it('aiTestPassRate 小於 1：不能啟用', () => {
    expect(canEnableSkill(baseSkill({ aiTestPassRate: 0.8 }))).toBe(false)
  })

  it('aiTestOverridden 是 true：即使沒全對也可以啟用', () => {
    expect(canEnableSkill(baseSkill({ aiTestPassRate: 0.5, aiTestOverridden: true }))).toBe(true)
  })

  it('非個人技能（zone 不是 personal）：一律視為可以啟用，不受這條規則限制', () => {
    expect(canEnableSkill(baseSkill({ zone: 'library', aiTestPassRate: null }))).toBe(true)
    expect(canEnableSkill(baseSkill({ zone: undefined, aiTestPassRate: null }))).toBe(true)
  })
})

describe('describeAiTestGateReason', () => {
  it('從沒測過：說明文字提到「還沒有」', () => {
    expect(describeAiTestGateReason(baseSkill())).toContain('還沒有')
  })

  it('測過但沒全對：說明文字帶百分比', () => {
    expect(describeAiTestGateReason(baseSkill({ aiTestPassRate: 0.75 }))).toContain('75%')
  })
})

describe('overrideAndEnableSkill', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('設定 aiTestOverridden、isEnabled，並寫入 auditLog', () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '測試技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    expect(store.findSkill(id)!.isEnabled).toBe(false)

    store.overrideAndEnableSkill(id)

    const skill = store.findSkill(id)!
    expect(skill.isEnabled).toBe(true)
    expect(skill.aiTestOverridden).toBe(true)
    expect(skill.auditLog?.[0]).toMatchObject({ action: 'ENABLED', by: '管理員' })
  })

  it('不存在的 id 不拋錯', () => {
    const store = useSkillStore()
    expect(() => store.overrideAndEnableSkill('nope')).not.toThrow()
  })
})
