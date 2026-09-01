import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeDetail from '../KnowledgeDetail.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

const STUBS = { AppSkeleton: true, AppErrorState: true, AppBreadcrumb: true, CreateVersionModal: true, VersionCompareModal: true, ReviewDrawer: true, FilePreviewModal: true, ChunkPreviewTab: true, ConversionLogTab: true }

function newRouter() {
  return createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
}

// 簡單案例：不需要在掛載前改資料，直接用既有 mock data
async function mountDetail(knowledgeId: string) {
  setActivePinia(createPinia())
  const wrapper = mount(KnowledgeDetail, {
    props: { id: knowledgeId },
    global: { plugins: [newRouter()], stubs: STUBS },
  })
  await flushPromises()
  await new Promise(resolve => setTimeout(resolve, 600))
  return wrapper
}

describe('KnowledgeDetail — isPipelineReview 改讀 activityLog', () => {
  it('有 SUBMITTED 活動紀錄的 reviewing 版本，不顯示 Pipeline 提示 banner', async () => {
    // 先建 pinia、取得 store、直接改資料，再用同一個 store 實例掛載元件
    setActivePinia(createPinia())
    const store = useKnowledgeStore()
    const item = store.getKnowledgeById('k2')!
    const v2 = item.versions.find(v => v.versionNumber === 'v2.0')!
    item.activityLog = [
      { id: 'test-act-1', action: 'SUBMITTED', by: 'Rita', time: '2026-04-01 11:00', versionId: v2.id, versionNumber: 'v2.0' },
    ]

    const wrapper = mount(KnowledgeDetail, {
      props: { id: 'k2' },
      global: { plugins: [newRouter()], stubs: STUBS },
    })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.find('.pipeline-review-banner').exists()).toBe(false)
  })

  it('reviewing 但完全沒有活動紀錄時，顯示 Pipeline 提示 banner', async () => {
    // 先建 pinia、取得 store、直接改資料，再用同一個 store 實例掛載元件
    setActivePinia(createPinia())
    const store = useKnowledgeStore()
    const item = store.getKnowledgeById('k3')! // k3 的 v1.0 目前是 draft，先手動改成 reviewing 但不寫活動紀錄
    item.versions[0].status = 'reviewing'
    item.activityLog = []

    const wrapper = mount(KnowledgeDetail, {
      props: { id: 'k3' },
      global: { plugins: [newRouter()], stubs: STUBS },
    })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    expect(wrapper.find('.pipeline-review-banner').exists()).toBe(true)
  })
})
