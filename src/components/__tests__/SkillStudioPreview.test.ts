import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillStudioPreview from '@/components/Skill/SkillStudioPreview.vue'
import { emptyDraft } from '@/composables/useSkillStudioConversation'

function mountPreview(over: Partial<Record<string, unknown>> = {}) {
  setActivePinia(createPinia())
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div/>' } },
      { path: '/view/Skills', name: 'SkillManagement', component: { template: '<div/>' } },
      { path: '/view/SkillTest', name: 'SkillTest', component: { template: '<div/>' } },
      { path: '/view/SkillEditor', name: 'SkillEditor', component: { template: '<div/>' } },
    ],
  })
  return mount(SkillStudioPreview, {
    props: {
      draft: emptyDraft(),
      mode: 'create',
      savedSkillId: null,
      isDirty: false,
      canSave: false,
      activeTab: 'preview',
      ...over,
    },
    global: { plugins: [router], stubs: { SkillTestAI: true, SkillFileUpload: true } },
  })
}

describe('SkillStudioPreview', () => {
  it('空白草稿：六個區塊標籤都在，並顯示各自的空狀態文案與「未儲存草稿」badge', () => {
    const w = mountPreview()
    const text = w.text()
    expect(text).toContain('尚未命名的技能')
    expect(text).toContain('跟 Agent 描述這個技能要做什麼')
    expect(text).toContain('尚未設定觸發條件')
    expect(text).toContain('尚未撰寫技能指令')
    expect(text).toContain('尚未拆解覆蓋能力項目')
    expect(w.find('.ssp-status-badge').text()).toBe('未儲存草稿')
    expect(w.findAll('.ssp-section-label').length).toBe(5) // 說明／觸發條件／技能指令／覆蓋能力／附加檔案
  })

  it('有內容時渲染名稱、觸發、markdown 指令與能力 chip', () => {
    const w = mountPreview({
      draft: { ...emptyDraft(), name: '查庫存', triggerHint: '提到庫存時', instructions: '1. **釐清**\n2. 查詢', capabilities: [{ name: '能力A', description: '' }] },
    })
    expect(w.find('.ssp-title').text()).toBe('查庫存')
    expect(w.text()).toContain('提到庫存時')
    expect(w.find('.markdown-body strong').text()).toBe('釐清')
    expect(w.findAll('.ssp-cap-chip').map(c => c.text())).toEqual(['能力A'])
  })

  it('建立模式主按鈕「儲存為個人技能」依 canSave 決定 disabled，點擊 emit save', async () => {
    const w = mountPreview({ canSave: false })
    const btn = w.find('.ssp-save-btn')
    expect(btn.text()).toContain('儲存為個人技能')
    expect(btn.attributes('disabled')).toBeDefined()
    await w.setProps({ canSave: true })
    await w.find('.ssp-save-btn').trigger('click')
    expect(w.emitted('save')).toHaveLength(1)
  })

  it('修改模式：主按鈕「儲存修改」依 isDirty；顯示「直接編輯」「到技能管理」；badge 依 isDirty 切換', async () => {
    const w = mountPreview({ mode: 'edit', savedSkillId: 'p1', canSave: true, isDirty: false })
    expect(w.find('.ssp-save-btn').text()).toContain('儲存修改')
    expect(w.find('.ssp-save-btn').attributes('disabled')).toBeDefined()
    expect(w.find('.ssp-status-badge').text()).toBe('個人技能 · 可使用')
    expect(w.text()).toContain('直接編輯')
    expect(w.text()).toContain('到技能管理')
    await w.setProps({ isDirty: true })
    expect(w.find('.ssp-save-btn').attributes('disabled')).toBeUndefined()
    expect(w.find('.ssp-status-badge').text()).toBe('有未儲存變更')
  })

  it('已儲存後兩個 tab 都有「技能測試沙盒」入口，點擊導向 /view/SkillTest?skillId=', async () => {
    const w = mountPreview({ mode: 'edit', savedSkillId: 'p1', canSave: true })
    const push = vi.spyOn((w.vm as any).$router, 'push')
    const footBtn = w.findAll('.ssp-footer button').find(b => b.text().includes('測試沙盒'))
    expect(footBtn).toBeDefined()
    await footBtn!.trigger('click')
    expect(push).toHaveBeenCalledWith({ path: '/view/SkillTest', query: { skillId: 'p1' } })

    await w.setProps({ activeTab: 'test' })
    const sandboxBtn = w.find('.ssp-sandbox-btn')
    expect(sandboxBtn.exists()).toBe(true)
    expect(sandboxBtn.text()).toContain('到技能測試沙盒')
    await sandboxBtn.trigger('click')
    expect(push).toHaveBeenCalledTimes(2)
    expect(push).toHaveBeenLastCalledWith({ path: '/view/SkillTest', query: { skillId: 'p1' } })
  })

  it('測試 tab：未儲存顯示空狀態與儲存鈕；已儲存掛載 SkillTestAI 並帶 skillId', async () => {
    const w = mountPreview({ activeTab: 'test' })
    expect(w.text()).toContain('先儲存技能')
    expect(w.findComponent({ name: 'SkillTestAI' }).exists()).toBe(false)
    await w.setProps({ savedSkillId: 'p1', mode: 'edit' })
    const ai = w.findComponent({ name: 'SkillTestAI' })
    expect(ai.exists()).toBe(true)
    expect(ai.attributes('skillid') ?? ai.props('skillId')).toBe('p1')
  })

  it('已儲存但 isDirty 時，測試 tab 頂端顯示「目前測試的是上次儲存的版本」提示', () => {
    const w = mountPreview({ activeTab: 'test', savedSkillId: 'p1', mode: 'edit', isDirty: true })
    expect(w.text()).toContain('目前測試的是上次儲存的版本')
  })

  it('點 tab 按鈕 emit update:activeTab', async () => {
    const w = mountPreview()
    await w.findAll('.ssp-tab-btn')[1].trigger('click')
    expect(w.emitted('update:activeTab')?.[0]).toEqual(['test'])
  })

  it('nameConflict 為 true 時顯示同名提示 banner，預設不顯示', () => {
    const w1 = mountPreview()
    expect(w1.find('.name-conflict-banner').exists()).toBe(false)
    const w2 = mountPreview({ nameConflict: true })
    expect(w2.find('.name-conflict-banner').exists()).toBe(true)
    expect(w2.text()).toContain('你已經有一個同名的個人技能，建議修改名稱以便區分。')
  })
})
