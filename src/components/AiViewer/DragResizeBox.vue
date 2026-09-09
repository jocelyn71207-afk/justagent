<template>
  <div
    :class="rootClasses"
    :style="rootStyle"
    @pointerdown="onBodyPointerDown"
  >
    <template v-if="props.resizable">
      <div
        v-for="handle in HANDLES"
        :key="handle"
        :class="['handle', `handle-${handle}`]"
        :style="handleStyle(handle)"
        @pointerdown.stop="onHandlePointerDown($event, handle)"
      >
        <slot :name="handle" />
      </div>
    </template>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { applyDrag, applyResize, snapToGrid, type HandleName } from '@/utils/dragResizeMath';

const HANDLES: HandleName[] = ['tl', 'tm', 'tr', 'mr', 'br', 'bm', 'bl', 'ml'];
const HANDLE_SIZE = 20; // px，跟呼叫端既有 .handle-icon（20px 圓點）搭配
const HANDLE_OFFSET = -10; // px，讓控制點熱區中心對齊區塊邊界

const CURSOR_MAP: Record<HandleName, string> = {
  tl: 'nwse-resize', tr: 'nesw-resize', br: 'nwse-resize', bl: 'nesw-resize',
  tm: 'ns-resize', bm: 'ns-resize', ml: 'ew-resize', mr: 'ew-resize',
};

const isCoarsePointer = ref(false);
onMounted(() => {
  isCoarsePointer.value = window.matchMedia('(pointer: coarse)').matches;
});

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
  const startBox = { x: props.x, y: props.y, width: props.w, height: props.h };
  startTracking(
    event,
    (dx, dy) => {
      isDragging.value = true;
      const { x, y } = applyDrag(startBox, dx, dy);
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
</script>
