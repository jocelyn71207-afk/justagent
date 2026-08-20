import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import CreateKnowledgeWizardModal from '../CreateKnowledgeWizardModal.vue'
import ResourceFilePicker from '../ResourceFilePicker.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { useResourceStore } from '@/stores/resourceStore'

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
    await picker.vm.$emit('select', {
      files: [
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
    await picker.vm.$emit('select', { files: [{ fileId: 'res2', fileName: '25W產品銷售DM.pdf' }] })
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

  it('沒有選擇分類時，送出按鈕為 disabled', async () => {
    const wrapper = await mountModal({ prefillFile: { fileId: 'res1', fileName: '26W產品特色簡報.pptx' } })
    expect(wrapper.find('.custom-main-btn').attributes('disabled')).toBeDefined()
  })
})
