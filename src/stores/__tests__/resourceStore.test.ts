import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useResourceStore, getKbSourceStatusLabel, isKbSourceSelectable } from '@/stores/resourceStore'

describe('resourceStore — addFileFromUpload', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('adds a new ResourceFile record to the front of resourceList', () => {
    const store = useResourceStore()
    const before = store.resourceList.length
    const mockFile = new File(['content'], 'report.pdf', { type: 'application/pdf' })

    const result = store.addFileFromUpload(mockFile)

    expect(store.resourceList.length).toBe(before + 1)
    expect(result.fileName).toBe('report.pdf')
    expect(store.resourceList[0].id).toBe(result.id)
    expect(store.resourceList[0].fileName).toBe('report.pdf')
  })

  it('sets status to stored and creatorType to USER', () => {
    const store = useResourceStore()
    const mockFile = new File([''], 'data.xlsx', { type: 'application/vnd.ms-excel' })

    store.addFileFromUpload(mockFile)

    const added = store.resourceList[0]
    expect(added.status).toBe('stored')
    expect(added.creatorType).toBe('USER')
    expect(added.processType).toBe('RAW')
    expect(added.version).toBe(1)
  })

  it('derives fileType from extension: pdf→PDF, docx→WORD, xlsx→EXCEL, unknown→OTHER', () => {
    const store = useResourceStore()

    store.addFileFromUpload(new File([''], 'a.pdf'))
    store.addFileFromUpload(new File([''], 'b.docx'))
    store.addFileFromUpload(new File([''], 'c.xlsx'))
    store.addFileFromUpload(new File([''], 'd.xyz'))

    // resourceList is prepended, so order is reversed
    expect(store.resourceList[0].fileType).toBe('OTHER')
    expect(store.resourceList[1].fileType).toBe('EXCEL')
    expect(store.resourceList[2].fileType).toBe('WORD')
    expect(store.resourceList[3].fileType).toBe('PDF')
  })
})

describe('resourceStore — 知識庫成員關係', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('addKnowledgeMembership 會新增 knowledgeId 且不重複', () => {
    const store = useResourceStore()
    const file = store.resourceList[0]
    store.addKnowledgeMembership(file.id, 'k-test')
    store.addKnowledgeMembership(file.id, 'k-test')
    expect(store.getFileById(file.id)?.knowledgeIds).toEqual(['k-test'])
  })

  it('removeKnowledgeMembership 只移除指定的 knowledgeId', () => {
    const store = useResourceStore()
    const file = store.resourceList[0]
    store.addKnowledgeMembership(file.id, 'k-a')
    store.addKnowledgeMembership(file.id, 'k-b')
    store.removeKnowledgeMembership(file.id, 'k-a')
    expect(store.getFileById(file.id)?.knowledgeIds).toEqual(['k-b'])
  })

  it('demo 資料 res3 已預先關聯 k1（供元件層測試「目前成員」欄位使用）', () => {
    const store = useResourceStore()
    expect(store.getFileById('res3')?.knowledgeIds).toEqual(['k1'])
  })
})

describe('resourceStore — addFileFromUpload 補上擁有者欄位', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('設定 ownerId/ownerName 並將 knowledgeIds 初始化為空陣列', () => {
    const store = useResourceStore()
    const mockFile = new File(['x'], 'new-upload.pdf')
    const result = store.addFileFromUpload(mockFile)
    const added = store.getFileById(result.id)!
    expect(added.ownerId).toBe('current-user')
    expect(added.ownerName).toBe('Current User')
    expect(added.knowledgeIds).toEqual([])
  })
})

describe('getKbSourceStatusLabel', () => {
  function makeFile(overrides: Partial<import('@/stores/resourceStore').ResourceFile>): import('@/stores/resourceStore').ResourceFile {
    return {
      id: 'f1', fileName: 'test.pdf', fileUrl: '', fileType: 'PDF', processType: 'RAW',
      status: 'saved', creatorType: 'USER', ownerId: 'u1', ownerName: 'U',
      lastModify: '2026-01-01 00:00:00', version: 1, knowledgeIds: [],
      ...overrides,
    }
  }

  it('needsColumnConfirmation 為 true 時，優先回傳「待確認」', () => {
    expect(getKbSourceStatusLabel(makeFile({ status: 'saved', needsColumnConfirmation: true }))).toBe('待確認')
  })

  it('status 為 uploading/parsing/failed 時回傳「需解析」', () => {
    expect(getKbSourceStatusLabel(makeFile({ status: 'uploading' }))).toBe('需解析')
    expect(getKbSourceStatusLabel(makeFile({ status: 'parsing' }))).toBe('需解析')
    expect(getKbSourceStatusLabel(makeFile({ status: 'failed' }))).toBe('需解析')
  })

  it('status 為 stored/saved 且不需確認時回傳「已有資料」', () => {
    expect(getKbSourceStatusLabel(makeFile({ status: 'stored' }))).toBe('已有資料')
    expect(getKbSourceStatusLabel(makeFile({ status: 'saved' }))).toBe('已有資料')
  })
})

describe('isKbSourceSelectable', () => {
  function makeFile(overrides: Partial<import('@/stores/resourceStore').ResourceFile>): import('@/stores/resourceStore').ResourceFile {
    return {
      id: 'f1', fileName: 'test.pdf', fileUrl: '', fileType: 'PDF', processType: 'RAW',
      status: 'saved', creatorType: 'USER', ownerId: 'u1', ownerName: 'U',
      lastModify: '2026-01-01 00:00:00', version: 1, knowledgeIds: [],
      ...overrides,
    }
  }

  it('僅 failed 狀態不可勾選', () => {
    expect(isKbSourceSelectable(makeFile({ status: 'failed' }))).toBe(false)
    expect(isKbSourceSelectable(makeFile({ status: 'uploading' }))).toBe(true)
    expect(isKbSourceSelectable(makeFile({ status: 'parsing' }))).toBe(true)
    expect(isKbSourceSelectable(makeFile({ status: 'saved' }))).toBe(true)
  })
})
