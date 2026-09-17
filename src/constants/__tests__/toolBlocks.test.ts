import { describe, it, expect } from 'vitest'
import { TOOL_BLOCK_META, isToolBlock } from '@/constants/toolBlocks'

describe('toolBlocks', () => {
  it('SKILL 是功能型 block，檔案類型不是', () => {
    expect(isToolBlock('SKILL')).toBe(true)
    expect(isToolBlock('HTML')).toBe(false)
    expect(isToolBlock('IMAGE')).toBe(false)
  })
  it('meta 提供 icon 與 label', () => {
    expect(TOOL_BLOCK_META.SKILL).toEqual({ icon: 'auto_fix_high', label: '技能建立' })
    expect(Object.keys(TOOL_BLOCK_META)).toEqual(['SKILL'])
  })
})
