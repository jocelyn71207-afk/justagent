import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

describe('knowledgeStore — 多檔案來源管理', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('createFromFile', () => {
    it('傳入多筆 files 時，sourceFiles 完整對應每一筆', () => {
      const store = useKnowledgeStore()
      const { knowledgeId } = store.createFromFile({
        files: [
          { fileId: 'res-a', fileName: 'A.pdf' },
          { fileId: 'res-b', fileName: 'B.xlsx' },
        ],
        category: '商品文件',
        template: '',
        content: '',
      })
      const version = store.getKnowledgeById(knowledgeId)!.versions[0]
      expect(version.sourceFiles).toEqual([
        { fileId: 'res-a', fileName: 'A.pdf', linkedVersion: 1 },
        { fileId: 'res-b', fileName: 'B.xlsx', linkedVersion: 1 },
      ])
    })

    it('多筆檔案時，summary 與 updateNote 使用複數文案', () => {
      const store = useKnowledgeStore()
      const { knowledgeId } = store.createFromFile({
        files: [
          { fileId: 'res-a', fileName: 'A.pdf' },
          { fileId: 'res-b', fileName: 'B.xlsx' },
        ],
        category: '商品文件',
        template: 'tpl',
        content: '',
      })
      const version = store.getKnowledgeById(knowledgeId)!.versions[0]
      expect(version.summary).toContain('等 2 個來源檔案')
      expect(version.updateNote).toContain('A.pdf、B.xlsx')
    })

    it('單一檔案時維持原本單數文案', () => {
      const store = useKnowledgeStore()
      const { knowledgeId } = store.createFromFile({
        files: [{ fileId: 'res-a', fileName: 'A.pdf' }],
        category: '商品文件',
        template: '',
        content: '',
      })
      const version = store.getKnowledgeById(knowledgeId)!.versions[0]
      expect(version.summary).toBe('由「A.pdf」生成的知識條目草稿')
    })
  })

  describe('createDraftFromMemberUpdate', () => {
    it('以現有生效版本為基礎建立新草稿，版本號遞增、狀態為 draft', () => {
      const store = useKnowledgeStore()
      const versionId = store.createDraftFromMemberUpdate('k1', [
        { fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt', linkedVersion: 1 },
      ])
      expect(versionId).toBeTruthy()
      const item = store.getKnowledgeById('k1')!
      const newVersion = item.versions.find(v => v.id === versionId)!
      expect(newVersion.versionNumber).toBe('v1.3')
      expect(newVersion.status).toBe('draft')
      expect(item.status).toBe('pending')
      expect(newVersion.sourceFiles).toEqual([
        { fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt', linkedVersion: 1 },
      ])
    })
  })

  describe('approveVersion — syncMembership callback', () => {
    it('生效時比對新舊 sourceFiles，回傳新增與移除的 fileId', () => {
      const store = useKnowledgeStore()
      const versionId = store.createDraftFromMemberUpdate('k1', [
        { fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt', linkedVersion: 1 },
      ])!
      store.submitForReview('k1', versionId, 'reviewer1', '調整來源')

      let syncResult: { added: string[]; removed: string[]; knowledgeId: string } | null = null
      store.approveVersion('k1', versionId, (opts) => { syncResult = opts })

      expect(syncResult).toEqual({ added: ['res9'], removed: ['res3'], knowledgeId: 'k1' })
      const item = store.getKnowledgeById('k1')!
      expect(item.versions.find(v => v.id === versionId)!.status).toBe('active')
    })

    it('沒有傳入 syncMembership 時，approveVersion 行為不變（不報錯）', () => {
      const store = useKnowledgeStore()
      const versionId = store.createDraftFromMemberUpdate('k1', [])!
      store.submitForReview('k1', versionId, 'reviewer1', '')
      expect(() => store.approveVersion('k1', versionId)).not.toThrow()
      expect(store.getVersionById('k1', versionId)?.status).toBe('active')
    })
  })
})
