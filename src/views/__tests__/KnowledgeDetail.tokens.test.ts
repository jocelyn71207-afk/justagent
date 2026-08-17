import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeDetail from '../KnowledgeDetail.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

function mountDetailWithPipelineError() {
  setActivePinia(createPinia())
  const knowledgeStore = useKnowledgeStore()
  const knowledgeId = knowledgeStore.knowledgeList[0].id
  const knowledge = knowledgeStore.getKnowledgeById(knowledgeId)!
  knowledge.pipelineError = '轉換失敗：檔案格式不支援'
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: { template: '<div/>' } }],
  })
  const wrapper = mount(KnowledgeDetail, {
    props: { id: knowledgeId },
    global: {
      plugins: [router],
      stubs: { AppSkeleton: true, AppErrorState: true, AppBreadcrumb: true, CreateVersionModal: true, RestoreVersionModal: true, VersionCompareModal: true, ReviewDrawer: true, FilePreviewModal: true, ChunkPreviewTab: true, ConversionLogTab: true },
    },
  })
  return wrapper
}

describe('KnowledgeDetail --color-danger 修正', () => {
  it('pipeline 錯誤訊息不再使用不存在的 --color-danger token', async () => {
    const wrapper = mountDetailWithPipelineError()
    // Wait for async data loading
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    const errorEl = wrapper.find('.pipeline-error-text')
    expect(errorEl.exists()).toBe(true)
    // 顏色已改由 _KnowledgeDetail.scss 的 .pipeline-error-text { color: var(--danger); } 規則提供，
    // 不再依賴 inline style，也就不會有寫死的 --color-danger token。
    expect(errorEl.attributes('style')).toBeUndefined()
  })
})

describe('KnowledgeDetail 活潑感套用', () => {
  it('版本歷程時間軸容器套用 lively-stagger', async () => {
    setActivePinia(createPinia())
    const knowledgeStore = useKnowledgeStore()
    const knowledgeId = knowledgeStore.knowledgeList[0].id
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(KnowledgeDetail, {
      props: { id: knowledgeId },
      global: {
        plugins: [router],
        stubs: { AppSkeleton: true, AppErrorState: true, AppBreadcrumb: true, CreateVersionModal: true, RestoreVersionModal: true, VersionCompareModal: true, ReviewDrawer: true, FilePreviewModal: true, ChunkPreviewTab: true, ConversionLogTab: true },
      },
    })
    // Wait for async data loading
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    // 切到版本歷程分頁
    const historyTabBtn = wrapper.findAll('.detail-tab-btn').find(b => b.text().includes('版本歷程'))
    expect(historyTabBtn).toBeTruthy()
    await historyTabBtn!.trigger('click')
    const timelineContainer = wrapper.find('.version-timeline')
    expect(timelineContainer.classes()).toContain('lively-stagger')

    // 確認時間軸的每個項目有 lively-card
    const timelineItems = wrapper.findAll('.version-timeline-item')
    expect(timelineItems.length).toBeGreaterThan(0)
    timelineItems.forEach(item => {
      expect(item.classes()).toContain('lively-card')
    })
  })
})
