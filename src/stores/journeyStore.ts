import { defineStore } from 'pinia'
import { ref } from 'vue'

export type NodeStatus = 'pending' | 'running' | 'done'

export interface JourneyNode {
  key: string
  label: string
  status: NodeStatus
  startedAt?: number
  completedAt?: number
}

export interface JourneyRecord {
  id: string
  userName: string
  createdAt: number
  status: 'running' | 'done'
  nodes: JourneyNode[]
}

const NODE_TEMPLATES: Omit<JourneyNode, 'status'>[] = [
  { key: 'D0',  label: '觸發加入旅程' },
  { key: 'D1',  label: '歡迎序列啟動' },
  { key: 'D3',  label: '行為條件分流' },
  { key: 'D7',  label: '產品深度培育' },
  { key: 'D14', label: '購買轉換衝刺' },
  { key: 'D30', label: '購後回購培育' },
]

export const useJourneyStore = defineStore('journey', () => {
  const journeys = ref<JourneyRecord[]>([])

  function createJourney(userName: string): string {
    const id = 'journey-' + Date.now()
    journeys.value.unshift({
      id,
      userName,
      createdAt: Date.now(),
      status: 'running',
      nodes: NODE_TEMPLATES.map(t => ({ ...t, status: 'pending' })),
    })
    return id
  }

  function setNodeRunning(journeyId: string, nodeKey: string): void {
    const journey = journeys.value.find(j => j.id === journeyId)
    if (!journey) return
    const node = journey.nodes.find(n => n.key === nodeKey)
    if (!node) return
    node.status = 'running'
    node.startedAt = Date.now()
  }

  function setNodeDone(journeyId: string, nodeKey: string): void {
    const journey = journeys.value.find(j => j.id === journeyId)
    if (!journey) return
    const node = journey.nodes.find(n => n.key === nodeKey)
    if (!node) return
    node.status = 'done'
    node.completedAt = Date.now()
    if (journey.nodes.every(n => n.status === 'done')) {
      journey.status = 'done'
    }
  }

  return { journeys, createJourney, setNodeRunning, setNodeDone }
})
