import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillStudioModeHeader from '@/components/Skill/SkillStudioModeHeader.vue'

describe('SkillStudioModeHeader', () => {
  it('建立模式：標題「新增技能」＋建立色系 chip', () => {
    const wrapper = mount(SkillStudioModeHeader, { props: { mode: 'create', skillName: '' } })
    expect(wrapper.find('.banner-title').text()).toBe('新增技能')
    expect(wrapper.find('.ssc-mode-chip').classes()).toContain('ssc-mode-chip--create')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('建立新技能')
  })

  it('修改模式：標題「修改技能」＋修改色系 chip，內含技能名稱', () => {
    const wrapper = mount(SkillStudioModeHeader, { props: { mode: 'edit', skillName: '週報自動生成' } })
    expect(wrapper.find('.banner-title').text()).toBe('修改技能')
    expect(wrapper.find('.ssc-mode-chip').classes()).toContain('ssc-mode-chip--edit')
    expect(wrapper.find('.ssc-mode-chip').text()).toContain('修改：週報自動生成')
  })
})
