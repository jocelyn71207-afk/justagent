import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — pipeline 完成後應停在草稿，而非自動進入審核中', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('markPipelineDone 完成後，item 狀態是 pending、草稿版本狀態維持 draft，並標記 aiGenerated', () => {
    const store = useKnowledgeStore()
    const { knowledgeId } = store.createManualDraft({ title: '測試文件', category: '系統文件', tags: [] })

    store.markPipelineDone(knowledgeId, [
      { index: 1, content: '測試分段', tokenCount: 10, sourceType: 'text' },
    ])

    const item = store.getKnowledgeById(knowledgeId)!
    expect(item.status).toBe('pending')

    const draft = item.versions.find(v => v.status === 'draft')
    expect(draft).toBeTruthy()
    expect(draft!.status).toBe('draft')
    expect(draft!.aiGenerated).toBe(true)
  })

  it('createDraftFromPublished：從一個曾被 pipeline 標記 aiGenerated 的已發布版本建立新草稿，新草稿的 aiGenerated 要重置，不能沿用舊版本的標記', () => {
    const store = useKnowledgeStore()
    const item = store.getKnowledgeById('k1')!
    const published = item.versions.find(v => v.status === 'active')!
    published.aiGenerated = true // 模擬「目前發布版本本來就是 AI 生成的」

    const versionId = store.createDraftFromPublished('k1', '修正錯字', '調整用字')
    const draft = store.getVersionById('k1', versionId!)

    expect(draft?.aiGenerated).toBeFalsy()
  })

  it('createDraftFromMemberUpdate：同樣不能沿用舊版本的 aiGenerated 標記', () => {
    const store = useKnowledgeStore()
    const item = store.getKnowledgeById('k1')!
    const published = item.versions.find(v => v.status === 'active')!
    published.aiGenerated = true

    const versionId = store.createDraftFromMemberUpdate('k1', [
      { fileId: 'res-x', fileName: 'x.pdf', linkedVersion: 1 },
    ])
    const draft = store.getVersionById('k1', versionId!)

    expect(draft?.aiGenerated).toBeFalsy()
  })
})
