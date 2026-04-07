export type ProjectStatus = 'pending' | 'active' | 'review' | 'done';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  pending: '待啟動',
  active:  '進行中',
  review:  '待驗收',
  done:    '已完成',
};

/**
 * 將單一數值依照陣列最大值比例換算為長條高度（px），最小值為 4。
 */
export function barHeight(count: number, arr: number[]): number {
  const max = Math.max(...arr);
  if (max === 0) return 4;
  return Math.max(4, Math.round((count / max) * 80));
}

/**
 * 將 index（0 = 6天前, 6 = 今天）轉換為中文標籤。
 */
export function weekLabel(index: number): string {
  const daysAgo = 6 - index;
  return daysAgo === 0 ? '今天' : `${daysAgo}天前`;
}

/**
 * 將 status value 轉換為中文標籤。
 */
export function statusLabel(status: ProjectStatus): string {
  return STATUS_LABELS[status];
}
