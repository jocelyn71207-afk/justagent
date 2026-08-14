import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeEditor from '../KnowledgeEditor.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

function mountEditor() {
  setActivePinia(createPinia())
  const knowledgeStore = useKnowledgeStore()
  const knowledgeId = knowledgeStore.knowledgeList[0].id
  const knowledge = knowledgeStore.getKnowledgeById(knowledgeId)!
  const versionId = knowledge.versions.find(v => v.status === 'draft')?.id ?? knowledge.versions[0].id
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  return mount(KnowledgeEditor, {
    props: { knowledgeId, versionId },
    global: {
      plugins: [router],
      stubs: { AppBreadcrumb: true, compDropDown: true, SubmitReviewModal: true },
    },
  })
}

describe('KnowledgeEditor 3 步驟向導', () => {
  it('預設顯示 Step 0（基本資訊），有 3 個步驟指示器', () => {
    const wrapper = mountEditor()
    const steps = wrapper.findAll('.ke-step')
    expect(steps).toHaveLength(3)
    expect(steps[0].classes()).toContain('is-active')
    expect(wrapper.find('input.custom-input').exists()).toBe(true) // 標題欄位在 Step 0
  })

  it('Step 0 標題為空時，下一步按鈕disabled', () => {
    const wrapper = mountEditor()
    const titleInput = wrapper.find('.ke-body input.custom-input')
    titleInput.setValue('')
    const nextBtn = wrapper.find('.ke-footer-right button.custom-main-btn')
    expect(nextBtn.attributes('disabled')).toBeDefined()
  })

  it('填寫標題後可以進到 Step 1（內容與來源）', async () => {
    const wrapper = mountEditor()
    const titleInput = wrapper.find('.ke-body input.custom-input')
    await titleInput.setValue('測試知識標題')
    const nextBtn = wrapper.find('.ke-footer-right button.custom-main-btn')
    await nextBtn.trigger('click')
    const steps = wrapper.findAll('.ke-step')
    expect(steps[1].classes()).toContain('is-active')
    expect(wrapper.find('textarea.editor-textarea').exists()).toBe(true) // 內容欄位在 Step 1
  })

  it('Step 2（確認與發布）顯示確認卡片內容摘要', async () => {
    const wrapper = mountEditor()
    await wrapper.find('.ke-body input.custom-input').setValue('測試知識標題')
    await wrapper.find('.ke-footer-right button.custom-main-btn').trigger('click')
    await wrapper.find('textarea.editor-textarea').setValue('這是內容')
    await wrapper.find('.ke-footer-right button.custom-main-btn').trigger('click')
    const steps = wrapper.findAll('.ke-step')
    expect(steps[2].classes()).toContain('is-active')
    expect(wrapper.find('.ke-confirm-grid').exists()).toBe(true)
    expect(wrapper.text()).toContain('測試知識標題')
  })
})
