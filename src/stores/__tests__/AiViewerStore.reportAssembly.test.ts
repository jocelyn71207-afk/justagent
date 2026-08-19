import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAiviewerStore } from '@/stores/AiViewerStore'

describe('AiViewerStore - 報告組裝', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addReportAssemblyBlock 建立一個 blockType 為 REPORT 的區塊', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const blockId = store.addReportAssemblyBlock(['promo_kpi', 'promo_top10'])

    expect(store.aiViewerBlocks.length).toBe(before + 1)
    const block = store.aiViewerBlocks.find((b: any) => b.id === blockId)
    expect(block).toBeDefined()
    expect(block.data.blockType).toBe('REPORT')
    expect(block.data.data.sectionIds).toEqual(['promo_kpi', 'promo_top10'])
    expect(block.data.data.templateName).toBeNull()
  })

  it('updateReportAssemblySections 更新指定區塊的章節順序', () => {
    const store = useAiviewerStore()
    const blockId = store.addReportAssemblyBlock(['a', 'b'])

    const result = store.updateReportAssemblySections(blockId, ['b', 'a', 'c'])

    expect(result).toBe(true)
    const block = store.aiViewerBlocks.find((b: any) => b.id === blockId)
    expect(block.data.data.sectionIds).toEqual(['b', 'a', 'c'])
  })

  it('updateReportAssemblySections 找不到區塊時回傳 false', () => {
    const store = useAiviewerStore()
    const result = store.updateReportAssemblySections('not-exist-id', ['a'])
    expect(result).toBe(false)
  })

  it('saveReportAssemblyTemplate 寫入模板名稱', () => {
    const store = useAiviewerStore()
    const blockId = store.addReportAssemblyBlock(['a'])

    const result = store.saveReportAssemblyTemplate(blockId, '促銷週報')

    expect(result).toBe(true)
    const block = store.aiViewerBlocks.find((b: any) => b.id === blockId)
    expect(block.data.data.templateName).toBe('促銷週報')
  })

  it('saveReportAssemblyTemplate 找不到區塊時回傳 false', () => {
    const store = useAiviewerStore()
    const result = store.saveReportAssemblyTemplate('not-exist-id', '促銷週報')
    expect(result).toBe(false)
  })
})
