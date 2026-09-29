import { describe, it, expect, beforeEach } from 'vitest'
import { mount, DOMWrapper } from '@vue/test-utils'
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

  it('100% 通過時顯示「啟用技能」按鈕；未 100% 或尚未測試時不顯示', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    const wrapper = mount(SkillTestAI, { props: { skillId: id } })

    expect(wrapper.find('.ai-enable-btn').exists()).toBe(false) // 還沒生成測試情境

    await store.generateAITestScenarios(id)
    await wrapper.vm.$nextTick()
    const scenarios = [...store.aiTestScenarios]
    expect(scenarios.length).toBeGreaterThan(1) // 這個測試要故意答錯至少一題，情境數要夠

    // 除了最後一題以外全部故意答錯，確定 correct !== total（不會意外全對）
    for (let i = 0; i < scenarios.length - 1; i++) {
      store.answerAITestScenario(id, scenarios[i].id, !scenarios[i].expectedTrigger)
    }
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.ai-enable-btn').exists()).toBe(false) // 還有題目 pending，aiTestReport 仍是 null

    store.answerAITestScenario(id, scenarios.at(-1)!.id, scenarios.at(-1)!.expectedTrigger)
    await wrapper.vm.$nextTick()
    expect(store.aiTestReport!.correct).not.toBe(store.aiTestReport!.total) // 確認這次真的不是 100%
    expect(wrapper.find('.ai-enable-btn').exists()).toBe(false)
  })

  it('100% 全對：顯示啟用按鈕，點擊走 SkillEnableFlow 並在確認後呼叫 setAssignedAgents + toggleSkill', async () => {
    const store = useSkillStore()
    const id = store.createPersonalSkill({ name: '待測技能2', instructions: 'x', triggerHint: 'y', assignedAgents: [] })
    await store.generateAITestScenarios(id)
    for (const sc of [...store.aiTestScenarios]) {
      store.answerAITestScenario(id, sc.id, sc.expectedTrigger) // 全部答對
    }
    expect(store.aiTestReport!.correct).toBe(store.aiTestReport!.total)

    const wrapper = mount(SkillTestAI, { props: { skillId: id } })
    await wrapper.vm.$nextTick()

    const enableBtn = wrapper.find('.ai-enable-btn')
    expect(enableBtn.exists()).toBe(true)
    await enableBtn.trigger('click')
    await wrapper.vm.$nextTick()

    const agentDialog = new DOMWrapper(document.body).find('.enable-agent-dialog')
    expect(agentDialog.exists()).toBe(true) // 100% 直接進 Agent 確認，不會看到閘門失敗對話框
    await agentDialog.findAll('.se-agent-chip').find(c => c.text().includes('通用助理'))!.trigger('click')
    await agentDialog.findAll('button').find(b => b.text().includes('確認並啟用'))!.trigger('click')

    expect(store.findSkill(id)!.isEnabled).toBe(true)
    expect(store.findSkill(id)!.assignedAgents).toEqual(['通用助理'])
  })
})
