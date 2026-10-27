import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SkillReviewCard from '@/components/Skill/SkillReviewCard.vue'
import { useSkillStore } from '@/stores/skillStore'

// 待審核區：審核卡片帶 RD 技能定義，預設收合（避免把通過／退回按鈕擠到下面），點標題展開
describe('SkillReviewCard：技能定義', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('待審核的技能都帶 RD 步驟，技能定義預設收合、點開後顯示六段', async () => {
    const store = useSkillStore()
    expect(store.pendingReviewSkills.length).toBeGreaterThan(0)
    for (const skill of store.pendingReviewSkills) {
      expect(skill.steps?.length).toBeGreaterThan(0)
      const w = mount(SkillReviewCard, { props: { skill }, global: { stubs: { Teleport: true } } })
      expect(w.find('.src-definition').attributes('style')).toContain('display: none')
      await w.find('.src-section-label').trigger('click')
      const def = w.find('.src-definition')
      expect(def.attributes('style') ?? '').not.toContain('display: none')
      for (const heading of ['技能描述', '步驟', '例外或特殊情況', '固定輸出格式', '適用範圍']) {
        expect(def.text()).toContain(heading)
      }
      w.unmount()
    }
  })
})
