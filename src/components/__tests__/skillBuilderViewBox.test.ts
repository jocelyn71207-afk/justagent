import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useSkillStore } from '@/stores/skillStore'
import skillBuilderViewBox from '@/components/AiViewer/viewBlock/skillBuilderViewBox.vue'

vi.mock('@/services/popDialog', () => ({ default: { toast: vi.fn(), confirm: vi.fn(), alert: vi.fn() } }))

function mountBlock(init?: Parameters<ReturnType<typeof useAiviewerStore>['addSkillBuilderBlock']>[0]) {
  const store = useAiviewerStore()
  const id = store.addSkillBuilderBlock(init)
  const block = store.aiViewerBlocks.find((b: any) => b.id === id)
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/view/SkillStudio', name: 'SkillStudio', component: { template: '<div/>' } },
      { path: '/view/Skills', name: 'SkillManagement', component: { template: '<div/>' } },
      { path: '/view/SkillTest', name: 'SkillTest', component: { template: '<div/>' } },
      { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
    ],
  })
  const wrapper = mount(skillBuilderViewBox, {
    props: { id, source: block.data },
    global: { plugins: [router], stubs: { SkillTestAI: true, SkillFileUpload: true }, directives: { tooltip: {} } },
  })
  return { wrapper, store, id, block, router }
}

describe('skillBuilderViewBox', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks() })

  it('預設在對話 tab，顯示開場訊息；切 tab 寫回 block data', async () => {
    const { wrapper, block } = mountBlock()
    expect(wrapper.find('.SkillStudioChat').exists()).toBe(true)
    expect(wrapper.text()).toContain('技能建立助理')
    const tabs = wrapper.findAll('.skb-tab-btn')
    expect(tabs.map(t => t.text())).toEqual(['對話', '預覽', '測試'].map(s => expect.stringContaining(s)))
    await tabs[1].trigger('click')
    expect(block.data.data.activeTab).toBe('preview')
    expect(wrapper.find('.SkillStudioPreview').exists()).toBe(true)
    expect(wrapper.find('.ssp-tabs').exists()).toBe(false)
  })

  it('預填 block：hydrate 後預覽顯示名稱；有 origin 時對話 tab 顯示脈絡條', async () => {
    const { wrapper } = mountBlock({
      prefill: { name: '產品銷售報告整理', instructions: '1. 查詢\n2. 套用' },
      openingMessage: '來自對話的開場',
      origin: { conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' },
    })
    expect(wrapper.find('.skb-origin-bar').text()).toContain('查詢銷售資料＋套用部門報告規範')
    expect(wrapper.text()).toContain('來自對話的開場')
    await wrapper.findAll('.skb-tab-btn')[1].trigger('click')
    expect(wrapper.find('.ssp-title').text()).toBe('產品銷售報告整理')
    expect(wrapper.find('.ssp-save-btn').attributes('disabled')).toBeUndefined()
  })

  it('對話送出後草稿變動會寫回 snapshot', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    try {
      const { wrapper, block } = mountBlock()
      const input = wrapper.find('.SkillStudioChat input.custom-input')
      await input.setValue('幫我建立一個能查 ERP 庫存的技能')
      await input.trigger('keydown.enter')
      await vi.advanceTimersByTimeAsync(800)
      await flushPromises()
      expect(block.data.data.snapshot.draft.name).toBe('查 ERP 庫存')
      expect(block.blockName).toBe('查 ERP 庫存')
      expect(block.data.data.snapshot.messages.length).toBe(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it('儲存：建立個人技能、toast、自動切到測試 tab；「在 AI 賦能開啟」儲存前 disabled、儲存後導頁', async () => {
    const { wrapper, block, router } = mountBlock({ prefill: { name: '查庫存', instructions: '1. 查' } })
    const skillStore = useSkillStore()
    const before = skillStore.myPersonalSkills.length
    const openBtn = wrapper.find('.skb-open-studio')
    expect(openBtn.attributes('disabled')).toBeDefined()

    await wrapper.findAll('.skb-tab-btn')[1].trigger('click')
    await wrapper.find('.ssp-save-btn').trigger('click')
    await flushPromises()
    expect(skillStore.myPersonalSkills.length).toBe(before + 1)
    expect(block.data.data.activeTab).toBe('test')
    expect(block.data.data.snapshot.savedSkillId).toBe(skillStore.myPersonalSkills[0].id)

    const push = vi.spyOn(router, 'push')
    expect(wrapper.find('.skb-open-studio').attributes('disabled')).toBeUndefined()
    await wrapper.find('.skb-open-studio').trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'SkillStudio', query: { skillId: skillStore.myPersonalSkills[0].id } })
  })

  it('snapshot 指到的技能已被刪除：顯示提示、退回建立模式', async () => {
    const skillStore = useSkillStore()
    const store = useAiviewerStore()
    const id = store.addSkillBuilderBlock({ prefill: { name: '查庫存', instructions: '1. 查' } })
    const block = store.aiViewerBlocks.find((b: any) => b.id === id)
    block.data.data.snapshot.mode = 'edit'
    block.data.data.snapshot.savedSkillId = 'personal-gone'
    const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
    const wrapper = mount(skillBuilderViewBox, {
      props: { id, source: block.data },
      global: { plugins: [router], stubs: { SkillTestAI: true, SkillFileUpload: true }, directives: { tooltip: {} } },
    })
    await flushPromises()
    expect(wrapper.find('.skb-missing-bar').text()).toContain('這顆技能已不存在')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
    expect(skillStore.findSkill('personal-gone')).toBeUndefined()
    // detach 後的狀態要寫回 block data，不然其他實例／重新掛載仍看到指向已刪除技能的舊快照
    expect(block.data.data.snapshot.savedSkillId).toBeNull()
    expect(block.data.data.snapshot.mode).toBe('create')
  })
})
