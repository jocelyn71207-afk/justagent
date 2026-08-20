import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import UpdateKnowledgeSourcesModal from '../UpdateKnowledgeSourcesModal.vue'
import ResourceFilePicker from '../ResourceFilePicker.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/knowledge/:knowledgeId/edit/:versionId', name: 'KnowledgeEditor', component: { template: '<div/>' } },
    ],
  })
}

async function mountModal() {
  setActivePinia(createPinia())
  const router = makeRouter()
  const wrapper = mount(UpdateKnowledgeSourcesModal, {
    props: { modelValue: true },
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

describe('UpdateKnowledgeSourcesModal', () => {
  it('選擇知識庫後，pickedFiles 預填為該知識庫目前生效版本的來源檔案', async () => {
    const wrapper = await mountModal()
    await wrapper.find('select.custom-input').setValue('k1')
    await flushPromises()
    expect(wrapper.findAll('.picked-file-row').length).toBe(1)
    expect(wrapper.text()).toContain('UGG2025商品總表.xlsx')
  })

  it('未選擇知識庫時，送出按鈕為 disabled', async () => {
    const wrapper = await mountModal()
    expect(wrapper.find('.custom-main-btn').attributes('disabled')).toBeDefined()
  })

  it('重新開啟共用檔案選取時，preselectedIds 反映目前的 pickedFiles（而非原始生效版本）', async () => {
    const wrapper = await mountModal()
    await wrapper.find('select.custom-input').setValue('k1')
    await flushPromises()

    const picker = wrapper.findComponent(ResourceFilePicker)
    await picker.vm.$emit('select', { files: [{ fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt' }] })
    await flushPromises()

    expect(picker.props('preselectedIds')).toEqual(['res9'])
  })

  it('送出後呼叫 createDraftFromMemberUpdate 並導頁至 KnowledgeEditor', async () => {
    const wrapper = await mountModal()
    const knowledgeStore = useKnowledgeStore()
    await wrapper.find('select.custom-input').setValue('k1')
    await flushPromises()

    const picker = wrapper.findComponent(ResourceFilePicker)
    await picker.vm.$emit('select', { files: [{ fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt' }] })
    await flushPromises()

    const before = knowledgeStore.getKnowledgeById('k1')!.versions.length
    await wrapper.find('.custom-main-btn').trigger('click')
    await flushPromises()

    const item = knowledgeStore.getKnowledgeById('k1')!
    expect(item.versions.length).toBe(before + 1)
    const newVersion = item.versions[item.versions.length - 1]
    expect(newVersion.status).toBe('draft')
    expect(newVersion.sourceFiles).toEqual([{ fileId: 'res9', fileName: '特殊材質名稱轉換清單(新）.txt', linkedVersion: 1 }])
  })
})
