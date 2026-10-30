import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SkillReviewCard from '@/components/Skill/SkillReviewCard.vue'
import { useSkillStore } from '@/stores/skillStore'

// 待審核區：技能描述獨立顯示在外層；其餘 RD 段落收在技能定義裡，預設收合（避免把通過／退回按鈕擠到下面），點標題展開
describe('SkillReviewCard：技能定義', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('待審核的技能都帶 RD 步驟，技能描述在外層，技能定義預設收合、點開後顯示其餘段落', async () => {
    const store = useSkillStore()
    expect(store.pendingReviewSkills.length).toBeGreaterThan(0)
    for (const skill of store.pendingReviewSkills) {
      expect(skill.steps?.length).toBeGreaterThan(0)
      const w = mount(SkillReviewCard, { props: { skill }, global: { stubs: { Teleport: true } } })
      expect(w.find('.src-description').text()).toBe(skill.description)
      expect(w.find('.src-definition').attributes('style')).toContain('display: none')
      await w.findAll('.src-section-label').find(l => l.text().includes('技能定義'))!.trigger('click')
      const def = w.find('.src-definition')
      expect(def.attributes('style') ?? '').not.toContain('display: none')
      for (const heading of ['步驟', '例外或特殊情況', '固定輸出格式', '適用範圍']) {
        expect(def.text()).toContain(heading)
      }
      expect(def.text()).not.toContain('技能描述')
      w.unmount()
    }
  })
})

describe('SkillReviewCard：送審資訊', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('標示技能來源，不顯示更新對象、AI 分析、技能指令與「查看完整詳情」', () => {
    const store = useSkillStore()
    const skill = store.pendingReviewSkills.find(s => s.derivedFrom)!
    const sourceName = store.flatSkills.find(s => s.id === skill.derivedFrom)!.name
    const w = mount(SkillReviewCard, { props: { skill }, global: { stubs: { Teleport: true } } })
    expect(w.find('.src-meta').text()).toContain(`技能來源：延伸自「${sourceName}」`)
    expect(w.find('.src-meta').text()).toContain(`送審說明：${skill.submitNote}`)
    expect(w.text()).not.toContain('更新對象')
    expect(w.text()).not.toContain('AI 分析')
    expect(w.text()).not.toContain('查看完整詳情')
    expect(w.text()).not.toContain('技能指令')
  })

  it('沒有來源的技能標示為自建', () => {
    const store = useSkillStore()
    const skill = store.pendingReviewSkills.find(s => !s.derivedFrom)!
    const w = mount(SkillReviewCard, { props: { skill }, global: { stubs: { Teleport: true } } })
    expect(w.find('.src-meta').text()).toContain('技能來源：自建')
  })

  it('更新版本標示要更新哪個範本：優先用送審時選的 updateTargetId，舊資料沒有就退回來源技能', () => {
    const store = useSkillStore()
    const skill = store.pendingReviewSkills.find(s => s.submitMode === 'version_update')!
    const fallbackName = store.flatSkills.find(s => s.id === skill.derivedFrom)!.name
    const w = mount(SkillReviewCard, { props: { skill }, global: { stubs: { Teleport: true } } })
    expect(w.find('.src-meta').text()).toContain(`更新範本：「${fallbackName}」`)
    expect(w.find('.src-meta').text()).not.toContain('範本名稱：')
    w.unmount()

    const other = store.flatSkills.find(s => s.zone !== 'personal' && s.id !== skill.derivedFrom)!
    const w2 = mount(SkillReviewCard, {
      props: { skill: { ...skill, updateTargetId: other.id } },
      global: { stubs: { Teleport: true } },
    })
    expect(w2.find('.src-meta').text()).toContain(`更新範本：「${other.name}」`)
  })

  it('建立新技能不顯示更新範本', () => {
    const store = useSkillStore()
    const skill = store.pendingReviewSkills.find(s => s.submitMode !== 'version_update')!
    const w = mount(SkillReviewCard, { props: { skill }, global: { stubs: { Teleport: true } } })
    expect(w.find('.src-meta').text()).not.toContain('更新範本')
  })
})
