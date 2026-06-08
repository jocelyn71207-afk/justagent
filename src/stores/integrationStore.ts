// src/stores/integrationStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

export type IntegrationType = 'NOTION' | 'GOOGLE_DRIVE' | 'SLACK'

export interface NotionConfig {
  apiKey: string
  databaseId: string
  titleProp: string
  categoryProp?: string
  tagsProp?: string
  includePageBody: true
  defaultCategory?: string
}

export interface GoogleDriveConfig { _placeholder: true }
export interface SlackConfig { _placeholder: true }

export interface IntegrationSource {
  id: string
  type: IntegrationType
  name: string
  enabled: boolean
  schedule: 'MANUAL' | 'DAILY' | 'WEEKLY'
  lastSyncAt: string | null
  lastSyncStatus: 'SUCCESS' | 'FAILED' | null
  lastSyncCount: number
  lastSyncError: string | null
  config: NotionConfig | GoogleDriveConfig | SlackConfig
}

export const useIntegrationStore = defineStore('integration', () => {
  const integrationSources = ref<IntegrationSource[]>([
    {
      id: 'integration-notion-1',
      type: 'NOTION',
      name: 'Notion 商品知識庫',
      enabled: true,
      schedule: 'DAILY',
      lastSyncAt: '2026-06-07 09:00',
      lastSyncStatus: 'SUCCESS',
      lastSyncCount: 24,
      lastSyncError: null,
      config: {
        apiKey: 'secret_demo_notion_token',
        databaseId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
        titleProp: 'Name',
        categoryProp: 'Category',
        tagsProp: 'Tags',
        includePageBody: true,
        defaultCategory: '商品文件',
      } satisfies NotionConfig,
    },
  ])

  function getIntegrationById(id: string) {
    return integrationSources.value.find(s => s.id === id) ?? null
  }

  return { integrationSources, getIntegrationById }
})
