# 畫布拖曳/縮放元件替換 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 寫一個原生 Vue 3 拖曳/縮放元件 `DragResizeBox.vue`，取代跟目前 Vue 版本不相容、會導致畫布區塊崩潰的第三方套件 `@gausszhou/vue3-drag-resize-rotate`。

**Architecture:** 拖曳/縮放的座標計算拆成一個獨立、無 DOM 依賴的純函式模組（`dragResizeMath.ts`），可以直接用 Vitest 單元測試涵蓋所有邊界情況（min/max 夾限、寬高比鎖定、格點對齊）。元件本身（`DragResizeBox.vue`）只負責用 Pointer Events API 把使用者的滑鼠/觸控操作轉成呼叫這些純函式，並維持跟現有 `VueDragResizeRotate` 完全一致的 props/events/slots 介面，讓呼叫端（`AiViewerContentBox.vue`）的業務邏輯不需要修改。

**Tech Stack:** Vue 3.5（`<script setup lang="ts">`）、原生 Pointer Events API（無額外套件依賴）、Vitest（純函式單元測試）。

**Spec:** [docs/superpowers/specs/2026-09-09-canvas-drag-resize-replacement-design.md](../specs/2026-09-09-canvas-drag-resize-replacement-design.md)

## Global Constraints

- 不使用 Options API，一律 `<script setup lang="ts">`
- 樣式統一在 `src/scss/` 管理，元件本身不寫 `<style scoped>`；沿用既有 `.vue-drag-resize-rotate`/`.handle`/`.handle-<position>` class 命名，`_AiViewer.scss` 不需要修改
- 不做縮放補償（沿用現有簡化行為，見 spec「座標系統」一節）
- 不實作旋轉功能
- 新元件的 props/events/slots 介面必須跟現有 `VueDragResizeRotate` 用法完全對應（見 spec 對照表），`AiViewerContentBox.vue` 除了替換標籤名稱與 import 之外不應該需要修改其他業務邏輯
- 保留 `hasRenderError`/`onErrorCaptured` error boundary（通用防護網，不因為這次根因解決就移除）

---

## Task 1: 拖曳/縮放座標計算的純函式模組（TDD）

**Files:**
- Create: `src/utils/dragResizeMath.ts`
- Test: `src/utils/__tests__/dragResizeMath.test.ts`

**Interfaces:**
- Produces：
  - `interface Box { x: number; y: number; width: number; height: number }`
  - `interface ResizeBounds { minWidth: number; minHeight: number; maxWidth: number; maxHeight: number }`
  - `type HandleName = 'tl' | 'tm' | 'tr' | 'mr' | 'br' | 'bm' | 'bl' | 'ml'`
  - `clamp(value: number, min: number, max: number): number`
  - `snapToGrid(value: number, gridSize: number): number`
  - `applyDrag(box: Box, dx: number, dy: number): { x: number; y: number }`
  - `applyResize(handle: HandleName, box: Box, dx: number, dy: number, bounds: ResizeBounds, lockAspectRatio?: boolean): Box`
  - 之後 Task 2/3 的 `DragResizeBox.vue` 會 import 這些名稱，簽名必須完全一致

- [ ] **Step 1: 寫失敗的測試**

建立 `src/utils/__tests__/dragResizeMath.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { clamp, snapToGrid, applyDrag, applyResize } from '@/utils/dragResizeMath';

describe('clamp', () => {
  it('數值在範圍內時原樣回傳', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });
  it('小於 min 時回傳 min', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });
  it('大於 max 時回傳 max', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });
});

describe('snapToGrid', () => {
  it('對齊到最近的格點倍數', () => {
    expect(snapToGrid(13, 5)).toBe(15);
    expect(snapToGrid(12, 5)).toBe(10);
  });
  it('gridSize 為 0 時原樣回傳（不對齊）', () => {
    expect(snapToGrid(13, 0)).toBe(13);
  });
  it('gridSize 為 1 時等於四捨五入到整數', () => {
    expect(snapToGrid(10.6, 1)).toBe(11);
  });
});

describe('applyDrag', () => {
  it('回傳位移後的座標，寬高不變（呼叫端另外處理）', () => {
    const result = applyDrag({ x: 100, y: 50, width: 200, height: 100 }, 20, -10);
    expect(result).toEqual({ x: 120, y: 40 });
  });
});

const NO_BOUNDS = { minWidth: 0, minHeight: 0, maxWidth: Infinity, maxHeight: Infinity };
const BOX = { x: 100, y: 100, width: 200, height: 100 };

describe('applyResize - 無邊界限制', () => {
  it('br（右下角）：往右下拖曳時寬高增加，x/y 不變', () => {
    const result = applyResize('br', BOX, 30, 20, NO_BOUNDS);
    expect(result).toEqual({ x: 100, y: 100, width: 230, height: 120 });
  });

  it('tl（左上角）：往右下拖曳時 x/y 跟著移動、寬高減少，右下角保持固定', () => {
    const result = applyResize('tl', BOX, 30, 20, NO_BOUNDS);
    expect(result).toEqual({ x: 130, y: 120, width: 170, height: 80 });
    // 驗證右下角座標真的沒變
    expect(result.x + result.width).toBe(BOX.x + BOX.width);
    expect(result.y + result.height).toBe(BOX.y + BOX.height);
  });

  it('tr（右上角）：x 不變，y 跟著移動，寬度增加、高度減少', () => {
    const result = applyResize('tr', BOX, 30, 20, NO_BOUNDS);
    expect(result).toEqual({ x: 100, y: 120, width: 230, height: 80 });
  });

  it('bl（左下角）：x 跟著移動，y 不變，寬度減少、高度增加', () => {
    const result = applyResize('bl', BOX, 30, 20, NO_BOUNDS);
    expect(result).toEqual({ x: 130, y: 100, width: 170, height: 120 });
  });

  it('tm（上邊中點）：只有 y/height 變化', () => {
    const result = applyResize('tm', BOX, 999, 20, NO_BOUNDS);
    expect(result).toEqual({ x: 100, y: 120, width: 200, height: 80 });
  });

  it('bm（下邊中點）：只有 height 變化', () => {
    const result = applyResize('bm', BOX, 999, 20, NO_BOUNDS);
    expect(result).toEqual({ x: 100, y: 100, width: 200, height: 120 });
  });

  it('ml（左邊中點）：只有 x/width 變化', () => {
    const result = applyResize('ml', BOX, 30, 999, NO_BOUNDS);
    expect(result).toEqual({ x: 130, y: 100, width: 170, height: 100 });
  });

  it('mr（右邊中點）：只有 width 變化', () => {
    const result = applyResize('mr', BOX, 30, 999, NO_BOUNDS);
    expect(result).toEqual({ x: 100, y: 100, width: 230, height: 100 });
  });
});

describe('applyResize - 邊界夾限', () => {
  it('br 縮到比 minWidth/minHeight 還小時，夾在下限', () => {
    const bounds = { minWidth: 50, minHeight: 50, maxWidth: Infinity, maxHeight: Infinity };
    const result = applyResize('br', BOX, -190, -90, bounds);
    expect(result.width).toBe(50);
    expect(result.height).toBe(50);
  });

  it('tl 拖到寬度會小於 minWidth 時，寬度夾在下限、右邊界仍然固定', () => {
    const bounds = { minWidth: 50, minHeight: 0, maxWidth: Infinity, maxHeight: Infinity };
    // 想把寬度從 200 縮到只剩 10（dx=190），應該被夾到 minWidth=50
    const result = applyResize('tl', BOX, 190, 0, bounds);
    expect(result.width).toBe(50);
    expect(result.x + result.width).toBe(BOX.x + BOX.width); // 右邊界仍固定
  });

  it('mr 放大超過 maxWidth 時，夾在上限', () => {
    const bounds = { minWidth: 0, minHeight: 0, maxWidth: 250, maxHeight: Infinity };
    const result = applyResize('mr', BOX, 999, 0, bounds);
    expect(result.width).toBe(250);
  });
});

describe('applyResize - lockAspectRatio', () => {
  it('角落控制點鎖定寬高比：br 只給寬度變化，高度依原始比例連動', () => {
    // BOX 寬高比 200:100 = 2:1
    const result = applyResize('br', BOX, 100, 0, NO_BOUNDS, true);
    expect(result.width).toBe(300);
    expect(result.height).toBe(150); // 300 / 2
  });

  it('邊中點控制點不受 lockAspectRatio 影響（單軸縮放語意上不適用鎖定）', () => {
    const result = applyResize('mr', BOX, 100, 0, NO_BOUNDS, true);
    expect(result.width).toBe(300);
    expect(result.height).toBe(100); // 不變
  });
});
```

- [ ] **Step 2: 執行測試，確認因為模組不存在而失敗**

Run: `npm run test:unit -- dragResizeMath`
Expected: 失敗，錯誤訊息類似 `Cannot find module '@/utils/dragResizeMath'`

- [ ] **Step 3: 寫最小實作讓測試通過**

建立 `src/utils/dragResizeMath.ts`：

```ts
// 畫布區塊拖曳/縮放的純座標計算——不依賴 DOM、不依賴 Vue，方便單獨做單元測試。
// 這裡刻意不做縮放比例補償（沿用專案既有的簡化行為，
// 見 docs/superpowers/specs/2026-09-09-canvas-drag-resize-replacement-design.md）。

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResizeBounds {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
}

export type HandleName = 'tl' | 'tm' | 'tr' | 'mr' | 'br' | 'bm' | 'bl' | 'ml';

// 每個控制點會移動哪些邊：left/top 為 true 代表該控制點拖曳時，
// 對應的起始邊（左/上）會跟著移動、而相對的邊（右/下）保持固定；
// right/bottom 為 true 則相反，起始邊固定、該邊本身變動。
const HANDLE_EDGES: Record<HandleName, { left?: true; top?: true; right?: true; bottom?: true }> = {
  tl: { left: true, top: true },
  tm: { top: true },
  tr: { top: true, right: true },
  mr: { right: true },
  br: { right: true, bottom: true },
  bm: { bottom: true },
  bl: { left: true, bottom: true },
  ml: { left: true },
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function snapToGrid(value: number, gridSize: number): number {
  if (!gridSize) return value;
  return Math.round(value / gridSize) * gridSize;
}

export function applyDrag(box: Box, dx: number, dy: number): { x: number; y: number } {
  return { x: box.x + dx, y: box.y + dy };
}

export function applyResize(
  handle: HandleName,
  box: Box,
  dx: number,
  dy: number,
  bounds: ResizeBounds,
  lockAspectRatio = false,
): Box {
  const edges = HANDLE_EDGES[handle];

  let width = box.width;
  let x = box.x;
  if (edges.right) {
    width = clamp(box.width + dx, bounds.minWidth, bounds.maxWidth);
  } else if (edges.left) {
    width = clamp(box.width - dx, bounds.minWidth, bounds.maxWidth);
    x = box.x + box.width - width; // 右邊界固定
  }

  let height = box.height;
  let y = box.y;
  if (edges.bottom) {
    height = clamp(box.height + dy, bounds.minHeight, bounds.maxHeight);
  } else if (edges.top) {
    height = clamp(box.height - dy, bounds.minHeight, bounds.maxHeight);
    y = box.y + box.height - height; // 下邊界固定
  }

  // 寬高比鎖定只套用在四個角落控制點；邊中點單軸縮放不適用「鎖定比例」的語意。
  const isCorner = (edges.left || edges.right) && (edges.top || edges.bottom);
  if (lockAspectRatio && isCorner && box.width > 0 && box.height > 0) {
    const ratio = box.width / box.height;
    const lockedHeight = clamp(width / ratio, bounds.minHeight, bounds.maxHeight);
    const lockedWidth = clamp(lockedHeight * ratio, bounds.minWidth, bounds.maxWidth);
    width = lockedWidth;
    height = lockedHeight;
    if (edges.left) x = box.x + box.width - width;
    if (edges.top) y = box.y + box.height - height;
  }

  return { x, y, width, height };
}
```

- [ ] **Step 4: 執行測試，確認全部通過**

Run: `npm run test:unit -- dragResizeMath`
Expected: 全部 PASS（約 18 個測試案例）

- [ ] **Step 5: Commit**

```bash
git add src/utils/dragResizeMath.ts src/utils/__tests__/dragResizeMath.test.ts
git commit -m "feat(canvas): add pure drag/resize math utility with tests

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: DragResizeBox.vue —— 基本結構與拖曳行為

**Files:**
- Create: `src/components/AiViewer/DragResizeBox.vue`

**Interfaces:**
- Consumes：Task 1 的 `applyDrag`、`snapToGrid`（從 `@/utils/dragResizeMath` import）
- Produces：元件名稱 `DragResizeBox`，props/events/slots 完整介面（見下方程式碼），Task 5 會直接拿來替換 `AiViewerContentBox.vue` 裡的 `<VueDragResizeRotate>`

這個 Task 先做「拖曳」（不含縮放控制點，`resizable` 先留著 prop 但控制點渲染留到 Task 3），讓每個 Task 都有一個可以獨立手動驗證的產出。

- [ ] **Step 1: 建立元件檔案**

建立 `src/components/AiViewer/DragResizeBox.vue`：

```vue
<template>
  <div
    :class="rootClasses"
    :style="rootStyle"
    @pointerdown="onBodyPointerDown"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { applyDrag, snapToGrid } from '@/utils/dragResizeMath';

const props = withDefaults(defineProps<{
  x: number;
  y: number;
  w: number;
  h: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  draggable?: boolean;
  resizable?: boolean;
  lockAspectRatio?: boolean;
  // 外部指定寬高比——目前 AiViewerContentBox.vue 呼叫端一律傳 false，
  // 沒有實際驗證邏輯；宣告這個 prop純粹是為了不讓它變成 fallthrough 屬性
  // 漏到根元素的 DOM 上（見 spec 對照表）。
  aspectRatio?: boolean;
  active?: boolean;
  z?: number | string;
  snap?: boolean;
  grid?: [number, number];
}>(), {
  minWidth: 0,
  minHeight: 0,
  maxWidth: Infinity,
  maxHeight: Infinity,
  draggable: true,
  resizable: true,
  lockAspectRatio: false,
  aspectRatio: false,
  active: false,
  z: 'auto',
  snap: false,
  grid: () => [1, 1],
});

const emit = defineEmits<{
  (e: 'activated'): void;
  (e: 'dragging', x: number, y: number, width: number, height: number): void;
  (e: 'resizing', x: number, y: number, width: number, height: number): void;
  (e: 'dragstop', x: number, y: number): void;
  (e: 'resizestop', x: number, y: number): void;
}>();

const isDragging = ref(false);
const isResizing = ref(false);

// class 命名沿用舊套件 @gausszhou/vue3-drag-resize-rotate 的慣例，
// 這樣 _AiViewer.scss 既有樣式不用修改。
const rootClasses = computed(() => [
  'vue-drag-resize-rotate',
  {
    active: props.active,
    draggable: props.draggable,
    resizable: props.resizable,
    dragging: isDragging.value,
    resizing: isResizing.value,
  },
]);

const rootStyle = computed(() => ({
  transform: `translate(${props.x}px, ${props.y}px)`,
  width: `${props.w}px`,
  height: `${props.h}px`,
  zIndex: props.z,
}));

// 統一的 pointer 拖曳追蹤：從 pointerdown 開始，持續呼叫 onMove（回傳目前算出的
// x/y 給收尾使用），pointerup/pointercancel 時呼叫 onEnd 並清掉監聽器。
// 用 setPointerCapture 讓游標拖出元素範圍外時仍能持續收到 pointermove/pointerup，
// 同一套邏輯滑鼠與觸控通用（觸控裝置在 jsdom 測試環境中 setPointerCapture
// 可能不存在，所以用 optional chaining 保護，不影響其餘邏輯）。
function startTracking(
  startEvent: PointerEvent,
  onMove: (dx: number, dy: number) => { x: number; y: number },
  onEnd: (x: number, y: number) => void,
) {
  const target = startEvent.currentTarget as HTMLElement;
  const startClientX = startEvent.clientX;
  const startClientY = startEvent.clientY;
  let lastResult = { x: props.x, y: props.y };
  target.setPointerCapture?.(startEvent.pointerId);

  function handleMove(moveEvent: PointerEvent) {
    const dx = moveEvent.clientX - startClientX;
    const dy = moveEvent.clientY - startClientY;
    lastResult = onMove(dx, dy);
  }
  function handleUp(upEvent: PointerEvent) {
    target.releasePointerCapture?.(upEvent.pointerId);
    target.removeEventListener('pointermove', handleMove);
    target.removeEventListener('pointerup', handleUp);
    target.removeEventListener('pointercancel', handleUp);
    onEnd(lastResult.x, lastResult.y);
  }
  target.addEventListener('pointermove', handleMove);
  target.addEventListener('pointerup', handleUp);
  target.addEventListener('pointercancel', handleUp);
}

function onBodyPointerDown(event: PointerEvent) {
  emit('activated');
  if (!props.draggable) return;
  startTracking(
    event,
    (dx, dy) => {
      isDragging.value = true;
      const { x, y } = applyDrag({ x: props.x, y: props.y, width: props.w, height: props.h }, dx, dy);
      const snappedX = props.snap ? snapToGrid(x, props.grid[0]) : x;
      const snappedY = props.snap ? snapToGrid(y, props.grid[1]) : y;
      emit('dragging', snappedX, snappedY, props.w, props.h);
      return { x: snappedX, y: snappedY };
    },
    (finalX, finalY) => {
      isDragging.value = false;
      emit('dragstop', finalX, finalY);
    },
  );
}
</script>
```

- [ ] **Step 2: 型別檢查與 lint**

Run: `npm run type-check && npx eslint src/components/AiViewer/DragResizeBox.vue`
Expected: 都沒有新增錯誤（這個檔案是全新的，理論上應該完全乾淨）

- [ ] **Step 3: Commit**

```bash
git add src/components/AiViewer/DragResizeBox.vue
git commit -m "feat(canvas): add DragResizeBox component with drag support

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: 加上 8 個縮放控制點

**Files:**
- Modify: `src/components/AiViewer/DragResizeBox.vue`

**Interfaces:**
- Consumes：Task 1 的 `applyResize`、`HandleName`
- Produces：`tl`/`tm`/`tr`/`mr`/`br`/`bm`/`bl`/`ml` 具名插槽（供呼叫端塞 icon），縮放行為透過 `resizing`/`resizestop` 事件對外，跟 Task 2 的拖曳事件是同一組 pointer 追蹤機制

- [ ] **Step 1: 加上控制點渲染與縮放邏輯**

修改 `src/components/AiViewer/DragResizeBox.vue`：

```vue
<template>
  <div
    :class="rootClasses"
    :style="rootStyle"
    @pointerdown="onBodyPointerDown"
  >
    <div
      v-if="props.resizable"
      v-for="handle in HANDLES"
      :key="handle"
      :class="['handle', `handle-${handle}`]"
      :style="handleStyle(handle)"
      @pointerdown.stop="onHandlePointerDown($event, handle)"
    >
      <slot :name="handle" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { applyDrag, applyResize, snapToGrid, type HandleName } from '@/utils/dragResizeMath';

const HANDLES: HandleName[] = ['tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml'];
const HANDLE_SIZE = 20; // px，跟呼叫端既有 .handle-icon（20px 圓點）搭配
const HANDLE_OFFSET = -10; // px，讓控制點熱區中心對齊區塊邊界

const CURSOR_MAP: Record<HandleName, string> = {
  tl: 'nwse-resize', tr: 'nesw-resize', br: 'nwse-resize', bl: 'nesw-resize',
  tm: 'ns-resize', bm: 'ns-resize', ml: 'ew-resize', mr: 'ew-resize',
};

/* ...props/emits 定義跟 Task 2 相同，這裡省略重複貼出，實作時直接在既有檔案基礎上加，不要整個檔案覆蓋重寫... */
</script>
```

> 注意給實作者：上面模板只列出「新增」的控制點渲染部分；`<script setup>` 裡 Task 2 已經寫好的 `props`／`emit`／`isDragging`／`isResizing`／`rootClasses`／`rootStyle`／`startTracking`／`onBodyPointerDown` 全部維持不變，用 Edit 工具在既有檔案上追加，不要整檔覆蓋。以下是這個 Task 要新增的兩個函式，加在 `onBodyPointerDown` 函式後面：

```ts
function handleStyle(handle: HandleName): Record<string, string> {
  const half = HANDLE_SIZE / 2;
  const style: Record<string, string> = {
    width: `${HANDLE_SIZE}px`,
    height: `${HANDLE_SIZE}px`,
    cursor: CURSOR_MAP[handle],
  };
  if (handle === 'tl' || handle === 'tm' || handle === 'tr') style.top = `${HANDLE_OFFSET}px`;
  if (handle === 'bl' || handle === 'bm' || handle === 'br') style.bottom = `${HANDLE_OFFSET}px`;
  if (handle === 'tl' || handle === 'ml' || handle === 'bl') style.left = `${HANDLE_OFFSET}px`;
  if (handle === 'tr' || handle === 'mr' || handle === 'br') style.right = `${HANDLE_OFFSET}px`;
  if (handle === 'tm' || handle === 'bm') style.left = `calc(50% - ${half}px)`;
  if (handle === 'ml' || handle === 'mr') style.top = `calc(50% - ${half}px)`;
  return style;
}

function onHandlePointerDown(event: PointerEvent, handle: HandleName) {
  emit('activated');
  if (!props.resizable) return;
  const startBox = { x: props.x, y: props.y, width: props.w, height: props.h };
  startTracking(
    event,
    (dx, dy) => {
      isResizing.value = true;
      const box = applyResize(handle, startBox, dx, dy, {
        minWidth: props.minWidth,
        minHeight: props.minHeight,
        maxWidth: props.maxWidth,
        maxHeight: props.maxHeight,
      }, props.lockAspectRatio);
      const snappedX = props.snap ? snapToGrid(box.x, props.grid[0]) : box.x;
      const snappedY = props.snap ? snapToGrid(box.y, props.grid[1]) : box.y;
      const snappedW = props.snap ? snapToGrid(box.width, props.grid[0]) : box.width;
      const snappedH = props.snap ? snapToGrid(box.height, props.grid[1]) : box.height;
      emit('resizing', snappedX, snappedY, snappedW, snappedH);
      return { x: snappedX, y: snappedY };
    },
    (finalX, finalY) => {
      isResizing.value = false;
      emit('resizestop', finalX, finalY);
    },
  );
}
```

同時把 import 那一行從：
```ts
import { applyDrag, snapToGrid } from '@/utils/dragResizeMath';
```
改成：
```ts
import { applyDrag, applyResize, snapToGrid, type HandleName } from '@/utils/dragResizeMath';
```

並在 `<script setup>` 最上面（props 定義之前）加上 `HANDLES`/`HANDLE_SIZE`/`HANDLE_OFFSET`/`CURSOR_MAP` 這幾個常數（如上）。

- [ ] **Step 2: 型別檢查與 lint**

Run: `npm run type-check && npx eslint src/components/AiViewer/DragResizeBox.vue`
Expected: 沒有新增錯誤

- [ ] **Step 3: 建一個暫時的測試頁面手動驗證**

在 `src/views/GUI.vue`（專案既有的雜項元件測試頁，見 `/view/GUI`）暫時加一小段：

```vue
<div class="mb-3">
  <h3>測試 DragResizeBox</h3>
  <div style="position: relative; width: 100%; height: 300px; border: 1px dashed #ccc;">
    <DragResizeBox :x="20" :y="20" :w="150" :h="100" :min-width="50" :min-height="50" active>
      <template #tl><div style="width:100%;height:100%;background:#333;border-radius:50%"></div></template>
      <template #tm><div style="width:100%;height:100%;background:#333;border-radius:50%"></div></template>
      <template #tr><div style="width:100%;height:100%;background:#333;border-radius:50%"></div></template>
      <template #mr><div style="width:100%;height:100%;background:#333;border-radius:50%"></div></template>
      <template #br><div style="width:100%;height:100%;background:#333;border-radius:50%"></div></template>
      <template #bm><div style="width:100%;height:100%;background:#333;border-radius:50%"></div></template>
      <template #bl><div style="width:100%;height:100%;background:#333;border-radius:50%"></div></template>
      <template #ml><div style="width:100%;height:100%;background:#333;border-radius:50%"></div></template>
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#eef;">拖我/縮放我</div>
    </DragResizeBox>
  </div>
</div>
```

記得在 `<script setup>` 加 `import DragResizeBox from '@/components/AiViewer/DragResizeBox.vue'`。

跑 `npm run dev`，開 `/view/GUI`，手動測試：
- 拖曳方塊本體，確認跟著滑鼠移動、鬆手後停在該位置
- 分別用 8 個控制點縮放，確認方向正確（例如拖 `br` 只往右下變大，拖 `tl` 左上角移動、右下角固定）
- 縮小到 50x50（`minWidth`/`minHeight`）以下，確認會被卡住不再變小
- console 沒有任何錯誤

確認手動驗證通過後，**把這段暫時加到 GUI.vue 的測試程式碼整段刪除還原**（這只是驗證用，不要留在最終程式碼裡）。

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/DragResizeBox.vue
git commit -m "feat(canvas): add resize handles to DragResizeBox

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: 寬高比鎖定、格點對齊、觸控裝置支援的收尾調整

**Files:**
- Modify: `src/components/AiViewer/DragResizeBox.vue`

**Interfaces:**
- 不新增對外介面（`lockAspectRatio`/`snap`/`grid` props 在 Task 2/3 已經存在並接上邏輯），這個 Task 純粹是觸控裝置的控制點熱區調整

- [ ] **Step 1: 加上觸控裝置偵測，放大控制點熱區**

在 `<script setup>` 裡（`HANDLE_SIZE`/`HANDLE_OFFSET` 常數定義之後）加上：

```ts
import { computed, ref, onMounted } from 'vue';
// ...

const isCoarsePointer = ref(false);
onMounted(() => {
  isCoarsePointer.value = window.matchMedia('(pointer: coarse)').matches;
});
```

（把原本的 `import { computed, ref } from 'vue';` 改成含 `onMounted` 的版本。）

然後把 `handleStyle` 函式開頭改成：

```ts
function handleStyle(handle: HandleName): Record<string, string> {
  const size = isCoarsePointer.value ? HANDLE_SIZE * 1.6 : HANDLE_SIZE;
  const offset = isCoarsePointer.value ? HANDLE_OFFSET * 1.6 : HANDLE_OFFSET;
  const half = size / 2;
  const style: Record<string, string> = {
    width: `${size}px`,
    height: `${size}px`,
    cursor: CURSOR_MAP[handle],
  };
  if (handle === 'tl' || handle === 'tm' || handle === 'tr') style.top = `${offset}px`;
  if (handle === 'bl' || handle === 'bm' || handle === 'br') style.bottom = `${offset}px`;
  if (handle === 'tl' || handle === 'ml' || handle === 'bl') style.left = `${offset}px`;
  if (handle === 'tr' || handle === 'mr' || handle === 'br') style.right = `${offset}px`;
  if (handle === 'tm' || handle === 'bm') style.left = `calc(50% - ${half}px)`;
  if (handle === 'ml' || handle === 'mr') style.top = `calc(50% - ${half}px)`;
  return style;
}
```

- [ ] **Step 2: 型別檢查與 lint**

Run: `npm run type-check && npx eslint src/components/AiViewer/DragResizeBox.vue`
Expected: 沒有新增錯誤

- [ ] **Step 3: 用瀏覽器 DevTools 的裝置模擬手動驗證觸控與寬高比鎖定**

用 `npm run dev` 開 `/view/GUI`（沿用 Task 3 留下的測試方塊，如果已經刪除就暫時加回來）：
- Chrome DevTools 切到裝置模擬模式（觸控），確認控制點熱區變大、可以正常觸控拖曳/縮放
- 桌面滑鼠模式下，按住 Shift 縮放 `br` 角落控制點：因為目前測試方塊沒有接 `lockAspectRatio` prop，這步驟主要是先確認一般滑鼠縮放沒有因為這次改動而壞掉；`lockAspectRatio` 的實際觸發（按 Shift）是 `AiViewer.vue` 裡既有的邏輯，會在 Task 5 接上 `AiViewerContentBox.vue` 之後才能完整測到，此處只需確認 `:lock-aspect-ratio="true"` 傳進去時角落縮放會連動另一軸即可（可以在測試方塊上暫時寫死 `lock-aspect-ratio` 手動加一個測試方塊驗證）
- 驗證完後，把 Task 3/4 暫時加到 `GUI.vue` 的測試程式碼整段刪除還原

- [ ] **Step 4: Commit**

```bash
git add src/components/AiViewer/DragResizeBox.vue
git commit -m "feat(canvas): add touch-aware handle sizing to DragResizeBox

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: 接上 AiViewerContentBox.vue

**Files:**
- Modify: `src/components/AiViewer/AiViewerContentBox.vue`

**Interfaces:**
- Consumes：Task 2-4 完成的 `DragResizeBox`（`@/components/AiViewer/DragResizeBox.vue`）

- [ ] **Step 1: 換掉 import**

把：
```ts
import VueDragResizeRotate from "@gausszhou/vue3-drag-resize-rotate";
```
改成：
```ts
import DragResizeBox from '@/components/AiViewer/DragResizeBox.vue';
```

- [ ] **Step 2: 換掉模板裡的標籤名稱**

`AiViewerContentBox.vue` 目前模板開頭是（因為先前修過崩潰問題，多了 error boundary 的 `v-if`/`v-else-if`）：

```html
<div v-if="hasRenderError" class="AiViewerContentResize block-render-error" ...>
  ...
</div>
<VueDragResizeRotate v-else-if="init" @wheel="stopWhellZoomEvent($event)" @touchmove="stopTouchpadZoomEvent($event)"
  ...（一大段 props/events）
  <template v-slot:tl>...</template>
  ...
</VueDragResizeRotate>
```

把 `<VueDragResizeRotate v-else-if="init" ...>` 開頭跟 `</VueDragResizeRotate>` 結尾這兩處的標籤名稱換成 `<DragResizeBox v-else-if="init" ...>` 與 `</DragResizeBox>`，中間 props/events/slots 內容維持不變（因為介面設計成一致，見 spec），**除了刪除這 3 個新元件不需要的 prop 綁定**（`DragResizeBox` 沒有宣告這幾個 prop，留著會變成漏到根元素 DOM 上的 fallthrough 屬性）：
- `:enable-native-drag="false"`
- `:parent="false"`
- `:scaleRatio="1"`

**保留** `hasRenderError`/`onErrorCaptured` 這段 error boundary 程式碼（不要刪除，理由見 spec「檔案異動」一節——這是通用防護網）。

- [ ] **Step 3: 型別檢查與 lint**

Run: `npm run type-check && npx eslint src/components/AiViewer/AiViewerContentBox.vue`
Expected: 錯誤數量跟改動前一致（既有的 pre-existing 錯誤，例如 `window.XLSX` 之類），沒有新增錯誤；特別確認原本 `Could not find a declaration file for module '@gausszhou/vue3-drag-resize-rotate'` 這個錯誤消失了

- [ ] **Step 4: 手動驗證整個畫布**

用 `npm run dev`，走一次完整流程（可用瀏覽器自動化工具模擬，或人工操作）：
- 切到 conv2，觸發「商品競品分析」快速任務，走到 Step5 產出報告，確認 `init-txt-aw26`／`init-excel-aw26-trans` 這兩個先前會崩潰的區塊，現在能拖曳、縮放，不再顯示「此區塊無法顯示」
- 在 conv1 觸發「請幫我做行銷策略分析」，確認產出的 HTML report 區塊一樣能正常顯示與拖曳/縮放
- 多選 2 個以上區塊，拖曳其中一個，確認其他區塊跟著位移相同差值（這段邏輯在 `checXY` 裡，見 spec）
- 打開瀏覽器 console，確認沒有任何 `Cannot read properties of null (reading 'ce')` 或其他新錯誤

- [ ] **Step 5: Commit**

```bash
git add src/components/AiViewer/AiViewerContentBox.vue
git commit -m "fix(canvas): replace VueDragResizeRotate with DragResizeBox in AiViewerContentBox

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: 清理 AiViewer.vue 的 debug 面板、移除舊套件依賴

**Files:**
- Modify: `src/views/AiViewer.vue`
- Modify: `package.json`（移除依賴）

**Interfaces:**
- 不涉及新的對外介面，純清理

- [ ] **Step 1: 把 debug 面板的 VueDragResizeRotate 換成一般 div**

`src/views/AiViewer.vue` 開頭（第 3-59 行）目前是：

```html
<VueDragResizeRotate
  class="debug-views AiViewerContentResize"
  v-if="lookDebug"
  :enable-native-drag="true"
  :draggable="false"
  :resizable="false"
  :rotatable="false"
  :w="200"
  :h="450"
  @wheel="stopWhellZoomEvent($event)"
  @touchmove="stopTouchpadZoomEvent($event)"
>
  <template v-slot:tl><div class="handle-icon"></div></template>
  <template v-slot:tm><div class="handle-icon"></div></template>
  <template v-slot:tr><div class="handle-icon"></div></template>
  <template v-slot:mr><div class="handle-icon"></div></template>
  <template v-slot:br><div class="handle-icon"></div></template>
  <template v-slot:bm><div class="handle-icon"></div></template>
  <template v-slot:bl><div class="handle-icon"></div></template>
  <template v-slot:ml><div class="handle-icon"></div></template>

  <div class="debug-views-content">
    ...(內容不變)...
  </div>
</VueDragResizeRotate>
```

這裡 `draggable`/`resizable`/`rotatable` 全部是 `false`，等於只是拿套件當一個固定尺寸的定位容器用，控制點插槽也永遠不會顯示（因為 resizable/rotatable 都是 false）。換成：

```html
<div
  class="debug-views AiViewerContentResize"
  v-if="lookDebug"
  style="position: absolute; width: 200px; height: 450px;"
  @wheel="stopWhellZoomEvent($event)"
  @touchmove="stopTouchpadZoomEvent($event)"
>
  <div class="debug-views-content">
    ...(內容不變，整段搬過來，不需要修改)...
  </div>
</div>
```

（拿掉所有 `v-slot:tl` 等 8 個控制點的 `<template>`，因為原本就不會顯示。）

- [ ] **Step 2: 移除對應的 import**

把 `src/views/AiViewer.vue` 裡的：
```ts
import VueDragResizeRotate from "@gausszhou/vue3-drag-resize-rotate";
```
整行刪除。

- [ ] **Step 3: 型別檢查與 lint**

Run: `npm run type-check && npx eslint src/views/AiViewer.vue`
Expected: 原本 `Could not find a declaration file for module '@gausszhou/vue3-drag-resize-rotate'` 這個錯誤消失，沒有新增其他錯誤

- [ ] **Step 4: 確認專案裡完全沒有殘留引用**

Run: `grep -rn "vue3-drag-resize-rotate\|VueDragResizeRotate" src/`
Expected: 沒有任何輸出（如果有殘留，回頭處理乾淨才能繼續下一步）

- [ ] **Step 5: 移除套件依賴**

Run: `npm uninstall @gausszhou/vue3-drag-resize-rotate`
Expected：`package.json`／`package-lock.json` 更新，`node_modules/@gausszhou` 移除

- [ ] **Step 6: 手動驗證 debug 面板**

`npm run dev`，在畫布頁面（`/view/AiViewer`）快速點擊專案標題（左上角）10 次觸發隱藏 debug 面板（見 `AiViewerRightBox.vue` 的 `debugCount` 邏輯），確認面板正常顯示、定位正確、內容（JSON debug 資訊）正常顯示，關閉按鈕正常運作。

- [ ] **Step 7: 全專案最終驗證**

Run: `npm run type-check && npm run lint && npm run test:unit`
Expected：
- `type-check`／`lint`：錯誤數量跟這次改動前的 baseline 一致或更少（不應該有新增錯誤）
- `test:unit`：全部通過，含 Task 1 新增的 `dragResizeMath.test.ts`

Run: `npm run build`
Expected：build 成功，無錯誤

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(canvas): remove @gausszhou/vue3-drag-resize-rotate dependency

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```
