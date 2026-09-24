import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillStudio from '@/views/SkillStudio.vue'
import popDialog from '@/services/popDialog'
import { useSkillStore } from '@/stores/skillStore'

vi.mock('@/services/popDialog', () => ({
  default: { toast: vi.fn(), confirm: vi.fn(), alert: vi.fn() },
}))

async function mountAt(query: Record<string, string> = {}) {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/view/SkillStudio', name: 'SkillStudio', component: SkillStudio, meta: { title: 'AI 賦能', parentLabel: 'AI 技能' } },
      { path: '/view/Skills', name: 'SkillManagement', component: { template: '<div/>' } },
      { path: '/view/AiViewer', name: 'AiViewer', component: { template: '<div/>' } },
    ],
  })
  await router.push({ path: '/view/SkillStudio', query })
  await router.isReady()
  const wrapper = mount(
    { template: '<router-view />' },
    { global: { plugins: [router], stubs: { AppBreadcrumb: true } } },
  )
  await flushPromises()
  return { wrapper, router }
}

describe('SkillStudio（頁面殼）', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('渲染 banner：建立模式顯示「新增技能」＋建立 chip，並掛載工作區', async () => {
    const { wrapper } = await mountAt()
    expect(wrapper.find('.banner-title').text()).toBe('新增技能')
    expect(wrapper.find('.banner-title-row .ssc-mode-chip').classes()).toContain('ssc-mode-chip--create')
    expect(wrapper.find('.skill-studio-layout .studio-chat-col').exists()).toBe(true)
    expect(wrapper.find('.skill-studio-layout .studio-side-col').exists()).toBe(true)
  })

  it('?skillId= 個人技能：banner 顯示「修改技能」＋修改 chip（含技能名稱）', async () => {
    const { wrapper } = await mountAt({ skillId: 'personal-001' })
    expect(wrapper.find('.banner-title').text()).toBe('修改技能')
    expect(wrapper.find('.banner-title-row .ssc-mode-chip').classes()).toContain('ssc-mode-chip--edit')
    expect(wrapper.find('.banner-title-row .ssc-mode-chip').text()).toContain('修改：週報自動生成')
  })

  it('同一路由 query 變化（skillId 移除）會重新套用；無未儲存變更時不彈確認', async () => {
    const { wrapper, router } = await mountAt({ skillId: 'personal-001' })
    expect(wrapper.find('.banner-title').text()).toBe('修改技能')
    await router.push({ path: '/view/SkillStudio' })
    await flushPromises()
    expect(popDialog.confirm).not.toHaveBeenCalled()
    expect(wrapper.find('.banner-title').text()).toBe('新增技能')
  })

  it('同一路由 query 變化：有未儲存變更時彈確認，取消則維持原本內容', async () => {
    const { wrapper, router } = await mountAt({ skillId: 'personal-001' })
    const store = useSkillStore()
    store.applyStudioPatch('personal-001', { name: '改過的名字還沒存' })
    // 直接改 store 不會讓 workspace 的 isDirty 變 true（isDirty 比對的是 workspace 自己的
    // draft vs snapshot），這裡改用 UI 操作讓草稿變 dirty：走「切換技能」讓 loadSkill
    // 重新載入，藉此製造一個乾淨的 dirty 情境不夠自然——改成直接送一句訊息
    const chatInput = wrapper.find('.SkillStudioChat input.custom-input')
    await chatInput.setValue('名稱改成「暫存中的修改」')
    await chatInput.trigger('keydown.enter')
    await new Promise(r => setTimeout(r, 850))
    await flushPromises()

    // router.push() 觸發的 onBeforeRouteUpdate 守衛（popDialog.confirm 在裡面呼叫）
    // 是非同步解析的，而 popDialog.confirm 在這裡被 mock 成不會呼叫 next() 的空函式，
    // 所以這個 push() 的 promise 永遠不會 resolve——不能 await，只能觸發後 flushPromises()
    // 看 confirm 有沒有被呼叫（同 SkillManagement.studioDrawer.test.ts 的作法）
    router.push({ path: '/view/SkillStudio' })
    await flushPromises()
    expect(popDialog.confirm).toHaveBeenCalledWith('有未儲存的變更，確定要放棄嗎？', '放棄變更', '留下', expect.any(Function), expect.any(Function))
  })

  it('離開頁面：無未儲存變更時不彈確認', async () => {
    const { wrapper, router } = await mountAt()
    await router.push({ name: 'SkillManagement' })
    await flushPromises()
    expect(popDialog.confirm).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('SkillManagement')
  })
})
