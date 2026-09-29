import { describe, it, expect, vi } from 'vitest'
import { mount, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import SkillManagement from '../SkillManagement.vue'
import { useSkillStore } from '@/stores/skillStore'

describe('SkillManagement Library 團隊技能卡片', () => {
  it('團隊技能區塊改為多欄卡片，卡片數等於團隊分組數', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/Skills', name: 'SkillManagement', component: SkillManagement },
      ],
    })
    await router.push('/view/Skills')
    await router.isReady()
    const rootWrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } } },
    )
    const wrapper = rootWrapper.findComponent(SkillManagement)
    const store = useSkillStore()
    // 切到管理區才會渲染 Library 技能管理區塊（點擊頂部「團隊技能管理」按鈕，不碰內部狀態）
    const teamManageBtn = wrapper.findAll('button').find(b => b.text().includes('團隊技能管理'))
    expect(teamManageBtn, '目前 mock 角色需為管理者才看得到「團隊技能管理」按鈕，若找不到請確認 SkillManagement.vue 的 currentUserRole 預設值').toBeTruthy()
    await teamManageBtn!.trigger('click')
    await wrapper.vm.$nextTick()

    const teamSkillCount = store.flatSkills.filter(s => s.scope === 'team').length
    expect(teamSkillCount).toBeGreaterThan(0)

    const teamGrid = wrapper.find('.lsr-team-grid')
    expect(teamGrid.exists()).toBe(true)
    const teamCards = wrapper.findAll('.lsr-team-card')
    expect(teamCards.length).toBeGreaterThan(0)
  })

  it('「跟 Agent 對話修改」導向 AI 賦能並帶 skillId', async () => {
    setActivePinia(createPinia())
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/', component: { template: '<div/>' } },
        { path: '/view/Skills', name: 'SkillManagement', component: SkillManagement },
      ],
    })
    await router.push('/view/Skills')
    await router.isReady()
    const rootWrapper = mount(
      { template: '<router-view />' },
      { global: { plugins: [router], stubs: { AppBreadcrumb: true, LibraryBrowseModal: true, SkillDetailDrawer: true, UpstreamUpdateDrawer: true, SkillReviewDrawer: true, BatchUpdateModal: true } } },
    )
    const wrapper = rootWrapper.findComponent(SkillManagement)
    const store = useSkillStore()
    const push = vi.spyOn(router, 'push')
    const skill = store.myPersonalSkills[0]
    ;(wrapper.vm as any).editChoiceSkill = skill
    await wrapper.vm.$nextTick()
    // 選擇框走 <Teleport to="body">，不在 wrapper 的 DOM 子樹裡，改用 DOMWrapper 查 document.body
    const btn = new DOMWrapper(document.body).findAll('button').find(b => b.text().includes('跟 Agent 對話修改'))
    expect(btn).toBeDefined()
    await btn!.trigger('click')
    expect(push).toHaveBeenCalledWith({ query: { skillId: skill.id } })
    expect((wrapper.vm as any).editChoiceSkill).toBeNull()
  })
})
