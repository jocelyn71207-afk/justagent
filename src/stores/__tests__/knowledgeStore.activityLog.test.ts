import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — activityLog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('submitForReview 寫入 activityLog', () => {
    it('送審後，activityLog 新增一筆 SUBMITTED 紀錄，帶正確的 versionId/versionNumber/by/note', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      // v2.0 在 mock data 裡已經是 reviewing 狀態，先撤回讓它變回 draft 才能重新送審
      store.withdrawReview('k2', versionId)
      store.submitForReview('k2', versionId, 'Tester', '測試送審備註')

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('SUBMITTED')
      expect(entry.by).toBe('Tester')
      expect(entry.versionId).toBe(versionId)
      expect(entry.versionNumber).toBe('v2.0')
      expect(entry.note).toBe('測試送審備註')
      expect(entry.id).toBeTruthy()
    })
  })
})
