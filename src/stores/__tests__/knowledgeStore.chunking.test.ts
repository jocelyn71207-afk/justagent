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
