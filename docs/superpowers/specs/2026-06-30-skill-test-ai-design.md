# SkillTest 沙盒重構：AI 快速測試設計規格

**日期：** 2026-06-30
**範圍：** SkillTest.vue、SkillTestChat.vue、新增 SkillTestAI.vue、skillStore.ts
**不含：** SkillTestJson.vue（取消，不實作）

---

## 背景

現有技能測試沙盒（SkillTest.vue）只有對話模式（SkillTestChat.vue），對不熟悉 AI Agent 的使用者有三個痛點：

- **A. 不知道要測什麼** — 使用者需要自己想測試輸入
- **B. 測試流程太手動** — 只能一則一則手動輸入、觀察結果
- **C. 結果難以解讀** — Agent 回覆是否「正確觸發」技能，使用者難以判斷

本設計在 SkillTest 中新增「AI 快速測試」Tab，由系統 AI 自動生成測試情境、批量執行並給出判斷，解決上述三個痛點。同時移除原本計劃的 JSON 模式（不實作）。

技術底層限制：AI 快速測試底層使用試跑預覽（sandbox execution）+ 觸發測試（trigger detection），不做雙盲 eval。

---

## Tab 結構變更

原規格預計三個 Tab（對話 / JSON / AI），調整為兩個：

```
[對話測試]  [AI 快速測試]
```

`SkillTest.vue` 新增 `activeTab: 'chat' | 'ai'` state，依值顯示對應元件。左側技能選擇器不變。

---

## SkillTestAI.vue

### 三個顯示狀態

#### ① 待生成（idle）
進入 tab 後、或切換技能後，顯示空白引導畫面：
- 置中說明文字：「AI 將依技能描述自動產生 6–8 個測試案例」
- 主要按鈕：[生成測試情境]
- 點擊觸發 `store.generateAITestScenarios(skillId)`，切換為 loading → 完成後切換為 ② 情境列表

#### ② 情境列表（scenarios）
頂部工具列：
- `[全部執行]` 按鈕：依序執行所有 pending 情境
- 執行中時顯示進度條：`X / Y 完成`，執行完畢後消失
- `[重新生成]` 按鈕：清空現有情境，重新呼叫生成（需確認提示）

情境卡片（每張）：
```
標籤（tag）    正常流程 / 邊界情況 / 觸發邊緣
輸入          「請幫我開立一張發票給 ABC 公司...」
預期行為       技能應觸發，呼叫 create_invoice tool，回傳確認訊息
[執行]        右側按鈕，status=pending 時顯示；執行中時改為 loading spinner
```

執行後卡片底部展開結果區塊：
```
Agent 回覆    「好的，已為您建立發票...」（最多兩行，右側有「展開」連結）
AI 判斷       ✓ 通過  技能正確觸發並呼叫 tool，回覆格式符合預期
              ✗ 失敗  技能未觸發，Agent 以一般回覆處理，未呼叫 tool
```

#### ③ 整體報告（report）
全部情境執行完畢後，在卡片列最下方渲染報告卡片：

```
通過率  5 / 7（71%）

類別         正常流程   邊界情況   觸發邊緣
通過/總計    3 / 3      1 / 3      1 / 1
狀態         ✓          ✗          ✓

AI 評語  技能在標準輸入下穩定觸發，建議調整「催款通知」等邊界情境的觸發
         描述以提高覆蓋率。
```

---

## skillStore.ts 變更

### 移除

```ts
// 配合取消 JSON 模式
testJsonInput: string
testJsonOutput: string | null
runJsonTest(skillId: string, input: string): Promise<void>
```

### 新增型別

```ts
interface AITestScenario {
  id: string
  tag: 'normal' | 'boundary' | 'trigger_edge'
  input: string
  expectedBehavior: string
  status: 'pending' | 'running' | 'pass' | 'fail'
  agentReply?: string
  aiJudgment?: string
}

interface AITestReport {
  total: number
  passed: number
  byTag: Record<AITestScenario['tag'], { total: number; passed: number }>
  summary: string
}
```

### 新增 State

```ts
aiTestScenarios: AITestScenario[]
aiTestReport: AITestReport | null
aiTestIsGenerating: boolean   // 生成情境中
aiTestIsRunning: boolean      // 批量執行中
```

### 新增 Actions

```ts
generateAITestScenarios(skillId: string): Promise<void>
// 以 mock 資料依 skill.description 生成 6–8 個 AITestScenario
// 生成完畢後 aiTestReport 重置為 null

runAllAITests(skillId: string): Promise<void>
// 依序執行所有 status==='pending' 的情境
// 每執行一個更新其 status / agentReply / aiJudgment
// 全部完成後呼叫 computeAITestReport()

runSingleAITest(skillId: string, scenarioId: string): Promise<void>
// 執行單一情境；完成後重新計算 report（若所有情境都已執行）

// 私有 helper（不暴露）
computeAITestReport(): void
// 彙整 aiTestScenarios 產生 aiTestReport
```

### State 初始化

切換 `selectedSkillId` 時，同步重置 `aiTestScenarios`、`aiTestReport`、`aiTestIsGenerating`、`aiTestIsRunning`。

---

## 新增 SCSS

| 檔案 | 說明 |
|------|------|
| `src/scss/components/_SkillTestAI.scss` | 情境卡片、tag badge、結果展開區、報告卡片、進度條 |

建立後在 `src/scss/components/_index.scss` 加：
```scss
@forward 'SkillTestAI';
```

---

## 不在此次範圍

- SkillTestJson.vue（取消，不實作）
- 真實 AI 呼叫（此次使用 mock 資料模擬生成與判斷）
- 報告留存 / 匯出功能
- 報告分享給 reviewer（後續 GROUP 升級流程規劃）
