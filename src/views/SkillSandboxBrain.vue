<template>
  <div class="SkillSandbox views-page">
    <div class="views-page-content-box">

      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">技能測試沙盒</div>
        </div>
        <div class="banner-right">
          <span class="sb-env">
            <i class="material-symbols-outlined">hub</i>
            測試環境：{{ agentCount }} 個 Agent・{{ liveSkillCount }} 顆已啟用技能<template v-if="includeDrafts">＋{{ draftCount }} 顆草稿</template>
          </span>
        </div>
      </div>

      <!-- 全系統對話：每則回覆只附「結果」與「原因」 -->
      <div class="sb-layout">
        <div class="sb-panel-head">
          <div class="sb-panel-title">全系統對話測試</div>
          <div class="sb-panel-actions">
            <label class="sb-draft-toggle" :class="{ 'is-on': includeDrafts }">
              <input type="checkbox" v-model="includeDrafts" />
              <span class="sb-toggle-track"></span>
              包含草稿<span class="sb-draft-count">{{ draftCount }}</span>
            </label>
            <button class="custom-btn sb-reset-btn" :disabled="!messages.length || phase !== 'idle'" @click="reset">
              <i class="material-symbols-outlined">refresh</i>重置對話
            </button>
          </div>
        </div>

        <!-- 參與分工的 Agent：至少選一個，大腦只會把工作分給選到的 Agent -->
        <div class="sb-agent-picker">
          <div class="sb-agent-picker-label">
            參與分工的 Agent<span class="sb-required">*</span>
            <span class="sb-agent-picker-count">已選 {{ selectedAgents.length }} / {{ availableAgents.length }}</span>
            <span v-if="agentsLocked" class="sb-agent-locked">
              <i class="material-symbols-outlined">lock</i>對話進行中已鎖定，要換 Agent 請先重置對話
            </span>
          </div>
          <div class="sb-agent-chips">
            <button
              v-for="agent in availableAgents"
              :key="agent"
              type="button"
              :class="['sb-agent-chip', { 'is-selected': selectedAgents.includes(agent) }]"
              :aria-pressed="selectedAgents.includes(agent)"
              :disabled="agentsLocked"
              @click="toggleAgent(agent)"
            >
              <i class="material-symbols-outlined">{{ selectedAgents.includes(agent) ? 'check' : 'smart_toy' }}</i>{{ agent }}
            </button>
          </div>
        </div>

        <div class="sb-messages" ref="messagesEl">
          <div v-if="!messages.length && phase === 'idle'" class="sb-empty">
            <i class="material-symbols-outlined">neurology</i>
            <p v-if="selectedAgents.length">像一般使用者一樣發話，AI大腦會決定交給哪個 Agent、調用哪顆技能，並說明原因</p>
            <p v-else>先在上方選擇參與分工的 Agent（至少 1 個），再開始發話</p>
          </div>

          <template v-for="msg in messages" :key="msg.id">
            <div v-if="msg.role === 'user'" class="sb-bubble sb-bubble--user">{{ msg.content }}</div>

            <div v-else-if="msg.decision" class="sb-turn">
              <!-- 結果：大腦把工作分給誰、調用哪顆技能 -->
              <div class="sb-route-line">
                <span class="sb-brain-chip"><i class="material-symbols-outlined">neurology</i>AI大腦</span>
                <i class="material-symbols-outlined sb-route-arrow">arrow_forward</i>
                <span class="sb-route-agent">
                  <i class="material-symbols-outlined">smart_toy</i>{{ msg.decision.agent }}
                </span>
              </div>

              <div class="sb-bubble sb-bubble--agent">
                <div :class="['sb-trigger-banner', msg.decision.skill ? { 'is-draft': msg.decision.skill.isDraft } : 'is-none']">
                  <i class="material-symbols-outlined">{{ msg.decision.skill ? 'bolt' : 'block' }}</i>
                  <template v-if="msg.decision.skill">
                    <span class="sb-tb-label">觸發技能</span>
                    <span class="sb-tb-name">{{ msg.decision.skill.name }}</span>
                    <span v-if="msg.decision.skill.versionName" class="sb-tb-version">{{ msg.decision.skill.versionName }}</span>
                    <span v-if="msg.decision.skill.isDraft" class="sb-tb-draft">草稿</span>
                  </template>
                  <span v-else class="sb-tb-label">未觸發任何技能</span>
                </div>
                <div class="sb-bubble-content">{{ msg.content }}</div>
              </div>

              <!-- 原因：拿上面的結果回頭問大腦為什麼這樣分 -->
              <div class="sb-brain-reason">
                <div class="sb-brain-reason-label">
                  <i class="material-symbols-outlined">neurology</i>判斷原因
                </div>
                <p v-if="msg.decision.reason" class="sb-reason">{{ msg.decision.reason }}</p>
                <div v-else class="sb-brain-pending">
                  正在詢問 AI大腦…
                  <span class="sb-typing"><span></span><span></span><span></span></span>
                </div>
              </div>
            </div>
          </template>

          <div v-if="phase === 'routing'" class="sb-turn">
            <div class="sb-route-line">
              <span class="sb-brain-chip"><i class="material-symbols-outlined">neurology</i>AI大腦</span>
              <span class="sb-route-agent is-pending">判斷分工中…</span>
            </div>
            <div class="sb-bubble sb-bubble--agent">
              <div class="sb-typing"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>

        <div class="sb-composer">
          <div v-if="focusedSkill" class="sb-focus-line">
            測試重點：<strong>{{ focusedSkill.name }}</strong>
            <button type="button" class="sb-focus-clear" aria-label="取消測試重點" @click="focusSkillId = null">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>
          <div class="sb-prompt-chips">
            <button
              v-for="p in prompts"
              :key="p"
              class="sb-prompt-chip"
              :disabled="!canSend"
              @click="send(p)"
            >{{ p }}</button>
          </div>
          <div class="sb-input-row">
            <input
              v-model="inputText"
              class="custom-input"
              :placeholder="selectedAgents.length ? '輸入訊息，模擬使用者發話…' : '請先選擇至少 1 個 Agent'"
              :disabled="!canSend"
              @keydown.enter.prevent="handleSend"
            />
            <button class="custom-btn" :disabled="!inputText.trim() || !canSend" @click="handleSend">
              <i class="material-symbols-outlined">send</i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { useSandboxBrain } from '@/composables/useSandboxBrain'
import { useSkillStore } from '@/stores/skillStore'

const route = useRoute()
const store = useSkillStore()
const {
  messages, phase, availableAgents, selectedAgents, canSend, agentsLocked, toggleAgent, includeDrafts, agentCount, liveSkillCount, draftCount,
  suggestedPrompts, send, reset,
} = useSandboxBrain()

const inputText = ref('')
const messagesEl = ref<HTMLElement | null>(null)

// 測試重點：從技能卡片「測試」進來（?skillId=）時帶入。不鎖定只測這顆（分工本來就是全系統
// 一起判斷），只是把快速發話換成它的測試案例
const focusSkillId = ref<string | null>(null)
const focusedSkill = computed(() => focusSkillId.value ? store.findSkill(focusSkillId.value) ?? null : null)

const prompts = computed(() => {
  const cases = focusedSkill.value?.testCases?.map(tc => tc.input).filter(Boolean) ?? []
  return cases.length ? cases : suggestedPrompts
})

// 還沒啟用的技能不在正式技能池裡，帶它進來時自動打開「包含草稿」，不然根本分不到它
function focusSkill(id: string) {
  focusSkillId.value = id
  const skill = store.findSkill(id)
  if (skill && !skill.isEnabled) includeDrafts.value = true
}

async function handleSend() {
  const text = inputText.value
  inputText.value = ''
  await send(text)
}

watch(
  () => [messages.value.length, phase.value],
  async () => {
    await nextTick()
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
)

onMounted(() => {
  const skillId = route.query.skillId as string | undefined
  if (skillId && store.findSkill(skillId)) focusSkill(skillId)
})
</script>
