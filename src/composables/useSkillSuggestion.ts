import { useSkillStore } from '@/stores/skillStore'

// 專案內由 Agent 發起「這個流程要不要建立成個人技能？」的可重用流程。
// 任何 convN 腳本只要提供自己的 push/scroll，就能一行 offer()；按鈕點擊由
// AiViewerRightBox 的 handleChatAreaClick 事件委派轉進 handleAction()。
// 卡片本體是 SkillSuggestCard.vue（cardType: 'skillSuggest'）。

export interface SkillSuggestion {
  id: string          // 一則建議一個 id，one-shot 旗標以此為 key
  name: string
  description: string
  triggerHint: string
  steps: string[]     // 依序編號組成 instructions，同時每步轉成一項覆蓋能力
  reason: string      // 「我留意到「{reason}」這類流程…」
}

export type SkillSuggestStage = 'ask' | 'preview' | 'saved' | 'skipped'

export interface SuggestionCtx {
  push: (msg: any) => void
  scroll: () => void
}

interface SuggestionState {
  ctx: SuggestionCtx
  suggestion: SkillSuggestion
  choiceMade: boolean
  confirmed: boolean
}

export const SKILL_SUGGEST_ACTIONS = {
  build: 'skill-suggest-build',
  skip: 'skill-suggest-skip',
  confirm: 'skill-suggest-confirm',
} as const

export function useSkillSuggestion() {
  const store = useSkillStore()
  const states = new Map<string, SuggestionState>()

  function offer(ctx: SuggestionCtx, suggestion: SkillSuggestion): void {
    states.set(suggestion.id, { ctx, suggestion, choiceMade: false, confirmed: false })
    ctx.push({ agent: 'brain', cardType: 'skillSuggest', suggestion, stage: 'ask' as SkillSuggestStage })
    ctx.scroll()
  }

  function build(st: SuggestionState) {
    if (st.choiceMade) return
    st.choiceMade = true
    st.ctx.push({ forUser: true, msg: '是，建立成個人技能' })
    st.ctx.scroll()
    setTimeout(() => {
      st.ctx.push({ agent: 'brain', cardType: 'skillSuggest', suggestion: st.suggestion, stage: 'preview' as SkillSuggestStage })
      st.ctx.scroll()
    }, 500)
  }

  function skip(st: SuggestionState) {
    if (st.choiceMade) return
    st.choiceMade = true
    st.ctx.push({ forUser: true, msg: '不用了' })
    st.ctx.scroll()
    setTimeout(() => {
      st.ctx.push({ agent: 'brain', msg: '好的，這次的結果已保留在畫布中，之後有需要再跟我說一聲！' })
      st.ctx.scroll()
    }, 500)
  }

  function confirm(st: SuggestionState) {
    if (!st.choiceMade || st.confirmed) return
    st.confirmed = true
    st.ctx.push({ forUser: true, msg: '確認並建立' })
    st.ctx.scroll()
    const s = st.suggestion
    const skillId = store.createPersonalSkill({
      name: s.name,
      description: s.description,
      instructions: s.steps.map((step, i) => `${i + 1}. ${step}`).join('\n'),
      triggerHint: s.triggerHint,
      isEnabled: true,
      assignedAgents: [],
      capabilities: s.steps.map(step => ({ name: step, description: '' })),
      creationMethod: 'ai_assisted',
    })
    setTimeout(() => {
      st.ctx.push({
        agent: 'brain',
        cardType: 'skillSuggest',
        suggestion: s,
        stage: 'saved' as SkillSuggestStage,
        skillId,
        finishResponse: true,
      })
      st.ctx.scroll()
    }, 500)
  }

  function handleAction(action: string, suggestionId: string): boolean {
    if (!action.startsWith('skill-suggest-')) return false
    const st = states.get(suggestionId)
    if (!st) return false
    if (action === SKILL_SUGGEST_ACTIONS.build) build(st)
    else if (action === SKILL_SUGGEST_ACTIONS.skip) skip(st)
    else if (action === SKILL_SUGGEST_ACTIONS.confirm) confirm(st)
    return true
  }

  function reset(suggestionId: string): void {
    states.delete(suggestionId)
  }

  return { offer, handleAction, reset }
}
