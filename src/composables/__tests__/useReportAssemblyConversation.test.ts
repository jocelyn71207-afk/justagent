import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useReportAssemblyConversation } from '@/composables/useReportAssemblyConversation'

describe('useReportAssemblyConversation', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('conv7InitFlow 一開始就在畫布建立報告組裝 Block', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const { conv7InitFlow } = useReportAssemblyConversation()

    conv7InitFlow()

    expect(store.aiViewerBlocks.length).toBe(before + 1)
    const block = store.aiViewerBlocks.find((b: any) => b.id?.startsWith('reportassembly-'))
    expect(block).toBeDefined()
    expect(block.data.blockType).toBe('REPORT')
    expect(block.data.data.sectionIds).toEqual(['promo_kpi', 'promo_top10', 'promo_type', 'promo_monthly', 'time_heatmap'])
  })

  it('conv7InitFlow 依腳本順序推入訊息', () => {
    const { conv7Msgs, conv7InitFlow } = useReportAssemblyConversation()

    conv7InitFlow()
    expect(conv7Msgs.value.length).toBe(1)
    expect(conv7Msgs.value[0].forUser).toBe(true)

    vi.advanceTimersByTime(500)
    expect(conv7Msgs.value.length).toBe(2)

    vi.advanceTimersByTime(700) // 累積 1200ms
    expect(conv7Msgs.value.length).toBe(3)
    expect(conv7Msgs.value[2].forUser).toBe(true)

    vi.advanceTimersByTime(800) // 累積 2000ms
    expect(conv7Msgs.value.length).toBe(4)
    expect(conv7Msgs.value[3].msg).toContain('conv7-satisfied')
    expect(conv7Msgs.value[3].msg).toContain('conv7-adjust')
  })

  it('conv7InitFlow 於腳本結束時額外建立一個靜態行銷報告 Block', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const { conv7InitFlow } = useReportAssemblyConversation()

    conv7InitFlow()
    expect(store.aiViewerBlocks.length).toBe(before + 1) // 此時只有報告組裝 Block

    vi.advanceTimersByTime(2000)

    expect(store.aiViewerBlocks.length).toBe(before + 2) // 腳本結束後多一個靜態行銷報告 Block
    const reportBlock = store.aiViewerBlocks.find((b: any) => b.id?.startsWith('report-'))
    expect(reportBlock).toBeDefined()
    expect(reportBlock.data.blockType).toBe('HTML')
  })

  it('conv7InitFlow 已有訊息時重複呼叫不會再推入訊息或重複建立 Block', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const { conv7Msgs, conv7InitFlow } = useReportAssemblyConversation()
    conv7InitFlow()
    conv7InitFlow()
    expect(conv7Msgs.value.length).toBe(1)
    expect(store.aiViewerBlocks.length).toBe(before + 1)
  })

  it('resetConv7 清空訊息與標題', () => {
    const { conv7Msgs, conv7Title, conv7InitFlow, resetConv7 } = useReportAssemblyConversation()
    conv7InitFlow()
    expect(conv7Title.value).toBe('行銷報告組裝')

    resetConv7()

    expect(conv7Msgs.value).toEqual([])
    expect(conv7Title.value).toBe('')
  })
})
