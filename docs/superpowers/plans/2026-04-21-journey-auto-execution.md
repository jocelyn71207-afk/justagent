# 行銷自動化旅程執行系統 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用者點擊「生成行銷自動化旅程」後，AI 自動依序執行 6 個節點，Canvas 顯示樹狀流程圖即時進度，另有 `/view/journeys` 獨立頁面查看多個並行用戶旅程。

**Architecture:** 新建 `journeyStore.ts` 管理旅程狀態；`AiViewerRightBox.vue` 觸發旅程並啟動 setTimeout 執行鏈，每次狀態變更透過 `postMessage` 推送給 Canvas iframe；Canvas HTML block（`hurricane_trailsetter_journey_dashboard.html`）監聽訊息並整個重繪旅程樹狀圖；`JourneyDashboard.vue` 從 store 讀取並顯示所有旅程清單。

**Tech Stack:** Vue 3 + TypeScript (`<script setup>`), Pinia (composition API style), Vite (`/justagent/` base path for public assets), Vitest (unit tests)

---

## Task 1: journeyStore

**Files:**
- Create: `src/stores/journeyStore.ts`
- Create: `src/stores/__tests__/journeyStore.spec.ts`

- [ ] **Step 1: Write failing tests**

建立測試檔：

```typescript
// src/stores/__tests__/journeyStore.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useJourneyStore } from '@/stores/journeyStore'

describe('journeyStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('createJourney returns id and initialises 6 pending nodes', () => {
    const store = useJourneyStore()
    const id = store.createJourney('User #1')
    expect(id).toMatch(/^journey-/)
    const j = store.journeys[0]
    expect(j.id).toBe(id)
    expect(j.userName).toBe('User #1')
    expect(j.status).toBe('running')
    expect(j.nodes).toHaveLength(6)
    expect(j.nodes.every(n => n.status === 'pending')).toBe(true)
  })

  it('setNodeRunning sets status and startedAt', () => {
    const store = useJourneyStore()
    const id = store.createJourney('User #1')
    store.setNodeRunning(id, 'D0')
    const node = store.journeys[0].nodes.find(n => n.key === 'D0')!
    expect(node.status).toBe('running')
    expect(node.startedAt).toBeDefined()
  })

  it('setNodeDone marks node done and sets completedAt', () => {
    const store = useJourneyStore()
    const id = store.createJourney('User #1')
    store.setNodeRunning(id, 'D0')
    store.setNodeDone(id, 'D0')
    const node = store.journeys[0].nodes.find(n => n.key === 'D0')!
    expect(node.status).toBe('done')
    expect(node.completedAt).toBeDefined()
  })

  it('journey status becomes done when all nodes are done', () => {
    const store = useJourneyStore()
    const id = store.createJourney('User #1')
    const keys = ['D0','D1','D3','D7','D14','D30']
    keys.forEach(k => { store.setNodeRunning(id, k); store.setNodeDone(id, k) })
    expect(store.journeys[0].status).toBe('done')
  })

  it('supports multiple concurrent journeys', () => {
    const store = useJourneyStore()
    store.createJourney('User #1')
    store.createJourney('User #2')
    expect(store.journeys).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm run test:unit -- src/stores/__tests__/journeyStore.spec.ts
```

Expected: FAIL — "Cannot find module '@/stores/journeyStore'"

- [ ] **Step 3: Implement journeyStore**

```typescript
// src/stores/journeyStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NodeStatus = 'pending' | 'running' | 'done'

export interface JourneyNode {
  key: string
  label: string
  status: NodeStatus
  startedAt?: number
  completedAt?: number
}

export interface JourneyRecord {
  id: string
  userName: string
  createdAt: number
  status: 'running' | 'done'
  nodes: JourneyNode[]
}

const NODE_TEMPLATES: Omit<JourneyNode, 'status'>[] = [
  { key: 'D0',  label: '觸發加入旅程' },
  { key: 'D1',  label: '歡迎序列啟動' },
  { key: 'D3',  label: '行為條件分流' },
  { key: 'D7',  label: '產品深度培育' },
  { key: 'D14', label: '購買轉換衝刺' },
  { key: 'D30', label: '購後回購培育' },
]

export const useJourneyStore = defineStore('journey', () => {
  const journeys = ref<JourneyRecord[]>([])

  function createJourney(userName: string): string {
    const id = 'journey-' + Date.now()
    journeys.value.unshift({
      id,
      userName,
      createdAt: Date.now(),
      status: 'running',
      nodes: NODE_TEMPLATES.map(t => ({ ...t, status: 'pending' })),
    })
    return id
  }

  function setNodeRunning(journeyId: string, nodeKey: string): void {
    const journey = journeys.value.find(j => j.id === journeyId)
    if (!journey) return
    const node = journey.nodes.find(n => n.key === nodeKey)
    if (!node) return
    node.status = 'running'
    node.startedAt = Date.now()
  }

  function setNodeDone(journeyId: string, nodeKey: string): void {
    const journey = journeys.value.find(j => j.id === journeyId)
    if (!journey) return
    const node = journey.nodes.find(n => n.key === nodeKey)
    if (!node) return
    node.status = 'done'
    node.completedAt = Date.now()
    if (journey.nodes.every(n => n.status === 'done')) {
      journey.status = 'done'
    }
  }

  return { journeys, createJourney, setNodeRunning, setNodeDone }
})
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm run test:unit -- src/stores/__tests__/journeyStore.spec.ts
```

Expected: PASS — 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/stores/journeyStore.ts src/stores/__tests__/journeyStore.spec.ts
git commit -m "feat: add journeyStore for tracking multi-user journey progress"
```

---

## Task 2: Canvas 旅程總覽 HTML

**Files:**
- Create: `public/hurricane_trailsetter_journey_dashboard.html`

這個 HTML 是放在 Canvas iframe 內的獨立頁面。它監聽來自父頁面的 `journey-state-sync` postMessage，接到後整個重繪所有旅程的樹狀流程圖。

- [ ] **Step 1: 建立 HTML 檔案**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<title>旅程總覽</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f1117;--surface:#1a1d27;--border:#2a2d3a;
  --text:#e8eaf0;--text2:#9ca3af;--text3:#5c6370;
  --blue:#3b72f6;--purple:#7c3aed;--green:#16a34a;
  --orange:#ea580c;--teal:#0891b2;--pink:#db2777;
}
html,body{height:100%;background:var(--bg);font-family:'Helvetica Neue','PingFang TC',sans-serif;
  color:var(--text);font-size:12px;overflow-x:auto}
body{padding:20px 24px 40px;min-height:100%}

/* Header */
.hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.hdr-title{font-size:15px;font-weight:800;letter-spacing:-.3px}
.hdr-sub{font-size:10px;color:var(--text3);margin-top:2px}
.badge{font-size:10px;font-weight:700;padding:3px 10px;border-radius:20px;
  background:rgba(59,114,246,.15);color:var(--blue);border:1px solid rgba(59,114,246,.3)}

/* Journey columns */
.journeys-wrap{display:flex;gap:24px;align-items:flex-start;min-height:200px}
.journey-col{flex:0 0 220px;display:flex;flex-direction:column}
.col-hdr{margin-bottom:16px}
.col-name{font-size:12px;font-weight:700;color:var(--text)}
.col-prog{font-size:10px;color:var(--text3);margin-top:2px}
.col-status{display:inline-block;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;margin-top:4px}
.col-status.running{background:rgba(59,114,246,.15);color:var(--blue)}
.col-status.done{background:rgba(22,163,74,.15);color:var(--green)}

/* Flow */
.flow{display:flex;flex-direction:column;align-items:center;gap:0}

/* Node */
.node-wrap{width:100%;display:flex;flex-direction:column;align-items:center}
.connector{width:2px;height:20px;background:var(--border);flex-shrink:0}
.connector.done{background:var(--green)}
.connector.running{background:var(--blue)}

.node{
  width:100%;border-radius:12px;padding:12px 14px 11px;position:relative;
  background:var(--surface);border:1px solid var(--border);
  transition:box-shadow .3s,border-color .3s;
}
.node.pending{opacity:.45}
.node.running{
  border-color:transparent;
  background:linear-gradient(var(--surface),var(--surface)) padding-box,
    linear-gradient(135deg,var(--purple),var(--blue)) border-box;
  box-shadow:0 0 14px rgba(124,58,237,.35),0 0 28px rgba(59,114,246,.2);
  animation:pulse-glow 2s ease-in-out infinite;
}
.node.done{
  border-color:transparent;
  background:linear-gradient(var(--surface),var(--surface)) padding-box,
    linear-gradient(135deg,#16a34a,#0891b2) border-box;
  box-shadow:0 0 12px rgba(22,163,74,.3);
}

@keyframes pulse-glow{
  0%,100%{box-shadow:0 0 10px rgba(124,58,237,.3),0 0 20px rgba(59,114,246,.15)}
  50%{box-shadow:0 0 22px rgba(124,58,237,.6),0 0 40px rgba(59,114,246,.3)}
}

/* Node icon badge */
.node-icon{
  width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:13px;margin:0 auto 8px;border:2px solid var(--border);
  background:var(--bg);
}
.node.running .node-icon,.node.done .node-icon{border-color:transparent}
.node.done .node-icon::after{content:'✓';position:absolute;font-size:10px;font-weight:700;
  top:-4px;right:-4px;background:var(--green);color:#fff;width:14px;height:14px;
  border-radius:50%;display:flex;align-items:center;justify-content:center}
.node-icon-wrap{position:relative;width:28px;margin:0 auto 8px}

.node-label{font-size:12px;font-weight:700;text-align:center;color:var(--text)}
.node-day{font-size:9px;font-weight:700;text-align:center;color:var(--text3);
  text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
.node-sub{font-size:10px;color:var(--text2);text-align:center;margin-top:3px}
.running-dot{display:inline-block;width:6px;height:6px;border-radius:50%;
  background:var(--blue);margin-right:4px;animation:blink 1s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}

/* Branch (D3) */
.branch-row{display:flex;gap:8px;width:100%;margin-top:0}
.branch-side{flex:1;display:flex;flex-direction:column;align-items:center}
.branch-line{width:2px;height:14px;background:var(--border)}
.branch-node{width:100%;border-radius:8px;padding:7px 8px;border:1px solid var(--border);
  background:var(--surface);font-size:10px;text-align:center;color:var(--text2)}
.branch-label{font-size:9px;font-weight:700;margin-bottom:3px}
.branch-yes .branch-label{color:var(--green)}
.branch-no .branch-label{color:#f59e0b}
.branch-connector{display:flex;width:100%;justify-content:space-around;
  height:20px;position:relative;margin-top:0}
.branch-connector::before{
  content:'';position:absolute;top:0;left:25%;right:25%;height:1px;background:var(--border)
}
.branch-marker{width:16px;height:16px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:9px;font-weight:700;flex-shrink:0;margin-top:-2px}
.branch-marker.yes{background:var(--green);color:#fff}
.branch-marker.no{background:#f59e0b;color:#fff}

/* Empty state */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;
  width:100%;min-height:180px;color:var(--text3);font-size:13px;gap:8px}
.empty-icon{font-size:28px;opacity:.4}
</style>
</head>
<body>

<div class="hdr">
  <div>
    <div class="hdr-title">🗺️ 旅程總覽</div>
    <div class="hdr-sub">Hurricane Trailsetter · AW26 行銷自動化</div>
  </div>
  <div class="badge">Journey Dashboard</div>
</div>

<div id="journeys-wrap" class="journeys-wrap">
  <div class="empty" id="empty-state">
    <div class="empty-icon">🗺️</div>
    <div>等待旅程啟動…</div>
  </div>
</div>

<script>
var NODE_META = {
  D0:  { icon:'🚀', sub:'首次訪問 / 加入購物車', color:'#3b72f6' },
  D1:  { icon:'💌', sub:'Email + LINE 歡迎', color:'#7c3aed' },
  D3:  { icon:'🔀', sub:'Email 開啟條件分流', color:'#16a34a' },
  D7:  { icon:'📖', sub:'Email + IG 廣告', color:'#ea580c' },
  D14: { icon:'⚡', sub:'加入購物車未結帳', color:'#0891b2' },
  D30: { icon:'⭐', sub:'完成購買 / 回購', color:'#db2777' },
};

function renderJourneys(journeys) {
  var wrap = document.getElementById('journeys-wrap');
  var empty = document.getElementById('empty-state');
  if (!journeys || journeys.length === 0) {
    empty.style.display = 'flex';
    wrap.querySelectorAll('.journey-col').forEach(function(el){ el.remove(); });
    return;
  }
  empty.style.display = 'none';

  // Remove old columns
  wrap.querySelectorAll('.journey-col').forEach(function(el){ el.remove(); });

  // Render newest-first (journeys array is already newest-first from store)
  journeys.forEach(function(journey) {
    var col = document.createElement('div');
    col.className = 'journey-col';
    col.setAttribute('data-id', journey.id);

    var doneCount = journey.nodes.filter(function(n){ return n.status === 'done'; }).length;
    var statusLabel = journey.status === 'done' ? '已完成' : '執行中';
    var statusClass = journey.status === 'done' ? 'done' : 'running';

    col.innerHTML =
      '<div class="col-hdr">' +
        '<div class="col-name">' + escHtml(journey.userName) + '</div>' +
        '<div class="col-prog">' + doneCount + ' / 6 節點完成</div>' +
        '<span class="col-status ' + statusClass + '">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="flow">' + renderFlow(journey.nodes) + '</div>';

    wrap.appendChild(col);
  });
}

function renderFlow(nodes) {
  var html = '';
  nodes.forEach(function(node, i) {
    var meta = NODE_META[node.key] || { icon:'⚙️', sub:'', color:'#9ca3af' };
    var connClass = i > 0 ? nodes[i-1].status : 'pending';

    // Connector before node (skip first)
    if (i > 0) {
      html += '<div class="connector ' + connClass + '"></div>';
    }

    if (node.key === 'D3') {
      html += renderBranchNode(node, meta);
    } else {
      html += renderLinearNode(node, meta);
    }
  });
  return html;
}

function renderLinearNode(node, meta) {
  var runningIndicator = node.status === 'running'
    ? '<span class="running-dot"></span>執行中…'
    : '';
  var doneCheck = node.status === 'done'
    ? '<div style="position:absolute;top:-4px;right:-4px;background:#16a34a;color:#fff;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">✓</div>'
    : '';
  return (
    '<div class="node-wrap">' +
      '<div class="node ' + node.status + '">' +
        '<div class="node-day">' + node.key + '</div>' +
        '<div class="node-icon-wrap" style="position:relative;width:28px;margin:0 auto 8px">' +
          '<div class="node-icon" style="border-color:' + (node.status==='pending'?'var(--border)':meta.color) + '">' + meta.icon + '</div>' +
          doneCheck +
        '</div>' +
        '<div class="node-label">' + escHtml(node.label) + '</div>' +
        '<div class="node-sub">' + meta.sub + '</div>' +
        (runningIndicator ? '<div style="font-size:10px;color:var(--blue);margin-top:6px;text-align:center">' + runningIndicator + '</div>' : '') +
      '</div>' +
    '</div>'
  );
}

function renderBranchNode(node, meta) {
  var runningIndicator = node.status === 'running'
    ? '<div style="font-size:10px;color:var(--blue);margin-top:6px;text-align:center"><span class="running-dot"></span>執行中…</div>'
    : '';
  var doneCheck = node.status === 'done'
    ? '<div style="position:absolute;top:-4px;right:-4px;background:#16a34a;color:#fff;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700">✓</div>'
    : '';
  return (
    '<div class="node-wrap">' +
      '<div class="node ' + node.status + '">' +
        '<div class="node-day">' + node.key + '</div>' +
        '<div class="node-icon-wrap" style="position:relative;width:28px;margin:0 auto 8px">' +
          '<div class="node-icon" style="border-color:' + (node.status==='pending'?'var(--border)':meta.color) + '">' + meta.icon + '</div>' +
          doneCheck +
        '</div>' +
        '<div class="node-label">' + escHtml(node.label) + '</div>' +
        '<div class="node-sub">' + meta.sub + '</div>' +
        runningIndicator +
      '</div>' +
      '<div class="branch-connector">' +
        '<div class="branch-marker yes">✓</div>' +
        '<div class="branch-marker no">✗</div>' +
      '</div>' +
      '<div class="branch-row">' +
        '<div class="branch-side">' +
          '<div class="branch-node branch-yes">' +
            '<div class="branch-label">已開啟 Email</div>' +
            '<div>限時優惠碼 + LINE 提醒</div>' +
          '</div>' +
        '</div>' +
        '<div class="branch-side">' +
          '<div class="branch-node branch-no">' +
            '<div class="branch-label">未開啟</div>' +
            '<div>換標題重發 + 再行銷</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== 'journey-state-sync') return;
  renderJourneys(e.data.journeys);
});

// Request initial state from parent on load
window.parent.postMessage({ type: 'journey-state-request' }, '*');
</script>
</body>
</html>
```

- [ ] **Step 2: 驗證 HTML 可獨立開啟**

```bash
open http://localhost:5173/justagent/hurricane_trailsetter_journey_dashboard.html
```

Expected: 看到深色背景、「旅程總覽」標題、「等待旅程啟動…」空狀態。

- [ ] **Step 3: Commit**

```bash
git add public/hurricane_trailsetter_journey_dashboard.html
git commit -m "feat: add journey dashboard HTML with tree flowchart and postMessage sync"
```

---

## Task 3: AiViewerRightBox.vue — 旅程觸發與執行鏈

**Files:**
- Modify: `src/components/AiViewer/AiViewerRightBox.vue`

目前行銷自動化旅程 handler 在第 947–955 行，onMounted/onUnmounted 在第 1066–1078 行。

- [ ] **Step 1: 新增 import 與 reactive 狀態**

在 `AiViewerRightBox.vue` script 區塊頂部找到現有 imports，加入：

```typescript
import { useJourneyStore } from '@/stores/journeyStore'
```

在現有 `const { sendUserInput, addReportBlock, addChartBlock } = aiviewerStore` 同區塊下方新增：

```typescript
const journeyStore = useJourneyStore()
const journeyDashboardAdded = ref(false)
let _journeyUserCount = 0
```

- [ ] **Step 2: 新增 syncJourneyToIframe 與 startJourneyExecution 函式**

在 `handleHurricaneChipMsg` 函式（第 1057 行）之前加入兩個新函式：

```typescript
function syncJourneyToIframe() {
  const iframe = document.querySelector(
    'iframe[src*="journey_dashboard"]'
  ) as HTMLIFrameElement | null
  iframe?.contentWindow?.postMessage(
    { type: 'journey-state-sync', journeys: journeyStore.journeys },
    '*'
  )
}

function startJourneyExecution(journeyId: string) {
  const schedule = [
    { key: 'D0',  runningDelay: 500,   doneDelay: 2000  },
    { key: 'D1',  runningDelay: 2500,  doneDelay: 5000  },
    { key: 'D3',  runningDelay: 5500,  doneDelay: 8500  },
    { key: 'D7',  runningDelay: 9000,  doneDelay: 11500 },
    { key: 'D14', runningDelay: 12000, doneDelay: 15000 },
    { key: 'D30', runningDelay: 15500, doneDelay: 18000 },
  ]
  for (const { key, runningDelay, doneDelay } of schedule) {
    setTimeout(() => {
      journeyStore.setNodeRunning(journeyId, key)
      syncJourneyToIframe()
    }, runningDelay)
    setTimeout(() => {
      journeyStore.setNodeDone(journeyId, key)
      syncJourneyToIframe()
    }, doneDelay)
  }
}
```

- [ ] **Step 3: 修改 `行銷自動化旅程` handler（第 947–955 行）**

把現有的：

```typescript
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
```

替換為：

```typescript
  } else if (msg.includes('行銷自動化旅程')) {
    c1PushThinkingThenReply(
      2000,
      '已根據 AW26 銷售數據與用戶行為分析，完成 Hurricane Trailsetter 行銷自動化旅程規劃。旅程涵蓋 D0–D30 共 6 個節點，整合 Email、LINE、廣告、SMS 四大渠道，請在畫布中查閱。',
      [{ name: 'hurricane_trailsetter_marketing_automation.html', type: 'HTML', size: 9800 }],
      '/justagent/hurricane_trailsetter_marketing_automation.html',
      'hurricane_trailsetter_marketing_automation.html',
      '行銷自動化旅程',
    )
    _journeyUserCount++
    const journeyId = journeyStore.createJourney(`User #${_journeyUserCount}`)
    if (!journeyDashboardAdded.value) {
      addReportBlock('/justagent/hurricane_trailsetter_journey_dashboard.html', '旅程總覽')
      journeyDashboardAdded.value = true
    }
    startJourneyExecution(journeyId)
  }
```

- [ ] **Step 4: 新增 handleJourneyStateRequest 並在 onMounted/onUnmounted 註冊**

在 `handleHurricaneChipMsg` 函式下方（第 1065 行後）新增：

```typescript
function handleJourneyStateRequest(event: MessageEvent) {
  if (event.data?.type !== 'journey-state-request') return
  syncJourneyToIframe()
}
```

把現有的 `onMounted`（第 1066–1074 行）改為：

```typescript
onMounted(() => {
  try {
    addReportBlock(
      '/justagent/hurricane_trailsetter_sales_report.html',
      'hurricane_trailsetter_sales_report.html'
    );
  } catch (e) { /* canvas 尚未初始化時略過 */ }
  window.addEventListener('message', handleHurricaneChipMsg)
  window.addEventListener('message', handleJourneyStateRequest)
})
```

把現有的 `onUnmounted`（第 1076–1078 行）改為：

```typescript
onUnmounted(() => {
  window.removeEventListener('message', handleHurricaneChipMsg)
  window.removeEventListener('message', handleJourneyStateRequest)
})
```

- [ ] **Step 5: TypeScript 型別檢查**

```bash
npm run type-check
```

Expected: No errors

- [ ] **Step 6: 手動驗證**

```bash
npm run dev
```

1. 打開 `http://localhost:5173/view/AiViewer`
2. 點擊右側 chat 中「🗺️ 生成行銷自動化旅程」
3. 確認 Canvas 出現「旅程總覽」HTML 區塊，顯示 User #1 旅程
4. 等待約 20 秒，確認節點依序從 pending → running（脈動光暈）→ done（綠色光暈 + ✓）
5. 再次點擊「🗺️ 生成行銷自動化旅程」，確認 User #2 旅程加入同一個總覽區塊，旅程並排顯示

- [ ] **Step 7: Commit**

```bash
git add src/components/AiViewer/AiViewerRightBox.vue
git commit -m "feat: trigger journey execution and sync progress to canvas HTML via postMessage"
```

---

## Task 4: JourneyDashboard 頁面、路由、AiViewer 入口

**Files:**
- Create: `src/views/JourneyDashboard.vue`
- Modify: `src/router/index.ts` (line 60，AiViewer 路由後插入)
- Modify: `src/views/AiViewer.vue` (line 136，選單加入旅程總覽項目)

- [ ] **Step 1: 建立 JourneyDashboard.vue**

```vue
<!-- src/views/JourneyDashboard.vue -->
<template>
  <div style="min-height:100vh;background:#0f1117;color:#e8eaf0;font-family:'Helvetica Neue','PingFang TC',sans-serif;padding:32px 40px 60px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#3b72f6;margin-bottom:4px">
          Hurricane Trailsetter · AW26
        </div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-.4px">🗺️ 旅程執行紀錄</div>
        <div style="font-size:12px;color:#5c6370;margin-top:4px">行銷自動化旅程 — 各用戶進度追蹤</div>
      </div>
      <button
        @click="router.push('/view/AiViewer')"
        style="padding:8px 16px;border-radius:8px;border:1px solid #2a2d3a;background:#1a1d27;color:#9ca3af;font-size:12px;cursor:pointer">
        ← 返回 AiViewer
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="journeys.length === 0"
      style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;color:#5c6370;gap:12px">
      <div style="font-size:40px;opacity:.3">🗺️</div>
      <div style="font-size:14px">尚無旅程記錄</div>
      <div style="font-size:12px">回到 AiViewer 並點擊「生成行銷自動化旅程」開始</div>
    </div>

    <!-- Journey list -->
    <div v-else style="display:flex;flex-direction:column;gap:20px">
      <div
        v-for="journey in journeys"
        :key="journey.id"
        style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:14px;padding:20px 24px">

        <!-- Journey header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-size:15px;font-weight:700">{{ journey.userName }}</div>
            <div style="font-size:11px;color:#5c6370;margin-top:2px">
              啟動：{{ formatDate(journey.createdAt) }}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:12px;color:#9ca3af">
              {{ doneCount(journey) }} / 6 節點完成
            </div>
            <span :style="statusBadgeStyle(journey.status)">
              {{ journey.status === 'done' ? '已完成' : '執行中' }}
            </span>
          </div>
        </div>

        <!-- Progress bar -->
        <div style="background:#0f1117;border-radius:6px;height:6px;margin-bottom:18px;overflow:hidden">
          <div
            :style="{
              height:'100%',
              borderRadius:'6px',
              background: journey.status === 'done'
                ? 'linear-gradient(90deg,#16a34a,#0891b2)'
                : 'linear-gradient(90deg,#7c3aed,#3b72f6)',
              width: (doneCount(journey) / 6 * 100) + '%',
              transition: 'width .5s ease',
            }"
          />
        </div>

        <!-- Node timeline -->
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <div
            v-for="node in journey.nodes"
            :key="node.key"
            :style="nodeCardStyle(node.status)"
          >
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px"
              :style="{ color: nodeKeyColor(node.status) }">
              {{ node.key }}
            </div>
            <div style="font-size:11px;font-weight:600;">{{ node.label }}</div>
            <div v-if="node.status === 'running'"
              style="font-size:9px;color:#3b72f6;margin-top:4px;display:flex;align-items:center;gap:3px">
              <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#3b72f6;animation:blink 1s ease-in-out infinite"></span>
              執行中
            </div>
            <div v-if="node.completedAt"
              style="font-size:9px;color:#5c6370;margin-top:4px">
              {{ formatTime(node.completedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useJourneyStore } from '@/stores/journeyStore'
import type { JourneyRecord, JourneyNode, NodeStatus } from '@/stores/journeyStore'

const router = useRouter()
const journeyStore = useJourneyStore()
const { journeys } = storeToRefs(journeyStore)

function doneCount(journey: JourneyRecord): number {
  return journey.nodes.filter(n => n.status === 'done').length
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function statusBadgeStyle(status: 'running' | 'done'): Record<string, string> {
  const base: Record<string, string> = {
    fontSize: '10px', fontWeight: '700', padding: '3px 10px',
    borderRadius: '20px', border: '1px solid',
  }
  return status === 'done'
    ? { ...base, background: 'rgba(22,163,74,.15)', color: '#16a34a', borderColor: 'rgba(22,163,74,.3)' }
    : { ...base, background: 'rgba(59,114,246,.15)', color: '#3b72f6', borderColor: 'rgba(59,114,246,.3)' }
}

function nodeCardStyle(status: NodeStatus): Record<string, string> {
  const base: Record<string, string> = {
    flex: '1', minWidth: '88px', maxWidth: '120px', borderRadius: '10px',
    padding: '10px 10px 9px', border: '1px solid',
  }
  if (status === 'done') return { ...base, background: 'rgba(22,163,74,.08)', borderColor: 'rgba(22,163,74,.25)' }
  if (status === 'running') return { ...base, background: 'rgba(59,114,246,.1)', borderColor: 'rgba(59,114,246,.4)' }
  return { ...base, background: '#0f1117', borderColor: '#2a2d3a', opacity: '.5' }
}

function nodeKeyColor(status: NodeStatus): string {
  if (status === 'done') return '#16a34a'
  if (status === 'running') return '#3b72f6'
  return '#5c6370'
}
</script>

<style>
@keyframes blink {
  0%,100% { opacity:1 }
  50% { opacity:.2 }
}
</style>
```

- [ ] **Step 2: 新增路由**

在 `src/router/index.ts` 第 60 行（AiViewer 路由的 `}` 後）插入：

```typescript
      {
        path: '/view/journeys',
        name: 'JourneyDashboard',
        component: () => import('@/views/JourneyDashboard.vue'),
        meta: { hideMenuTree: true },
      },
```

完整插入位置（修改後第 56–65 行應看起來像）：

```typescript
      {
        path: '/view/AiViewer',
        name: 'AiViewer',
        component: () => import('@/views/AiViewer.vue'),
        meta: { hideMenuTree: true },
      },
      {
        path: '/view/journeys',
        name: 'JourneyDashboard',
        component: () => import('@/views/JourneyDashboard.vue'),
        meta: { hideMenuTree: true },
      },
```

- [ ] **Step 3: AiViewer.vue 下拉選單新增入口**

在 `src/views/AiViewer.vue` 第 136 行（「操作教學」`option-item` 之後）插入：

```html
      <div class="option-item" @click="router.push('/view/journeys')">
        <i class="material-symbols-outlined">route</i>
        旅程總覽
      </div>
```

插入後，`more-options-box` 結尾應如下（第 135–139 行）：

```html
      <div class="option-item">
        <i class="material-symbols-outlined">description</i> 操作教學
      </div>
      <div class="option-item" @click="router.push('/view/journeys')">
        <i class="material-symbols-outlined">route</i>
        旅程總覽
      </div>
    </div>
```

- [ ] **Step 4: TypeScript 型別檢查**

```bash
npm run type-check
```

Expected: No errors

- [ ] **Step 5: 手動驗證**

```bash
npm run dev
```

1. 打開 AiViewer，觸發旅程，等待執行完成
2. 點擊左上角 `keyboard_arrow_down` 選單，確認出現「旅程總覽」項目
3. 點擊「旅程總覽」，確認跳轉至 `/view/journeys`
4. 確認頁面顯示 User #1 旅程卡片，節點狀態正確（done/running/pending）
5. 返回 AiViewer，再觸發一次旅程，回到旅程總覽確認出現 User #2

- [ ] **Step 6: Commit**

```bash
git add src/views/JourneyDashboard.vue src/router/index.ts src/views/AiViewer.vue
git commit -m "feat: add JourneyDashboard page, route, and AiViewer nav entry"
```
