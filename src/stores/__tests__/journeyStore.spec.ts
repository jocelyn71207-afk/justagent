import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useJourneyStore } from '@/stores/journeyStore'

describe('journeyStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('createJourney returns id and initialises 6 pending nodes', () => {
    const store = useJourneyStore()
    const id = store.createJourney('User #1')
    expect(id).toMatch(/^journey-/)
    const j = store.journeys[0]
    expect(j.id).toBe(id)
    expect(j.userName).toBe('User #1')
    expect(j.status).toBe('running')
    expect(j.nodes).toHaveLength(6)
    expect(j.nodes.every(n => n.status === 'pending')).toBe(true)
  })

  it('setNodeRunning sets status and startedAt', () => {
    const store = useJourneyStore()
    const id = store.createJourney('User #1')
    store.setNodeRunning(id, 'D0')
    const node = store.journeys[0].nodes.find(n => n.key === 'D0')!
    expect(node.status).toBe('running')
    expect(node.startedAt).toBeDefined()
  })

  it('setNodeDone marks node done and sets completedAt', () => {
    const store = useJourneyStore()
    const id = store.createJourney('User #1')
    store.setNodeRunning(id, 'D0')
    store.setNodeDone(id, 'D0')
    const node = store.journeys[0].nodes.find(n => n.key === 'D0')!
    expect(node.status).toBe('done')
    expect(node.completedAt).toBeDefined()
  })

  it('journey status becomes done when all nodes are done', () => {
    const store = useJourneyStore()
    const id = store.createJourney('User #1')
    const keys = ['D0','D1','D3','D7','D14','D30']
    keys.forEach(k => { store.setNodeRunning(id, k); store.setNodeDone(id, k) })
    expect(store.journeys[0].status).toBe('done')
  })

  it('supports multiple concurrent journeys', () => {
    const store = useJourneyStore()
    store.createJourney('User #1')
    store.createJourney('User #2')
    expect(store.journeys).toHaveLength(2)
  })
})
