import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nlTobr, formatTimeToDisplay, isTouchDeviceFn } from '@/utils/utils'

// ─── nlTobr ───────────────────────────────────────────────────────────────────

describe('nlTobr', () => {
  it('將 \\n 轉換為 <br />', () => {
    expect(nlTobr('第一行\n第二行')).toBe('第一行<br />第二行')
  })

  it('多個 \\n 全部轉換', () => {
    expect(nlTobr('a\nb\nc')).toBe('a<br />b<br />c')
  })

  it('沒有 \\n 時原樣回傳', () => {
    expect(nlTobr('沒有換行')).toBe('沒有換行')
  })

  it('空字串回傳空字串', () => {
    expect(nlTobr('')).toBe('')
  })
})

// ─── formatTimeToDisplay ──────────────────────────────────────────────────────

describe('formatTimeToDisplay', () => {
  beforeEach(() => {
    // 固定現在時間為 2026-03-16 12:00:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-16T12:00:00'))
  })

  it('60 秒內顯示「剛剛」', () => {
    const time = new Date('2026-03-16T11:59:30').toISOString()
    expect(formatTimeToDisplay(time)).toBe('剛剛')
  })

  it('5 分鐘前顯示「5 分鐘前」', () => {
    const time = new Date('2026-03-16T11:55:00').toISOString()
    expect(formatTimeToDisplay(time)).toBe('5 分鐘前')
  })

  it('2 小時前顯示「2 小時前」', () => {
    const time = new Date('2026-03-16T10:00:00').toISOString()
    expect(formatTimeToDisplay(time)).toBe('2 小時前')
  })

  it('昨天顯示「昨天 HH:mm」', () => {
    const time = new Date('2026-03-15T09:30:00').toISOString()
    expect(formatTimeToDisplay(time)).toBe('昨天 09:30')
  })

  it('3 天前顯示「3 天前」', () => {
    const time = new Date('2026-03-13T12:00:00').toISOString()
    expect(formatTimeToDisplay(time)).toBe('3 天前')
  })

  it('2 週前顯示「2 週前」', () => {
    const time = new Date('2026-03-02T12:00:00').toISOString()
    expect(formatTimeToDisplay(time)).toBe('2 週前')
  })

  it('2 個月前顯示「2 個月前」', () => {
    const time = new Date('2026-01-14T12:00:00').toISOString() // 61 天前，floor(61/30)=2
    expect(formatTimeToDisplay(time)).toBe('2 個月前')
  })

  it('1 年前顯示「1 年前」', () => {
    const time = new Date('2025-03-16T12:00:00').toISOString()
    expect(formatTimeToDisplay(time)).toBe('1 年前')
  })
})

// ─── isTouchDeviceFn ──────────────────────────────────────────────────────────

describe('isTouchDeviceFn', () => {
  it('Android 裝置回傳 true', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
      maxTouchPoints: 5,
    })
    expect(isTouchDeviceFn()).toBe(true)
  })

  it('iPhone 回傳 true', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
      maxTouchPoints: 5,
    })
    expect(isTouchDeviceFn()).toBe(true)
  })

  it('一般桌機 Chrome 回傳 false', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
      maxTouchPoints: 0,
    })
    expect(isTouchDeviceFn()).toBe(false)
  })

  it('iPadOS 13+（偽裝成 Mac）回傳 true', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)',
      maxTouchPoints: 5,
    })
    expect(isTouchDeviceFn()).toBe(true)
  })
})
