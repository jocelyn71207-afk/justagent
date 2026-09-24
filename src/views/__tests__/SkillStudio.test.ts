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

async function chooseChat(wrapper: any) {
  await wrapper.findAll('.smc-card')[0].trigger('click')
  await flushPromises()
}

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
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
    expect(wrapper.find('.ssc-mode-chip').exists()).toBe(false)
    await chooseChat(wrapper)
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
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
  })

  it('?skillId= 不存在：toast「找不到這個技能」並退回建立模式', async () => {
    const { wrapper } = await mountAt({ skillId: 'nope-999' })
    expect(popDialog.toast).toHaveBeenCalledWith('找不到這個技能')
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
  })

  it('?tab=test 預設切到測試 tab', async () => {
    const { wrapper } = await mountAt({ skillId: 'personal-001', tab: 'test' })
    expect(wrapper.findAll('.ssp-tab-btn')[1].classes()).toContain('is-active')
  })

  it('送出訊息 → 草稿更新 → 儲存 → 建立個人技能、toast、自動切到測試 tab', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const { wrapper } = await mountAt()
      await chooseChat(wrapper)
      const store = useSkillStore()
      // 清單非空時，建立意圖的訊息會先卡在 gate1（見 useSkillStudioConversation 的意圖判斷關卡）；
      // 這裡要測的是送出訊息→草稿→儲存本身，先清空清單讓 chat 建立訊息直接進 active、照舊擬草稿
      store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
      const before = store.myPersonalSkills.length
      const input = wrapper.find('.SkillStudioChat input.custom-input')
      // 新的多輪 gathering 流程：第一句描述 → 兩輪追問 → confirmKnownInfo 確認，
      // 才會落在 gate3（草稿已擬好但尚未儲存），維持這裡「儲存前先驗證草稿」的測試意圖
      await input.setValue('幫我建立一個能查 ERP 庫存的技能')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('沒有特殊例外')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('照標準流程執行')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('對，沒錯')
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
    await chooseChat(wrapper)
    await wrapper.find('.ssc-skill-select').setValue('personal-001')
    await flushPromises()
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
  })

  it('同名個人技能時顯示提示 banner，改成不同名後消失，儲存仍可用', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const { wrapper } = await mountAt()
      await chooseChat(wrapper)
      const store = useSkillStore()
      // 清單非空時，建立意圖的訊息會先卡在 gate1（見 useSkillStudioConversation 的意圖判斷關卡）；
      // 這裡要測的是名稱衝突 banner 本身，先清空清單讓 chat 建立訊息直接進 active、照舊擬草稿，
      // 草稿擬好之後再直接呼叫 store 補回一顆同名（週報自動生成）的個人技能來觸發衝突判斷
      store.myPersonalSkills.forEach(s => store.deletePersonalSkill(s.id))
      const input = wrapper.find('.SkillStudioChat input.custom-input')
      // 這個測試接著要送出「自由格式」的改名訊息，那只有在 gateStage 'active' 才會走
      // interpretStudioMessage 的改名規則（見 useSkillStudioConversation 的 gate3 分支），
      // 所以要走完整輪：第一句描述 → 兩輪追問 → confirmKnownInfo 確認 → gate3 確認，
      // 最後一步會實際呼叫 save() 落地一顆「查 ERP 庫存」個人技能，但這個測試不檢查
      // myPersonalSkills.length，只驗證 name-conflict-banner 與儲存按鈕的狀態，不受影響
      await input.setValue('幫我建立一個能查 ERP 庫存的技能')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('沒有特殊例外')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('照標準流程執行')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('對，沒錯')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      await input.setValue('這樣可以，存到個人技能')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()

      store.createPersonalSkill({ name: '週報自動生成', instructions: '', triggerHint: '', assignedAgents: [] })
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
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
  })

  it('同一路由 query 變化：找不到的 skillId 退回建立模式並強制回到預覽 tab', async () => {
    const { wrapper } = await mountAt({ skillId: 'nope-999', tab: 'test' })
    expect(popDialog.toast).toHaveBeenCalledWith('找不到這個技能')
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
    expect(wrapper.findAll('.ssp-tab-btn')[0].classes()).toContain('is-active')
  })

  it('選「用行銷積木組裝」：左欄變成積木面板；勾章節、命名、儲存 → 個人技能有 composition', async () => {
    const { wrapper } = await mountAt()
    await wrapper.findAll('.smc-card')[1].trigger('click')
    await flushPromises()
    expect(wrapper.find('.studio-chat-col .SkillBlockComposer').exists()).toBe(true)
    expect(wrapper.find('.SkillStudioChat').exists()).toBe(false)
    await wrapper.find('.sbc-name-input').setValue('行銷週報')
    await wrapper.findAll('.sbc-palette-item').find(i => i.text().includes('活動排行'))!.find('.sbc-add-btn').trigger('click')
    await flushPromises()
    expect(wrapper.find('.ssp-title').text()).toBe('行銷週報')
    expect(wrapper.text()).toContain('活動排行：各促銷活動帶動效果排行')
    await wrapper.find('.ssp-save-btn').trigger('click')
    await flushPromises()
    const store = useSkillStore()
    expect(store.myPersonalSkills[0].composition).toEqual({ sectionIds: ['promo_ranking'] })
    expect(wrapper.find('.skb-after-save-bar').exists()).toBe(false) // 頁面沒有畫布，不提供產報告
  })

  it('?skillId= 指向有 composition 的技能：左欄直接是積木面板且勾選還原', async () => {
    setActivePinia(createPinia())
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '渠道週報', instructions: '依序產出以下章節：\n1. 渠道核心 KPI', triggerHint: 't', isEnabled: true, assignedAgents: [], composition: { sectionIds: ['ch_kpi'] } })
    const { wrapper } = await mountAt({ skillId: id })
    expect(wrapper.find('.SkillBlockComposer').exists()).toBe(true)
    expect(wrapper.findAll('.sbc-list .sbc-item-name').map(n => n.text())).toEqual(['渠道核心 KPI'])
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(false)
  })

  it('積木方式的左欄也有「建立新技能」，點擊回到方式選擇', async () => {
    const { wrapper } = await mountAt()
    await wrapper.findAll('.smc-card')[1].trigger('click')
    await flushPromises()
    await wrapper.find('.studio-new-btn').trigger('click')
    await flushPromises()
    expect(wrapper.find('.SkillMethodChooser').exists()).toBe(true)
  })
})
