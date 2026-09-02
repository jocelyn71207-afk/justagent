import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

// 回歸測試：同一個 item 同時有兩個 approved 版本時，
// publishApprovedVersion 必須只發佈「明確傳入 id」的那一個，不能被任何隱含的
// 「陣列順序中第一個 approved」邏輯影響（那正是本次修復的 bug class）。
describe('knowledgeStore.publishApprovedVersion — 多個 approved 版本時的選取正確性', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('k2 同時有兩個 approved 版本時，帶明確 id 呼叫只發佈該版本，不影響另一個 approved 版本', () => {
    const store = useKnowledgeStore()
    const item = store.getKnowledgeById('k2')!

    // mock data 裡 v1.2 已經是 approved（陣列中排在較前面）。
    // 額外把 v2.0（目前 reviewing，陣列中排在最後）也核准成 approved，
    // 製造「兩個同時 approved」的情境。
    const v12 = item.versions.find(v => v.versionNumber === 'v1.2')!
    const v20 = item.versions.find(v => v.versionNumber === 'v2.0')!
    expect(v12.status).toBe('approved')
    v20.status = 'approved'
    v20.reviewedBy = 'Ethan'
    v20.reviewedTime = '2026-04-02 09:00'

    // 明確指定發佈「陣列順序中排在後面」的 v2.0
    store.publishApprovedVersion('k2', v20.id)

    const updated = store.getKnowledgeById('k2')!
    const updatedV20 = updated.versions.find(v => v.id === v20.id)!
    const updatedV12 = updated.versions.find(v => v.id === v12.id)!

    expect(updatedV20.status).toBe('active')
    // 沒被指名的 v1.2 應該維持原狀（approved），不能被誤發佈或被連動改動
    expect(updatedV12.status).toBe('approved')

    const log = updated.activityLog ?? []
    const last = log[log.length - 1]
    expect(last.action).toBe('PUBLISHED')
    expect(last.versionId).toBe(v20.id)
    expect(last.versionNumber).toBe('v2.0')
  })
})
