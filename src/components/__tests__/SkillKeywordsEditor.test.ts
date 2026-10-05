import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillKeywordsEditor from '../Skill/SkillKeywordsEditor.vue'

// 跟 SkillCapabilityEditor 同一套 hashtag 標籤輸入規則（不支援空白、不限字數、
// 可以多個），差別只在沒有常見範本那排 chip
describe('SkillKeywordsEditor', () => {
  it('沒有任何關鍵字時，不顯示標籤清單', () => {
    const wrapper = mount(SkillKeywordsEditor, { props: { modelValue: [] } })
    expect(wrapper.find('.sce-tag-list').exists()).toBe(false)
  })

  it('不顯示常見範本（跟覆蓋能力不同，關鍵字沒有預設清單）', () => {
    const wrapper = mount(SkillKeywordsEditor, { props: { modelValue: [] } })
    expect(wrapper.find('.sce-presets').exists()).toBe(false)
    expect(wrapper.find('.sce-preset-chip').exists()).toBe(false)
  })

  it('輸入框打字按 Enter：新增一個關鍵字，清空輸入框', async () => {
    const wrapper = mount(SkillKeywordsEditor, { props: { modelValue: [] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('週報')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['週報']])
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('一次輸入多個（空白分隔）：拆成多個關鍵字各自新增', async () => {
    const wrapper = mount(SkillKeywordsEditor, { props: { modelValue: ['已存在'] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('關鍵字一 關鍵字二')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['已存在', '關鍵字一', '關鍵字二']])
  })

  it('輸入已經存在的關鍵字：不會重複加入', async () => {
    const wrapper = mount(SkillKeywordsEditor, { props: { modelValue: ['週報'] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('週報')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['週報']])
  })

  it('輸入框只有空白：不新增任何關鍵字，也不噴錯', async () => {
    const wrapper = mount(SkillKeywordsEditor, { props: { modelValue: [] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('   ')
    await input.trigger('keydown.enter')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('點標籤的移除按鈕：從清單移除該項', async () => {
    const wrapper = mount(SkillKeywordsEditor, { props: { modelValue: ['A', 'B', 'C'] } })
    const tags = wrapper.findAll('.sce-tag-chip')
    await tags[1].find('.sce-tag-remove').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['A', 'C']])
  })

  it('失焦（blur）時也會提交目前輸入框內容', async () => {
    const wrapper = mount(SkillKeywordsEditor, { props: { modelValue: [] } })
    const input = wrapper.find('.sce-tag-input')
    await input.setValue('打完沒按Enter')
    await input.trigger('blur')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([['打完沒按Enter']])
  })
})
