import { describe, it, expect } from 'vitest'
import { getChunkingConfig } from '@/stores/knowledgeStore'

describe('getChunkingConfig', () => {
  it('returns correct config for 商品文件', () => {
    const config = getChunkingConfig('商品文件')
    expect(config.chunkSize).toBe(200)
    expect(config.overlap).toBe(20)
    expect(config.contextPrefix).toBe('[商品]')
  })

  it('returns correct config for 客服知識', () => {
    const config = getChunkingConfig('客服知識')
    expect(config.chunkSize).toBe(300)
    expect(config.overlap).toBe(50)
    expect(config.contextPrefix).toBe('[客服]')
  })

  it('returns correct config for 規則說明', () => {
    const config = getChunkingConfig('規則說明')
    expect(config.chunkSize).toBe(500)
    expect(config.overlap).toBe(100)
    expect(config.contextPrefix).toBe('[規則]')
  })

  it('returns correct config for 系統文件', () => {
    const config = getChunkingConfig('系統文件')
    expect(config.chunkSize).toBe(400)
    expect(config.overlap).toBe(80)
    expect(config.contextPrefix).toBe('[系統]')
  })

  it('returns default config for unknown category', () => {
    const config = getChunkingConfig('未知分類')
    expect(config.chunkSize).toBe(300)
    expect(config.overlap).toBe(50)
    expect(config.contextPrefix).toBe('')
  })
})

import { buildChunkContent } from '@/stores/knowledgeStore'

describe('buildChunkContent', () => {
  it('prepends category, tags and sourceType prefix', () => {
    const result = buildChunkContent('退款需要三個工作天', {
      category: '客服知識',
      tags: ['退款', '流程'],
      sourceType: 'text',
    })
    expect(result).toBe('[分類:客服知識][標籤:退款,流程][來源:text] 退款需要三個工作天')
  })

  it('omits tags section when tags array is empty', () => {
    const result = buildChunkContent('商品說明文字', {
      category: '商品文件',
      tags: [],
      sourceType: 'text',
    })
    expect(result).toBe('[分類:商品文件][來源:text] 商品說明文字')
  })

  it('marks image-derived chunks with image sourceType', () => {
    const result = buildChunkContent('黑色無線耳機，頭戴式設計', {
      category: '商品文件',
      tags: ['3C'],
      sourceType: 'image',
    })
    expect(result).toBe('[分類:商品文件][標籤:3C][來源:image] 黑色無線耳機，頭戴式設計')
  })
})
