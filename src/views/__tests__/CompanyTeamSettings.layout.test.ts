import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CompanyTeamSettings from '../CompanyTeamSettings.vue'

describe('CompanyTeamSettings 版型', () => {
  it('企業 tab 的設定區塊被包在雙欄容器內', () => {
    setActivePinia(createPinia())
    const wrapper = mount(CompanyTeamSettings, {
      global: { stubs: { AppBreadcrumb: true, compSwitch: true, TeamSettingModal: true, AddPlatformAdminModal: true } },
    })
    const grid = wrapper.find('.company-settings .settings-grid')
    expect(grid.exists()).toBe(true)
    expect(grid.findAll('.settings-block').length).toBe(2)
  })
})
