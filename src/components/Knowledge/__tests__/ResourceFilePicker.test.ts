import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ResourceFilePicker from '../ResourceFilePicker.vue'
import { useResourceStore } from '@/stores/resourceStore'

function mountPicker(props: Record<string, unknown> = {}) {
  return mount(ResourceFilePicker, {
    props: { modelValue: true, ...props },
  })
}

describe('ResourceFilePicker — 多選', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('可以勾選多筆檔案，確認選取後 emit 完整清單', async () => {
    const wrapper = mountPicker()
    const rows = wrapper.findAll('.picker-row')
    await rows[0].trigger('click')
    await rows[1].trigger('click')

    const confirmBtn = wrapper.find('.custom-main-btn')
    await confirmBtn.trigger('click')

    const emitted = wrapper.emitted('select')
    expect(emitted).toBeTruthy()
    const payload = emitted![0][0] as { files: { fileId: string; fileName: string }[] }
    expect(payload.files.length).toBe(2)
  })

  it('未選取任何檔案時，確認按鈕為 disabled', () => {
    const wrapper = mountPicker()
    const confirmBtn = wrapper.find('.custom-main-btn')
    expect(confirmBtn.attributes('disabled')).toBeDefined()
  })

  it('failed 狀態的檔案列被禁用，parsing 狀態仍可勾選', () => {
    const resourceStore = useResourceStore()
    resourceStore.resourceList.push({
      id: 'res-failed-test', fileName: 'failed-demo.pdf', fileUrl: '', fileType: 'PDF',
      processType: 'RAW', status: 'failed', creatorType: 'USER', ownerId: 'u', ownerName: 'U',
      lastModify: '2026-01-01 00:00:00', version: 1, knowledgeIds: [],
    })
    const wrapper = mountPicker()
    const failedRow = wrapper.findAll('.picker-row').find(r => r.text().includes('failed-demo.pdf'))
    expect(failedRow!.classes()).toContain('is-disabled')

    const parsingRow = wrapper.findAll('.picker-row').find(r => r.text().includes('特殊材質名稱轉換清單.md'))
    expect(parsingRow!.classes()).not.toContain('is-disabled')
  })

  it('needsColumnConfirmation 為 true 的檔案顯示「待確認」狀態', () => {
    const wrapper = mountPicker()
    const row = wrapper.findAll('.picker-row').find(r => r.text().includes('特殊材質名稱轉換清單(新）.txt'))
    expect(row!.text()).toContain('待確認')
  })

  it('目前成員欄位顯示已關聯的知識庫標題', () => {
    const wrapper = mountPicker()
    const row = wrapper.findAll('.picker-row').find(r => r.text().includes('UGG2025商品總表.xlsx'))
    expect(row!.text()).toContain('2025產品總表-Q3')
  })

  it('preselectedIds 開啟時正確預先勾選', () => {
    const wrapper = mountPicker({ preselectedIds: ['res1'] })
    const row = wrapper.findAll('.picker-row').find(r => r.text().includes('26W產品特色簡報.pptx'))
    expect(row!.classes()).toContain('is-selected')
  })
})
