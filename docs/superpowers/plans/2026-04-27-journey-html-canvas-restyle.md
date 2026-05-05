# Journey HTML Canvas Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將三個旅程 HTML iframe 改為淺色 canvas 風格，保留所有 postMessage 功能。

**Architecture:** 每個 HTML 檔案完整重寫 CSS + HTML 結構（節點改用 header pill 設計），JavaScript 區塊原封不動保留。三個任務完全獨立，可依序執行。

**Tech Stack:** 純 HTML / CSS，無外部依賴

---

## File Map

| 動作 | 路徑 |
|------|------|
| Rewrite | `public/hurricane_trailsetter_journey_dashboard.html` |
| Rewrite | `public/hurricane_trailsetter_birthday_journey.html` |
| Rewrite | `public/hurricane_trailsetter_journey_flow.html` |

---

### Task 1：重寫 hurricane_trailsetter_journey_dashboard.html

**Files:**
- Modify: `public/hurricane_trailsetter_journey_dashboard.html`

**關鍵規則：**
- `<script>` 區塊原封不動，一個字元都不能改
- 保留所有 `id="node-D*"` 屬性（JavaScript 依賴）
- 保留所有 `.vline[data-prev]` 結構（JavaScript 依賴）
- 保留 `id="btn-start"` 和 `id="btn-modify"`

- [ ] **Step 1：用以下完整內容取代整個 dashboard.html**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>旅程總覽</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:'Helvetica Neue','PingFang TC',sans-serif;font-size:12px;color:#1a1d23}
body{display:flex;flex-direction:column;height:100vh;overflow:hidden}

/* ── Topbar ── */
.topbar{background:#fff;border-bottom:1px solid #e5e7eb;padding:10px 16px;
  display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.topbar-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#3b72f6;margin-bottom:2px}
.topbar-title{font-size:13px;font-weight:800;letter-spacing:-.3px}
.btn-start{background:#3b72f6;color:#fff;border:none;border-radius:8px;
  padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;transition:background .2s}
.btn-start:hover{background:#2563eb}
.btn-modify{background:#fff;color:#3b72f6;border:1.5px solid #bfdbfe;border-radius:8px;
  padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;transition:background .2s,color .2s}
.btn-modify:hover{background:#eff6ff}
.topbar-actions{display:flex;gap:8px;align-items:center}

/* ── Canvas ── */
.canvas-area{
  flex:1;position:relative;overflow:hidden;
  background-color:#f8faff;
  background-image:radial-gradient(circle,#c7d2fe 1px,transparent 1px);
  background-size:24px 24px;
}

/* ── Zoom controls (visual only) ── */
.zoom-ctrl{
  position:absolute;top:10px;right:10px;
  background:#fff;border:1px solid #e5e7eb;border-radius:8px;
  display:flex;align-items:center;overflow:hidden;
  box-shadow:0 1px 4px rgba(0,0,0,.08);z-index:10;
}
.zoom-btn{background:none;border:none;color:#6b7280;width:28px;height:28px;
  cursor:pointer;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center}
.zoom-btn:hover{background:#f3f4f6}
.zoom-val{font-size:11px;color:#374151;padding:0 8px;font-weight:600;
  border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;
  height:28px;display:flex;align-items:center}

/* ── Flow (scrollable) ── */
.flow{
  position:absolute;inset:0;overflow-y:auto;
  display:flex;flex-direction:column;align-items:center;
  padding:20px 16px 40px;
}

/* ── Node card ── */
.jnode{
  width:240px;background:#fff;border:1px solid #e5e7eb;
  border-radius:10px;overflow:hidden;position:relative;
  box-shadow:0 1px 6px rgba(0,0,0,.06);transition:box-shadow .3s;
}
.jnode.running{box-shadow:0 0 0 3px rgba(59,114,246,.2),0 2px 8px rgba(0,0,0,.08)}
.jnode.done{opacity:.8}

/* Node accent border */
.jnode-blue  {border-left:3px solid #3b72f6}
.jnode-teal  {border-left:3px solid #0891b2}
.jnode-purple{border-left:3px solid #7c3aed}
.jnode-green {border-left:3px solid #16a34a}

/* Node header pill */
.jnode-hdr{padding:5px 10px 4px;display:flex;align-items:center;gap:5px;
  font-size:9px;font-weight:700;letter-spacing:.03em}
.hdr-blue  {background:#eff6ff;color:#2563eb}
.hdr-teal  {background:#f0fdfe;color:#0891b2}
.hdr-purple{background:#f5f3ff;color:#7c3aed}
.hdr-green {background:#f0fdf4;color:#16a34a}

/* Node body */
.jnode-body{padding:7px 10px 9px}
.jnode-title{font-size:11px;font-weight:700;color:#1a1d23;margin-bottom:2px}
.jnode-sub{font-size:10px;color:#6b7280;line-height:1.4}

/* Done badge */
.done-badge{
  position:absolute;top:-5px;right:-5px;width:15px;height:15px;
  border-radius:50%;background:#16a34a;color:#fff;font-size:9px;font-weight:700;
  display:flex;align-items:center;justify-content:center;border:2px solid #fff;
}

/* Running pill */
.running-pill{display:inline-flex;align-items:center;gap:3px;
  font-size:9px;color:#3b72f6;font-weight:600;margin-top:5px}
.running-dot{width:5px;height:5px;border-radius:50%;background:#3b72f6;
  animation:blink 1s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}

/* Connector */
.vline{width:2px;height:14px;background:#d1d5db;flex-shrink:0}
.vline.done{background:#16a34a}

/* Branch */
.branch-area{width:100%;max-width:240px;display:flex;flex-direction:column;align-items:center}
.branch-connector{display:flex;width:50%;justify-content:space-between;position:relative;margin-bottom:0}
.branch-connector::before{content:'';position:absolute;top:0;left:0;right:0;height:1.5px;background:#d1d5db}
.branch-v{width:1.5px;height:14px;background:#d1d5db}
.branch-row{display:flex;width:100%;gap:8px}
.branch-side{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px}
.branch-tag{font-size:8px;font-weight:700;padding:2px 7px;border-radius:8px}
.branch-tag.yes{background:#dcfce7;color:#166534}
.branch-tag.no{background:#fef9c3;color:#92400e}
.branch-card{width:100%;border-radius:7px;padding:7px 9px;border:1px solid #e5e7eb;
  background:#fff;font-size:10px;color:#6b7280}
.branch-card-label{font-size:9px;font-weight:700;margin-bottom:3px;color:#1a1d23}
</style>
</head>
<body>

<!-- Topbar -->
<div class="topbar">
  <div>
    <div class="topbar-label">Hurricane Trailsetter · AW26</div>
    <div class="topbar-title">🗺️ 行銷自動化旅程</div>
  </div>
  <div class="topbar-actions">
    <button class="btn-modify" id="btn-modify">＋ 新增旅程修改需求</button>
    <button class="btn-start" id="btn-start">▶ 啟動旅程</button>
  </div>
</div>

<!-- Canvas -->
<div class="canvas-area">
  <div class="zoom-ctrl">
    <button class="zoom-btn">−</button>
    <span class="zoom-val">100%</span>
    <button class="zoom-btn">+</button>
  </div>

  <div class="flow" id="treePanel">

    <!-- D0 -->
    <div class="jnode jnode-blue pending" id="node-D0">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-blue">⚡ 旅程起點：觸發</div>
      <div class="jnode-body">
        <div class="jnode-title">觸發加入旅程</div>
        <div class="jnode-sub">🚀 首次訪問 / 加入購物車</div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>
    <div class="vline" data-prev="D0"></div>

    <!-- D1 -->
    <div class="jnode jnode-teal pending" id="node-D1">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-teal">✉ 訊息發送</div>
      <div class="jnode-body">
        <div class="jnode-title">歡迎序列啟動</div>
        <div class="jnode-sub">💌 Email + LINE 歡迎</div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>
    <div class="vline" data-prev="D1"></div>

    <!-- D3 -->
    <div class="jnode jnode-purple pending" id="node-D3">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-purple">⑂ 條件分流</div>
      <div class="jnode-body">
        <div class="jnode-title">行為條件分流</div>
        <div class="jnode-sub">🔀 Email 開啟條件</div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>
    <!-- D3 branches -->
    <div class="branch-area">
      <div class="branch-connector">
        <div class="branch-v"></div>
        <div class="branch-v"></div>
      </div>
      <div class="branch-row">
        <div class="branch-side">
          <span class="branch-tag yes">是 ✓</span>
          <div class="branch-card">
            <div class="branch-card-label">已開啟 Email</div>
            <div>限時優惠碼 + LINE 提醒</div>
          </div>
        </div>
        <div class="branch-side">
          <span class="branch-tag no">否 ✗</span>
          <div class="branch-card">
            <div class="branch-card-label">未開啟</div>
            <div>換標題重發 + 再行銷</div>
          </div>
        </div>
      </div>
    </div>
    <div class="vline" data-prev="D3"></div>

    <!-- D7 -->
    <div class="jnode jnode-teal pending" id="node-D7">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-teal">📖 產品培育</div>
      <div class="jnode-body">
        <div class="jnode-title">產品深度培育</div>
        <div class="jnode-sub">📖 Email + IG 廣告</div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>
    <div class="vline" data-prev="D7"></div>

    <!-- D14 -->
    <div class="jnode jnode-teal pending" id="node-D14">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-teal">⚡ 轉換衝刺</div>
      <div class="jnode-body">
        <div class="jnode-title">購買轉換衝刺</div>
        <div class="jnode-sub">⚡ 未結帳提醒</div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>
    <div class="vline" data-prev="D14"></div>

    <!-- D30 -->
    <div class="jnode jnode-green pending" id="node-D30">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-green">⭐ 旅程終點</div>
      <div class="jnode-body">
        <div class="jnode-title">購後回購培育</div>
        <div class="jnode-sub">⭐ 完成購買 / 回購</div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>

  </div>
</div>

<script>
var _journeys = [];

// ── Tree rendering ───────────────────────────────────────────────
var NODE_KEYS = ['D0','D1','D3','D7','D14','D30'];

function renderTree(journeys) {
  var latest = (journeys && journeys.length > 0) ? journeys[0] : null;

  NODE_KEYS.forEach(function(key) {
    var el = document.getElementById('node-' + key);
    if (!el) return;

    var status = 'pending';
    if (latest) {
      var found = null;
      for (var i = 0; i < latest.nodes.length; i++) {
        if (latest.nodes[i].key === key) { found = latest.nodes[i]; break; }
      }
      if (found) {
        status = (found.status === 'running' || found.status === 'done') ? found.status : 'pending';
      }
    }

    el.classList.remove('pending', 'running', 'done');
    el.classList.add(status);

    var badge = el.querySelector('.done-badge');
    if (badge) badge.style.display = status === 'done' ? 'flex' : 'none';

    var pill = el.querySelector('.running-pill');
    if (pill) pill.style.display = status === 'running' ? 'inline-flex' : 'none';
  });

  var vlines = document.querySelectorAll('.vline[data-prev]');
  for (var j = 0; j < vlines.length; j++) {
    var vl = vlines[j];
    var prevKey = vl.getAttribute('data-prev');
    var prevStatus = 'pending';
    if (latest) {
      for (var k = 0; k < latest.nodes.length; k++) {
        if (latest.nodes[k].key === prevKey) {
          prevStatus = latest.nodes[k].status;
          break;
        }
      }
    }
    vl.classList.remove('done');
    if (prevStatus === 'done') vl.classList.add('done');
  }
}

// ── Event wiring ─────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', function() {
  window.parent.postMessage({ type: 'journey-start-request' }, '*');
});

document.getElementById('btn-modify').addEventListener('click', function() {
  window.parent.postMessage({ type: 'journey-modify-request' }, '*');
});

window.addEventListener('message', function(e) {
  if (!e.data) return;
  if (e.data.type === 'journey-state-sync') {
    if (!Array.isArray(e.data.journeys)) return;
    _journeys = e.data.journeys;
    renderTree(_journeys);
  }
});

window.parent.postMessage({ type: 'journey-state-request' }, '*');
</script>
</body>
</html>
```

- [ ] **Step 2：在瀏覽器開啟 `/hurricane_trailsetter_journey_dashboard.html` 確認**

```bash
open http://localhost:5173/hurricane_trailsetter_journey_dashboard.html
```

確認：
- 淺藍色點狀格線背景
- 頂部 topbar 有兩個按鈕
- 右上角縮放控制
- 六個節點各有彩色 header pill + 白底卡片
- D3 有 branch 分流

- [ ] **Step 3：Commit**

```bash
git add public/hurricane_trailsetter_journey_dashboard.html
git commit -m "feat: restyle journey dashboard to light canvas with header pill nodes"
```

---

### Task 2：重寫 hurricane_trailsetter_birthday_journey.html

**Files:**
- Modify: `public/hurricane_trailsetter_birthday_journey.html`

**關鍵規則：**
- `<script>` 區塊原封不動
- 保留 `id="node-PRE7"`, `id="node-D0"`, `id="node-D1"`, `id="node-D7"`, `id="node-D30"`
- 保留 `.vline[data-prev]` 結構
- 保留 `id="btn-start"` 和 `id="btn-modify"`
- message type 仍是 `birthday-journey-state-sync` 和 `birthday-journey-state-request`

- [ ] **Step 1：用以下完整內容取代整個 birthday_journey.html**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>5月壽星專屬旅程</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;font-family:'Helvetica Neue','PingFang TC',sans-serif;font-size:12px;color:#1a1d23}
body{display:flex;flex-direction:column;height:100vh;overflow:hidden}

/* ── Topbar ── */
.topbar{background:#fff;border-bottom:1px solid #e5e7eb;padding:10px 16px;
  display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.topbar-label{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#7c3aed;margin-bottom:2px}
.topbar-title{font-size:13px;font-weight:800;letter-spacing:-.3px}
.topbar-badge{display:inline-block;font-size:8px;font-weight:700;background:#fdf2f8;
  color:#db2777;border:1px solid #fbcfe8;border-radius:4px;
  padding:1px 6px;margin-left:6px;vertical-align:middle}
.topbar-actions{display:flex;gap:8px;align-items:center}
.btn-start{background:#7c3aed;color:#fff;border:none;border-radius:8px;
  padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;transition:background .2s}
.btn-start:hover{background:#6d28d9}
.btn-modify{background:#fff;color:#7c3aed;border:1.5px solid #ddd6fe;border-radius:8px;
  padding:7px 14px;font-size:11px;font-weight:700;cursor:pointer;transition:background .2s,color .2s}
.btn-modify:hover{background:#f5f3ff}

/* ── Segment bar ── */
.segment-bar{background:#f5f3ff;border-bottom:1px solid #ddd6fe;padding:8px 16px;
  display:flex;gap:16px;flex-shrink:0}
.seg-stat{text-align:center}
.seg-val{font-size:14px;font-weight:800;color:#7c3aed}
.seg-label{font-size:9px;color:#9ca3af;margin-top:1px}

/* ── Canvas ── */
.canvas-area{
  flex:1;position:relative;overflow:hidden;
  background-color:#faf5ff;
  background-image:radial-gradient(circle,#ddd6fe 1px,transparent 1px);
  background-size:24px 24px;
}

/* ── Zoom controls ── */
.zoom-ctrl{
  position:absolute;top:10px;right:10px;
  background:#fff;border:1px solid #e5e7eb;border-radius:8px;
  display:flex;align-items:center;overflow:hidden;
  box-shadow:0 1px 4px rgba(0,0,0,.08);z-index:10;
}
.zoom-btn{background:none;border:none;color:#6b7280;width:28px;height:28px;
  cursor:pointer;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center}
.zoom-btn:hover{background:#f3f4f6}
.zoom-val{font-size:11px;color:#374151;padding:0 8px;font-weight:600;
  border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;
  height:28px;display:flex;align-items:center}

/* ── Flow ── */
.flow{
  position:absolute;inset:0;overflow-y:auto;
  display:flex;flex-direction:column;align-items:center;
  padding:20px 16px 40px;
}

/* ── Node card ── */
.jnode{
  width:260px;background:#fff;border:1px solid #e5e7eb;
  border-radius:10px;overflow:hidden;position:relative;
  box-shadow:0 1px 6px rgba(0,0,0,.06);transition:box-shadow .3s;
}
.jnode.running{box-shadow:0 0 0 3px rgba(124,58,237,.2),0 2px 8px rgba(0,0,0,.08)}
.jnode.done{opacity:.8}

/* Node accent borders */
.jnode-purple{border-left:3px solid #7c3aed}
.jnode-pink  {border-left:3px solid #db2777}
.jnode-teal  {border-left:3px solid #0891b2}
.jnode-green {border-left:3px solid #16a34a}

/* Node header pill */
.jnode-hdr{padding:5px 10px 4px;display:flex;align-items:center;gap:5px;
  font-size:9px;font-weight:700;letter-spacing:.03em}
.hdr-purple{background:#f5f3ff;color:#7c3aed}
.hdr-pink  {background:#fdf2f8;color:#db2777}
.hdr-teal  {background:#f0fdfe;color:#0891b2}
.hdr-green {background:#f0fdf4;color:#16a34a}

/* Node body */
.jnode-body{padding:7px 10px 9px}
.jnode-title{font-size:11px;font-weight:700;color:#1a1d23;margin-bottom:2px}
.jnode-sub{font-size:10px;color:#6b7280;line-height:1.4}
.node-timing{font-size:8px;font-weight:600;background:#f3f4f6;color:#9ca3af;
  border-radius:4px;padding:0 5px;line-height:16px;display:inline-block;margin-left:4px}
.node-channels{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.ch-tag{font-size:8px;font-weight:600;padding:1px 6px;border-radius:4px;background:rgba(0,0,0,.05);color:#6b7280}

/* Done badge */
.done-badge{
  position:absolute;top:-5px;right:-5px;width:15px;height:15px;
  border-radius:50%;background:#16a34a;color:#fff;font-size:9px;font-weight:700;
  display:flex;align-items:center;justify-content:center;border:2px solid #fff;
}

/* Running pill (purple for birthday) */
.running-pill{display:inline-flex;align-items:center;gap:3px;
  font-size:9px;color:#7c3aed;font-weight:600;margin-top:5px}
.running-dot{width:5px;height:5px;border-radius:50%;background:#7c3aed;
  animation:bday-blink 1s ease-in-out infinite}
@keyframes bday-blink{0%,100%{opacity:1}50%{opacity:.2}}

/* Connector */
.vline{width:2px;height:14px;background:#d1d5db;flex-shrink:0}
.vline.done{background:#16a34a}

/* Branch */
.branch-area{width:100%;max-width:260px;display:flex;flex-direction:column;align-items:center}
.branch-connector{display:flex;width:55%;justify-content:space-between;position:relative;margin-bottom:0}
.branch-connector::before{content:'';position:absolute;top:0;left:0;right:0;height:1.5px;background:#d1d5db}
.branch-v{width:1.5px;height:14px;background:#d1d5db}
.branch-row{display:flex;width:100%;gap:6px}
.branch-side{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px}
.branch-tag{font-size:8px;font-weight:700;padding:2px 6px;border-radius:8px}
.branch-tag.yes{background:#dcfce7;color:#166534}
.branch-tag.no{background:#fce7f3;color:#9d174d}
.branch-card{width:100%;border-radius:7px;padding:6px 8px;border:1px solid #e5e7eb;
  background:#fff;font-size:9px;color:#6b7280}
.branch-card-label{font-size:8px;font-weight:700;margin-bottom:3px;color:#1a1d23}
</style>
</head>
<body>

<!-- Topbar -->
<div class="topbar">
  <div>
    <div class="topbar-label">Hurricane Trailsetter · 台北地區</div>
    <div class="topbar-title">🎂 5月壽星專屬旅程<span class="topbar-badge">AI 生成</span></div>
  </div>
  <div class="topbar-actions">
    <button class="btn-modify" id="btn-modify">＋ 新增旅程修改需求</button>
    <button class="btn-start" id="btn-start">▶ 啟動旅程</button>
  </div>
</div>

<!-- Segment stats -->
<div class="segment-bar">
  <div class="seg-stat"><div class="seg-val">1,284</div><div class="seg-label">目標用戶</div></div>
  <div class="seg-stat"><div class="seg-val">台北市</div><div class="seg-label">地區</div></div>
  <div class="seg-stat"><div class="seg-val">5月</div><div class="seg-label">生日月份</div></div>
  <div class="seg-stat"><div class="seg-val">+38%</div><div class="seg-label">預估轉換提升</div></div>
</div>

<!-- Canvas -->
<div class="canvas-area">
  <div class="zoom-ctrl">
    <button class="zoom-btn">−</button>
    <span class="zoom-val">100%</span>
    <button class="zoom-btn">+</button>
  </div>

  <div class="flow" id="treePanel">

    <!-- PRE7 -->
    <div class="jnode jnode-purple pending" id="node-PRE7">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-purple">🎯 篩選過濾</div>
      <div class="jnode-body">
        <div class="jnode-title">壽星名單篩選啟動 <span class="node-timing">生日前 7 天</span></div>
        <div class="jnode-sub">🎯 台北 · 5月生日 · 近6個月活躍</div>
        <div class="node-channels">
          <span class="ch-tag">CDP 篩選</span><span class="ch-tag">Email</span><span class="ch-tag">LINE</span>
        </div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>
    <div class="vline" data-prev="PRE7"></div>

    <!-- D0 -->
    <div class="jnode jnode-pink pending" id="node-D0">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-pink">🎂 生日觸發</div>
      <div class="jnode-body">
        <div class="jnode-title">生日驚喜觸發 <span class="node-timing">生日當天</span></div>
        <div class="jnode-sub">🎁 多渠道生日祝福 + 專屬優惠碼</div>
        <div class="node-channels">
          <span class="ch-tag">Email</span><span class="ch-tag">LINE</span><span class="ch-tag">SMS</span>
        </div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>
    <div class="vline" data-prev="D0"></div>

    <!-- D1 -->
    <div class="jnode jnode-teal pending" id="node-D1">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-teal">📊 使用追蹤</div>
      <div class="jnode-body">
        <div class="jnode-title">生日禮使用追蹤 <span class="node-timing">生日後 1 天</span></div>
        <div class="jnode-sub">📊 是否開啟優惠碼條件判斷</div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>
    <!-- D1 branch -->
    <div class="branch-area">
      <div class="branch-connector">
        <div class="branch-v"></div>
        <div class="branch-v"></div>
      </div>
      <div class="branch-row">
        <div class="branch-side">
          <span class="branch-tag yes">已使用 ✓</span>
          <div class="branch-card">
            <div class="branch-card-label">已兌換生日優惠</div>
            <div>VIP感謝訊息<br>推薦獎勵邀請</div>
          </div>
        </div>
        <div class="branch-side">
          <span class="branch-tag no">未使用 ✗</span>
          <div class="branch-card">
            <div class="branch-card-label">尚未使用優惠碼</div>
            <div>延長優惠期限<br>LINE 再提醒</div>
          </div>
        </div>
      </div>
    </div>
    <div class="vline" data-prev="D1"></div>

    <!-- D7 -->
    <div class="jnode jnode-teal pending" id="node-D7">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-teal">🛍️ 回購培育</div>
      <div class="jnode-body">
        <div class="jnode-title">壽星專屬回購培育 <span class="node-timing">生日後 7 天</span></div>
        <div class="jnode-sub">🛍️ 台北門市限定推薦 + 社群廣告</div>
        <div class="node-channels">
          <span class="ch-tag">Email</span><span class="ch-tag">IG Ads</span><span class="ch-tag">LINE</span>
        </div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>
    <div class="vline" data-prev="D7"></div>

    <!-- D30 -->
    <div class="jnode jnode-green pending" id="node-D30">
      <div class="done-badge" style="display:none">✓</div>
      <div class="jnode-hdr hdr-green">📈 旅程終點</div>
      <div class="jnode-body">
        <div class="jnode-title">旅程成效報告 <span class="node-timing">旅程總結</span></div>
        <div class="jnode-sub">📈 轉換率統計 → 下月壽星預備</div>
        <div class="node-channels">
          <span class="ch-tag">報表匯出</span><span class="ch-tag">下月預備</span>
        </div>
        <div class="running-pill" style="display:none"><span class="running-dot"></span>執行中</div>
      </div>
    </div>

  </div>
</div>

<script>
var NODE_KEYS = ['PRE7','D0','D1','D7','D30'];

function renderTree(journeys) {
  var latest = (journeys && journeys.length > 0) ? journeys[0] : null;
  NODE_KEYS.forEach(function(key) {
    var el = document.getElementById('node-' + key);
    if (!el) return;
    var status = 'pending';
    if (latest) {
      for (var i = 0; i < latest.nodes.length; i++) {
        if (latest.nodes[i].key === key) {
          var s = latest.nodes[i].status;
          status = (s === 'running' || s === 'done') ? s : 'pending';
          break;
        }
      }
    }
    el.classList.remove('pending','running','done');
    el.classList.add(status);
    var badge = el.querySelector('.done-badge');
    if (badge) badge.style.display = status === 'done' ? 'flex' : 'none';
    var pill = el.querySelector('.running-pill');
    if (pill) pill.style.display = status === 'running' ? 'inline-flex' : 'none';
  });
}

document.getElementById('btn-start').addEventListener('click', function() {
  window.parent.postMessage({ type: 'journey-start-request', journeyType: 'birthday' }, '*');
});

document.getElementById('btn-modify').addEventListener('click', function() {
  window.parent.postMessage({ type: 'journey-modify-request' }, '*');
});

window.addEventListener('message', function(e) {
  if (!e.data) return;
  if (e.data.type === 'birthday-journey-state-sync') {
    if (!Array.isArray(e.data.journeys)) return;
    renderTree(e.data.journeys);
  }
});

window.parent.postMessage({ type: 'birthday-journey-state-request' }, '*');
</script>
</body>
</html>
```

- [ ] **Step 2：在瀏覽器驗證**

```bash
open http://localhost:5173/hurricane_trailsetter_birthday_journey.html
```

確認：
- 淡紫色格線背景
- Segment bar（1,284 / 台北市 / 5月 / +38%）在 topbar 下方
- 五個節點各有 header pill
- D1 有 branch 分流
- running pill 是紫色

- [ ] **Step 3：Commit**

```bash
git add public/hurricane_trailsetter_birthday_journey.html
git commit -m "feat: restyle birthday journey to light canvas with header pill nodes"
```

---

### Task 3：更新 hurricane_trailsetter_journey_flow.html 樣式

**Files:**
- Modify: `public/hurricane_trailsetter_journey_flow.html`

此檔案為靜態報告（無 JavaScript），只更新 `<style>` 區塊使視覺語言一致。HTML 結構和內容不動。

- [ ] **Step 1：完整替換 `<style>` 區塊**

找到 `<style>` 到 `</style>` 的整個區塊，用以下內容取代：

```css
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #f8faff;
      --surface: #ffffff;
      --border: #e5e7eb;
      --border-base: #e5e7eb;
      --text: #1a1d23;
      --text-2: #4b5563;
      --text-3: #9ca3af;
      --green: #16a34a;
      --green-mid: #10b981;
      --green-light: #dcfce7;
      --green-xlight: #f0fdf4;
      --green-deep: #166534;
      --blue: #3b72f6;
      --blue-light: #dbeafe;
      --purple: #7c3aed;
      --purple-light: #ede9fe;
      --orange: #ea580c;
      --orange-light: #ffedd5;
      --red: #dc2626;
      --red-light: #fee2e2;
      --yellow: #d97706;
      --yellow-light: #fef3c7;
    }

    body {
      background-color: var(--bg);
      background-image: radial-gradient(circle, #c7d2fe 1px, transparent 1px);
      background-size: 24px 24px;
      font-family: 'Helvetica Neue', 'PingFang TC', 'Microsoft JhengHei', sans-serif;
      color: var(--text);
      padding: 24px 20px 48px;
      font-size: 13px;
      line-height: 1.5;
    }

    /* ── Header ── */
    .report-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 12px;
    }
    .report-brand {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #3b72f6;
      margin-bottom: 3px;
    }
    .report-title {
      font-size: 19px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.3px;
    }
    .report-meta {
      font-size: 11px;
      color: var(--text-3);
      margin-top: 3px;
    }
    .report-tag {
      font-size: 10px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      background: #eff6ff;
      color: #3b72f6;
      border: 1px solid #bfdbfe;
      white-space: nowrap;
      align-self: flex-start;
      margin-top: 2px;
    }

    /* ── KPI strip ── */
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .kpi-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-3);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.5px;
    }
    .kpi-value.green { color: var(--green); }
    .kpi-value.blue  { color: var(--blue); }
    .kpi-value.orange { color: var(--orange); }
    .kpi-sub {
      font-size: 10px;
      color: var(--text-3);
      margin-top: 2px;
    }

    /* ── Section label ── */
    .sec-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-3);
      margin: 18px 0 10px;
    }

    /* ── Flow canvas ── */
    .flow-canvas {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px 16px;
      position: relative;
      box-shadow: 0 1px 8px rgba(0,0,0,.06);
    }

    /* column layout: Entry | Email branch | LINE branch | Ads branch */
    .flow-grid {
      display: grid;
      grid-template-columns: 110px 1fr 1fr 1fr;
      gap: 0 16px;
      align-items: start;
    }

    /* ── Node types ── */
    .node {
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 11px;
      font-weight: 600;
      line-height: 1.4;
      text-align: center;
      position: relative;
    }
    .node-trigger {
      background: #3b72f6;
      color: #fff;
      border-radius: 20px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 700;
    }
    .node-email {
      background: var(--blue-light);
      color: var(--blue);
      border: 1px solid #93c5fd;
    }
    .node-line {
      background: var(--green-light);
      color: var(--green-deep);
      border: 1px solid #86efac;
    }
    .node-ads {
      background: var(--yellow-light);
      color: var(--yellow);
      border: 1px solid #fcd34d;
    }
    .node-condition {
      background: var(--purple-light);
      color: var(--purple);
      border: 1px solid #c4b5fd;
      border-radius: 6px;
      font-size: 10px;
    }
    .node-action-yes {
      background: var(--green-xlight);
      color: var(--green-deep);
      border: 1px solid #86efac;
    }
    .node-action-no {
      background: var(--red-light);
      color: var(--red);
      border: 1px solid #fca5a5;
    }
    .node-convert {
      background: var(--green);
      color: #fff;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }
    .node-end {
      background: #f9fafb;
      color: var(--text-2);
      border: 1px dashed var(--border);
      font-size: 10px;
    }

    /* ── Channel column header ── */
    .ch-header {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 12px;
      padding: 5px 8px;
      border-radius: 6px;
    }
    .ch-email { background: var(--blue-light); color: var(--blue); }
    .ch-line  { background: var(--green-light); color: var(--green-deep); }
    .ch-ads   { background: var(--yellow-light); color: var(--yellow); }

    .ch-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .dot-blue   { background: var(--blue); }
    .dot-green  { background: var(--green); }
    .dot-yellow { background: var(--yellow); }

    /* ── Arrow ── */
    .arrow {
      text-align: center;
      font-size: 14px;
      color: var(--text-3);
      line-height: 1;
      margin: 3px 0;
    }
    .arrow-label {
      font-size: 9px;
      font-weight: 600;
      color: var(--text-3);
      text-align: center;
      margin-bottom: 1px;
    }

    /* ── Branch row ── */
    .branch-row {
      display: flex;
      gap: 6px;
      margin: 3px 0;
    }
    .branch-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
    }

    /* ── Entry column ── */
    .entry-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding-top: 28px;
    }
    .entry-label {
      font-size: 9px;
      font-weight: 600;
      color: var(--text-3);
      text-align: center;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .trigger-sources {
      display: flex;
      flex-direction: column;
      gap: 4px;
      width: 100%;
      margin-bottom: 6px;
    }
    .source-chip {
      font-size: 9px;
      font-weight: 600;
      padding: 3px 6px;
      border-radius: 4px;
      text-align: center;
    }
    .source-chip.web    { background: var(--blue-light); color: var(--blue); }
    .source-chip.social { background: var(--purple-light); color: var(--purple); }
    .source-chip.store  { background: var(--orange-light); color: var(--orange); }

    /* ── Channel column ── */
    .ch-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }
    .ch-col .node {
      width: 100%;
    }

    /* ── Day badge ── */
    .day-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      background: #eff6ff;
      color: #3b72f6;
      border: 1px solid #bfdbfe;
      display: inline-block;
      margin-bottom: 3px;
    }

    /* ── Rate bar ── */
    .rate-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 3px 0;
    }
    .rate-label { font-size: 10px; color: var(--text-3); flex-shrink: 0; }
    .rate-bar {
      flex: 1;
      height: 4px;
      background: var(--border);
      border-radius: 2px;
      overflow: hidden;
    }
    .rate-fill {
      height: 100%;
      border-radius: 2px;
    }
    .rate-val { font-size: 10px; font-weight: 700; flex-shrink: 0; }

    /* ── Bottom section: timeline + metrics ── */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 200px;
      gap: 10px;
      margin-top: 10px;
    }

    /* Timeline */
    .timeline-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .timeline-grid {
      display: grid;
      grid-template-columns: 44px repeat(6, 1fr);
      gap: 4px;
      font-size: 9px;
    }
    .tg-header {
      font-weight: 700;
      color: var(--text-3);
      text-align: center;
      padding-bottom: 4px;
    }
    .tg-ch-label {
      font-weight: 700;
      color: var(--text-2);
      font-size: 10px;
      display: flex;
      align-items: center;
    }
    .tg-cell {
      border-radius: 4px;
      padding: 4px 2px;
      text-align: center;
      font-weight: 600;
      min-height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tg-cell.email { background: var(--blue-light); color: var(--blue); }
    .tg-cell.line  { background: var(--green-light); color: var(--green-deep); }
    .tg-cell.ads   { background: var(--yellow-light); color: var(--yellow); }
    .tg-cell.empty { background: transparent; }
    .tg-sep { height: 3px; }

    /* Metrics side */
    .metrics-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,.05);
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      border-bottom: 1px solid var(--border);
      font-size: 11px;
    }
    .metric-row:last-child { border-bottom: none; }
    .metric-name { color: var(--text-2); }
    .metric-val { font-weight: 700; color: var(--text); }
    .metric-val.green { color: var(--green); }
    .metric-val.blue  { color: var(--blue); }
    .metric-val.orange { color: var(--orange); }
```

- [ ] **Step 2：在瀏覽器驗證**

```bash
open http://localhost:5173/hurricane_trailsetter_journey_flow.html
```

確認：
- 背景有藍色點狀格線
- KPI 卡片和 flow-canvas 白底帶陰影
- `day-badge` 改為藍色系（原為綠色系）
- `report-tag` 改為藍色系
- `report-brand` 改為藍色

- [ ] **Step 3：Commit**

```bash
git add public/hurricane_trailsetter_journey_flow.html
git commit -m "feat: restyle journey flow report to light canvas design language"
```
