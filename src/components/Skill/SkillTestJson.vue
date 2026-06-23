<template>
  <div class="SkillTestJson">
    <!-- Input 區 -->
    <div class="json-section">
      <div class="json-section-label">
        <i class="material-symbols-outlined">input</i> Input (JSON)
      </div>
      <textarea
        v-model="localInput"
        class="json-textarea"
        spellcheck="false"
        :disabled="store.testIsRunning"
      />
      <div class="json-actions">
        <button class="custom-btn" :disabled="store.testIsRunning" @click="handleRun">
          <i class="material-symbols-outlined">play_arrow</i>執行
        </button>
        <button class="custom-btn" @click="loadExample">載入範例</button>
        <button class="custom-btn" @click="store.testJsonInput = '{\n  \n}'">清除</button>
      </div>
    </div>

    <!-- Output 區 -->
    <div class="json-section">
      <div class="json-section-label">
        <i class="material-symbols-outlined">output</i> Output
        <span v-if="store.testJsonOutput && !store.testIsRunning" class="result-tag tag--success">
          ✓ 成功 · {{ lastLatencyMs }}ms
        </span>
        <span v-if="store.testIsRunning" class="result-tag tag--running">執行中...</span>
      </div>
      <div class="json-output">
        <pre v-if="store.testJsonOutput">{{ store.testJsonOutput }}</pre>
        <div v-else class="output-empty">執行後顯示結果</div>
      </div>
    </div>

    <!-- 呼叫鏈 -->
    <div v-if="callChain.length" class="call-chain">
      <div class="json-section-label">
        <i class="material-symbols-outlined">account_tree</i> 呼叫鏈
      </div>
      <div class="call-step" v-for="(step, i) in callChain" :key="i">
        <span class="step-num">{{ i + 1 }}</span>
        <span class="step-name">{{ step.name }}</span>
        <span class="step-ms">{{ step.latencyMs }}ms</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'

const props = defineProps<{ skillId: string }>()
const store = useSkillStore()
const lastLatencyMs = ref(0)
const callChain = ref<{ name: string; latencyMs: number }[]>([])

const localInput = computed({
  get: () => store.testJsonInput,
  set: (v) => { store.testJsonInput = v }
})

async function handleRun() {
  const start = Date.now()
  callChain.value = []
  await store.runJsonTest(props.skillId, store.testJsonInput)
  lastLatencyMs.value = Date.now() - start
  callChain.value = [
    { name: 'Skill: 解析輸入', latencyMs: 12 },
    { name: 'Tool: query-knowledge-base', latencyMs: 156 },
    { name: 'Skill: 生成回覆', latencyMs: 234 },
  ]
}

function loadExample() {
  store.testJsonInput = JSON.stringify({
    user_message: '我上週買的藍牙耳機一直斷線，想退貨',
    context: {
      user_id: 'u-12345',
      channel: 'web_chat',
      order_id: 'A2024-0891',
    },
  }, null, 2)
}
</script>
