import { describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRootStore } from '../rootStore'

describe('rootStore testGroups', () => {
  it('每個團隊預設就有 isResourceOpen 欄位（供共享資源庫群組展開狀態使用）', () => {
    setActivePinia(createPinia())
    const store = useRootStore()
    store.testGroups.forEach((group) => {
      expect(group.isResourceOpen).toBe(false)
    })
  })
})
