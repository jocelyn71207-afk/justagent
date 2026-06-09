import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIntegrationStore } from '@/stores/integrationStore'
import type { NotionBlock } from '@/stores/integrationStore'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('integrationStore — CRUD', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('createIntegration 建立新整合並回傳 id', () => {
    const store = useIntegrationStore()
    const before = store.integrationSources.length
    const id = store.createIntegration(
      'NOTION',
      { apiKey: 'secret_x', databaseId: 'db-1', titleProp: 'Name', includePageBody: true },
      'My Notion',
      'MANUAL',
    )
    expect(store.integrationSources.length).toBe(before + 1)
    const src = store.getIntegrationById(id)
    expect(src?.name).toBe('My Notion')
    expect(src?.type).toBe('NOTION')
    expect(src?.schedule).toBe('MANUAL')
    expect(src?.enabled).toBe(true)
  })

  it('updateIntegration 更新指定欄位', () => {
    const store = useIntegrationStore()
    const id = store.createIntegration(
      'NOTION',
      { apiKey: 'secret_x', databaseId: 'db-1', titleProp: 'Name', includePageBody: true },
      'My Notion',
      'MANUAL',
    )
    store.updateIntegration(id, { name: 'Updated Name', schedule: 'WEEKLY' })
    const src = store.getIntegrationById(id)
    expect(src?.name).toBe('Updated Name')
    expect(src?.schedule).toBe('WEEKLY')
  })

  it('deleteIntegration 從清單移除', () => {
    const store = useIntegrationStore()
    const id = store.createIntegration(
      'NOTION',
      { apiKey: 'secret_x', databaseId: 'db-1', titleProp: 'Name', includePageBody: true },
      'My Notion',
      'MANUAL',
    )
    const before = store.integrationSources.length
    store.deleteIntegration(id)
    expect(store.integrationSources.length).toBe(before - 1)
    expect(store.getIntegrationById(id)).toBeNull()
  })

  it('toggleIntegrationEnabled 切換啟用狀態', () => {
    const store = useIntegrationStore()
    const id = store.integrationSources[0].id
    const original = store.integrationSources[0].enabled
    store.toggleIntegrationEnabled(id)
    expect(store.getIntegrationById(id)?.enabled).toBe(!original)
    store.toggleIntegrationEnabled(id)
    expect(store.getIntegrationById(id)?.enabled).toBe(original)
  })
})

describe('blocksToMarkdown', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('轉換常見 block 類型為 Markdown', () => {
    const store = useIntegrationStore()
    const blocks: NotionBlock[] = [
      { type: 'heading_2', heading_2: { rich_text: [{ plain_text: '標題' }] } },
      { type: 'paragraph', paragraph: { rich_text: [{ plain_text: '段落文字' }] } },
      { type: 'bulleted_list_item', bulleted_list_item: { rich_text: [{ plain_text: '清單項目' }] } },
      { type: 'numbered_list_item', numbered_list_item: { rich_text: [{ plain_text: '編號項目' }] } },
    ]
    const result = store.blocksToMarkdown(blocks)
    expect(result).toContain('## 標題')
    expect(result).toContain('段落文字')
    expect(result).toContain('- 清單項目')
    expect(result).toContain('1. 編號項目')
  })

  it('忽略不支援的 block 類型', () => {
    const store = useIntegrationStore()
    const blocks: NotionBlock[] = [
      { type: 'unsupported_type' as never },
      { type: 'paragraph', paragraph: { rich_text: [{ plain_text: '保留這段' }] } },
    ]
    const result = store.blocksToMarkdown(blocks)
    expect(result).toBe('保留這段')
  })
})

describe('triggerIntegrationSync — Notion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('同步成功後更新 lastSyncStatus 為 SUCCESS', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9) // > 0.2 → success
    const store = useIntegrationStore()
    const id = store.integrationSources[0].id
    const syncPromise = store.triggerIntegrationSync(id)
    vi.advanceTimersByTime(2000)
    await syncPromise
    const src = store.getIntegrationById(id)
    expect(src?.lastSyncStatus).toBe('SUCCESS')
    expect(src?.lastSyncCount).toBeGreaterThan(0)
    expect(src?.lastSyncError).toBeNull()
  })

  it('同步失敗後更新 lastSyncStatus 為 FAILED', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1) // <= 0.2 → fail
    const store = useIntegrationStore()
    const id = store.integrationSources[0].id
    const syncPromise = store.triggerIntegrationSync(id)
    vi.advanceTimersByTime(2000)
    await syncPromise
    const src = store.getIntegrationById(id)
    expect(src?.lastSyncStatus).toBe('FAILED')
    expect(src?.lastSyncError).toBeTruthy()
  })

  it('id 不存在時不拋出錯誤', async () => {
    const store = useIntegrationStore()
    await expect(store.triggerIntegrationSync('non-existent')).resolves.toBeUndefined()
  })
})

describe('syncNotion — 建立知識條目', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('成功同步後在 knowledgeStore 建立新知識條目', async () => {
    const integrationStore = useIntegrationStore()
    const knowledgeStore = useKnowledgeStore()

    const before = knowledgeStore.knowledgeList.length
    const sourceId = integrationStore.integrationSources[0].id

    const syncPromise = integrationStore.triggerIntegrationSync(sourceId)
    vi.advanceTimersByTime(2000)
    await syncPromise

    expect(knowledgeStore.knowledgeList.length).toBeGreaterThan(before)
    const newItems = knowledgeStore.knowledgeList.filter(
      k => k.integrationSourceId === sourceId,
    )
    expect(newItems.length).toBeGreaterThan(0)
    expect(newItems[0].sourceType).toBe('NOTION')
    expect(newItems[0].versions[0].status).toBe('draft')
  })
})
