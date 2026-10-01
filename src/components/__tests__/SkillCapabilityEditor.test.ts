import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillCapabilityEditor from '../Skill/SkillCapabilityEditor.vue'

// 覆蓋能力改成純 hashtag（不支援空白、不限字數、可以多個），這裡測輸入框、
// 預設範本、移除都照這個規則走
describe('SkillCapabilityEditor', () => {
  it('沒有任何標籤時，不顯示標籤清單', () => {
    const wrapper = mount(SkillCapabilityEditor, { props: { modelValue: [] } })
    expect(wrapper.find('.sce-tag-list').exists()).toBe(false)
  })

  it('點預設範本：加進清單，顯示 #開頭；已加過的範本變成 disabled', async () => {
    const wrapper = mount(SkillCapabilityEditor, { props: { modelValue: [] } })
    const preset = wrapper.findAll('.sce-preset-chip')[0]
    expect(preset.text()).toContain('#問題分類')
    await preset.trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['問題分類']])

    await wrapper.setProps({ modelValue: ['問題分類'] })
    expect(wrapper.findAll('.sce-preset-chip')[0].attributes('disabled')).toBeDefined()
  })

  it('輸入框打字按 Enter：新增一個標籤，清空輸入框', async () => {
    const wrapper = mount(SkillCapabilityEditor, { props: { modelValue: [] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('自訂能力')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['自訂能力']])
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('一次輸入多個（空白分隔）：拆成多個標籤各自新增', async () => {
    const wrapper = mount(SkillCapabilityEditor, { props: { modelValue: ['已存在'] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('標籤一 標籤二')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['已存在', '標籤一', '標籤二']])
  })

  it('輸入已經存在的標籤：不會重複加入', async () => {
    const wrapper = mount(SkillCapabilityEditor, { props: { modelValue: ['問題分類'] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('問題分類')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['問題分類']])
  })

  it('輸入框只有空白：不新增任何標籤，也不噴錯', async () => {
    const wrapper = mount(SkillCapabilityEditor, { props: { modelValue: [] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('   ')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('點標籤的移除按鈕：從清單移除該項', async () => {
    const wrapper = mount(SkillCapabilityEditor, { props: { modelValue: ['A', 'B', 'C'] } })
    const tags = wrapper.findAll('.sce-tag-chip')
    expect(tags.map(t => t.text())).toEqual(['#A close', '#B close', '#C close'])
    await tags[1].find('.sce-tag-remove').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['A', 'C']])
  })

  it('失焦（blur）時也會提交目前輸入框內容', async () => {
    const wrapper = mount(SkillCapabilityEditor, { props: { modelValue: [] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('打完沒按Enter')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['打完沒按Enter']])
  })
})
