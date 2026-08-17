<!-- src/components/Knowledge/ConversionLogTab.vue -->
<template>
  <div class="conversion-log-tab">
    <!-- 無資料 -->
    <div v-if="!conversionLog.length" class="conversion-log-empty">
      <i class="material-symbols-outlined">hourglass_empty</i>
      <p>{{ status === 'processing' ? '轉換進行中，請稍後…' : '尚無轉換紀錄' }}</p>
    </div>

    <!-- 有資料 -->
    <template v-else>
      <!-- 總覽列 -->
      <div class="conversion-log-summary">
        <span :class="['conversion-status-badge', isAllSuccess ? 'badge--success' : 'badge--failed']">
          {{ isAllSuccess ? '✓ 轉換成功' : '✕ 轉換失敗' }}
        </span>
        <span class="fs-12 fc-grey-1">
          總耗時 {{ totalDurationLabel }} · {{ lastStepTime }}
        </span>
      </div>

      <!-- 步驟卡片 -->
      <div class="conversion-step-list">
        <div
          v-for="step in conversionLog"
          :key="step.stage"
          :class="['conversion-step-card', `step--${step.status}`]"
        >
          <div class="step-header">
            <span class="step-status-icon">{{ statusIcon(step.status) }}</span>
            <span class="step-title">{{ stageLabel[step.stage] }}</span>
            <span class="step-duration fs-11 fc-grey-1">
              {{ step.status === 'skipped' ? '已跳過' : durationLabel(step.durationMs) }}
            </span>
          </div>
          <div class="step-body">
            <template v-if="step.status === 'skipped'">
              <p class="step-skipped-note">此步驟已跳過（MANUAL 來源不需要分段）</p>
            </template>
            <template v-else>
              <div class="step-detail-grid">
                <template v-for="(val, key) in step.detail" :key="key">
                  <span class="step-detail-key">{{ key }}</span>
                  <span class="step-detail-val">{{ val }}</span>
                </template>
              </div>
              <p v-if="step.errorMessage" class="step-error-msg">{{ step.errorMessage }}</p>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ConversionStep, ItemStatus } from '@/stores/knowledgeStore'

const props = defineProps<{
  conversionLog: ConversionStep[]
  status: ItemStatus
}>()

const stageLabel: Record<string, string> = {
  chunking: '1. 分段（Chunking）',
  embedding: '2. 向量化（Embedding）',
  indexing: '3. 索引建立（Indexing）',
}

function statusIcon(status: ConversionStep['status']): string {
  if (status === 'success') return '✓'
  if (status === 'failed') return '✕'
  return '—'
}

function durationLabel(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const isAllSuccess = computed(() =>
  props.conversionLog.every(s => s.status === 'success' || s.status === 'skipped')
)

const totalDurationLabel = computed(() => {
  const total = props.conversionLog.reduce((sum, s) => sum + s.durationMs, 0)
  return durationLabel(total)
})

const lastStepTime = computed(() => {
  const last = props.conversionLog[props.conversionLog.length - 1]
  return last?.startedAt ?? ''
})
</script>
