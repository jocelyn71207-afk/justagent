import { describe, it, expect } from 'vitest'
import { parseHashtags } from '../hashtags'

describe('parseHashtags', () => {
  it('單一標籤：原樣回傳', () => {
    expect(parseHashtags('問題分類')).toEqual(['問題分類'])
  })

  it('多個標籤（空白分隔）：拆成多個', () => {
    expect(parseHashtags('問題分類 資料查詢 格式轉換')).toEqual(['問題分類', '資料查詢', '格式轉換'])
  })

  it('前後／連續多個空白：濾掉空字串', () => {
    expect(parseHashtags('  問題分類   資料查詢  ')).toEqual(['問題分類', '資料查詢'])
  })

  it('全空白或空字串：回傳空陣列', () => {
    expect(parseHashtags('   ')).toEqual([])
    expect(parseHashtags('')).toEqual([])
  })

  it('不限字數：長字串原樣保留', () => {
    const long = '一個很長很長很長很長很長很長很長很長很長很長的標籤名稱'
    expect(parseHashtags(long)).toEqual([long])
  })
})
