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
