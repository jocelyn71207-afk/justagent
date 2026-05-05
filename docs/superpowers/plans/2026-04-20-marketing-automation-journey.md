# 行銷自動化旅程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 conv1「2026商品文件翻譯」流程新增「🗺️ 生成行銷自動化旅程」快速按鈕，點擊後產生互動式 HTML 流程圖報告並加到畫布，報告內 chip 可繼續觸發 AI 對話。

**Architecture:** 沿用既有 conv1 架構：`C1_ALL_STEPS` 定義步驟，`processConv1Msg` 處理訊息，`c1PushThinkingThenReply` 執行 thinking → 回覆 → 加畫布流程。chip 透過 `postMessage` 進入 `handleHurricaneChipMsg`，再呼叫 `processConv1Msg`。

**Tech Stack:** Vue 3 + TypeScript（`<script setup>`）、純 HTML/CSS/JS 靜態報告、Vite dev server

---

## 檔案地圖

| 動作 | 路徑 | 負責內容 |
|---|---|---|
| 修改 | `src/components/AiViewer/AiViewerRightBox.vue` | step 定義、nextSteps、processConv1Msg handlers |
| 新建 | `public/hurricane_trailsetter_marketing_automation.html` | 旅程報告本體（含 chip 互動） |

---

## Task 1：建立 HTML 報告

**Files:**
- Create: `public/hurricane_trailsetter_marketing_automation.html`

- [ ] **Step 1：建立 HTML 檔案**

建立 `public/hurricane_trailsetter_marketing_automation.html`，完整內容如下：

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hurricane Trailsetter AW26 行銷自動化旅程</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f7f8fa;--surface:#fff;--border:#e4e7ed;
  --text:#1a1d23;--text2:#5c6370;--text3:#9ca3af;
  --blue:#3b72f6;--blue-l:rgba(59,114,246,.08);
  --purple:#7c3aed;--purple-l:rgba(124,58,237,.08);
  --green:#16a34a;--green-l:rgba(22,163,74,.08);
  --orange:#ea580c;--orange-l:rgba(234,88,12,.08);
  --teal:#0891b2;--teal-l:rgba(8,145,178,.08);
}
body{background:var(--bg);font-family:'Helvetica Neue','PingFang TC','Microsoft JhengHei',sans-serif;
  color:var(--text);padding:24px 22px 48px;font-size:13px;line-height:1.6}

/* Header */
.rh{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;gap:12px}
.brand{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--blue);margin-bottom:3px}
.title{font-size:19px;font-weight:800;letter-spacing:-.3px}
.meta{font-size:11px;color:var(--text3);margin-top:3px}
.badge{font-size:10px;font-weight:700;padding:4px 10px;border-radius:20px;background:var(--blue-l);
  color:var(--blue);border:1px solid rgba(59,114,246,.2);white-space:nowrap;flex-shrink:0}

/* Section */
.sec{margin-bottom:24px}
.sec-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:var(--text3);margin-bottom:12px;display:flex;align-items:center;gap:6px}
.sec-title::after{content:'';flex:1;height:1px;background:var(--border)}

/* Segments */
.segs{display:flex;gap:8px;flex-wrap:wrap}
.seg{padding:4px 12px;border-radius:20px;font-size:11px;font-weight:600;border:1.5px solid}
.seg-new{background:var(--blue-l);color:var(--blue);border-color:rgba(59,114,246,.25)}
.seg-warm{background:var(--purple-l);color:var(--purple);border-color:rgba(124,58,237,.25)}
.seg-vip{background:var(--orange-l);color:var(--orange);border-color:rgba(234,88,12,.25)}

/* Flow */
.flow{display:flex;flex-direction:column}
.node-row{display:flex;align-items:flex-start}
.node-spine{width:32px;display:flex;flex-direction:column;align-items:center;flex-shrink:0}
.spine-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0;margin-top:4px}
.spine-line{width:2px;flex:1;min-height:20px}
.node-body{flex:1;padding-bottom:20px}
.node-head{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap}
.node-day{font-size:10px;font-weight:700;color:var(--text3);min-width:28px}
.node-label{font-size:13px;font-weight:700;color:var(--text)}
.node-trigger{font-size:10px;font-weight:600;padding:2px 8px;border-radius:10px;
  background:var(--surface);border:1px solid var(--border);color:var(--text2)}

/* Channels */
.channels{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.ch{padding:5px 10px;border-radius:8px;font-size:11px;font-weight:600;border:1px solid}
.ch-email{background:var(--blue-l);color:var(--blue);border-color:rgba(59,114,246,.2)}
.ch-line{background:var(--green-l);color:var(--green);border-color:rgba(22,163,74,.2)}
.ch-sms{background:var(--teal-l);color:var(--teal);border-color:rgba(8,145,178,.2)}
.ch-ad{background:var(--orange-l);color:var(--orange);border-color:rgba(234,88,12,.2)}
.ch-push{background:var(--purple-l);color:var(--purple);border-color:rgba(124,58,237,.2)}

/* Chips */
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;
  font-size:11px;font-weight:600;cursor:pointer;border:1.5px solid;
  transition:all .15s;user-select:none;background:var(--surface)}
.chip:hover{transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.12)}
.chip:active{transform:scale(.96)}
.chip-blue{background:var(--blue-l);color:var(--blue);border-color:rgba(59,114,246,.3)}
.chip-green{background:var(--green-l);color:var(--green);border-color:rgba(22,163,74,.3)}
.chip-purple{background:var(--purple-l);color:var(--purple);border-color:rgba(124,58,237,.3)}
.chip-orange{background:var(--orange-l);color:var(--orange);border-color:rgba(234,88,12,.3)}
.chip.sent{opacity:.45;pointer-events:none;text-decoration:line-through}

/* Fork */
.fork{display:flex;gap:10px;margin-bottom:8px}
.fork-branch{flex:1;border-radius:8px;padding:8px 10px;border:1px solid}
.fork-yes{background:var(--green-l);border-color:rgba(22,163,74,.2)}
.fork-no{background:#fef9e7;border-color:#fcd34d}
.fork-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.fork-yes .fork-label{color:var(--green)}
.fork-no .fork-label{color:#92400e}
.fork-content{font-size:11px;color:var(--text2)}

/* KPI */
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.kpi{background:var(--surface);border:1px solid var(--border);border-radius:10px;
  padding:10px 12px;text-align:center}
.kpi-val{font-size:18px;font-weight:800;color:var(--blue);line-height:1}
.kpi-lbl{font-size:10px;color:var(--text3);margin-top:3px}

/* Toast */
#toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(60px);
  background:#1a1d23;color:#fff;font-size:12px;font-weight:600;padding:9px 18px;
  border-radius:20px;white-space:nowrap;pointer-events:none;
  transition:transform .25s cubic-bezier(.34,1.56,.64,1),opacity .25s;opacity:0;z-index:999}
#toast.show{transform:translateX(-50%) translateY(0);opacity:1}
</style>
</head>
<body>

<!-- Header -->
<div class="rh">
  <div>
    <div class="brand">Hurricane Trailsetter · AW26</div>
    <div class="title">行銷自動化旅程</div>
    <div class="meta">生成日期：2026-04-20 · 適用期間：2026 Q3–Q4</div>
  </div>
  <div class="badge">Marketing Automation</div>
</div>

<!-- Segments -->
<div class="sec">
  <div class="sec-title">目標受眾</div>
  <div class="segs">
    <div class="seg seg-new">🆕 新客（未購買）</div>
    <div class="seg seg-warm">🔁 溫客（瀏覽未購）</div>
    <div class="seg seg-vip">⭐ VIP（購買 2+）</div>
  </div>
</div>

<!-- Flow -->
<div class="sec">
  <div class="sec-title">自動化旅程節點</div>
  <div class="flow">

    <!-- D0 -->
    <div class="node-row">
      <div class="node-spine">
        <div class="spine-dot" style="background:var(--blue)"></div>
        <div class="spine-line" style="background:linear-gradient(var(--blue),var(--purple))"></div>
      </div>
      <div class="node-body">
        <div class="node-head">
          <span class="node-day">D0</span>
          <span class="node-label">觸發加入旅程</span>
          <span class="node-trigger">觸發：首次訪問商品頁 / 加入購物車</span>
        </div>
        <div class="channels">
          <div class="ch ch-ad">📢 Meta 廣告 · 品牌曝光</div>
          <div class="ch ch-push">🔔 Web Push · 歡迎</div>
        </div>
        <div class="chips">
          <span class="chip chip-blue" onclick="sendChip(this,'生成 AW26 Hurricane 品牌曝光廣告文案')">✏️ 生成廣告文案</span>
        </div>
      </div>
    </div>

    <!-- D1 -->
    <div class="node-row">
      <div class="node-spine">
        <div class="spine-dot" style="background:var(--purple)"></div>
        <div class="spine-line" style="background:linear-gradient(var(--purple),var(--green))"></div>
      </div>
      <div class="node-body">
        <div class="node-head">
          <span class="node-day">D1</span>
          <span class="node-label">歡迎序列啟動</span>
        </div>
        <div class="channels">
          <div class="ch ch-email">📧 Email · 品牌故事 + 產品亮點</div>
          <div class="ch ch-line">💬 LINE · 歡迎加好友優惠</div>
        </div>
        <div class="chips">
          <span class="chip chip-blue" onclick="sendChip(this,'生成 Hurricane Trailsetter AW26 歡迎 Email 模板')">✉️ 生成 Email 模板</span>
          <span class="chip chip-green" onclick="sendChip(this,'撰寫 LINE 歡迎訊息腳本')">💬 撰寫 LINE 腳本</span>
        </div>
      </div>
    </div>

    <!-- D3 -->
    <div class="node-row">
      <div class="node-spine">
        <div class="spine-dot" style="background:var(--green)"></div>
        <div class="spine-line" style="background:linear-gradient(var(--green),var(--orange))"></div>
      </div>
      <div class="node-body">
        <div class="node-head">
          <span class="node-day">D3</span>
          <span class="node-label">行為條件分流</span>
          <span class="node-trigger">條件：Email 開啟 / 未開啟</span>
        </div>
        <div class="fork">
          <div class="fork-branch fork-yes">
            <div class="fork-label">✓ 已開啟 Email</div>
            <div class="fork-content">發送 <strong>限時優惠碼</strong>（7 折，72hr 效期）+ LINE 推播提醒</div>
          </div>
          <div class="fork-branch fork-no">
            <div class="fork-label">✗ 未開啟</div>
            <div class="fork-content">換題目重發 Email + Meta 再行銷廣告加強</div>
          </div>
        </div>
        <div class="chips">
          <span class="chip chip-orange" onclick="sendChip(this,'設定 Hurricane Trailsetter 限時優惠碼再行銷廣告受眾')">🎯 設定再行銷受眾</span>
        </div>
      </div>
    </div>

    <!-- D7 -->
    <div class="node-row">
      <div class="node-spine">
        <div class="spine-dot" style="background:var(--orange)"></div>
        <div class="spine-line" style="background:linear-gradient(var(--orange),var(--teal))"></div>
      </div>
      <div class="node-body">
        <div class="node-head">
          <span class="node-day">D7</span>
          <span class="node-label">產品深度培育</span>
        </div>
        <div class="channels">
          <div class="ch ch-email">📧 Email · Hurricane 戶外穿搭指南</div>
          <div class="ch ch-ad">📢 Instagram · UGC 素材投放</div>
        </div>
        <div class="chips">
          <span class="chip chip-purple" onclick="sendChip(this,'生成 Hurricane Trailsetter 戶外穿搭指南 Email 內容')">📝 生成穿搭指南</span>
        </div>
      </div>
    </div>

    <!-- D14 -->
    <div class="node-row">
      <div class="node-spine">
        <div class="spine-dot" style="background:var(--teal)"></div>
        <div class="spine-line" style="background:linear-gradient(var(--teal),#db2777)"></div>
      </div>
      <div class="node-body">
        <div class="node-head">
          <span class="node-day">D14</span>
          <span class="node-label">購買轉換衝刺</span>
          <span class="node-trigger">觸發：加入購物車未結帳</span>
        </div>
        <div class="channels">
          <div class="ch ch-sms">📱 SMS · 棄單提醒</div>
          <div class="ch ch-line">💬 LINE · 最後倒數</div>
          <div class="ch ch-ad">📢 動態再行銷廣告</div>
        </div>
        <div class="chips">
          <span class="chip chip-blue" onclick="sendChip(this,'撰寫 Hurricane Trailsetter 棄單 SMS 提醒文案')">📱 棄單 SMS 文案</span>
        </div>
      </div>
    </div>

    <!-- D30 -->
    <div class="node-row">
      <div class="node-spine">
        <div class="spine-dot" style="background:#db2777"></div>
        <div class="spine-line" style="background:#e5e7eb;min-height:10px"></div>
      </div>
      <div class="node-body">
        <div class="node-head">
          <span class="node-day">D30</span>
          <span class="node-label">購後回購培育</span>
          <span class="node-trigger">條件：完成購買</span>
        </div>
        <div class="channels">
          <div class="ch ch-email">📧 Email · 使用心得 + 開箱引導</div>
          <div class="ch ch-line">💬 LINE · 積分通知 + 會員升級</div>
        </div>
        <div class="chips">
          <span class="chip chip-green" onclick="sendChip(this,'設計 Hurricane Trailsetter 購後忠誠計畫與積分規則')">⭐ 設計忠誠計畫</span>
        </div>
      </div>
    </div>

  </div>
</div>

<!-- KPI -->
<div class="sec">
  <div class="sec-title">預估成效</div>
  <div class="kpis">
    <div class="kpi"><div class="kpi-val">28%</div><div class="kpi-lbl">Email 開信率</div></div>
    <div class="kpi"><div class="kpi-val">4.2%</div><div class="kpi-lbl">轉換率</div></div>
    <div class="kpi"><div class="kpi-val">1.8×</div><div class="kpi-lbl">ROAS</div></div>
    <div class="kpi"><div class="kpi-val">−32%</div><div class="kpi-lbl">棄單流失率</div></div>
  </div>
</div>

<div id="toast"></div>

<script>
function sendChip(el, msg) {
  window.parent.postMessage({ type: 'hurricane-chip-click', msg }, '*');
  el.classList.add('sent');
  showToast('已送出：' + msg.slice(0, 28) + (msg.length > 28 ? '…' : ''));
}
function showToast(text) {
  var t = document.getElementById('toast');
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(function(){ t.classList.remove('show'); }, 2200);
}
</script>
</body>
</html>
```

- [ ] **Step 2：驗證 HTML 報告**

在瀏覽器直接開啟 `public/hurricane_trailsetter_marketing_automation.html`（雙擊或 `open`）：
- 確認 6 個節點均正確渲染
- 點擊任一 chip → chip 文字變灰劃線 + 底部 toast 出現

- [ ] **Step 3：commit**

```bash
git add public/hurricane_trailsetter_marketing_automation.html
git commit -m "feat: add marketing automation journey HTML report with chip interactions"
```

---

## Task 2：AiViewerRightBox — step 定義 + 初始 nextSteps

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:811-823`

- [ ] **Step 1：在 id_10 的 nextSteps 新增第四個選項**

找到 [AiViewerRightBox.vue:811-814](src/components/AiViewer/AiViewerRightBox.vue#L811)，將：

```typescript
    nextSteps: [
      { label: '🎯 生成行銷策略', msg: '生成 Hurricane Trailsetter AW26 行銷策略報告' },
      { label: '👤 目標客群用戶畫像', msg: '分析 Hurricane Trailsetter 目標客群的用戶畫像' },
      { label: '📊 產出圖表', msg: '給我 Hurricane Trailsetter 相關的銷售圖表，我要做報告使用' },
    ],
```

改為：

```typescript
    nextSteps: [
      { label: '🎯 生成行銷策略', msg: '生成 Hurricane Trailsetter AW26 行銷策略報告' },
      { label: '👤 目標客群用戶畫像', msg: '分析 Hurricane Trailsetter 目標客群的用戶畫像' },
      { label: '📊 產出圖表', msg: '給我 Hurricane Trailsetter 相關的銷售圖表，我要做報告使用' },
      { label: '🗺️ 生成行銷自動化旅程', msg: '生成 Hurricane Trailsetter AW26 行銷自動化旅程' },
    ],
```

- [ ] **Step 2：在 C1_ALL_STEPS 新增對應 step**

找到 [AiViewerRightBox.vue:819-823](src/components/AiViewer/AiViewerRightBox.vue#L819)，將：

```typescript
const C1_ALL_STEPS = [
  { key: '行銷策略', label: '🎯 生成行銷策略',     msg: '生成 Hurricane Trailsetter AW26 行銷策略報告' },
  { key: '用戶畫像', label: '👤 目標客群用戶畫像', msg: '分析 Hurricane Trailsetter 目標客群的用戶畫像' },
  { key: '圖表',     label: '📊 產出圖表',          msg: '給我 Hurricane Trailsetter 相關的銷售圖表，我要做報告使用' },
];
```

改為：

```typescript
const C1_ALL_STEPS = [
  { key: '行銷策略',       label: '🎯 生成行銷策略',       msg: '生成 Hurricane Trailsetter AW26 行銷策略報告' },
  { key: '用戶畫像',       label: '👤 目標客群用戶畫像',   msg: '分析 Hurricane Trailsetter 目標客群的用戶畫像' },
  { key: '圖表',           label: '📊 產出圖表',           msg: '給我 Hurricane Trailsetter 相關的銷售圖表，我要做報告使用' },
  { key: '行銷自動化旅程', label: '🗺️ 生成行銷自動化旅程', msg: '生成 Hurricane Trailsetter AW26 行銷自動化旅程' },
];
```

- [ ] **Step 3：啟動 dev server 驗證**

```bash
npm run dev
```

開啟 AiViewer，確認最後一則 nextStepPrompt 訊息顯示 **4 個按鈕**（行銷策略、用戶畫像、產出圖表、生成行銷自動化旅程）。

- [ ] **Step 4：commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat: add 行銷自動化旅程 to C1_ALL_STEPS and initial nextSteps"
```

---

## Task 3：AiViewerRightBox — 主流程 handler

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue:944-945`

- [ ] **Step 1：在 processConv1Msg 新增旅程 handler**

找到 [AiViewerRightBox.vue:944-945](src/components/AiViewer/AiViewerRightBox.vue#L944)，將：

```typescript
  } else if (msg.includes('用戶畫像')) {
    c1PushThinkingThenReply(
      2000,
      '已完成目標客群分析，以下是 Hurricane Trailsetter 系列的用戶畫像報告，請查閱。',
      [{ name: 'hurricane_trailsetter_user_persona.html', type: 'HTML', size: 30725 }],
      '/justagent/hurricane_trailsetter_user_persona.html',
      'hurricane_trailsetter_user_persona.html',
      '用戶畫像',
    );
  }
}
```

改為：

```typescript
  } else if (msg.includes('用戶畫像')) {
    c1PushThinkingThenReply(
      2000,
      '已完成目標客群分析，以下是 Hurricane Trailsetter 系列的用戶畫像報告，請查閱。',
      [{ name: 'hurricane_trailsetter_user_persona.html', type: 'HTML', size: 30725 }],
      '/justagent/hurricane_trailsetter_user_persona.html',
      'hurricane_trailsetter_user_persona.html',
      '用戶畫像',
    );
  } else if (msg.includes('行銷自動化旅程')) {
    c1PushThinkingThenReply(
      2000,
      '已根據 AW26 銷售數據與用戶行為分析，完成 Hurricane Trailsetter 行銷自動化旅程規劃。旅程涵蓋 D0–D30 共 6 個節點，整合 Email、LINE、廣告、SMS 四大渠道，請在畫布中查閱。',
      [{ name: 'hurricane_trailsetter_marketing_automation.html', type: 'HTML', size: 9800 }],
      '/justagent/hurricane_trailsetter_marketing_automation.html',
      'hurricane_trailsetter_marketing_automation.html',
      '行銷自動化旅程',
    );
  }
}
```

- [ ] **Step 2：驗證主流程**

在 dev server 中：
1. 點擊「🗺️ 生成行銷自動化旅程」
2. 確認出現 thinking 泡泡（約 2 秒）
3. 確認回覆訊息出現，含 `hurricane_trailsetter_marketing_automation.html` 下載卡片
4. 確認畫布上新增一個 HTML 區塊，展開後顯示旅程報告

- [ ] **Step 3：commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat: handle 行銷自動化旅程 in processConv1Msg and add report to canvas"
```

---

## Task 4：AiViewerRightBox — chip handlers

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`（緊接在 Task 3 新增的 `else if` 之後插入）

- [ ] **Step 1：在 processConv1Msg 新增 7 個 chip handlers**

找到 Task 3 新增的 `行銷自動化旅程` handler 的結尾 `);`，在它**之後**（函式閉合 `}` 之前）插入以下 7 個 `else if`：

```typescript
  } else if (msg.includes('廣告文案')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '以下是 3 條 Hurricane Trailsetter AW26 品牌曝光廣告文案：<br><br>① <strong>「山路之王，秋冬出擊」</strong><br>Hurricane Trailsetter — 專為台灣山林設計，防滑耐磨，陪你征服每一條步道。<br><br>② <strong>「戶外不將就，腳感決定一切」</strong><br>全新 AW26 系列登場，Vibram 大底 × 防水鞋面，由內而外的戶外自信。<br><br>③ <strong>「你的下一段旅程，從這裡開始」</strong><br>Hurricane Trailsetter AW26，限時優惠倒數中。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 1500);
  } else if (msg.includes('歡迎 Email 模板')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '📧 <strong>歡迎 Email 模板</strong><br><br><strong>主旨：</strong>歡迎加入 Hurricane Trailsetter 探險家族 🏔️<br><br><strong>內文：</strong><br>Hi [姓名]，<br><br>感謝你關注 Hurricane Trailsetter！我們為 AW26 秋冬系列注入了全新工藝——<br>・Vibram® 大底，抓地力提升 30%<br>・Gore-Tex® 防水膜，惡劣天氣也不妥協<br>・符合台灣山林地形設計的鞋楦<br><br>身為我們的新朋友，這裡有一份 <strong>專屬 9 折優惠碼：WELCOME26</strong>，有效期 7 天。<br><br>[立即選購] 按鈕<br><br>期待在每條步道上看見你的足跡。<br>Hurricane Trailsetter 團隊',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 1800);
  } else if (msg.includes('LINE 腳本')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '💬 <strong>LINE 歡迎訊息腳本</strong><br><br><strong>主訊息：</strong><br>嗨！感謝加入 Hurricane Trailsetter 官方帳號 🏔️<br>AW26 秋冬新品現正上市，加好友限定 85 折！<br><br><strong>快速回覆按鈕（建議設定 3 個）：</strong><br>・🛒 立即選購<br>・📦 查看新品<br>・🎁 領取優惠碼<br><br><strong>備注：</strong>按鈕點擊後導向官網商品頁，搭配 UTM 參數追蹤轉換。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 1500);
  } else if (msg.includes('再行銷受眾')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '🎯 <strong>再行銷受眾設定建議</strong><br><br><strong>受眾條件（Meta Ads Manager）：</strong><br>・行為事件：<code>ViewContent</code>（商品頁停留 &gt; 15 秒）<br>・時間窗口：過去 <strong>7 天</strong>內瀏覽但未購買<br>・排除條件：過去 30 天內已購買者<br><br><strong>廣告素材建議：</strong><br>・動態商品廣告（DPA）自動帶入瀏覽商品<br>・文案：「還在考慮嗎？限時優惠只剩 2 天 ⏳」<br>・預算：日預算 NT$500，CPM 目標 ≤ NT$180',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 1600);
  } else if (msg.includes('穿搭指南')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '📝 <strong>戶外穿搭指南 Email 內容草稿</strong><br><br><strong>主旨：</strong>這個秋冬，跟著 Hurricane 這樣穿出門 🍂<br><br><strong>Section 1 — 日系機能風</strong><br>Hurricane Trailsetter Mid + 寬版工作褲 + 薄羽絨背心，輕量機能感十足。<br><br><strong>Section 2 — 城市健走風</strong><br>Hurricane Trailsetter Sandal + 修身長褲 + 連帽外套，從捷運到步道無縫接軌。<br><br><strong>Section 3 — 週末山林風</strong><br>Hurricane Trailsetter Mid + 快乾長褲 + 防風外層，應對台灣 2000m 以下山徑全制霸。<br><br>每段附產品連結與 UTM 追蹤參數。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 1800);
  } else if (msg.includes('棄單 SMS')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '📱 <strong>棄單 SMS 提醒文案（2 條）</strong><br><br><strong>版本 A（優惠導向，70 字以內）：</strong><br>「Hurricane Trailsetter 購物車提醒：你的 AW26 鞋款還在等你！現在結帳享 85 折，限今日。點此完成購買：[短網址]」<br><br><strong>版本 B（稀缺感導向，70 字以內）：</strong><br>「你選的 Hurricane Trailsetter 剩最後幾雙，明天可能就沒了！點此立即結帳：[短網址]  回覆 TD 退訂」<br><br><strong>建議發送時間：</strong>棄單後 1 小時，若未購買再於 24 小時後發版本 B。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 1500);
  } else if (msg.includes('忠誠計畫')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '⭐ <strong>購後忠誠計畫建議</strong><br><br><strong>積分規則：</strong><br>・每消費 NT$1 = 1 點<br>・開箱影片投稿 = 500 點<br>・成功推薦好友 = 300 點（雙方各得）<br><br><strong>會員等級（3 級）：</strong><br>・🥾 <strong>Trail Starter</strong>（0–2,999 點）：生日禮 + 新品早鳥 5% off<br>・🏔️ <strong>Trail Explorer</strong>（3,000–9,999 點）：免運 + 季末特賣 10% off<br>・🦅 <strong>Trail Master</strong>（10,000 點以上）：專屬客服 + 限定商品優先購 + 15% off<br><br><strong>升級通知：</strong>LINE 推播 + Email 雙管道，搭配升級限定優惠碼刺激下一單。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 1800);
  }
```

- [ ] **Step 2：驗證所有 chip handlers**

在 dev server 中點擊旅程 HTML 區塊的每個 chip，確認：
- 每個 chip 點擊後 → thinking 泡泡出現 → 消失 → AI 回覆出現
- chip 本身變灰 + toast 出現（在 HTML 報告內）
- 共 7 個 chip 全部正常（廣告文案、Email 模板、LINE 腳本、再行銷受眾、穿搭指南、棄單 SMS、忠誠計畫）

- [ ] **Step 3：commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat: add chip handlers for marketing automation journey in processConv1Msg"
```
