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
      expect(item!.status).toBe('DRAFT')
      expect(item!.versions.length).toBe(1)
      expect(item!.versions[0].status).toBe('DRAFT')
      expect(item!.versions[0].versionNumber).toBe('v1.0')
    })
  })

  describe('triggerSync', () => {
    it('成功同步後：不新增額外 KnowledgeItem，只在已關聯的條目建立新版本', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9) // 強制走成功分支
      const store = useKnowledgeStore()

      const knowledgeId = store.createKnowledgeFromApiSource({
        apiSourceId: 'api-1',
        apiSourceName: '商品目錄 API',
        name: '商品目錄',
        category: '商品文件',
      })
      const beforeCount = store.knowledgeList.length

      await store.triggerSync('api-1')

      expect(store.knowledgeList.length).toBe(beforeCount) // 沒有新增條目
      const item = store.knowledgeList.find(k => k.id === knowledgeId)!
      expect(item.versions.length).toBeGreaterThan(1)      // 多了一個新版本
      expect(item.status).toBe('DRAFT')
    })

    it('成功同步後：ApiSource.lastSyncStatus 為 SUCCESS', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.9)
      const store = useKnowledgeStore()

      store.createKnowledgeFromApiSource({
        apiSourceId: 'api-1',
        apiSourceName: '商品目錄 API',
        name: '商品目錄',
        category: '商品文件',
      })
      await store.triggerSync('api-1')

      const source = store.apiSources.find(s => s.id === 'api-1')!
      expect(source.lastSyncStatus).toBe('SUCCESS')
      expect(source.lastSyncAt).not.toBeNull()
    })

    it('失敗同步後：KnowledgeItem 版本數不變', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.0) // 強制走失敗分支
      const store = useKnowledgeStore()

      const knowledgeId = store.createKnowledgeFromApiSource({
        apiSourceId: 'api-1',
        apiSourceName: '商品目錄 API',
        name: '商品目錄',
        category: '商品文件',
      })
      const versionsBefore = store.knowledgeList.find(k => k.id === knowledgeId)!.versions.length

      await store.triggerSync('api-1')

      const versionsAfter = store.knowledgeList.find(k => k.id === knowledgeId)!.versions.length
      expect(versionsAfter).toBe(versionsBefore)
    })
  })
})
