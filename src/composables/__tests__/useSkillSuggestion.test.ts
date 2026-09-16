import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAiviewerStore } from '@/stores/AiViewerStore'
import { useSkillStore } from '@/stores/skillStore'
import { useSkillSuggestion, suggestionToPrefill, suggestionOpeningMessage } from '@/composables/useSkillSuggestion'
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
  return { msgs, ctx: { push: (m: any) => msgs.push(m), scroll: vi.fn(), conversationId: 'conv4' } }
}

describe('suggestionToPrefill / suggestionOpeningMessage', () => {
  it('步驟編號成指令、每步一項能力；開場訊息含 reason', () => {
    const p = suggestionToPrefill(SUGGESTION)
    expect(p.name).toBe('產品銷售報告整理')
    expect(p.description).toBe(SUGGESTION.description)
    expect(p.triggerHint).toBe(SUGGESTION.triggerHint)
    expect(p.instructions).toBe('1. 查詢指定月份產品銷售數據\n2. 套用三諾產品部輸出報告規範自動產出報告')
    expect(p.capabilities?.map(c => c.name)).toEqual(SUGGESTION.steps)
    expect(suggestionOpeningMessage(SUGGESTION)).toBe('這顆技能來自本對話的「查詢銷售資料＋套用部門報告規範」流程，設定我先填好了。想調整就直接說，確認後按「儲存為個人技能」。')
  })
})

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
    expect(ctx.scroll).toHaveBeenCalled()
  })

  it('build：推使用者回聲、畫布放上預填的 SKILL block（含 origin）、500ms 後推 placed 卡帶 blockId；不建立技能', () => {
    const aiviewer = useAiviewerStore()
    const skills = useSkillStore()
    const blocksBefore = aiviewer.aiViewerBlocks.length
    const skillsBefore = skills.myPersonalSkills.length
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-build', SUGGESTION.id)).toBe(true)
    expect(msgs[1]).toMatchObject({ forUser: true, msg: '是，建立成個人技能' })
    expect(aiviewer.aiViewerBlocks.length).toBe(blocksBefore + 1)
    const block = aiviewer.aiViewerBlocks.find((b: any) => b.data.blockType === 'SKILL')
    expect(block.blockName).toBe('產品銷售報告整理')
    expect(block.data.data.origin).toEqual({ conversationId: 'conv4', reason: SUGGESTION.reason })
    expect(block.data.data.snapshot.draft.instructions).toContain('1. 查詢指定月份產品銷售數據')
    expect(block.data.data.snapshot.messages[0].content).toBe(suggestionOpeningMessage(SUGGESTION))
    vi.advanceTimersByTime(500)
    expect(msgs[2]).toMatchObject({ cardType: 'skillSuggest', stage: 'placed', blockId: block.id, finishResponse: true })
    expect(skills.myPersonalSkills.length).toBe(skillsBefore)
  })

  it('skip：推回聲與婉拒訊息；之後 build 無效（one-shot）', () => {
    const aiviewer = useAiviewerStore()
    const before = aiviewer.aiViewerBlocks.length
    const { msgs, ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-skip', SUGGESTION.id)).toBe(true)
    vi.advanceTimersByTime(500)
    expect(msgs.at(-1).msg).toContain('好的')
    const len = msgs.length
    expect(s.handleAction('skill-suggest-build', SUGGESTION.id)).toBe(true)
    vi.advanceTimersByTime(500)
    expect(msgs.length).toBe(len)
    expect(aiviewer.aiViewerBlocks.length).toBe(before)
  })

  it('build 只放一個 block；reset 後可重播', () => {
    const aiviewer = useAiviewerStore()
    const before = aiviewer.aiViewerBlocks.length
    const { ctx } = makeCtx()
    const s = useSkillSuggestion()
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(aiviewer.aiViewerBlocks.length).toBe(before + 1)
    s.reset(SUGGESTION.id)
    s.offer(ctx, SUGGESTION)
    s.handleAction('skill-suggest-build', SUGGESTION.id)
    vi.advanceTimersByTime(500)
    expect(aiviewer.aiViewerBlocks.length).toBe(before + 2)
  })

  it('非 skill-suggest- 前綴、未知 id、或已移除的 confirm 動作回 false', () => {
    const { ctx } = makeCtx()
    const s = useSkillSuggestion()
    expect(s.handleAction('conv7-satisfied', 'x')).toBe(false)
    expect(s.handleAction('skill-suggest-build', 'never-offered')).toBe(false)
    s.offer(ctx, SUGGESTION)
    expect(s.handleAction('skill-suggest-confirm', SUGGESTION.id)).toBe(false)
  })
})
