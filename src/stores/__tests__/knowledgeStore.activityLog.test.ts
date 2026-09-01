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

  describe('rejectVersion 寫入 activityLog', () => {
    it('退回後，activityLog 新增一筆 REJECTED 紀錄，帶 note', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      store.rejectVersion('k2', versionId, '權限矩陣有誤，請修正後重新送審')

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('REJECTED')
      expect(entry.by).toBe('Current User')
      expect(entry.versionId).toBe(versionId)
      expect(entry.versionNumber).toBe('v2.0')
      expect(entry.note).toBe('權限矩陣有誤，請修正後重新送審')
    })
  })

  describe('withdrawReview 寫入 activityLog', () => {
    it('撤回審核後，activityLog 新增一筆 WITHDRAWN 紀錄', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      store.withdrawReview('k2', versionId)

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('WITHDRAWN')
      expect(entry.by).toBe('Current User')
      expect(entry.versionId).toBe(versionId)
      expect(entry.versionNumber).toBe('v2.0')
    })
  })

  describe('approveVersion（一步到位）寫入 activityLog', () => {
    it('核准並發布後，activityLog 依序新增 APPROVED 與 PUBLISHED 兩筆紀錄，同一時間戳', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      store.approveVersion('k2', versionId)

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const last2 = log.slice(-2)
      expect(last2.map(e => e.action)).toEqual(['APPROVED', 'PUBLISHED'])
      last2.forEach(entry => {
        expect(entry.by).toBe('Current User')
        expect(entry.versionId).toBe(versionId)
        expect(entry.versionNumber).toBe('v2.0')
      })
      expect(last2[0].time).toBe(last2[1].time)
    })
  })

  describe('approveVersionPending（新）', () => {
    it('核准但不發布：版本狀態變 approved、item 狀態變 approved、寫入一筆 APPROVED（不寫 PUBLISHED）', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v2.0')!.id

      store.approveVersionPending('k2', versionId)

      const updated = store.getKnowledgeById('k2')!
      const version = updated.versions.find(v => v.id === versionId)!
      expect(version.status).toBe('approved')
      expect(version.reviewedBy).toBe('Current User')
      expect(version.reviewedTime).toBeTruthy()
      expect(updated.status).toBe('approved')

      const log = updated.activityLog ?? []
      const last = log[log.length - 1]
      expect(last.action).toBe('APPROVED')
      expect(last.versionId).toBe(versionId)
      expect(log.some(e => e.action === 'PUBLISHED' && e.versionId === versionId)).toBe(false)
    })

    it('版本狀態不是 reviewing 時，不做任何事', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const activeVersionId = item.versions.find(v => v.status === 'active')!.id
      const beforeLogLength = (item.activityLog ?? []).length

      store.approveVersionPending('k2', activeVersionId)

      const updated = store.getKnowledgeById('k2')!
      expect(updated.versions.find(v => v.id === activeVersionId)!.status).toBe('active')
      expect((updated.activityLog ?? []).length).toBe(beforeLogLength)
    })
  })

  describe('publishApprovedVersion 寫入 activityLog', () => {
    it('發佈已核准版本後，activityLog 新增一筆 PUBLISHED 紀錄', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const versionId = item.versions.find(v => v.versionNumber === 'v1.2')!.id // mock data 裡已經是 approved

      store.publishApprovedVersion('k2', versionId)

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('PUBLISHED')
      expect(entry.by).toBe('Current User')
      expect(entry.versionId).toBe(versionId)
      expect(entry.versionNumber).toBe('v1.2')
    })
  })

  describe('switchToVersion 寫入 activityLog', () => {
    it('切換回歷史版本後，activityLog 新增一筆 SWITCHED 紀錄，帶 replacedVersionId/replacedVersionNumber', () => {
      const store = useKnowledgeStore()
      const item = store.getKnowledgeById('k2')!
      const targetVersion = item.versions.find(v => v.versionNumber === 'v1.0')! // mock data 裡是 history
      const previouslyActive = item.versions.find(v => v.status === 'active')!

      store.switchToVersion('k2', targetVersion.id)

      const log = store.getKnowledgeById('k2')!.activityLog ?? []
      const entry = log[log.length - 1]
      expect(entry.action).toBe('SWITCHED')
      expect(entry.by).toBe('Current User')
      expect(entry.versionId).toBe(targetVersion.id)
      expect(entry.versionNumber).toBe('v1.0')
      expect(entry.replacedVersionId).toBe(previouslyActive.id)
      expect(entry.replacedVersionNumber).toBe(previouslyActive.versionNumber)
    })
  })
})
