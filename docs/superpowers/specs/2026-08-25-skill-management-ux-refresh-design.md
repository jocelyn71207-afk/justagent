# 技能管理 / 技能測試沙盒 UX 重構

**日期：** 2026-08-25
**範圍：** `SkillManagement.vue`、`SkillTest.vue`、`SkillDetailDrawer.vue`、`SkillTile.vue`、`PersonalSkillGroup.vue`、`skillStore.ts`、`AppMenuTree.vue`、`useBreadcrumb.ts`
**性質：** 這份規格是**回溯性**記錄——內容是本次對話裡逐項確認、逐項實作完的一輪調整，寫在這裡是為了讓決策脈絡留在 repo 裡，不是實作前的預先設計文件。

---

## 1. 背景

這一輪調整源自使用者連續多輪的具體回饋（畫面截圖比對、逐項指出「這裡不對」），主題環繞在三件事：
1. 「我的技能」跟「團隊技能管理」這兩個心智模型不同的區域，原本擠在同一個 tab 介面裡，權限與操作範圍常常混在一起
2. 技能卡片、詳情抽屜、技能測試沙盒三個地方各自長出了不一致的圖示配色與版號顯示規則
3. 版本審核「通過」跟「上線」被當成同一件事，導致沒辦法先核准版號、晚點再手動上線

## 2. 頁面結構：「我的技能」與「團隊技能管理」拆成兩個獨立頁面

`SkillManagement.vue` 原本用一個 tab bar（`.skill-tabs`）在「我的技能」/「管理區」之間切換。改成：

- 移除 tab bar 樣式，兩個區塊變成**完全獨立、靠按鈕互相導覽**的頁面：
  - 頂部 banner 的「團隊技能管理」按鈕（`v-if="isManager && activeTab === 'my'"`）進入管理區
  - 管理區內容頂部的「返回技能管理」按鈕（`v-if="activeTab === 'review'"`，位置上就是唯一離開管理區的路徑）
- Banner 標題跟著 `activeTab` 動態換：「技能管理」／「團隊技能管理」
- 統計列（`.skill-stats-row`）只在「我的技能」顯示，管理區不顯示
- 「瀏覽 Library」「建立技能」兩顆按鈕從頂部 banner 移到「我的技能」分頁內容區頂部

## 3. Side-menu 與麵包屑

- `AppMenuTree.vue`：父層群組「技能管理」→「AI 技能」；子項目「所有技能」→「技能管理」（避免父子兩層同名，比照「共享資源庫→共用檔案管理／知識庫管理」的既有命名慣例）
- `router/index.ts` 新增 `parentLabel` meta 欄位：跟既有的 `parentName`（會連到實際路由）不同，`parentLabel` 純粹補一段**不可點擊**的上層文字。技能管理路由 `meta: { title: '技能管理', parentLabel: 'AI 技能' }`，麵包屑因此顯示「AI 技能 / 技能管理」
- `useBreadcrumb.ts` 新增對 `parentLabel` 的處理（`result.push({ label: parentLabel })`，不帶 `to`）
- `SkillTest.vue` 補上原本沒有的 `page-banner`（`AppBreadcrumb` + `banner-title`「技能測試沙盒」）；因為原本 `.skill-test-layout` 用 `calc(100vh - 60px)` 撐滿可視高度，加了 banner 後改成 `calc(100vh - 172px)`（實測校正，不是理論推算值）

## 4. 圖示與配色統一

**問題**：卡片列表（`SkillTile`/`PersonalSkillGroup`）跟詳情抽屜（`SkillDetailDrawer`）的圖示，一個依 `scope` 上色、一個依 `type`（system/extension）上色，同一顆技能點開後圖示會變。

**規則（現在全站統一）：**

| Scope / Zone | 圖示 | 顏色 |
|---|---|---|
| system | `psychology` | `--tag-blue-text` |
| enterprise | `psychology` | 品牌 teal 漸層（`$color_main_4→$color_main_3`） |
| team | `psychology` | `--tag-violet-text` |
| personal | `person` | `--tag-slate-text`（中性灰藍，跟企業層級的品牌綠明確區隔，避免兩種層級配色太像分不清楚） |

`SkillDetailDrawer.vue` 新增 `iconScopeClass`/`iconName` computed 取代原本以 `skill.type` 決定圖示的邏輯。

技能測試沙盒（`SkillTest.vue`）側欄的分類色條與圓點，原本是另一套配色（system=綠、enterprise=藍、team=琥珀，圓點又只分 sys/ext 兩種不看 team），改成跟上表同一套（system=藍、enterprise=teal、team=紫），圓點依 `group.key` 上色而不是 `skill.type`。

## 5. 版號與管理權限的顯示規則

- **版號只在審核通過後才顯示**：版本歷史列表裡，`status === 'reviewing'` 的版本不顯示 `vX.X.X` 標籤，只顯示狀態徽章＋送審日期
- **個人技能一律不顯示版號**（`dh-badges` 標題徽章 `v-if="!isPersonal"`）——個人技能沒有 Library 版本概念，版號會誤導
- **企業技能不顯示「來源關係」**（`v-if="skill.scope !== 'enterprise'"`）——企業技能是全公司唯一一份的正式發佈技能，沒有個人層級的血緣關係可看
- **管理類操作依開啟情境隱藏**：`manageable` prop 從單純 `isManager` 改成 `isManager && activeTab === 'review'`。從「瀏覽 Library」（我的技能頁，唯讀情境）開啟的詳情，不會出現「編輯」「停用/啟用」；只有從「團隊技能管理」開啟才有

## 6. 版本審核工作流程：核准版號 ≠ 上線

**問題**：原本 `approveSkillVersion` 一步就把版本設成 `active`、同時把技能的 `name`/`description`/`instructions`/`capabilities` 全部覆蓋掉，等於「審核通過」跟「正式上線」是同一個動作，管理者沒有機會在核准之後、實際上線之前再確認一次。

**新流程：**

```
reviewing --[審核通過 approveSkillVersion]--> approved（待啟用，核發版號，不動任何現有內容）
approved  --[手動「設為使用中」setLibraryActiveVersion]--> active（真正上線，同步內容，前一個 active 轉 history）
history   --[手動「設為使用中」]--> active（回滾，同樣的函式，不特別區分文字）
```

- `SkillVersionStatus` 新增 `'approved'`
- `approveSkillVersion`：只核發版號＋寫審核記錄，狀態設為 `approved`，**不再**去動任何版本的 active/history 狀態，也不動技能本身的內容欄位
- `setLibraryActiveVersion`：現在是唯一「讓內容真正生效」的地方——切換 active/history 狀態，並同步 `name`/`description`/`instructions`/`triggerHint`/`capabilities` 到技能上（這段邏輯是從舊版 `approveSkillVersion` 搬過來的）
- 「設為使用中」按鈕條件 `ver.status === 'approved' || ver.status === 'history'`（不包含 `reviewing`），按鈕文字統一「設為使用中」，不特別標註「回滾」二字——不管是待啟用轉正還是歷史回滾，使用者操作的按鈕跟語意都一樣
- `SkillReviewDrawer.vue` 的按鈕文字「通過並發布」→「通過審核」（不再宣稱會直接發布上線）

## 7. 詳情抽屜：固定區塊，不因為沒資料就消失

**問題**：技能指令／覆蓋能力／實際使用情境／版本歷史這幾個區塊，原本是 `v-if="skill.xxx?.length"`，沒資料時整塊消失，導致不同技能點開後看到的區塊數量不一致。

**改法**：這幾個區塊改成永遠渲染標籤，沒資料時顯示提示文字（「尚未撰寫技能指令」「尚未拆解覆蓋能力項目」「尚無記錄的使用情境」「尚無版本歷史」），跟既有的「附加檔案」「可調用此技能的 Agent」是同一套模式。**版本歷史例外**：明確用 `v-if="!isPersonal"` 判斷（個人技能本來就不該有這個區塊，不是「剛好沒資料」）。

配合這次調整，也把 `skillStore.ts` 裡缺這些欄位的 Library 技能與個人技能假資料補齊（見 commit diff，不逐一列在這裡）。

## 8. 提示條整合進統計列

**問題**：「有 X 個技能等待審核」原本是獨立的琥珀色警示框，跟下面刻意做成安靜「色點＋文字」語彙的統計列風格衝突；併進統計列當純文字 chip 又太不明顯，容易被忽略。

**最終方案**：統計列最前面加一個**實心 pill 徽章**（`@extend %badge-shape`，`--tag-rust-bg`/`--tag-rust-text`），跟其他三個安靜的色點文字統計並列在同一列，但用實心色塊+icon 讓它保留足夠的視覺重量，一眼就能注意到、又不會回到獨立警示框的突兀感。整顆可點擊，直接跳轉到「團隊技能範本管理 > 待審核」。

## 9. 詳情抽屜新增「有版本待審核」提示

Library 技能若有一個 `status === 'reviewing'` 的版本（既有版本仍在使用，但已經有新版本送審），詳情抽屜頭部（統計列上方）會顯示提示條：「新版本 vX.X.X 正在等待審核」，管理者可見「開始審核」捷徑按鈕。個人技能不會有這個提示（`reviewingVersion` 只可能命中 Library 技能）。

## 10. 命名調整

- 「Library 管理」分頁 → 「團隊技能範本管理」
- 「返回我的技能」→「返回技能管理」（管理區的返回按鈕本來就是回到技能管理頁，不是只回到我的技能分頁）

## 11. 非目標

- 沒有動 `skillStore.ts` 既有的個人技能送審（`approvePersonalSkill`／`SkillReviewCard.vue`）流程——那是「個人技能升級成 Library 技能」的概念，跟本次調整的「Library 技能版本審核」（`approveSkillVersion`）是不同機制，沒有版號/待啟用的概念
- 沒有清理 `UpstreamUpdateDrawer`／`openUpstreamUpdate`／`BatchUpdateModal` 這幾個目前已經沒有 UI 入口可以觸發的邏輯（移除「上游更新」提示條時已跟使用者說明這個副作用，但使用者沒有要求連帶清掉，先保留）

## 12. 測試

- `skillStore.test.ts` 新增／更新版本審核流程測試：`approveSkillVersion` 只會把狀態改成 `approved` 且不動其他版本；`setLibraryActiveVersion` 才會真正切換 active/history 並同步技能內容
- `SkillManagement.liveliness.test.ts` 更新統計列結構斷言（含新的待審核 pill）
- `SkillManagement.teamCards.test.ts` 更新成點擊「團隊技能管理」按鈕進管理區（而非舊的 tab 按鈕）
- `AppMenuTree.skillLabel.test.ts` 更新成驗證「AI 技能」群組 + 「技能管理」子項目
- `SkillTest.sidebar.test.ts` 既有的 `subgroup-label--<key>` 斷言不受影響（只改了顏色，沒改 class 結構）

## 13. 成功標準

- 「我的技能」與「團隊技能管理」是兩個靠按鈕互相導覽的獨立頁面，不再共用 tab bar
- 三個技能相關畫面（技能管理、技能測試沙盒、詳情抽屜）的圖示配色完全一致
- 版號只在審核通過後出現；審核通過跟正式上線是兩個分開、都需要手動確認的步驟
- 詳情抽屜六個固定區塊（技能指令／附加檔案／覆蓋能力／實際使用情境／可調用 Agent／版本歷史）在所有技能類型下都穩定出現（版本歷史僅個人技能除外），沒資料時顯示空狀態而非整塊消失
- 型別檢查（`vue-tsc --noEmit`）與既有測試全數通過，無新增失敗案例
