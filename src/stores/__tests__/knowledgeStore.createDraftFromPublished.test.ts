import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — createDraftFromPublished 改用自由輸入版本名稱', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('建立草稿後，新版本的 versionNumber 直接等於使用者輸入的名稱，不再自動計算 vX.Y', () => {
    const store = useKnowledgeStore()
    const versionId = store.createDraftFromPublished('k1', '修正保固條款用詞', '調整保固說明的用字')

    const draft = store.getVersionById('k1', versionId!)
    expect(draft?.versionNumber).toBe('修正保固條款用詞')
  })

  it('建立草稿後，新版本狀態是 draft，更新說明對應到輸入的備註，且有記錄建立時間', () => {
    const store = useKnowledgeStore()
    const versionId = store.createDraftFromPublished('k1', '修正保固條款用詞', '調整保固說明的用字')

    const draft = store.getVersionById('k1', versionId!)
    expect(draft?.status).toBe('draft')
    expect(draft?.updateNote).toBe('調整保固說明的用字')
    expect(draft?.lastUpdateTime).toBeTruthy()
  })
})
