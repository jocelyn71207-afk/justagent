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

  it('tl 大幅往左上拖曳超過 maxWidth 時，寬度夾在上限、右邊界仍然固定', () => {
    const bounds = { minWidth: 0, minHeight: 0, maxWidth: 300, maxHeight: Infinity };
    const result = applyResize('tl', BOX, -500, 0, bounds);
    expect(result.width).toBe(300);
    expect(result.x + result.width).toBe(BOX.x + BOX.width);
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

  it('br 角落，dy 為主要變化時，寬度依高度連動（修正只看 dx 導致 dy 被忽略的 bug）', () => {
    const result = applyResize('br', BOX, 0, 200, NO_BOUNDS, true);
    // BOX 寬高比 200:100 = 2:1；dy=200 讓 height 變化比例(200/100=2.0)遠大於 width(0)
    expect(result.height).toBe(300);
    expect(result.width).toBe(600);
  });

  it('tl 角落，純 dy 拖曳時寬高同步鎖定，且角落正確往左上移動（右下邊界固定）', () => {
    const result = applyResize('tl', BOX, 0, -200, NO_BOUNDS, true);
    expect(result.height).toBe(300);
    expect(result.width).toBe(600);
    expect(result.x + result.width).toBe(BOX.x + BOX.width);
    expect(result.y + result.height).toBe(BOX.y + BOX.height);
  });
});
