import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CompanyTeamSettings from '../CompanyTeamSettings.vue'

describe('CompanyTeamSettings 頁面標題改名', () => {
  it('頁面大標題應為「企業設定」，不是舊的「企業/團隊設定」', () => {
    setActivePinia(createPinia())
    const wrapper = mount(CompanyTeamSettings, {
      global: { stubs: { AppBreadcrumb: true, compSwitch: true, TeamSettingModal: true, AddPlatformAdminModal: true } },
    })

    expect(wrapper.find('.banner-title').text()).toBe('企業設定')
  })
})
