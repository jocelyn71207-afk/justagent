<!-- src/views/JourneyDashboard.vue -->
<template>
  <div style="min-height:100vh;background:#0f1117;color:#e8eaf0;font-family:'Helvetica Neue','PingFang TC',sans-serif;padding:32px 40px 60px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:32px">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#3b72f6;margin-bottom:4px">
          Hurricane Trailsetter · AW26
        </div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-.4px">🗺️ 旅程執行紀錄</div>
        <div style="font-size:12px;color:#5c6370;margin-top:4px">行銷自動化旅程 — 各用戶進度追蹤</div>
      </div>
      <button
        @click="router.push('/view/AiViewer')"
        style="padding:8px 16px;border-radius:8px;border:1px solid #2a2d3a;background:#1a1d27;color:#9ca3af;font-size:12px;cursor:pointer">
        ← 返回 AiViewer
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="journeys.length === 0"
      style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;color:#5c6370;gap:12px">
      <div style="font-size:40px;opacity:.3">🗺️</div>
      <div style="font-size:14px">尚無旅程記錄</div>
      <div style="font-size:12px">回到 AiViewer 並點擊「生成行銷自動化旅程」開始</div>
    </div>

    <!-- Journey list -->
    <div v-else style="display:flex;flex-direction:column;gap:20px">
      <div
        v-for="journey in journeys"
        :key="journey.id"
        style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:14px;padding:20px 24px">

        <!-- Journey header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div style="font-size:15px;font-weight:700">{{ journey.userName }}</div>
            <div style="font-size:11px;color:#5c6370;margin-top:2px">
              啟動：{{ formatDate(journey.createdAt) }}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:12px;color:#9ca3af">
              {{ doneCount(journey) }} / 6 節點完成
            </div>
            <span :style="statusBadgeStyle(journey.status)">
              {{ journey.status === 'done' ? '已完成' : '執行中' }}
            </span>
          </div>
        </div>

        <!-- Progress bar -->
        <div style="background:#0f1117;border-radius:6px;height:6px;margin-bottom:18px;overflow:hidden">
          <div
            :style="{
              height:'100%',
              borderRadius:'6px',
              background: journey.status === 'done'
                ? 'linear-gradient(90deg,#16a34a,#0891b2)'
                : 'linear-gradient(90deg,#7c3aed,#3b72f6)',
              width: (doneCount(journey) / 6 * 100) + '%',
              transition: 'width .5s ease',
            }"
          />
        </div>

        <!-- Node timeline -->
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <div
            v-for="node in journey.nodes"
            :key="node.key"
            :style="nodeCardStyle(node.status)"
          >
            <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px"
              :style="{ color: nodeKeyColor(node.status) }">
              {{ node.key }}
            </div>
            <div style="font-size:11px;font-weight:600;">{{ node.label }}</div>
            <div v-if="node.status === 'running'"
              style="font-size:9px;color:#3b72f6;margin-top:4px;display:flex;align-items:center;gap:3px">
              <span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:#3b72f6;animation:blink 1s ease-in-out infinite"></span>
              執行中
            </div>
            <div v-if="node.completedAt"
              style="font-size:9px;color:#5c6370;margin-top:4px">
              {{ formatTime(node.completedAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useJourneyStore } from '@/stores/journeyStore'
import type { JourneyRecord, NodeStatus } from '@/stores/journeyStore'

const router = useRouter()
const journeyStore = useJourneyStore()
const { journeys } = storeToRefs(journeyStore)

function doneCount(journey: JourneyRecord): number {
  return journey.nodes.filter(n => n.status === 'done').length
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function statusBadgeStyle(status: 'running' | 'done'): Record<string, string> {
  const base: Record<string, string> = {
    fontSize: '10px', fontWeight: '700', padding: '3px 10px',
    borderRadius: '20px', border: '1px solid',
  }
  return status === 'done'
    ? { ...base, background: 'rgba(22,163,74,.15)', color: '#16a34a', borderColor: 'rgba(22,163,74,.3)' }
    : { ...base, background: 'rgba(59,114,246,.15)', color: '#3b72f6', borderColor: 'rgba(59,114,246,.3)' }
}

function nodeCardStyle(status: NodeStatus): Record<string, string> {
  const base: Record<string, string> = {
    flex: '1', minWidth: '88px', maxWidth: '120px', borderRadius: '10px',
    padding: '10px 10px 9px', border: '1px solid',
  }
  if (status === 'done') return { ...base, background: 'rgba(22,163,74,.08)', borderColor: 'rgba(22,163,74,.25)' }
  if (status === 'running') return { ...base, background: 'rgba(59,114,246,.1)', borderColor: 'rgba(59,114,246,.4)' }
  return { ...base, background: '#0f1117', borderColor: '#2a2d3a', opacity: '.5' }
}

function nodeKeyColor(status: NodeStatus): string {
  if (status === 'done') return '#16a34a'
  if (status === 'running') return '#3b72f6'
  return '#5c6370'
}
</script>

<style>
@keyframes blink {
  0%,100% { opacity:1 }
  50% { opacity:.2 }
}
</style>
