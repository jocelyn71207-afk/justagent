import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ReviewDrawer from '../ReviewDrawer.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

vi.mock('@/services/popDialog', () => ({ default: { toast: vi.fn(), alert: vi.fn(), confirm: vi.fn() } }))

async function mountDrawer(knowledgeId: string, versionId: string) {
  setActivePinia(createPinia())
  const wrapper = mount(ReviewDrawer, {
    props: { modelValue: true, knowledgeId, versionId },
    global: { stubs: { VersionCompareModal: true, AppSkeleton: true, AppErrorState: true } },
  })
  await flushPromises()
  // useApiCall 內部用 setTimeout 模擬非同步請求，等待 loading 結束
  await new Promise(resolve => setTimeout(resolve, 600))
  return wrapper
}

describe('ReviewDrawer', () => {
  it('三個 footer 按鈕都會渲染：退回 / 僅核准（待發佈） / 通過並發布', async () => {
    // k2 的 v2.0 在 mock data 裡是 reviewing 狀態
    const wrapper = await mountDrawer('k2', 'k2-v2.0')

    const reject = wrapper.find('.review-footer__reject')
    const approvePending = wrapper.find('.review-footer__approve-pending')
    const approve = wrapper.find('.review-footer__approve')

    expect(reject.exists()).toBe(true)
    expect(reject.text()).toContain('退回')
    expect(approvePending.exists()).toBe(true)
    expect(approvePending.text()).toContain('僅核准（待發佈）')
    expect(approve.exists()).toBe(true)
    expect(approve.text()).toContain('通過並發布')
  })

  it('點擊「僅核准（待發佈）」呼叫 approveVersionPending，版本狀態變為 approved（非 active），且只新增一筆 APPROVED 活動紀錄（不寫 PUBLISHED）', async () => {
    const wrapper = await mountDrawer('k2', 'k2-v2.0')
    const store = useKnowledgeStore()
    const item = store.getKnowledgeById('k2')!
    const beforeLog = [...(item.activityLog ?? [])]

    const spy = vi.spyOn(store, 'approveVersionPending')

    await wrapper.find('.review-footer__approve-pending').trigger('click')
    await flushPromises()

    // 呼叫時帶的是 props 的 knowledgeId / versionId
    expect(spy).toHaveBeenCalledWith('k2', 'k2-v2.0')

    const updated = store.getKnowledgeById('k2')!
    const version = updated.versions.find(v => v.id === 'k2-v2.0')!
    expect(version.status).toBe('approved')
    expect(version.status).not.toBe('active')

    const log = updated.activityLog ?? []
    expect(log.length).toBe(beforeLog.length + 1)
    const newEntries = log.slice(beforeLog.length)
    expect(newEntries.map(e => e.action)).toEqual(['APPROVED'])
    expect(newEntries[0].versionId).toBe('k2-v2.0')
    expect(log.some(e => e.action === 'PUBLISHED' && e.versionId === 'k2-v2.0')).toBe(false)

    // 元件應同時 emit approvedPending，通知外層（列表關閉 drawer 等）
    expect(wrapper.emitted('approvedPending')).toBeTruthy()
    // 元件關閉自己（update:modelValue 變 false）
    expect(wrapper.emitted('update:modelValue')?.pop()).toEqual([false])
  })
})
