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
      { path: '/view/SkillTest', name: 'SkillTest', component: { template: '<div/>' } },
      { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
    ],
  })
  await router.push({ path: '/view/SkillStudio', query })
  await router.isReady()
  // 掛在 <router-view/> 之下，讓 SkillStudio.vue 裡的 onBeforeRouteLeave() 能拿到有效的
  // matched route record（直接 mount(SkillStudio, ...) 不經過 router-view 會觸發 vue-router 的
  // 「No active route record was found」警告）。
  const wrapper = mount(
    { template: '<router-view />' },
    { global: { plugins: [router], stubs: { AppBreadcrumb: true, SkillTestAI: true } } },
  )
  await flushPromises()
  return { wrapper, router }
}

describe('SkillStudio', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('渲染 banner 標題「AI 賦能」與左右兩欄版面', async () => {
    const { wrapper } = await mountAt()
    expect(wrapper.find('.banner-title').text()).toBe('AI 賦能')
    expect(wrapper.find('.skill-studio-layout .studio-chat-col').exists()).toBe(true)
    expect(wrapper.find('.skill-studio-layout .studio-side-col').exists()).toBe(true)
  })

  it('無 query：建立模式，左側 chip「建立新技能」，右側預覽空狀態', async () => {
    const { wrapper } = await mountAt()
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
    expect(wrapper.text()).toContain('尚未命名的技能')
  })

  it('?skillId= 個人技能：修改模式，預覽帶入該技能內容', async () => {
    const { wrapper } = await mountAt({ skillId: 'personal-001' })
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
    expect(wrapper.find('.ssp-title').text()).toBe('週報自動生成')
  })

  it('?skillId= Library 技能：toast 提示並退回建立模式', async () => {
    const { wrapper } = await mountAt({ skillId: 'sys-cs-001' })
    expect(popDialog.toast).toHaveBeenCalledWith('Library 技能請先在技能管理複製為個人技能')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
  })

  it('?skillId= 不存在：toast「找不到這個技能」並退回建立模式', async () => {
    const { wrapper } = await mountAt({ skillId: 'nope-999' })
    expect(popDialog.toast).toHaveBeenCalledWith('找不到這個技能')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
  })

  it('?tab=test 預設切到測試 tab', async () => {
    const { wrapper } = await mountAt({ skillId: 'personal-001', tab: 'test' })
    expect(wrapper.findAll('.ssp-tab-btn')[1].classes()).toContain('is-active')
  })

  it('送出訊息 → 草稿更新 → 儲存 → 建立個人技能、toast、自動切到測試 tab', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const { wrapper } = await mountAt()
      const store = useSkillStore()
      const before = store.myPersonalSkills.length
      const input = wrapper.find('.SkillStudioChat input.custom-input')
      await input.setValue('幫我建立一個能查 ERP 庫存的技能')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()
      expect(wrapper.find('.ssp-title').text()).toBe('查 ERP 庫存')
      await wrapper.find('.ssp-save-btn').trigger('click')
      await flushPromises()
      expect(store.myPersonalSkills.length).toBe(before + 1)
      expect(popDialog.toast).toHaveBeenCalledWith('已儲存為個人技能，可到「測試」tab 驗證')
      expect(wrapper.findAll('.ssp-tab-btn')[1].classes()).toContain('is-active')
      expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：查 ERP 庫存')
    } finally {
      vi.useRealTimers()
    }
  })

  it('切換技能下拉：無未儲存變更時直接切換', async () => {
    const { wrapper } = await mountAt()
    await wrapper.find('.ssc-skill-select').setValue('personal-001')
    await flushPromises()
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
  })

  it('同名個人技能時顯示提示 banner，改成不同名後消失，儲存仍可用', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const { wrapper } = await mountAt()
      const input = wrapper.find('.SkillStudioChat input.custom-input')
      await input.setValue('幫我建立一個能查 ERP 庫存的技能')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('名稱改成「週報自動生成」')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()
      expect(wrapper.find('.name-conflict-banner').exists()).toBe(true)
      expect(wrapper.find('.ssp-save-btn').attributes('disabled')).toBeUndefined()

      await input.setValue('名稱改成「庫存速查」')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()
      expect(wrapper.find('.name-conflict-banner').exists()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('同一路由 query 變化（skillId 移除）會重新套用；無未儲存變更時不彈確認', async () => {
    const { wrapper, router } = await mountAt({ skillId: 'personal-001' })
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
    await router.push({ path: '/view/SkillStudio' })
    await flushPromises()
    expect(popDialog.confirm).not.toHaveBeenCalled()
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
  })

  it('同一路由 query 變化：找不到的 skillId 退回建立模式並強制回到預覽 tab', async () => {
    const { wrapper } = await mountAt({ skillId: 'nope-999', tab: 'test' })
    expect(popDialog.toast).toHaveBeenCalledWith('找不到這個技能')
    expect(wrapper.findAll('.ssp-tab-btn')[0].classes()).toContain('is-active')
  })
})
