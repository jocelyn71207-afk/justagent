import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeDetail from '../KnowledgeDetail.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

// popDialog.confirm 在真實環境會跳出 SweetAlert2 對話框，測試環境裡直接讓
// confirm callback 立即執行，模擬使用者按下確定。
vi.mock('@/services/popDialog', () => ({
  default: {
    confirm: (_msg: string, cb?: () => void) => { if (typeof cb === 'function') cb() },
    toast: vi.fn(),
    alert: vi.fn(),
  },
}))

const STUBS = { AppSkeleton: true, AppErrorState: true, AppBreadcrumb: true, CreateVersionModal: true, VersionCompareModal: true, ReviewDrawer: true, FilePreviewModal: true, ChunkPreviewTab: true, ConversionLogTab: true }

function newRouter() {
  return createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
}

// k2 mock data：v1.0(history) / v1.1(active) / v1.2(approved) / v2.0(reviewing)。
// 把 v2.0 也改成 approved，製造「同時有兩個 approved 版本」的情境 —— 這正是
// Finding 1 / Finding 2 的 bug class（誤用陣列順序中第一個 approved，而非
// 使用者實際點擊或最新核准的那一個）。
function setupTwoApprovedVersions() {
  setActivePinia(createPinia())
  const store = useKnowledgeStore()
  const item = store.getKnowledgeById('k2')!
  const v12 = item.versions.find(v => v.versionNumber === 'v1.2')!
  const v20 = item.versions.find(v => v.versionNumber === 'v2.0')!
  expect(v12.status).toBe('approved') // 陣列順序中排在前面
  v20.status = 'approved' // 陣列順序中排在後面、也是較晚核准的版本
  v20.reviewedBy = 'Ethan'
  v20.reviewedTime = '2026-04-02 09:00'
  item.status = 'approved' // 讓 header 的「已核准，待發佈」/「立即發佈」按鈕顯示出來
  return { store, v12, v20 }
}

describe('KnowledgeDetail — 兩個 approved 版本同時存在時的發佈選取（回歸測試）', () => {
  it('Finding 2 對照組：版本歷程列表點擊「第二個」approved 版本（v2.0）列上的立即發佈，發佈的必須是 v2.0 而非 v1.2', async () => {
    const { store, v12, v20 } = setupTwoApprovedVersions()

    const wrapper = mount(KnowledgeDetail, {
      props: { id: 'k2' },
      global: { plugins: [newRouter()], stubs: STUBS },
    })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    // 切到「版本歷程」分頁
    const historyTabBtn = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('版本歷程'))
    await historyTabBtn!.trigger('click')

    // 版本歷程以新到舊排序顯示，v2.0 是最新版本，其列上的「立即發佈」按鈕排在最前面
    const publishBtns = wrapper.findAll('.version-timeline-item button').filter(b => b.text().includes('立即發佈'))
    expect(publishBtns.length).toBe(2) // 兩個 approved 版本各有一顆立即發佈按鈕

    // 找到 v2.0 那一列的立即發佈按鈕（非陣列順序中的第一個 v1.2）
    const v20Item = wrapper.findAll('.version-timeline-item').find(item => item.text().includes('v2.0'))!
    const v20PublishBtn = v20Item.findAll('button').find(b => b.text().includes('立即發佈'))!
    await v20PublishBtn.trigger('click')
    await flushPromises()

    const updated = store.getKnowledgeById('k2')!
    expect(updated.versions.find(v => v.id === v20.id)!.status).toBe('active')
    // 沒被點擊的 v1.2 應維持 approved，不能被誤發佈
    expect(updated.versions.find(v => v.id === v12.id)!.status).toBe('approved')
  })

  it('Finding 1 對照組：不指定版本（header「立即發佈」按鈕的 fallback 路徑）時，發佈「最近核准」的版本（v2.0），而非陣列順序第一個 approved 版本（v1.2）', async () => {
    const { store, v12, v20 } = setupTwoApprovedVersions()

    const wrapper = mount(KnowledgeDetail, {
      props: { id: 'k2' },
      global: { plugins: [newRouter()], stubs: STUBS },
    })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 600))

    // 概覽分頁（預設分頁）目前檢視版本是 active 版本 v1.1，不是 approved，
    // 所以 header 的「立即發佈」按鈕會走 fallback 邏輯（未帶明確 versionId）。
    const headerPublishBtn = wrapper.findAll('button').find(b => b.text().includes('立即發佈') && b.classes().includes('ml-2'))
    expect(headerPublishBtn).toBeTruthy()
    await headerPublishBtn!.trigger('click')
    await flushPromises()

    const updated = store.getKnowledgeById('k2')!
    // 修復前的 bug：fallback 永遠選陣列順序第一個 approved（v1.2），
    // 而非最近核准的 v2.0 —— 這裡驗證修復後的正確行為。
    expect(updated.versions.find(v => v.id === v20.id)!.status).toBe('active')
    expect(updated.versions.find(v => v.id === v12.id)!.status).toBe('approved')
  })
})
