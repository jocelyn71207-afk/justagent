import type { BlockType } from '@/types/AiViewer'

export interface ToolBlockMeta {
  icon: string   // Material Symbols icon 名稱
  label: string
}

// 功能型 block：目前只有 SKILL
// 工具箱項目、block header 徽章都從這裡取 icon／label，單一來源
export const TOOL_BLOCK_META: Partial<Record<BlockType, ToolBlockMeta>> = {
  SKILL: { icon: 'auto_fix_high', label: '技能建立' },
}

export function isToolBlock(type: BlockType): boolean {
  return type in TOOL_BLOCK_META
}
