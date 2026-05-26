import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useResourceStore } from '@/stores/resourceStore'

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
