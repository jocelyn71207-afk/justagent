import type { BlockType } from '@/types/AiViewer'

export interface ToolBlockMeta {
  icon: string   // Material Symbols icon 名稱
  label: string
}

// 功能型 block：畫布上「可操作的工具」而不是「一份檔案」。
// 工具箱項目、block header 徽章都從這裡取 icon／label，單一來源
export const TOOL_BLOCK_META: Partial<Record<BlockType, ToolBlockMeta>> = {
  REPORT: { icon: 'bar_chart', label: '報告組裝' },
  SKILL: { icon: 'auto_fix_high', label: '技能建立' },
}

export function isToolBlock(type: BlockType): boolean {
  return type in TOOL_BLOCK_META
}
