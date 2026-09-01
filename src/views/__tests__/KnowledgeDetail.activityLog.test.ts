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

describe('KnowledgeDetail — 活動紀錄分頁', () => {
  it('導覽列有「活動紀錄」項目，插在版本歷程跟分段預覽中間', async () => {
    const wrapper = await mountDetail('k2')
    const labels = wrapper.findAll('.detail-nav-item').map(i => i.find('span').text())
    expect(labels).toEqual(['概覽', '版本歷程', '活動紀錄', '分段預覽', '轉換結果'])
  })

  it('點擊活動紀錄分頁，依時間新到舊顯示注入的紀錄', async () => {
    setActivePinia(createPinia())
    const store = useKnowledgeStore()
    const item = store.getKnowledgeById('k4')!
    const versionId = item.versions[0].id // k4-v1.3
    item.activityLog = [
      { id: 'a1', action: 'SUBMITTED', by: 'Alice', time: '2026-01-01 09:00', versionId, versionNumber: 'v1.3', note: '測試送審' },
      { id: 'a2', action: 'APPROVED', by: 'Bob', time: '2026-01-02 09:00', versionId, versionNumber: 'v1.3' },
    ]

    const wrapper = mount(KnowledgeDetail, {
      props: { id: 'k4' },
      global: { plugins: [newRouter()], stubs: STUBS },
    })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    const tabBtn = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('活動紀錄'))
    await tabBtn!.trigger('click')

    const items = wrapper.findAll('.activity-timeline-item')
    expect(items.length).toBe(2)
    // 新到舊：後 push 的 APPROVED 排最上面
    expect(items[0].text()).toContain('核准')
    expect(items[0].text()).toContain('v1.3')
    expect(items[1].text()).toContain('送審')
    expect(items[1].text()).toContain('測試送審')
  })

  it('活動紀錄為空時顯示「尚無活動紀錄」', async () => {
    const wrapper = await mountDetail('k3') // k3 從未有任何審核動作，mock data 沒有 activityLog 欄位
    const tabBtn = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('活動紀錄'))
    await tabBtn!.trigger('click')
    expect(wrapper.text()).toContain('尚無活動紀錄')
  })
})
