import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'
import type { SkillSuggestionEntry } from '@/stores/skillStore'

const ENTRY: SkillSuggestionEntry = {
  id: 'conv4-sales-report',
  name: '產品銷售報告整理',
  description: '查詢指定月份產品銷售數據，並依三諾產品部輸出報告規範自動產出報告',
  triggerHint: '偵測到「查詢銷售資料＋套用部門報告規範」類型的整理需求',
  steps: ['查詢指定月份產品銷售數據', '套用三諾產品部輸出報告規範自動產出報告'],
  reason: '查詢銷售資料＋套用部門報告規範',
  conversationId: 'conv4',
}

describe('skillStore 建議建立的技能佇列', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addSuggestion 後會出現在 pendingSuggestions', () => {
    const store = useSkillStore()
    expect(store.pendingSuggestions).toEqual([])
    store.addSuggestion(ENTRY)
    expect(store.pendingSuggestions).toEqual([ENTRY])
  })

  it('同一個 id 重複 addSuggestion 不會產生重複項目', () => {
    const store = useSkillStore()
    store.addSuggestion(ENTRY)
    store.addSuggestion(ENTRY)
    expect(store.pendingSuggestions).toHaveLength(1)
  })

  it('dismissSuggestion 依 id 移除', () => {
    const store = useSkillStore()
    store.addSuggestion(ENTRY)
    store.dismissSuggestion(ENTRY.id)
    expect(store.pendingSuggestions).toEqual([])
  })
})
