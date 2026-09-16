import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkillBlockComposer from '@/components/Skill/SkillBlockComposer.vue'

function mountComposer(over: Partial<Record<string, unknown>> = {}) {
  return mount(SkillBlockComposer, {
    props: { name: '', description: '', sectionIds: [], ...over },
    global: { directives: { tooltip: {} } },
  })
}

describe('SkillBlockComposer', () => {
  it('名稱／說明輸入 emit update:name / update:description', async () => {
    const w = mountComposer()
    await w.find('.sbc-name-input').setValue('行銷週報')
    await w.find('.sbc-desc-input').setValue('每週一')
    expect(w.emitted('update:name')?.[0]).toEqual(['行銷週報'])
    expect(w.emitted('update:description')?.[0]).toEqual(['每週一'])
  })

  it('積木庫三個分類、計數 n/總數；點＋ emit 加入；已加入顯示 check 且再點不重複', async () => {
    const w = mountComposer({ sectionIds: ['promo_kpi'] })
    const cats = w.findAll('.sbc-category')
    expect(cats).toHaveLength(3)
    expect(cats[1].find('.sbc-category-count').text()).toBe('1/7')
    const added = w.find('.sbc-palette-item.added')
    expect(added.text()).toContain('促銷核心 KPI')
    expect(added.find('.sbc-add-btn i').text()).toBe('check')
    await added.find('.sbc-add-btn').trigger('click')
    expect(w.emitted('update:sectionIds')).toBeUndefined()
    const other = w.findAll('.sbc-palette-item').find(i => i.text().includes('性別分布'))!
    await other.find('.sbc-add-btn').trigger('click')
    expect(w.emitted('update:sectionIds')?.[0]).toEqual([['promo_kpi', 'ta_gender']])
  })

  it('已選清單依序顯示、可移除；空清單顯示提示', async () => {
    const w = mountComposer({ sectionIds: ['ta_gender', 'promo_kpi'] })
    expect(w.findAll('.sbc-list .sbc-item-name').map(n => n.text())).toEqual(['性別分布', '促銷核心 KPI'])
    await w.findAll('.sbc-remove')[0].trigger('click')
    expect(w.emitted('update:sectionIds')?.[0]).toEqual([['promo_kpi']])
    const empty = mountComposer()
    expect(empty.find('.sbc-empty').text()).toContain('還沒有章節')
  })

  it('拖曳排序：drop 在目標上半部插到前面，下半部插到後面', async () => {
    const w = mountComposer({ sectionIds: ['ta_gender', 'promo_kpi', 'ch_kpi'] })
    const items = w.findAll('.sbc-item')
    await items[2].trigger('dragstart', { dataTransfer: { setData() {}, effectAllowed: '' } })
    const rect = { top: 0, height: 40 }
    ;(items[0].element as HTMLElement).getBoundingClientRect = () => rect as DOMRect
    await items[0].trigger('dragover', { clientY: 5 })
    await items[0].trigger('drop')
    expect(w.emitted('update:sectionIds')?.at(-1)).toEqual([['ch_kpi', 'ta_gender', 'promo_kpi']])
  })

  it('nameConflict 顯示提示條；compact 加 is-compact', () => {
    expect(mountComposer({ nameConflict: true }).find('.name-conflict-banner').exists()).toBe(true)
    expect(mountComposer({ compact: true }).classes()).toContain('is-compact')
  })
})
