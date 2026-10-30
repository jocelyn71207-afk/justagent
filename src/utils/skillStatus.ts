import type { Skill } from '@/stores/skillStore'

// 技能狀態只有啟用中／停用中，卡片／詳情抽屜／AI 賦能預覽共用同一套用詞。
// 「測過沒」不算狀態，另外用 skillTested() 標註（見 SkillTestMark）；審核中是
// 另一層（personalStatus），也用標籤另外標，都不混在狀態文字裡
export type SkillEnableStatus = '啟用中' | '停用中'

export function skillEnableStatus(skill: Pick<Skill, 'isEnabled'>): SkillEnableStatus {
  return skill.isEnabled ? '啟用中' : '停用中'
}

// 這顆技能測過了沒：後端技能看最新版的「測過」記號，個人技能看 AI 快速測試有沒有交過卷。
// Library 技能沒有這一關，回傳 null（不顯示標註）
export function skillTested(skill: Pick<Skill, 'zone' | 'aiTestPassRate' | 'backendVersion'>): boolean | null {
  if (skill.backendVersion) return skill.backendVersion.tested
  if (skill.zone !== 'personal') return null
  return skill.aiTestPassRate != null
}
