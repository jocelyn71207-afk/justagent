import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — pipeline actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('createFromUpload', () => {
    it('建立 pending 狀態條目，sourceType 為 FILE', () => {
      const store = useKnowledgeStore()
      const before = store.knowledgeList.length

      const id = store.createFromUpload({
        fileName: '房貸說明.pdf',
        category: '法規合規',
        tags: ['房貸'],
      })

      expect(store.knowledgeList.length).toBe(before + 1)
      const item = store.knowledgeList.find(k => k.id === id)!
      expect(item.status).toBe('pending')
      expect(item.sourceType).toBe('FILE')
      expect(item.pipelineProgress).toBe(0)
      expect(item.pipelineStage).toBeNull()
    })
  })

  describe('updatePipelineProgress', () => {
    it('更新進度與 stage', () => {
      const store = useKnowledgeStore()
      const id = store.createFromUpload({ fileName: 'test.pdf', category: '測試', tags: [] })

      store.updatePipelineProgress(id, 'chunking', 40)

      const item = store.knowledgeList.find(k => k.id === id)!
      expect(item.status).toBe('processing')
      expect(item.pipelineStage).toBe('chunking')
      expect(item.pipelineProgress).toBe(40)
    })
  })

  describe('markPipelineDone', () => {
    it('pipeline 完成後 item status 變 reviewing，version status 變 reviewing', () => {
      const store = useKnowledgeStore()
      const id = store.createFromUpload({ fileName: 'test.pdf', category: '測試', tags: [] })
      store.updatePipelineProgress(id, 'indexing', 100)

      store.markPipelineDone(id, [
        { index: 1, content: 'chunk 1', tokenCount: 100, sourceType: 'text' },
      ])

      const item = store.knowledgeList.find(k => k.id === id)!
      expect(item.status).toBe('reviewing')
      expect(item.pipelineProgress).toBe(100)
      expect(item.pipelineStage).toBeNull()
      expect(item.versions[0].status).toBe('reviewing')
      expect(item.versions[0].chunks.length).toBe(1)
    })
  })

  describe('markPipelineFailed', () => {
    it('pipeline 失敗後 item status 變 failed，error 有值', () => {
      const store = useKnowledgeStore()
      const id = store.createFromUpload({ fileName: 'test.pdf', category: '測試', tags: [] })

      store.markPipelineFailed(id, '解析失敗：不支援的檔案格式')

      const item = store.knowledgeList.find(k => k.id === id)!
      expect(item.status).toBe('failed')
      expect(item.pipelineError).toBe('解析失敗：不支援的檔案格式')
    })
  })

  describe('retriggerPipeline', () => {
    it('將 needs_update 或 failed 條目重設為 processing', () => {
      const store = useKnowledgeStore()
      // k4 is needs_update in mock data
      const item = store.knowledgeList.find(k => k.id === 'k4')!

      store.retriggerPipeline('k4')

      expect(item.status).toBe('processing')
      expect(item.pipelineProgress).toBe(0)
      expect(item.pipelineStage).toBe('chunking')
      expect(item.pipelineError).toBeNull()
    })
  })

  describe('archiveKnowledge', () => {
    it('將 active 條目封存', () => {
      const store = useKnowledgeStore()

      store.archiveKnowledge('k1')

      const item = store.knowledgeList.find(k => k.id === 'k1')!
      expect(item.status).toBe('archived')
    })
  })

  describe('batchArchive', () => {
    it('批次封存多個條目', () => {
      const store = useKnowledgeStore()

      store.batchArchive(['k1', 'k5'])

      expect(store.knowledgeList.find(k => k.id === 'k1')!.status).toBe('archived')
      expect(store.knowledgeList.find(k => k.id === 'k5')!.status).toBe('archived')
    })
  })

  describe('batchDelete', () => {
    it('批次刪除多個條目', () => {
      const store = useKnowledgeStore()
      const before = store.knowledgeList.length

      store.batchDelete(['k3'])

      expect(store.knowledgeList.length).toBe(before - 1)
      expect(store.knowledgeList.find(k => k.id === 'k3')).toBeUndefined()
    })
  })

  describe('createFromJustka', () => {
    it('建立 pending 狀態條目，sourceType 為 JUSTKA，title 包含機器人名稱', () => {
      const store = useKnowledgeStore()
      const before = store.knowledgeList.length

      const { knowledgeId, versionId } = store.createFromJustka({
        botId: 'bot-1',
        botName: '客服機器人',
        cardCount: 48,
        category: '客服',
      })

      expect(store.knowledgeList.length).toBe(before + 1)
      const item = store.knowledgeList.find(k => k.id === knowledgeId)!
      expect(item.status).toBe('pending')
      expect(item.sourceType).toBe('JUSTKA')
      expect(item.title).toBe('客服機器人 題庫')
      expect(item.pipelineProgress).toBe(0)
      expect(item.pipelineStage).toBeNull()
      const ver = item.versions.find(v => v.id === versionId)!
      expect(ver.status).toBe('draft')
      expect(ver.summary).toContain('48')
    })
  })
})

describe('ignoreUpdate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('needs_update 狀態轉為 active，並清除 sourceStale', () => {
    const store = useKnowledgeStore()
    const item = store.knowledgeList.find(k => k.status === 'needs_update')
    expect(item).toBeDefined()
    store.ignoreUpdate(item!.id)
    expect(item!.status).toBe('active')
    expect(item!.sourceStale).toBe(false)
  })

  it('非 needs_update 狀態不做任何變更', () => {
    const store = useKnowledgeStore()
    const item = store.knowledgeList.find(k => k.status === 'active')
    expect(item).toBeDefined()
    store.ignoreUpdate(item!.id)
    expect(item!.status).toBe('active')
  })
})
