import { describe, it, expect } from 'vitest'
import { skillEnableStatus, skillTested } from '../skillStatus'

describe('skillEnableStatus', () => {
  it('狀態只有啟用中／停用中', () => {
    expect(skillEnableStatus({ isEnabled: true })).toBe('啟用中')
    expect(skillEnableStatus({ isEnabled: false })).toBe('停用中')
  })
})

describe('skillTested', () => {
  it('個人技能看 AI 快速測試交過卷沒；後端技能看最新版記號；Library 技能不標（null）', () => {
    expect(skillTested({ zone: 'personal', aiTestPassRate: null })).toBe(false)
    expect(skillTested({ zone: 'personal', aiTestPassRate: 0 })).toBe(true)
    expect(skillTested({ zone: 'personal', backendVersion: { version: 1, tested: true } })).toBe(true)
    expect(skillTested({ zone: 'library', aiTestPassRate: null })).toBeNull()
  })
})
