import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useExploreStore, getSkillVisual } from '@/stores/exploreStore'

describe('exploreStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('agents 至少有 10 筆，且每筆都有唯一的 id', () => {
    const store = useExploreStore()
    expect(store.agents.length).toBeGreaterThanOrEqual(10)
    const ids = store.agents.map(a => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('toggleFavorite 可以加入與移出常用清單', () => {
    const store = useExploreStore()
    const agentId = store.agents[0].id
    expect(store.isFavorite(agentId)).toBe(false)

    store.toggleFavorite(agentId)
    expect(store.isFavorite(agentId)).toBe(true)
    expect(store.favoriteAgentIds).toContain(agentId)

    store.toggleFavorite(agentId)
    expect(store.isFavorite(agentId)).toBe(false)
    expect(store.favoriteAgentIds).not.toContain(agentId)
  })

  it('toggleFavorite 寫入 localStorage，重新建立 store 後常用清單狀態仍在', () => {
    const store = useExploreStore()
    const agentId = store.agents[1].id
    store.toggleFavorite(agentId)

    setActivePinia(createPinia())
    const freshStore = useExploreStore()
    expect(freshStore.isFavorite(agentId)).toBe(true)
  })

  it('localStorage 內容損毀時，favoriteAgentIds 安全 fallback 為空陣列', () => {
    localStorage.setItem('explore.favoriteAgentIds', '{not valid json')
    setActivePinia(createPinia())
    const store = useExploreStore()
    expect(store.favoriteAgentIds).toEqual([])
  })

  it('getSkillVisual 依 functionType 回傳固定的 icon/colorKey，沒有 functionType 時回傳預設值', () => {
    expect(getSkillVisual('資料查詢')).toEqual({ icon: 'travel_explore', colorKey: 'teal' })
    expect(getSkillVisual(undefined)).toEqual({ icon: 'psychology', colorKey: 'rose' })
  })
})
