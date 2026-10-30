<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="gateSkill" class="drawer-confirm-overlay" @click.self="resolveCancelled">
        <div :class="['drawer-confirm-dialog', 'enable-gate-dialog', { 'is-testing': isTesting }]">
          <template v-if="!isTesting">
            <div class="confirm-icon confirm-icon--update">
              <i class="material-symbols-outlined">rule</i>
            </div>
            <h4>「{{ gateSkill.name }}」還沒測試過</h4>
            <p>{{ describeAiTestGateReason() }}</p>
            <div class="confirm-actions confirm-actions--column">
              <button class="custom-btn custom-main-btn" @click="startTesting">
                <i class="material-symbols-outlined">science</i>立即測試
              </button>
              <!-- 測試是建議、不是強制：使用者可以略過測試，直接進「確認可調用 Agent」 -->
              <button class="custom-btn enable-skip-test-btn" @click="enterAgentStep(gateSkill)">
                <i class="material-symbols-outlined">bolt</i>不測試，直接啟用
              </button>
              <button class="custom-btn" @click="resolveCancelled">
                取消
              </button>
            </div>
          </template>

          <!-- 「立即測試」：就地在同一個對話框裡測，原本的選擇按鈕收起來。既然選了測試，就不再給
               「不測試，直接啟用」：交卷（測過即可，不用全對）前「繼續啟用」反灰，不想測了按取消 -->
          <template v-else>
            <h4>測試「{{ gateSkill.name }}」</h4>
            <!-- 送審沒有「略過測試」，直接進測試；用一行說明交代為什麼要先測 -->
            <p v-if="mode === 'submit'">送審前這一版需要先測過一次（交卷就算，不用全部答對）。</p>
            <div class="enable-gate-test">
              <SkillTestAI :skill-id="gateSkill.id" embedded />
            </div>
            <div class="confirm-actions">
              <button class="custom-btn" @click="resolveCancelled">
                取消
              </button>
              <button
                v-if="mode === 'submit'"
                class="custom-btn custom-main-btn"
                :disabled="!gatePassed"
                @click="resolveSubmitReady"
              >
                <i class="material-symbols-outlined">send</i>繼續送審
              </button>
              <button
                v-else
                class="custom-btn custom-main-btn"
                :disabled="!gatePassed"
                @click="enterAgentStep(gateSkill)"
              >
                <i class="material-symbols-outlined">check_circle</i>繼續啟用
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="confirm-fade">
      <div v-if="agentSkill" class="drawer-confirm-overlay" @click.self="resolveCancelled">
        <div class="drawer-confirm-dialog enable-agent-dialog">
          <div class="confirm-icon confirm-icon--update">
            <i class="material-symbols-outlined">smart_toy</i>
          </div>
          <h4>啟用「{{ agentSkill.name }}」</h4>
          <p>確認哪些 Agent 可以調用這個技能，之後隨時可以再調整。</p>
          <div class="se-agent-grid lively-stagger">
            <button
              v-for="agent in AVAILABLE_AGENTS"
              :key="agent"
              type="button"
              :class="['se-agent-chip', 'lively-card', { 'is-selected': selectedAgents.includes(agent) }]"
              @click="toggleAgent(agent)"
            >
              <i class="material-symbols-outlined">smart_toy</i>
              {{ agent }}
              <i v-if="selectedAgents.includes(agent)" class="material-symbols-outlined se-chip-check">check</i>
            </button>
          </div>
          <div class="confirm-actions confirm-actions--column">
            <button
              class="custom-btn custom-main-btn"
              :disabled="selectedAgents.length === 0"
              @click="resolveConfirmed"
            >
              <i class="material-symbols-outlined">check_circle</i>確認並啟用
            </button>
            <button class="custom-btn" @click="resolveCancelled">
              取消
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// 啟用一顆技能的共用流程：檢查這一版測過沒有（不要求全對，沒測過可就地測試）→ 確認可調用此技能的 Agent。
// 送審前的測試閘門也共用這裡的「就地測試」對話框（requestTestBeforeSubmit），只是沒有略過選項、
// 也不接 Agent 確認，測過就交回呼叫端打開送審 dialog。
// 只負責「問使用者、回傳結果」，不負責實際呼叫 store 把技能存檔或切換狀態——
// 三個呼叫端（SkillManagement/SkillEditor/SkillTestAI）的「啟用」動作形狀不一樣
// （已存在技能直接切換 vs. 表單送出的一部分），拿到結果後各自決定要做什麼。
import { computed, ref } from 'vue'
import { canEnableSkill, canSubmitSkill, describeAiTestGateReason, AVAILABLE_AGENTS, useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'
import SkillTestAI from '@/components/Skill/SkillTestAI.vue'

export type EnableFlowOutcome =
  | { type: 'confirmed'; agents: string[] }
  | { type: 'cancelled' }

const store = useSkillStore()
// 'enable'：啟用流程；'submit'：送審前的測試閘門
const mode = ref<'enable' | 'submit'>('enable')
const gateSkill = ref<Skill | null>(null)
const isTesting = ref(false)
const agentSkill = ref<Skill | null>(null)
const selectedAgents = ref<string[]>([])

let resolver: ((outcome: EnableFlowOutcome) => void) | null = null
let submitResolver: ((ready: boolean) => void) | null = null
let pendingExistingAgents: string[] = []

function toggleAgent(agent: string) {
  const idx = selectedAgents.value.indexOf(agent)
  if (idx === -1) selectedAgents.value.push(agent)
  else selectedAgents.value.splice(idx, 1)
}

// 呼叫端傳進來的 skill 可能是列表 computed 展開過的複本，測試作答時 store 只會更新
// 原本那份的 aiTestPassRate——所以要回 store 找最新的那份判斷是否已通過
const gatePassed = computed(() => {
  if (!gateSkill.value) return false
  const latest = store.findSkill(gateSkill.value.id) ?? gateSkill.value
  return mode.value === 'submit' ? canSubmitSkill(latest) : canEnableSkill(latest)
})

function startTesting() {
  isTesting.value = true
}

function enterAgentStep(skill: Skill) {
  gateSkill.value = null
  isTesting.value = false
  agentSkill.value = skill
  selectedAgents.value = [...pendingExistingAgents]
}

function resolveCancelled() {
  gateSkill.value = null
  isTesting.value = false
  agentSkill.value = null
  resolver?.({ type: 'cancelled' })
  resolver = null
  submitResolver?.(false)
  submitResolver = null
}

function resolveConfirmed() {
  if (selectedAgents.value.length === 0) return
  agentSkill.value = null
  resolver?.({ type: 'confirmed', agents: [...selectedAgents.value] })
  resolver = null
}

function resolveSubmitReady() {
  if (!gatePassed.value) return
  gateSkill.value = null
  isTesting.value = false
  submitResolver?.(true)
  submitResolver = null
}

// 上一次呼叫還沒 resolve 就又被呼叫（理論上不該發生），不能讓前一個 promise 永遠
// pending 下去，先幫它 resolve 成取消
function cancelPending() {
  resolver?.({ type: 'cancelled' })
  resolver = null
  submitResolver?.(false)
  submitResolver = null
}

function requestEnable(skill: Skill, existingAgents: string[]): Promise<EnableFlowOutcome> {
  cancelPending()
  mode.value = 'enable'
  isTesting.value = false
  pendingExistingAgents = existingAgents
  return new Promise(resolve => {
    resolver = resolve
    if (!canEnableSkill(skill)) {
      gateSkill.value = skill
    } else {
      enterAgentStep(skill)
    }
  })
}

// 送審前的測試閘門：這一版已經測過就直接回 true；沒測過就打開就地測試對話框，
// 交卷後按「繼續送審」回 true，取消回 false
function requestTestBeforeSubmit(skill: Skill): Promise<boolean> {
  cancelPending()
  if (canSubmitSkill(skill)) return Promise.resolve(true)
  mode.value = 'submit'
  return new Promise(resolve => {
    submitResolver = resolve
    gateSkill.value = skill
    isTesting.value = true
  })
}

defineExpose({ requestEnable, requestTestBeforeSubmit })
</script>
