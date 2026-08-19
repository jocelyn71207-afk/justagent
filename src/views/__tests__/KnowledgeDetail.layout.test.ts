import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import KnowledgeDetail from '../KnowledgeDetail.vue'
import { useKnowledgeStore } from '@/stores/knowledgeStore'

async function mountDetail() {
  setActivePinia(createPinia())
  const knowledgeStore = useKnowledgeStore()
  const knowledgeId = knowledgeStore.knowledgeList[0].id
  const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div/>' } }] })
  const wrapper = mount(KnowledgeDetail, {
    props: { id: knowledgeId },
    global: {
      plugins: [router],
      stubs: { AppSkeleton: true, AppErrorState: true, AppBreadcrumb: true, CreateVersionModal: true, RestoreVersionModal: true, VersionCompareModal: true, ReviewDrawer: true, FilePreviewModal: true, ChunkPreviewTab: true, ConversionLogTab: true },
    },
  })
  await flushPromises()
  await new Promise(resolve => setTimeout(resolve, 600))
  return wrapper
}

describe('KnowledgeDetail 導覽列改版', () => {
  it('左側導覽列渲染 4 個項目，文字依序為概覽/版本歷程/分段預覽/轉換結果', async () => {
    const wrapper = await mountDetail()
    const items = wrapper.findAll('.detail-nav-item')
    expect(items.length).toBe(4)
    expect(items.map(i => i.find('span').text())).toEqual(['概覽', '版本歷程', '分段預覽', '轉換結果'])
  })

  it('點擊「版本歷程」導覽項目後，對應分頁內容變成可見', async () => {
    const wrapper = await mountDetail()
    const historyItem = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('版本歷程'))
    expect(historyItem).toBeTruthy()
    await historyItem!.trigger('click')
    const historyPanel = wrapper.find('.version-timeline').element.closest('.detail-tab-panel')
    expect(historyPanel?.className).toContain('is-active')
  })

  it('metadata 抽屜預設展開，點擊切換按鈕後隱藏，再點一次恢復', async () => {
    const wrapper = await mountDetail()
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(true)

    const toggleBtn = wrapper.findAll('button').find(b => b.text().includes('隱藏詳細資訊'))
    expect(toggleBtn).toBeTruthy()
    await toggleBtn!.trigger('click')
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(false)

    const reopenBtn = wrapper.findAll('button').find(b => b.text().includes('顯示詳細資訊'))
    expect(reopenBtn).toBeTruthy()
    await reopenBtn!.trigger('click')
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(true)
  })

  it('切換導覽項目時，metadata 抽屜不會被卸載', async () => {
    const wrapper = await mountDetail()
    const chunksItem = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('分段預覽'))
    await chunksItem!.trigger('click')
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(true)

    const conversionItem = wrapper.findAll('.detail-nav-item').find(i => i.text().includes('轉換結果'))
    await conversionItem!.trigger('click')
    expect(wrapper.find('.detail-metadata-drawer').exists()).toBe(true)
  })
})
