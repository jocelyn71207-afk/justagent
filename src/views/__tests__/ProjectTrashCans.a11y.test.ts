import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ProjectTrashCans from '../ProjectTrashCans.vue'

// 元件內使用 useRoute() 取得 query，測試環境無真實 router，故最小化 mock route
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}))

describe('ProjectTrashCans 可及性', () => {
  it('「更多選項」觸發元素是可聚焦的 <button> 且有 aria-label', async () => {
    setActivePinia(createPinia())
    const wrapper = mount(ProjectTrashCans, {
      global: { stubs: { AppBreadcrumb: true, compDropDown: true } },
    })
    // 假資料透過 onMounted 非同步寫入，需等待下一輪 tick 讓畫面更新
    await nextTick()
    const moreBtn = wrapper.find('.more-btn')
    expect(moreBtn.element.tagName).toBe('BUTTON')
    expect(moreBtn.attributes('aria-label')).toBeTruthy()
  })
})
