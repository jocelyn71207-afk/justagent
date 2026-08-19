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
    expect(conv7Msgs.value[3].msg).toContain('conv7-confirm-generate')
  })

  it('conv7InitFlow 已有訊息時重複呼叫不會再推入', () => {
    const { conv7Msgs, conv7InitFlow } = useReportAssemblyConversation()
    conv7InitFlow()
    conv7InitFlow()
    expect(conv7Msgs.value.length).toBe(1)
  })

  it('conv7ConfirmGenerate 呼叫 store 建立報告組裝 Block 並推入完成訊息', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const { conv7Msgs, conv7ConfirmGenerate } = useReportAssemblyConversation()

    conv7ConfirmGenerate()
    expect(conv7Msgs.value[0].forUser).toBe(true)

    vi.advanceTimersByTime(600)
    expect(store.aiViewerBlocks.length).toBe(before + 1)
    expect(conv7Msgs.value[1].finishResponse).toBe(true)
    expect(conv7Msgs.value[1].msg).toContain('conv7-satisfied')
    expect(conv7Msgs.value[1].msg).toContain('conv7-adjust')
  })

  it('conv7ConfirmGenerate 重複呼叫只建立一次 Block', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const { conv7ConfirmGenerate } = useReportAssemblyConversation()

    conv7ConfirmGenerate()
    vi.advanceTimersByTime(600)
    conv7ConfirmGenerate()
    vi.advanceTimersByTime(600)

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
