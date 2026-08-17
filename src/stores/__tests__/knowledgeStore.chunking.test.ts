import { describe, it, expect, beforeEach } from 'vitest'
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

import { getVisionPrompt, processImage } from '@/stores/knowledgeStore'

describe('getVisionPrompt', () => {
  it('returns product-focused prompt for 商品文件', () => {
    const prompt = getVisionPrompt('商品文件')
    expect(prompt).toContain('外觀')
    expect(prompt).toContain('顏色')
  })

  it('returns UI-focused prompt for 系統文件', () => {
    const prompt = getVisionPrompt('系統文件')
    expect(prompt).toContain('UI')
    expect(prompt).toContain('操作步驟')
  })

  it('returns rule-focused prompt for 規則說明', () => {
    const prompt = getVisionPrompt('規則說明')
    expect(prompt).toContain('條款')
  })

  it('returns service-focused prompt for 客服知識', () => {
    const prompt = getVisionPrompt('客服知識')
    expect(prompt).toContain('流程')
  })

  it('returns fallback prompt for unknown category', () => {
    const prompt = getVisionPrompt('未知')
    expect(typeof prompt).toBe('string')
    expect(prompt.length).toBeGreaterThan(0)
  })
})

describe('processImage', () => {
  it('returns vision method with non-empty text', async () => {
    const mockFile = new File([''], 'product.jpg', { type: 'image/jpeg' })
    const result = await processImage(mockFile, '商品文件')
    expect(result.method).toBe('vision')
    expect(typeof result.text).toBe('string')
    expect(result.text.length).toBeGreaterThan(0)
  })

  it('includes category name in mock description', async () => {
    const mockFile = new File([''], 'manual.jpg', { type: 'image/jpeg' })
    const result = await processImage(mockFile, '系統文件')
    expect(result.text).toContain('系統文件')
  })
})

import { setActivePinia, createPinia } from 'pinia'
import { useKnowledgeStore, vectorSearch } from '@/stores/knowledgeStore'

describe('vectorSearch', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('returns results matching the given category filter', () => {
    const store = useKnowledgeStore()
    const results = vectorSearch('退款', { category: '客服知識' }, store.knowledgeList)
    results.forEach(r => {
      expect(r.category).toBe('客服知識')
    })
  })

  it('returns all results when no category filter is provided', () => {
    const store = useKnowledgeStore()
    const allResults = vectorSearch('商品', undefined, store.knowledgeList)
    const filteredResults = vectorSearch('商品', { category: '商品文件' }, store.knowledgeList)
    expect(allResults.length).toBeGreaterThanOrEqual(filteredResults.length)
  })
})
