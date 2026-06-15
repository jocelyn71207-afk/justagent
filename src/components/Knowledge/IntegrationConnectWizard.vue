<!-- src/components/Knowledge/IntegrationConnectWizard.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useIntegrationStore } from '@/stores/integrationStore'
import type { NotionConfig } from '@/stores/integrationStore'
import NotionConnectSteps from '@/components/Knowledge/NotionConnectSteps.vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  completed: [integrationId: string]
}>()

const integrationStore = useIntegrationStore()

const currentStep = ref(1)
const selectedType = ref<'NOTION' | null>(null)
const notionConfig = ref<Partial<NotionConfig>>({})
const notionName = ref('Notion 知識庫')
const notionSchedule = ref<'MANUAL' | 'DAILY' | 'WEEKLY'>('DAILY')
const stepValid = ref(false)
const isSyncing = ref(false)

const stepLabels = ['選擇平台', '連線設定', '欄位對應', '同步設定']

const canNext = computed(() => {
  if (currentStep.value === 1) return selectedType.value !== null
  return stepValid.value
})

function handleStepConfig(config: Partial<NotionConfig> & { name?: string; schedule?: 'MANUAL' | 'DAILY' | 'WEEKLY' }) {
  const { name, schedule, ...rest } = config
  if (name) notionName.value = name
  if (schedule) notionSchedule.value = schedule
  Object.assign(notionConfig.value, rest)
}

async function finish() {
  isSyncing.value = true
  const id = integrationStore.createIntegration(
    'NOTION',
    { ...notionConfig.value, includePageBody: true } as NotionConfig,
    notionName.value,
    notionSchedule.value,
  )
  await integrationStore.triggerIntegrationSync(id)
  isSyncing.value = false
  emit('completed', id)
  emit('update:modelValue', false)
  currentStep.value = 1
  selectedType.value = null
  notionConfig.value = {}
}

function close() {
  emit('update:modelValue', false)
  currentStep.value = 1
  selectedType.value = null
  notionConfig.value = {}
}
</script>

<template>
  <div v-if="modelValue" class="integration-wizard-overlay" @click.self="close">
    <div class="integration-wizard">
      <!-- Header -->
      <div class="integration-wizard__header">
        <div>
          <div class="integration-wizard__title">連接外部平台</div>
          <div class="integration-wizard__steps">
            <span
              v-for="(label, i) in stepLabels"
              :key="i"
              class="integration-wizard__step"
              :class="{
                'integration-wizard__step--active': currentStep === i + 1,
                'integration-wizard__step--done': currentStep > i + 1,
              }"
            >{{ label }}</span>
          </div>
        </div>
        <button class="integration-wizard__close" @click="close">✕</button>
      </div>

      <!-- Body -->
      <div class="integration-wizard__body">
        <!-- Step 1: Select type -->
        <div v-if="currentStep === 1" class="integration-wizard__platform-grid">
          <div
            class="integration-wizard__platform"
            :class="{ 'integration-wizard__platform--selected': selectedType === 'NOTION' }"
            @click="selectedType = 'NOTION'"
          >
            <div class="integration-wizard__platform-icon">N</div>
            <div class="integration-wizard__platform-name">Notion</div>
            <div class="integration-wizard__platform-desc">Database 同步至知識庫</div>
          </div>
          <div class="integration-wizard__platform integration-wizard__platform--disabled">
            <div class="integration-wizard__platform-badge">即將推出</div>
            <div class="integration-wizard__platform-icon">📁</div>
            <div class="integration-wizard__platform-name">Google 雲端硬碟</div>
            <div class="integration-wizard__platform-desc">雲端文件匯入知識庫</div>
          </div>
          <div class="integration-wizard__platform integration-wizard__platform--disabled">
            <div class="integration-wizard__platform-badge">即將推出</div>
            <div class="integration-wizard__platform-icon">💬</div>
            <div class="integration-wizard__platform-name">Slack</div>
            <div class="integration-wizard__platform-desc">頻道訊息轉知識條目</div>
          </div>
        </div>

        <!-- Step 2-4: Notion steps -->
        <NotionConnectSteps
          v-else-if="selectedType === 'NOTION' && (currentStep === 2 || currentStep === 3 || currentStep === 4)"
          :step="currentStep as 2 | 3 | 4"
          @update:config="handleStepConfig"
          @validated="stepValid = $event"
        />

        <!-- Syncing overlay -->
        <div v-if="isSyncing" class="integration-wizard__syncing">
          <div class="integration-wizard__spinner"></div>
          <div>正在執行首次同步...</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="integration-wizard__footer">
        <button v-if="currentStep > 1" class="integration-wizard__btn" @click="currentStep--">← 上一步</button>
        <div class="integration-wizard__spacer"></div>
        <button
          v-if="currentStep < 4"
          class="integration-wizard__btn integration-wizard__btn--primary"
          :disabled="!canNext"
          @click="currentStep++"
        >
          下一步 →
        </button>
        <button
          v-else
          class="integration-wizard__btn integration-wizard__btn--success"
          :disabled="!canNext || isSyncing"
          @click="finish"
        >
          完成並開始同步 ✓
        </button>
      </div>
    </div>
  </div>
</template>
