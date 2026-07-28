# 測試面板標題移除類型 badge 設計規格

**日期：** 2026-07-28
**範圍：** `src/views/SkillTest.vue`
**相關設計文件：** `docs/superpowers/specs/2026-07-24-skill-test-sandbox-design.md`

---

## 背景

測試沙盒右側測試面板（對話測試／AI 快速測試上方）的標題列，目前在技能名稱、版本號後面還掛了一個類型 badge，顯示「系統技能」或「企業擴充」。這個 badge 拿掉。

## 變更內容

移除 `SkillTest.vue` 測試面板標題（`.panel-title`）裡的類型 badge：

```vue
<span :class="['skill-tag', selectedSkill.type === 'system' ? 'tag--sys' : 'tag--ext']">
  {{ selectedSkill.type === 'system' ? '系統技能' : '企業擴充' }}
</span>
```

移除後標題只剩：技能名稱 + 版本號 badge（`v{{ selectedSkill.version }}`）。

## 不在此次範圍

- 版本號 badge（`.tag--version`）保留，不動
- 側邊欄的色點（系統/擴充）跟這次已經拿掉的 scope badge 不受影響
- `.skill-tag.tag--sys`／`.tag--ext` 這兩個全域 CSS class 不刪除，其他地方可能還在用
