import { describe, it, expect } from 'vitest'
import { setSkillHandoff, consumeSkillHandoff } from '@/composables/useSkillHandoff'
import type { SkillHandoff } from '@/composables/useSkillHandoff'

const HANDOFF: SkillHandoff = {
  prefill: { name: '產品銷售報告整理', instructions: '1. 查詢資料' },
  openingMessage: '這顆技能來自本對話的「查詢銷售資料」流程，設定我先填好了。',
  origin: { conversationId: 'conv4', reason: '查詢銷售資料＋套用部門報告規範' },
}

describe('useSkillHandoff：對話河道 → AI 賦能的一次性交接', () => {
  it('setSkillHandoff 後 consumeSkillHandoff 能取回同一份資料', () => {
    setSkillHandoff(HANDOFF)
    expect(consumeSkillHandoff()).toEqual(HANDOFF)
  })

  it('consumeSkillHandoff 讀完即清空：連續呼叫第二次拿到 null', () => {
    setSkillHandoff(HANDOFF)
    consumeSkillHandoff()
    expect(consumeSkillHandoff()).toBeNull()
  })

  it('沒有交接資料時回 null', () => {
    expect(consumeSkillHandoff()).toBeNull()
  })
})
