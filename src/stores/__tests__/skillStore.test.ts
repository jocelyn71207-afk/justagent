import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSkillStore } from '@/stores/skillStore'

describe('skillStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始載入包含 mock skill 資料', () => {
    const store = useSkillStore()
    expect(store.skills.length).toBeGreaterThan(0)
  })

  it('flatSkills 攤平 system + extension skills', () => {
    const store = useSkillStore()
    const flat = store.flatSkills
    const hasExtension = flat.some(s => s.type === 'extension')
    expect(hasExtension).toBe(true)
  })

  it('toggleSkill 切換啟用狀態', () => {
    const store = useSkillStore()
    const skill = store.flatSkills[0]
    const original = skill.isEnabled
    store.toggleSkill(skill.id)
    expect(store.findSkill(skill.id)!.isEnabled).toBe(!original)
  })

  it('ignoreUpstreamUpdate 將狀態改為 ignored', () => {
    const store = useSkillStore()
    const ext = store.flatSkills.find(s => s.upstreamUpdateStatus === 'update_available')!
    store.ignoreUpstreamUpdate(ext.id)
    expect(store.findSkill(ext.id)!.upstreamUpdateStatus).toBe('ignored')
  })

  it('mergeUpstreamUpdate 將狀態改為 up_to_date', () => {
    const store = useSkillStore()
    const ext = store.flatSkills.find(s => s.upstreamUpdateStatus === 'update_available')!
    store.mergeUpstreamUpdate(ext.id)
    expect(store.findSkill(ext.id)!.upstreamUpdateStatus).toBe('up_to_date')
  })

  it('detachUpstream 解除上游連結', () => {
    const store = useSkillStore()
    const ext = store.flatSkills.find(s => s.upstreamLink === 'linked')!
    store.detachUpstream(ext.id)
    expect(store.findSkill(ext.id)!.upstreamLink).toBe('unlinked')
  })

  it('firstPendingUpdate 返回第一個待更新技能', () => {
    const store = useSkillStore()
    expect(store.firstPendingUpdate).not.toBeNull()
    expect(store.firstPendingUpdate!.upstreamUpdateStatus).toBe('update_available')
  })

  it('resetConversation 清空對話歷史', async () => {
    const store = useSkillStore()
    await store.sendChatMessage('any-id', '測試訊息')
    expect(store.testConversationHistory.length).toBeGreaterThan(0)
    store.resetConversation()
    expect(store.testConversationHistory.length).toBe(0)
  })
})
