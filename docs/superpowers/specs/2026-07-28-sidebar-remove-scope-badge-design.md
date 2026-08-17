# 側邊欄技能列移除 scope badge 設計規格

**日期：** 2026-07-28
**範圍：** `src/views/SkillTest.vue`
**相關設計文件：** `docs/superpowers/specs/2026-07-24-skill-test-sandbox-design.md`

---

## 背景

測試沙盒側邊欄的 Library 技能已經用灰字子群組標題（系統技能／企業擴充／團隊擴充）分類過了，但每一列技能上還額外掛了 scope badge：企業擴充掛「企業」標籤，團隊擴充掛團隊名稱標籤（如「工程部」）。這跟上方的分類標題重複，拿掉。

## 變更內容

移除 `SkillTest.vue` 側邊欄 Library 技能列裡的兩個 badge：
- `<span v-if="skill.scope === 'enterprise'" class="skill-tag tag--enterprise">企業</span>`
- `<span v-else-if="skill.scope === 'team' && skill.teamName" class="skill-tag tag--team">{{ skill.teamName }}</span>`

移除後每列 Library 技能只剩：色點（系統／擴充）+ 技能名稱 + 版本控制（系統技能純文字／企業與團隊擴充下拉選單）。

## 不在此次範圍

- 系統技能不提供版本切換的邏輯（已完成）不受影響
- 我的技能區塊不受影響（原本就沒有 scope badge）
- `.skill-tag.tag--enterprise`／`.skill-tag.tag--team` 這兩個全域 CSS class 不刪除，其他地方（如 SkillManagement 頁面）可能還在用
