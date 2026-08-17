# 系統技能不提供版本切換設計規格

**日期：** 2026-07-28
**範圍：** `src/views/SkillTest.vue`
**相關設計文件：** `docs/superpowers/specs/2026-07-24-skill-test-sandbox-design.md`

---

## 背景

技能測試沙盒側邊欄目前對「Library 技能」統一套用版本控制邏輯：只有一個版本顯示純文字版本號，有多個版本則顯示可切換的下拉選單（`SkillVersionPicker`）。系統技能（`scope === 'system'`，例如「通用客服機器人」有 v2.4.0/v2.4.1 兩版）因此也會出現版本下拉選單，但系統技能不應該讓使用者任意切換版本測試。

## 變更內容

在 `SkillTest.vue` 的側邊欄樣板中，對 `scope === 'system'` 的技能，一律顯示純文字版本號（沿用現有 `.version-inline` 樣式），不管該技能實際有幾個版本，都不使用 `SkillVersionPicker` 下拉元件。

- 顯示的版本號 = 該技能目前的預設／使用中版本（跟 `SkillVersionPicker` 原本預設顯示的值一致），只是拿掉可以點開切換其他版本的互動能力
- 企業擴充、團隊擴充（`scope` 為 `enterprise`／`team`）不受影響，維持原本「單版本純文字／多版本下拉」的邏輯
- 點擊系統技能整列，行為不變：用預設版本選中該技能開始測試

## 不在此次範圍

- `skillStore.ts` 的 `getVersionOptions`／`getDefaultVersionTag`／`setSelectedSkill` 不需要修改，這幾個函式本來就會正確算出系統技能的預設版本
- `SkillVersionPicker.vue` 元件本身不需要修改，只是這次不再套用到系統技能
- 我的技能、企業擴充、團隊擴充的版本切換行為維持現狀
