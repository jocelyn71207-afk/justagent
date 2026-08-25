import { describe, it, expect } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRootStore } from '../rootStore'

describe('rootStore 企業與團隊的歸屬關係', () => {
  it('至少有兩間企業的假資料，才能驗證企業切換會影響團隊清單', () => {
    setActivePinia(createPinia())
    const store = useRootStore()
    expect(store.companyList.length).toBeGreaterThanOrEqual(2)
  })

  it('每個團隊都標記了所屬企業的 companyId，且對應到 companyList 裡真實存在的企業', () => {
    setActivePinia(createPinia())
    const store = useRootStore()
    const companyIds = new Set(store.companyList.map((c) => c.id))
    store.testGroups.forEach((group) => {
      expect(companyIds.has(group.companyId)).toBe(true)
    })
  })

  it('兩間企業底下都至少各有一個團隊', () => {
    setActivePinia(createPinia())
    const store = useRootStore()
    store.companyList.forEach((company) => {
      const teamsOfCompany = store.testGroups.filter((g) => g.companyId === company.id)
      expect(teamsOfCompany.length).toBeGreaterThan(0)
    })
  })
})
