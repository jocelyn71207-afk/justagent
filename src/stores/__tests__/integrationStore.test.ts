import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useIntegrationStore } from '@/stores/integrationStore'

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
