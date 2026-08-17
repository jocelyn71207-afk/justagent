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

export interface NotionRichText {
  plain_text: string
}

export interface NotionBlock {
  type: string
  heading_1?: { rich_text: NotionRichText[] }
  heading_2?: { rich_text: NotionRichText[] }
  heading_3?: { rich_text: NotionRichText[] }
  paragraph?: { rich_text: NotionRichText[] }
  bulleted_list_item?: { rich_text: NotionRichText[] }
  numbered_list_item?: { rich_text: NotionRichText[] }
  code?: { rich_text: NotionRichText[]; language: string }
}

function blocksToMarkdown(blocks: NotionBlock[]): string {
  return blocks
    .map(block => {
      const text = (arr?: NotionRichText[]) => (arr ?? []).map(t => t.plain_text).join('')
      switch (block.type) {
        case 'heading_1': return `# ${text(block.heading_1?.rich_text)}`
        case 'heading_2': return `## ${text(block.heading_2?.rich_text)}`
        case 'heading_3': return `### ${text(block.heading_3?.rich_text)}`
        case 'paragraph': return text(block.paragraph?.rich_text)
        case 'bulleted_list_item': return `- ${text(block.bulleted_list_item?.rich_text)}`
        case 'numbered_list_item': return `1. ${text(block.numbered_list_item?.rich_text)}`
        case 'code':
          return `\`\`\`${block.code?.language ?? ''}\n${text(block.code?.rich_text)}\n\`\`\``
        default: return ''
      }
    })
    .filter(Boolean)
    .join('\n\n')
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

  function createIntegration(
    type: IntegrationType,
    config: NotionConfig | GoogleDriveConfig | SlackConfig,
    name: string,
    schedule: 'MANUAL' | 'DAILY' | 'WEEKLY',
  ): string {
    const id = `integration-${type.toLowerCase()}-${Date.now()}`
    integrationSources.value.push({
      id,
      type,
      name,
      enabled: true,
      schedule,
      lastSyncAt: null,
      lastSyncStatus: null,
      lastSyncCount: 0,
      lastSyncError: null,
      config,
    })
    return id
  }

  function updateIntegration(id: string, patch: Partial<Omit<IntegrationSource, 'id' | 'type'>>) {
    const src = integrationSources.value.find(s => s.id === id)
    if (!src) return
    Object.assign(src, patch)
  }

  function deleteIntegration(id: string) {
    const idx = integrationSources.value.findIndex(s => s.id === id)
    if (idx !== -1) integrationSources.value.splice(idx, 1)
  }

  function toggleIntegrationEnabled(id: string) {
    const src = integrationSources.value.find(s => s.id === id)
    if (src) src.enabled = !src.enabled
  }

  function syncNotion(source: IntegrationSource): Promise<void> {
    return new Promise(resolve => {
      setTimeout(async () => {
        const success = Math.random() > 0.2
        const now = new Date().toISOString().replace('T', ' ').slice(0, 16)

        if (!success) {
          source.lastSyncStatus = 'FAILED'
          source.lastSyncAt = now
          source.lastSyncCount = 0
          source.lastSyncError = '連線失敗：無法存取 Notion API'
          resolve()
          return
        }

        const { useKnowledgeStore } = await import('@/stores/knowledgeStore')
        const knowledgeStore = useKnowledgeStore()
        const config = source.config as NotionConfig
        const count = Math.floor(Math.random() * 5) + 3

        const mockPages = Array.from({ length: count }, (_, i) => ({
          notionPageId: `notion-page-${source.id}-${i}`,
          title: `${source.name} 條目 ${i + 1}`,
          content: `## 說明\n\n這是來自 Notion Database「${source.name}」的第 ${i + 1} 筆知識內容。\n\n## 詳細資訊\n\n由 Notion Integration 自動同步生成的示範段落文字。`,
          category: config.defaultCategory ?? '商品文件',
          tags: ['Notion', 'AI 同步'],
        }))

        for (const page of mockPages) {
          const existing = knowledgeStore.knowledgeList.find(
            k => k.integrationSourceId === source.id && k.notionPageId === page.notionPageId,
          )
          if (existing) {
            knowledgeStore.createDraftFromIntegrationSync(
              existing.id, page.title, page.content, page.category, page.tags,
            )
          } else {
            knowledgeStore.createKnowledgeFromIntegration(
              source.id, page.notionPageId, page.title, page.content, page.category, page.tags,
            )
          }
        }

        source.lastSyncStatus = 'SUCCESS'
        source.lastSyncAt = now
        source.lastSyncCount = count
        source.lastSyncError = null
        resolve()
      }, 2000)
    })
  }

  function triggerIntegrationSync(id: string): Promise<void> {
    const source = integrationSources.value.find(s => s.id === id)
    if (!source) return Promise.resolve()
    switch (source.type) {
      case 'NOTION': return syncNotion(source)
      default: return Promise.resolve()
    }
  }

  return {
    integrationSources,
    getIntegrationById,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleIntegrationEnabled,
    blocksToMarkdown,
    triggerIntegrationSync,
  }
})
