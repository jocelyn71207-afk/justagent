// src/stores/__tests__/knowledgeStore.datasource.test.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — datasource 功能', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createKnowledgeFromApiSource', () => {
    it('建立一個 KnowledgeItem，且 sourceType 為 API', () => {
      const store = useKnowledgeStore()
      const before = store.knowledgeList.length

      const id = store.createKnowledgeFromApiSource({
        apiSourceId: 'api-test-1',
        apiSourceName: '測試 API',
        name: '測試知識條目',
        category: '商品文件',
      })

      expect(store.knowledgeList.length).toBe(before + 1)
      const item = store.knowledgeList.find(k => k.id === id)
      expect(item).toBeDefined()
      expect(item!.sourceType).toBe('API')
      expect(item!.apiSourceId).toBe('api-test-1')
      expect(item!.apiSourceName).toBe('測試 API')
      expect(item!.title).toBe('測試知識條目')
      expect(item!.category).toBe('商品文件')
      expect(item!.status).toBe('pending')
      expect(item!.versions.length).toBe(1)
      expect(item!.versions[0].status).toBe('draft')
      expect(item!.versions[0].versionNumber).toBe('v1.0')
    })
  })

  describe('triggerSync', () => {
    let store: ReturnType<typeof useKnowledgeStore>
    let apiSourceId: string
    let knowledgeId: string

    beforeEach(() => {
      store = useKnowledgeStore()
      apiSourceId = store.createApiSource({
        name: '商品目錄 API',
        url: 'https://api.example.com/products',
        method: 'GET',
        headers: [],
        body: '',
        titleField: 'productName',
        contentField: 'description',
        schedule: 'MANUAL',
        enabled: true,
      })
      knowledgeId = store.createKnowledgeFromApiSource({
        apiSourceId,
        apiSourceName: '商品目錄 API',
        name: '商品目錄',
        category: '商品文件',
      })
    })

    it('成功同步後：不新增額外 KnowledgeItem，只在已關聯的條目建立新版本', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9) // 強制走成功分支
      const beforeCount = store.knowledgeList.length

      await store.triggerSync(apiSourceId)

      expect(store.knowledgeList.length).toBe(beforeCount) // 沒有新增條目
      const item = store.knowledgeList.find(k => k.id === knowledgeId)!
      expect(item.versions.length).toBeGreaterThan(1) // 多了一個新版本
      expect(item.status).toBe('pending')
    })

    it('成功同步後：ApiSource 的 lastSyncStatus 為 SUCCESS，lastSyncAt 有值', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9)

      await store.triggerSync(apiSourceId)

      const source = store.apiSources.find(s => s.id === apiSourceId)!
      expect(source.lastSyncStatus).toBe('SUCCESS')
      expect(source.lastSyncAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/)
    })

    it('失敗同步後：ApiSource 的 lastSyncStatus 為 FAILED，lastSyncError 有值', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // 強制走失敗分支

      await store.triggerSync(apiSourceId)

      const source = store.apiSources.find(s => s.id === apiSourceId)!
      expect(source.lastSyncStatus).toBe('FAILED')
      expect(source.lastSyncError).toBeTruthy()
      // 失敗時不應新增版本
      const item = store.knowledgeList.find(k => k.id === knowledgeId)!
      expect(item.versions.length).toBe(1) // 仍只有初始版本
    })
  })
})
