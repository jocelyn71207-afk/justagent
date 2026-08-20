import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import CreateKnowledgeWizardModal from '../CreateKnowledgeWizardModal.vue'
import ResourceFilePicker from '../ResourceFilePicker.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useResourceStore } from '@/stores/resourceStore'

vi.mock('@/services/popDialog', () => ({ default: { toast: vi.fn() } }))

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/knowledge/:id', name: 'KnowledgeDetail', component: { template: '<div/>' } },
    ],
  })
}

async function mountModal(props: Record<string, unknown> = {}) {
  setActivePinia(createPinia())
  const router = makeRouter()
  const wrapper = mount(CreateKnowledgeWizardModal, {
    props: { modelValue: true, ...props },
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

describe('CreateKnowledgeWizardModal — 多檔建立', () => {
  it('prefillFile 開啟時，pickedFiles 預填為第一筆', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    expect(wrapper.findAll('.picked-file-row').length).toBe(1)
    expect(wrapper.text()).toContain('26W產品特色簡報.pptx')
  })

  it('可透過「從共用檔案管理選取」再加入多筆檔案', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    const picker = wrapper.findComponent(ResourceFilePicker)
    // 真實 picker 會以 preselected-ids 預先勾選 res1，使用者再多勾 res2、res4 後確認選取，
    // 因此 emit 出的 payload 是「目前完整勾選集合」（res1 + res2 + res4）
    await picker.vm.$emit('select', {
      files: [
        { fileId: 'res1', fileName: '26W產品特色簡報.pptx' },
        { fileId: 'res2', fileName: '25W產品銷售DM.pdf' },
        { fileId: 'res4', fileName: '25W產品特色搭配建議.pdf' },
      ],
    })
    await flushPromises()
    expect(wrapper.findAll('.picked-file-row').length).toBe(3)
  })

  it('移除按鈕可移除已選檔案', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    await wrapper.find('.picked-file-remove').trigger('click')
    expect(wrapper.findAll('.picked-file-row').length).toBe(0)
  })

  it('FILE 送出時呼叫 createFromFile 帶正確的多筆 files 陣列，並逐筆呼叫 addKnowledgeMembership', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    const knowledgeStore = useKnowledgeStore()
    const resourceStore = useResourceStore()
    const beforeCount = knowledgeStore.knowledgeList.length

    const picker = wrapper.findComponent(ResourceFilePicker)
    // 真實 picker 會以 preselected-ids 預先勾選 res1，確認選取時 payload 含目前完整勾選集合
    await picker.vm.$emit('select', {
      files: [
        { fileId: 'res1', fileName: '26W產品特色簡報.pptx' },
        { fileId: 'res2', fileName: '25W產品銷售DM.pdf' },
      ],
    })
    await flushPromises()

    await wrapper.find('select.custom-input').setValue('商品文件')
    await wrapper.find('.custom-main-btn').trigger('click')
    await flushPromises()

    expect(knowledgeStore.knowledgeList.length).toBe(beforeCount + 1)
    const created = knowledgeStore.knowledgeList[0]
    expect(created.versions[0].sourceFiles).toEqual([
      { fileId: 'res1', fileName: '26W產品特色簡報.pptx', linkedVersion: 1 },
      { fileId: 'res2', fileName: '25W產品銷售DM.pdf', linkedVersion: 1 },
    ])
    expect(resourceStore.getFileById('res1')?.knowledgeIds).toContain(created.id)
    expect(resourceStore.getFileById('res2')?.knowledgeIds).toContain(created.id)
  })

  it('picker 的 preselected-ids 只反映共用庫選取的檔案，且重新確認選取會正確移除未勾選項目（上傳檔案不受影響）', async () => {
    const wrapper = await mountModal()
    const picker = wrapper.findComponent(ResourceFilePicker)

    // 1) 透過共用庫選取兩筆檔案
    await picker.vm.$emit('select', {
      files: [
        { fileId: 'res1', fileName: '26W產品特色簡報.pptx' },
        { fileId: 'res2', fileName: '25W產品銷售DM.pdf' },
      ],
    })
    await flushPromises()
    expect(wrapper.findAll('.picked-file-row').length).toBe(2)

    // 2) 另外新增一筆「新上傳」檔案（不應受共用庫勾選狀態影響）
    const uploadedFile = new File(['x'], 'uploaded-report.pdf', { type: 'application/pdf' })
    await wrapper.find('.upload-dropzone').trigger('drop', { dataTransfer: { files: [uploadedFile] } })
    await flushPromises()
    expect(wrapper.findAll('.picked-file-row').length).toBe(3)
    expect(wrapper.text()).toContain('uploaded-report.pdf')

    // 3) 重新開啟共用庫選取器：preselected-ids 應只反映目前共用庫選取的子集（不含上傳檔案）
    expect(picker.props('preselectedIds')).toEqual(['res1', 'res2'])

    // 4) 確認選取時省略 res1（模擬使用者取消勾選），res2 保留
    await picker.vm.$emit('select', {
      files: [{ fileId: 'res2', fileName: '25W產品銷售DM.pdf' }],
    })
    await flushPromises()

    const rows = wrapper.findAll('.picked-file-row')
    expect(rows.length).toBe(2)
    expect(wrapper.text()).not.toContain('26W產品特色簡報.pptx')
    expect(wrapper.text()).toContain('25W產品銷售DM.pdf')
    // 上傳檔案應完全不受共用庫確認選取動作影響
    expect(wrapper.text()).toContain('uploaded-report.pdf')
  })

  it('沒有選擇分類時，送出按鈕為 disabled', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    expect(wrapper.find('.custom-main-btn').attributes('disabled')).toBeDefined()
  })
})
