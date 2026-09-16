import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useSkillStore } from '@/stores/skillStore'
import { useSkillSuggestion } from '@/composables/useSkillSuggestion'
import type { SkillSuggestion } from '@/composables/useSkillSuggestion'

const SUGGESTION: SkillSuggestion = {
  id: 'conv4-sales-report',
  name: '產品銷售報告整理',
  description: '查詢指定月份產品銷售數據，並依三諾產品部輸出報告規範自動產出報告',
  triggerHint: '偵測到「查詢銷售資料＋套用部門報告規範」類型的整理需求',
  steps: ['查詢指定月份產品銷售數據', '套用三諾產品部輸出報告規範自動產出報告'],
  reason: '查詢銷售資料＋套用部門報告規範',
}

function makeCtx() {
  const msgs: any[] = []
  return { msgs, ctx: { push: (m: any) => msgs.push(m), scroll: vi.fn() } }
}

describe('useSkillSuggestion', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('offer 推入一則 brain 的 ask 卡片', () => {
    const { msgs, ctx } = makeCtx()
    useSkillSuggestion().offer(ctx, SUGGESTION)
    expect(msgs).toHaveLength(1)
    expect(msgs[0]).toMatchObject({ agent: 'brain', cardType: 'skillSuggest', stage: 'ask' })
    expect(msgs[0].suggestion.id).toBe('conv4-sales-report')
    expect(ctx.scroll).toHaveBeenCalled()
  })

  it('build：推使用者回聲，500ms 後推 preview 卡', () => {
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-build', SUGGESTION.id)).toBe(true)
    expect(msgs[1]).toMatchObject({ forUser: true, msg: '是，建立成個人技能' })
    vi.advanceTimersByTime(500)
    expect(msgs[2]).toMatchObject({ cardType: 'skillSuggest', stage: 'preview' })
  })

  it('confirm：真的建立個人技能（ai_assisted、步驟編號成指令），推 saved 卡帶 skillId', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(s.handleAction('skill-suggest-confirm', SUGGESTION.id)).toBe(true)
    vi.advanceTimersByTime(500)
    expect(store.myPersonalSkills.length).toBe(before + 1)
    const created = store.myPersonalSkills[0]
    expect(created.name).toBe('產品銷售報告整理')
    expect(created.creationMethod).toBe('ai_assisted')
    expect(created.zone).toBe('personal')
    expect(created.instructions).toBe('1. 查詢指定月份產品銷售數據\n2. 套用三諾產品部輸出報告規範自動產出報告')
    expect(created.triggerHint).toBe(SUGGESTION.triggerHint)
    expect(created.capabilities?.map(c => c.name)).toEqual(SUGGESTION.steps)
    const saved = msgs.at(-1)
    expect(saved).toMatchObject({ cardType: 'skillSuggest', stage: 'saved', finishResponse: true, skillId: created.id })
  })

  it('skip：推使用者回聲與婉拒訊息；之後 build 無效（one-shot）', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-skip', SUGGESTION.id)).toBe(true)
    vi.advanceTimersByTime(500)
    expect(msgs.at(-1).msg).toContain('好的')
    const len = msgs.length
    expect(s.handleAction('skill-suggest-build', SUGGESTION.id)).toBe(true) // 有攔到，但不做事
    vi.advanceTimersByTime(500)
    expect(msgs.length).toBe(len)
    expect(store.myPersonalSkills.length).toBe(before)
  })

  it('confirm 只會建立一次；reset 後可重播整個流程', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const { ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    s.handleAction('skill-suggest-confirm', SUGGESTION.id)
    s.handleAction('skill-suggest-confirm', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(store.myPersonalSkills.length).toBe(before + 1)

    s.reset(SUGGESTION.id)
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    s.handleAction('skill-suggest-confirm', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(store.myPersonalSkills.length).toBe(before + 2)
  })

  it('skip 之後 confirm 無效：不建立技能、不推 saved 卡', () => {
    const store = useSkillStore()
    const before = store.myPersonalSkills.length
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-skip', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    const len = msgs.length
    const skillCount = store.myPersonalSkills.length
    expect(s.handleAction('skill-suggest-confirm', SUGGESTION.id)).toBe(true)
    vi.advanceTimersByTime(500)
    expect(msgs.length).toBe(len)
    expect(store.myPersonalSkills.length).toBe(skillCount)
    expect(store.myPersonalSkills.length).toBe(before)
    expect(msgs.some(m => m.stage === 'saved')).toBe(false)
  })

  it('非 skill-suggest- 開頭的 action 或未知 id 回 false', () => {
    const s = useSkillSuggestion()
    expect(s.handleAction('conv7-satisfied', 'x')).toBe(false)
    expect(s.handleAction('skill-suggest-build', 'never-offered')).toBe(false)
  })
})
