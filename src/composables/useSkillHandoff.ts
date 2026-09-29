import type { SkillDraft } from './useSkillStudioConversation'

// 對話河道（如 conv4）建議建立成個人技能、使用者按「是」後，交給 AI 賦能
// （SkillStudio）的一次性交接資料。流程：build() 先把這份資料放進這裡，
// 再 router.push 過去；SkillStudio 掛載時讀走並清空——避免重新整理頁面、
// 或之後單純用 ?from= 再次進站時，被舊的交接資料誤套用。

export interface SkillHandoffOrigin {
  conversationId: string
  reason: string
}

export interface SkillHandoff {
  prefill: Partial<SkillDraft>
  openingMessage: string
  origin: SkillHandoffOrigin
}

let pending: SkillHandoff | null = null

export function setSkillHandoff(handoff: SkillHandoff): void {
  pending = handoff
}

// 讀完即清空
export function consumeSkillHandoff(): SkillHandoff | null {
  const h = pending
  pending = null
  return h
}
