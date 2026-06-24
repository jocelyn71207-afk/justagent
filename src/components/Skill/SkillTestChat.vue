<template>
  <div class="SkillTestChat">
    <div class="chat-toolbar">
      <span class="system-hint">模擬 User 與 Agent 的真實對話，觀察技能觸發行為</span>
      <button class="custom-btn" @click="store.resetConversation()">
        <i class="material-symbols-outlined">restart_alt</i>重置對話
      </button>
    </div>

    <div class="chat-messages" ref="messagesEl">
      <div v-if="!store.testConversationHistory.length" class="chat-empty">
        <i class="material-symbols-outlined">chat_bubble_outline</i>
        <p>輸入訊息開始測試對話</p>
      </div>

      <template v-for="msg in store.testConversationHistory" :key="msg.id">
        <div :class="['chat-bubble', msg.role === 'user' ? 'bubble--user' : 'bubble--agent']">
          <div v-if="msg.role === 'agent'" class="bubble-label">AI Agent</div>
          <div class="bubble-content">{{ msg.content }}</div>
          <div v-if="msg.toolTrace?.length" class="tool-trace">
            <div class="trace-row" v-for="t in msg.toolTrace" :key="t.name">
              <i class="material-symbols-outlined">settings</i>
              {{ t.name }}
              <span class="trace-ms">{{ t.latencyMs }}ms</span>
            </div>
          </div>
        </div>
      </template>

      <div v-if="store.testIsRunning" class="chat-bubble bubble--agent">
        <div class="bubble-label">AI Agent</div>
        <div class="bubble-typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <!-- 預設測試案例 -->
    <div v-if="testCases.length" class="test-cases-bar">
      <span class="test-cases-label">測試案例</span>
      <div class="test-cases-list">
        <button
          v-for="tc in testCases"
          :key="tc.name"
          class="test-case-chip"
          :disabled="store.testIsRunning"
          @click="inputText = tc.input"
        >
          {{ tc.name }}
        </button>
      </div>
    </div>

    <div class="chat-input-row">
      <input
        v-model="inputText"
        class="custom-input"
        placeholder="輸入測試訊息，模擬用戶..."
        :disabled="store.testIsRunning"
        @keydown.enter.prevent="handleSend"
      />
      <button
        class="custom-btn"
        :disabled="!inputText.trim() || store.testIsRunning"
        @click="handleSend"
      >
        <i class="material-symbols-outlined">send</i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useSkillStore } from '@/stores/skillStore'

const props = defineProps<{ skillId: string }>()
const store = useSkillStore()
const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)

const testCases = computed(() => store.findSkill(props.skillId)?.testCases ?? [])

async function handleSend() {
  const msg = inputText.value.trim()
  if (!msg) return
  inputText.value = ''
  await store.sendChatMessage(props.skillId, msg)
}

watch(
  () => store.testConversationHistory.length,
  async () => {
    await nextTick()
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  }
)
</script>
