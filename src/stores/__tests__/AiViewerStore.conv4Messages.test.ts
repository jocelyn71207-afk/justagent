import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAiviewerStore } from '@/stores/AiViewerStore'

// conv4 的對話訊息搬進 store（原本是 AiViewerRightBox.vue 內的區域 ref）：
// 方案三離開 AiViewer 導到 AI 賦能、再返回時，AiViewerRightBox 會被銷毀重建，
// 區域 state 撐不住這趟往返；搬進 store 才留得住對話，也才推得進「已建立」確認訊息。
describe('AiViewerStore - conv4 對話訊息', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('初始為空', () => {
    const store = useAiviewerStore()
    expect(store.conv4Msgs).toEqual([])
    expect(store.conv4Title).toBe('')
  })

  it('pushConv4Message 依序給 id，保留其餘欄位', () => {
    const store = useAiviewerStore()
    store.pushConv4Message({ forUser: true, msg: '哈囉' })
    store.pushConv4Message({ agent: 'brain', msg: '你好' })
    expect(store.conv4Msgs).toHaveLength(2)
    expect(store.conv4Msgs[0]).toMatchObject({ forUser: true, msg: '哈囉' })
    expect(store.conv4Msgs[1]).toMatchObject({ agent: 'brain', msg: '你好' })
    expect(store.conv4Msgs[0].id).not.toBe(store.conv4Msgs[1].id)
  })

  it('resetConv4 清空訊息與標題', () => {
    const store = useAiviewerStore()
    store.conv4Title = '產品銷售報告整理'
    store.pushConv4Message({ msg: 'x' })
    store.resetConv4()
    expect(store.conv4Msgs).toEqual([])
    expect(store.conv4Title).toBe('')
  })
})
