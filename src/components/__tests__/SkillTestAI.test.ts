import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SkillTestAI from '@/components/Skill/SkillTestAI.vue'
import { useSkillStore } from '@/stores/skillStore'

describe('SkillTestAI：AI 出題、使用者判斷該不該觸發的選擇題', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始空狀態：顯示「生成測試情境」按鈕', () => {
    const w = mount(SkillTestAI, { props: { skillId: 'sys-cs-001' } })
    expect(w.find('.ai-idle-hint').exists()).toBe(true)
    const btn = w.find('button')
    expect(btn.text()).toContain('生成測試情境')
  })

  it('點「生成測試情境」：每張情境卡顯示題目、問句，以及「該觸發」「不該觸發」兩個按鈕', async () => {
    const w = mount(SkillTestAI, { props: { skillId: 'sys-cs-001' } })
    await w.find('button').trigger('click')
    await new Promise(r => setTimeout(r, 950))
    await w.vm.$nextTick()

    const cards = w.findAll('.scenario-card')
    expect(cards.length).toBeGreaterThanOrEqual(6)
    const first = cards[0]
    expect(first.text()).toContain('這句話該不該觸發這顆技能？')
    const btns = first.findAll('.scenario-answer-btns button')
    expect(btns.map(b => b.text())).toEqual(['該觸發', '不該觸發'])
    expect(w.find('.ai-report').exists()).toBe(false)
  }, 10000)

  it('答對：卡片顯示「答對了」，答案按鈕消失', async () => {
    const store = useSkillStore()
    const w = mount(SkillTestAI, { props: { skillId: 'sys-cs-001' } })
    await store.generateAITestScenarios('sys-cs-001')
    await w.vm.$nextTick()

    const sc = store.aiTestScenarios[0]
    const card = w.findAll('.scenario-card')[0]
    const correctBtnIndex = sc.expectedTrigger ? 0 : 1
    await card.findAll('.scenario-answer-btns button')[correctBtnIndex].trigger('click')
    await w.vm.$nextTick()

    expect(card.find('.scenario-answer-btns').exists()).toBe(false)
    expect(card.text()).toContain('答對了')
    expect(card.text()).toContain(sc.expectedTrigger ? '該觸發' : '不該觸發')
  }, 10000)

  it('答錯：卡片顯示「答錯了」與正確答案說明', async () => {
    const store = useSkillStore()
    const w = mount(SkillTestAI, { props: { skillId: 'sys-cs-001' } })
    await store.generateAITestScenarios('sys-cs-001')
    await w.vm.$nextTick()

    const sc = store.aiTestScenarios[0]
    const card = w.findAll('.scenario-card')[0]
    // 選跟正確答案相反的按鈕
    const wrongBtnIndex = sc.expectedTrigger ? 1 : 0
    await card.findAll('.scenario-answer-btns button')[wrongBtnIndex].trigger('click')
    await w.vm.$nextTick()

    expect(card.text()).toContain('答錯了')
    expect(card.text()).toContain(sc.expectedBehavior)
  }, 10000)

  it('全部答完後顯示測試報告：答對題數、分類統計、總結文字', async () => {
    const store = useSkillStore()
    const w = mount(SkillTestAI, { props: { skillId: 'sys-cs-001' } })
    await store.generateAITestScenarios('sys-cs-001')
    await w.vm.$nextTick()

    for (const sc of [...store.aiTestScenarios]) {
      store.answerAITestScenario('sys-cs-001', sc.id, sc.expectedTrigger)
    }
    await w.vm.$nextTick()

    const report = w.find('.ai-report')
    expect(report.exists()).toBe(true)
    expect(report.text()).toContain(`${store.aiTestScenarios.length} / ${store.aiTestScenarios.length} 答對`)
    expect(report.text()).toContain('100%')
    expect(w.find('.report-summary').text()).toBeTruthy()
  }, 10000)

  it('「重新生成」會清空已作答的情境重新出題', async () => {
    const store = useSkillStore()
    const w = mount(SkillTestAI, { props: { skillId: 'sys-cs-001' } })
    await store.generateAITestScenarios('sys-cs-001')
    store.answerAITestScenario('sys-cs-001', store.aiTestScenarios[0].id, store.aiTestScenarios[0].expectedTrigger)
    await w.vm.$nextTick()
    expect(w.findAll('.status-badge').length).toBeGreaterThan(0)

    await w.find('.ai-toolbar button').trigger('click')
    await new Promise(r => setTimeout(r, 950))
    await w.vm.$nextTick()

    expect(store.aiTestScenarios.every(s => s.status === 'pending')).toBe(true)
    expect(w.find('.status-badge').exists()).toBe(false)
  }, 10000)
})
