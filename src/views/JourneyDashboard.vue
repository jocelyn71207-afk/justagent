<!-- src/views/JourneyDashboard.vue -->
<template>
  <div class="JourneyDashboard">

    <!-- Header -->
    <div class="jd-header">
      <div>
        <div class="jd-eyebrow">Hurricane Trailsetter · AW26</div>
        <div class="jd-title">🗺️ 旅程執行紀錄</div>
        <div class="jd-subtitle">行銷自動化旅程 — 各用戶進度追蹤</div>
      </div>
      <button class="jd-back-btn" @click="router.push('/view/AiViewer')">
        ← 返回 AiViewer
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="journeys.length === 0" class="jd-empty">
      <div class="jd-empty-icon">🗺️</div>
      <div class="jd-empty-title">尚無旅程記錄</div>
      <div class="jd-empty-desc">回到 AiViewer 並點擊「生成行銷自動化旅程」開始</div>
    </div>

    <!-- Journey list -->
    <div v-else class="jd-list lively-stagger">
      <div v-for="journey in journeys" :key="journey.id" class="jd-card">

        <div class="jd-card-head">
          <div>
            <div class="jd-user">{{ journey.userName }}</div>
            <div class="jd-meta">啟動：{{ formatDate(journey.createdAt) }}</div>
          </div>
          <div class="jd-card-right">
            <span class="jd-count">{{ doneCount(journey) }} / {{ journey.nodes.length }} 節點完成</span>
            <span :class="['jd-badge', `jd-badge--${journey.status}`]">
              {{ journey.status === 'done' ? '已完成' : '執行中' }}
            </span>
          </div>
        </div>

        <div class="jd-progress">
          <div
            :class="['jd-progress-fill', `jd-progress-fill--${journey.status}`]"
            :style="{ width: (doneCount(journey) / journey.nodes.length * 100) + '%' }"
          />
        </div>

        <div class="jd-track">
          <div
            v-for="(node, i) in journey.nodes"
            :key="node.key"
            :class="['jd-step', `jd-step--${node.status}`]"
          >
            <div class="jd-dot">
              <span v-if="node.status === 'done'">✓</span>
              <span v-else-if="node.status === 'running'">●</span>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <div class="jd-step-key">{{ node.key }}</div>
            <div class="jd-step-label">{{ node.label }}</div>
            <div v-if="node.status === 'running'" class="jd-step-running">
              <span class="jd-blink-dot"></span>執行中
            </div>
            <div v-if="node.completedAt" class="jd-step-time">{{ formatTime(node.completedAt) }}</div>
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
import type { JourneyRecord } from '@/stores/journeyStore'

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
</script>
