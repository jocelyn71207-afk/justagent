import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CompanyTeamSettings from '../CompanyTeamSettings.vue'

describe('CompanyTeamSettings 版型', () => {
  it('企業 tab：現有 Agent 區塊維持雙欄排列，平台管理者區塊為全寬（避免表格被擠壓）', () => {
    setActivePinia(createPinia())
    const wrapper = mount(CompanyTeamSettings, {
      global: { stubs: { AppBreadcrumb: true, compSwitch: true, TeamSettingModal: true, AddPlatformAdminModal: true } },
    })
    const grid = wrapper.find('.company-settings .settings-grid')
    expect(grid.exists()).toBe(true)

    // 平台管理者（含表格）為全寬區塊，不參與雙欄排列
    const wideBlocks = grid.findAll('.settings-block--wide')
    expect(wideBlocks.length).toBe(1)
    expect(wideBlocks[0].text()).toContain('平台管理者')

    // 只有「現有 Agent」仍是一般（非 wide）的雙欄 grid 子項
    const normalBlocks = grid.findAll('.settings-block:not(.settings-block--wide)')
    expect(normalBlocks.length).toBe(1)
    expect(normalBlocks[0].text()).toContain('現有 Agent')
  })

  it('團隊 tab 的設定區塊被包在雙欄容器內', async () => {
    setActivePinia(createPinia())
    const wrapper = mount(CompanyTeamSettings, {
      global: { stubs: { AppBreadcrumb: true, compSwitch: true, TeamSettingModal: true, AddPlatformAdminModal: true } },
    })
    // 切到團隊 tab（compSwitch 被 stub 掉，直接切換底層狀態）
    ;(wrapper.vm as any).isCompanyTab = false
    await wrapper.vm.$nextTick()

    const grid = wrapper.find('.team-settings .settings-grid')
    expect(grid.exists()).toBe(true)
    expect(grid.findAll('.settings-block').length).toBe(2)
  })
})
