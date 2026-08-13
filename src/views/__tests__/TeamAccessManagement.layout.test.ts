import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TeamAccessManagement from '../TeamAccessManagement.vue'

describe('TeamAccessManagement 版型', () => {
  it('企業擁有者以 hero 卡呈現，其餘角色是 tile，且有最近異動側欄', () => {
    setActivePinia(createPinia())
    const wrapper = mount(TeamAccessManagement, {
      global: { stubs: { AppBreadcrumb: true, compPagination: true, TeamAccountSettingModal: true } },
    })

    const hero = wrapper.find('.role-stat-hero')
    expect(hero.exists()).toBe(true)
    expect(hero.text()).toContain('企業擁有者')

    const tiles = wrapper.findAll('.role-stat-tile')
    expect(tiles.length).toBeGreaterThan(0)

    expect(wrapper.find('.access-activity-panel').exists()).toBe(true)
    expect(wrapper.findAll('.access-activity-item').length).toBeGreaterThan(0)
  })
})
