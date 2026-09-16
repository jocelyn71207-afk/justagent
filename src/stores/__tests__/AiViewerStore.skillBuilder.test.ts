import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useAiviewerStore } from '@/stores/AiViewerStore'

describe('AiViewerStore - 技能建立 block', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('addSkillBuilderBlock() 空白建立：SKILL block、預設名稱、chat tab、開場訊息、鏡頭移過去', () => {
    const store = useAiviewerStore()
    const before = store.aiViewerBlocks.length
    const id = store.addSkillBuilderBlock()
    expect(id.startsWith('skillbuilder-')).toBe(true)
    expect(store.aiViewerBlocks.length).toBe(before + 1)
    const block = store.aiViewerBlocks.find((b: any) => b.id === id)
    expect(block.data.blockType).toBe('SKILL')
    expect(block.blockName).toBe('技能建立')
    expect(block.width).toBe(640)
    expect(block.height).toBe(750)
    expect(block.data.data.activeTab).toBe('chat')
    expect(block.data.data.origin).toBeNull()
    expect(block.data.data.snapshot.mode).toBe('create')
    expect(block.data.data.snapshot.draft.name).toBe('')
    expect(block.data.data.snapshot.messages).toHaveLength(0)
    expect(store.panToTarget).toEqual({ x: block.x, y: block.y, width: 640, height: 750 })
    expect(store.nowChoiceAiViewerId).toBe(id)
  })

  it('addSkillBuilderBlock({prefill, openingMessage, origin})：名稱、草稿、開場與來源都寫入', () => {
    const store = useAiviewerStore()
    const id = store.addSkillBuilderBlock({
      prefill: { name: '產品銷售報告整理', instructions: '1. 查詢\n2. 套用' },
      openingMessage: '來自對話的開場',
      origin: { conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' },
    })
    const block = store.aiViewerBlocks.find((b: any) => b.id === id)
    expect(block.blockName).toBe('產品銷售報告整理')
    expect(block.data.data.snapshot.draft.instructions).toBe('1. 查詢\n2. 套用')
    expect(block.data.data.snapshot.messages[0].content).toBe('來自對話的開場')
    expect(block.data.data.origin).toEqual({ conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' })
  })

  it('連續建立兩個 block：id 不重複、同列橫向排開', () => {
    const store = useAiviewerStore()
    const a = store.addSkillBuilderBlock()
    const b = store.addSkillBuilderBlock()
    expect(a).not.toBe(b)
    const ba = store.aiViewerBlocks.find((x: any) => x.id === a)
    const bb = store.aiViewerBlocks.find((x: any) => x.id === b)
    expect(bb.y).toBe(ba.y)
    expect(bb.x).toBe(ba.x + 640 + 24)
  })

  it('updateSkillBuilderBlock：snapshot 寫回並同步 blockName；activeTab 可改；非 SKILL 或不存在回 false', () => {
    const store = useAiviewerStore()
    const id = store.addSkillBuilderBlock()
    const block = store.aiViewerBlocks.find((b: any) => b.id === id)
    const snap = JSON.parse(JSON.stringify(block.data.data.snapshot))
    snap.draft.name = '查 ERP 庫存'
    expect(store.updateSkillBuilderBlock(id, { snapshot: snap })).toBe(true)
    expect(block.blockName).toBe('查 ERP 庫存')
    expect(store.updateSkillBuilderBlock(id, { activeTab: 'test' })).toBe(true)
    expect(block.data.data.activeTab).toBe('test')
    snap.draft.name = '   '
    store.updateSkillBuilderBlock(id, { snapshot: snap })
    expect(block.blockName).toBe('技能建立')

    const reportId = store.addReportAssemblyBlock(['promo_kpi'])
    expect(store.updateSkillBuilderBlock(reportId, { activeTab: 'test' })).toBe(false)
    expect(store.updateSkillBuilderBlock('nope', { activeTab: 'test' })).toBe(false)
  })
})
