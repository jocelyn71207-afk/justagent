import { useAiviewerStore } from '@/stores/AiViewerStore'
import type { SkillDraft } from '@/composables/useSkillStudioConversation'

// 專案內由 Agent 發起「這個流程要不要建立成個人技能？」的可重用流程。
// 使用者按「是」→ 直接在畫布放上一個已預填的技能建立 block（SKILL），
// 確認、調整、儲存、測試都在 block 內完成；河道只回一則「已放上區塊」。
// 任何 convN 腳本只要提供自己的 push/scroll/conversationId，就能一行 offer()；
// 按鈕點擊由 AiViewerRightBox 的 handleChatAreaClick 事件委派轉進 handleAction()。

export interface SkillSuggestion {
  id: string          // 一則建議一個 id，one-shot 旗標以此為 key
  name: string
  description: string
  triggerHint: string
  steps: string[]     // 依序編號組成 instructions，同時每步轉成一項覆蓋能力
  reason: string      // 「我留意到「{reason}」這類流程…」
}

export type SkillSuggestStage = 'ask' | 'placed' | 'skipped'

export interface SuggestionCtx {
  push: (msg: any) => void
  scroll: () => void
  conversationId: string   // 寫進 block 的 origin，讓 block 知道自己從哪段對話長出來
}

interface SuggestionState {
  ctx: SuggestionCtx
  suggestion: SkillSuggestion
  choiceMade: boolean      // build／skip 二擇一
}

export const SKILL_SUGGEST_ACTIONS = {
  build: 'skill-suggest-build',
  skip: 'skill-suggest-skip',
} as const

export function suggestionToPrefill(s: SkillSuggestion): Partial<SkillDraft> {
  return {
    name: s.name,
    description: s.description,
    triggerHint: s.triggerHint,
    instructions: s.steps.map((step, i) => `${i + 1}. ${step}`).join('\n'),
    capabilities: s.steps.map(step => ({ name: step, description: '' })),
  }
}

export function suggestionOpeningMessage(s: SkillSuggestion): string {
  return `這顆技能來自本對話的「${s.reason}」流程，設定我先填好了。想調整就直接說，確認後按「儲存為個人技能」。`
}

export function useSkillSuggestion() {
  const aiviewerStore = useAiviewerStore()
  const states = new Map<string, SuggestionState>()

  function offer(ctx: SuggestionCtx, suggestion: SkillSuggestion): void {
    states.set(suggestion.id, { ctx, suggestion, choiceMade: false })
    ctx.push({ agent: 'brain', cardType: 'skillSuggest', suggestion, stage: 'ask' as SkillSuggestStage })
    ctx.scroll()
  }

  function build(st: SuggestionState) {
    if (st.choiceMade) return
    st.choiceMade = true
    st.ctx.push({ forUser: true, msg: '是，建立成個人技能' })
    st.ctx.scroll()
    const s = st.suggestion
    const blockId = aiviewerStore.addSkillBuilderBlock({
      prefill: suggestionToPrefill(s),
      openingMessage: suggestionOpeningMessage(s),
      origin: { conversationId: st.ctx.conversationId, reason: s.reason },
    })
    setTimeout(() => {
      st.ctx.push({
        agent: 'brain',
        cardType: 'skillSuggest',
        suggestion: s,
        stage: 'placed' as SkillSuggestStage,
        blockId,
        finishResponse: true,
      })
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

  function handleAction(action: string, suggestionId: string): boolean {
    if (!action.startsWith('skill-suggest-')) return false
    const st = states.get(suggestionId)
    if (!st) return false
    if (action === SKILL_SUGGEST_ACTIONS.build) build(st)
    else if (action === SKILL_SUGGEST_ACTIONS.skip) skip(st)
    else return false
    return true
  }

  function reset(suggestionId: string): void {
    states.delete(suggestionId)
  }

  return { offer, handleAction, reset }
}
