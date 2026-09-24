import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SkillStudioDrawer from '@/components/Skill/SkillStudioDrawer.vue'

// SkillStudioDrawer 整個殼透過 <Teleport to="body"> 掛到 document.body，不在
// wrapper 的元素樹底下，wrapper.find() 找不到，比照 SkillEditor.enableGate.test.ts
// 等既有測試的作法改用 DOMWrapper 查 document.body；且 Teleport 出去的內容不會
// 隨 wrapper 卸載自動清掉，每個測試後手動 unmount 避免下一個測試撿到殘留內容
let currentWrapper: VueWrapper | null = null
const body = () => new DOMWrapper(document.body)

describe('SkillStudioDrawer', () => {
  beforeEach(() => setActivePinia(createPinia()))

  afterEach(() => {
    currentWrapper?.unmount()
    currentWrapper = null
  })

  it('open=false：不渲染面板內容', () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: false, query: {} } })
    currentWrapper = wrapper
    expect(body().find('.ssd-panel').exists()).toBe(false)
  })

  it('open=true：渲染面板、標題徽章、工作區', async () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: true, query: { method: 'chat' } } })
    currentWrapper = wrapper
    await wrapper.vm.$nextTick()
    expect(body().find('.ssd-panel').exists()).toBe(true)
    expect(body().find('.banner-title').text()).toBe('新增技能')
    expect(body().find('.SkillStudioChat').exists()).toBe(true)
  })

  it('點背景遮罩觸發 close', async () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: true, query: {} } })
    currentWrapper = wrapper
    await body().find('.ssd-mask').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('點右上角關閉鈕觸發 close', async () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: true, query: {} } })
    currentWrapper = wrapper
    await body().find('.ssd-close-btn').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('exposed isDirty 反映內部工作區的未儲存狀態；關閉時為 false', async () => {
    const wrapper = mount(SkillStudioDrawer, { props: { open: false, query: {} } })
    currentWrapper = wrapper
    expect((wrapper.vm as any).isDirty).toBe(false)
  })
})
