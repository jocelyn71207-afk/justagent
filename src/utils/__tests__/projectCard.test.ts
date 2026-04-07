import { describe, it, expect } from 'vitest';
import { barHeight, weekLabel, statusLabel } from '@/utils/projectCard';

describe('barHeight', () => {
  it('最大值回傳 80', () => {
    expect(barHeight(20, [12, 8, 20, 15, 5, 3, 18])).toBe(80);
  });
  it('0 回傳 4（min-height）', () => {
    expect(barHeight(0, [12, 8, 20, 15, 5, 3, 18])).toBe(4);
  });
  it('一半的值約回傳 40', () => {
    expect(barHeight(10, [20, 10])).toBe(40);
  });
  it('所有值相同時全部回傳 80', () => {
    expect(barHeight(5, [5, 5, 5])).toBe(80);
  });
});

describe('weekLabel', () => {
  it('index 6 回傳「今天」', () => {
    expect(weekLabel(6)).toBe('今天');
  });
  it('index 5 回傳「1天前」', () => {
    expect(weekLabel(5)).toBe('1天前');
  });
  it('index 0 回傳「6天前」', () => {
    expect(weekLabel(0)).toBe('6天前');
  });
});

describe('statusLabel', () => {
  it('pending → 待啟動', () => {
    expect(statusLabel('pending')).toBe('待啟動');
  });
  it('active → 進行中', () => {
    expect(statusLabel('active')).toBe('進行中');
  });
  it('review → 待驗收', () => {
    expect(statusLabel('review')).toBe('待驗收');
  });
  it('done → 已完成', () => {
    expect(statusLabel('done')).toBe('已完成');
  });
});
