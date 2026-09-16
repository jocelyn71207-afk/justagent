import { describe, it, expect } from 'vitest'
import { TOOL_BLOCK_META, isToolBlock } from '@/constants/toolBlocks'

describe('toolBlocks', () => {
  it('REPORT 與 SKILL 是功能型 block，檔案類型不是', () => {
    expect(isToolBlock('REPORT')).toBe(true)
    expect(isToolBlock('SKILL')).toBe(true)
    expect(isToolBlock('HTML')).toBe(false)
    expect(isToolBlock('IMAGE')).toBe(false)
  })
  it('meta 提供 icon 與 label', () => {
    expect(TOOL_BLOCK_META.REPORT).toEqual({ icon: 'bar_chart', label: '報告組裝' })
    expect(TOOL_BLOCK_META.SKILL).toEqual({ icon: 'auto_fix_high', label: '技能建立' })
  })
})
