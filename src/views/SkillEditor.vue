<template>
  <div class="SkillEditor views-page">
    <div class="views-page-content-box">

      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">{{ isEditMode ? '編輯技能' : '建立技能' }}</div>
        </div>
      </div>

      <div v-if="hasNameConflict" class="name-conflict-banner">
        <i class="material-symbols-outlined">info</i>
        你已經有一份來自「{{ conflictSourceName }}」的技能了，建議修改顯示名稱以便區分。
      </div>

      <!-- 步驟指示器 -->
      <div class="se-stepper">
        <button
          type="button"
          v-for="(label, i) in STEPS"
          :key="i"
          :class="['se-step', { 'is-active': currentStep === i, 'is-done': currentStep > i }]"
          :disabled="currentStep <= i"
          :aria-current="currentStep === i ? 'step' : undefined"
          @click="currentStep > i ? (currentStep = i) : undefined"
        >
          <span class="se-step-bubble">
            <i v-if="currentStep > i" class="material-symbols-outlined">check</i>
            <span v-else>{{ i + 1 }}</span>
          </span>
          <span class="se-step-label">{{ label }}</span>
        </button>
        <div class="se-step-track">
          <div class="se-step-fill" :style="{ width: fillWidth }" />
        </div>
      </div>

      <!-- 步驟內容 -->
      <div class="se-body">

        <!-- Step 0：基本資訊 -->
        <template v-if="currentStep === 0">
          <div class="se-section">
            <label class="se-label">技能名稱 <span class="se-required">*</span></label>
            <input
              v-model="form.name"
              class="custom-input"
              placeholder="例：ERP 庫存查詢"
              maxlength="40"
              autofocus
            />
            <p class="se-hint">簡短精確，讓 Agent 在選用時能快速識別。</p>
          </div>
          <div class="se-section">
            <div class="se-label-row">
              <label class="se-label">技能描述</label>
              <span class="se-ai-badge">
                <i class="material-symbols-outlined">auto_awesome</i>AI 自動生成
              </span>
            </div>
            <div class="se-ai-desc">
              <template v-if="existingSkill?.description">{{ existingSkill.description }}</template>
              <span v-else class="se-ai-desc-hint">AI 將根據技能指令自動識別並填入描述</span>
            </div>
          </div>
        </template>

        <!-- Step 1：技能指令 -->
        <template v-else-if="currentStep === 1">
          <div class="se-primary-section">
            <label class="se-label">技能指令（Instructions）</label>
            <p class="se-hint">
              定義此技能的角色、行為規則與限制。Agent 執行此技能時依照這份指令運作。
              可使用 Markdown，支援條列式規則與範例。
            </p>
            <div class="se-editor-wrap">
              <textarea
                v-model="form.instructions"
                class="custom-input se-textarea-lg se-mono"
                :placeholder="instructionsPlaceholder"
              />
              <div class="se-char-count">{{ form.instructions.length }} 字元</div>
            </div>
          </div>

          <div class="se-secondary-row">
            <div class="se-secondary-section">
              <label class="se-label">觸發時機（選填）</label>
              <p class="se-hint">描述 Agent 在什麼情境下應優先選用此技能，幫助路由判斷更準確。</p>
              <textarea
                v-model="form.triggerHint"
                class="custom-input se-textarea-sm"
                placeholder="例：當用戶詢問庫存數量、倉庫存量、缺貨狀態等相關問題時使用"
                rows="3"
                maxlength="300"
              />
            </div>
            <div class="se-secondary-section">
              <label class="se-label">所需檔案（選填）</label>
              <p class="se-hint">上傳技能執行時需要參考的檔案，例如規則表、範本、FAQ 文件。</p>
              <SkillFileUpload v-model="form.files" />
            </div>
          </div>

          <div class="se-section">
            <label class="se-label">覆蓋能力（選填）</label>
            <p class="se-hint">拆解這個技能具體涵蓋哪些能力，例如「問題分類」「情緒分析」，方便之後在技能詳情快速掌握技能範圍。</p>
            <SkillCapabilityEditor v-model="form.capabilities" />
          </div>

          <div class="se-section">
            <label class="se-label">指派 Agent（選填）</label>
            <p class="se-hint">選擇哪些 Agent 可以調用此技能。未指派時技能仍可建立，之後可再補充。</p>
            <div class="se-agent-grid lively-stagger">
              <button
                v-for="agent in AVAILABLE_AGENTS"
                :key="agent"
                type="button"
                :class="['se-agent-chip', 'lively-card', { 'is-selected': form.assignedAgents.includes(agent) }]"
                @click="toggleAgent(agent)"
              >
                <i class="material-symbols-outlined">smart_toy</i>
                {{ agent }}
                <i v-if="form.assignedAgents.includes(agent)" class="material-symbols-outlined se-chip-check">check</i>
              </button>
            </div>
          </div>
        </template>

        <!-- Step 2：確認 -->
        <template v-else>
          <h3 class="se-confirm-title">{{ form.name }}</h3>

          <div class="se-confirm-grid lively-stagger">
            <div class="se-confirm-group lively-card">
              <div class="se-confirm-group-hd">
                <i class="material-symbols-outlined lively-icon">description</i>內容摘要
              </div>
              <div class="se-confirm-row">
                <span class="se-confirm-key">指令</span>
                <span class="se-confirm-val">
                  <span v-if="form.instructions">{{ form.instructions.length }} 字元</span>
                  <span v-else class="se-empty">（未填寫）</span>
                </span>
              </div>
              <div v-if="form.triggerHint" class="se-confirm-row">
                <span class="se-confirm-key">觸發時機</span>
                <span class="se-confirm-val">{{ form.triggerHint }}</span>
              </div>
              <div class="se-confirm-row">
                <span class="se-confirm-key">所需檔案</span>
                <span class="se-confirm-val">
                  <span v-if="form.files.length">{{ form.files.length }} 個檔案</span>
                  <span v-else class="se-empty">（未上傳）</span>
                </span>
              </div>
              <div class="se-confirm-row">
                <span class="se-confirm-key">覆蓋能力</span>
                <span class="se-confirm-val">
                  <span v-if="form.capabilities.length">{{ form.capabilities.length }} 項能力</span>
                  <span v-else class="se-empty">（未填寫）</span>
                </span>
              </div>
            </div>

            <div class="se-confirm-group lively-card">
              <div class="se-confirm-group-hd">
                <i class="material-symbols-outlined lively-icon">tune</i>設定
              </div>
              <div class="se-confirm-row">
                <span class="se-confirm-key">指派 Agent</span>
                <span class="se-confirm-val">
                  <span v-if="form.assignedAgents.length">{{ form.assignedAgents.join('、') }}</span>
                  <span v-else class="se-empty">（未指派）</span>
                </span>
              </div>
              <div v-if="isEditMode" class="se-confirm-row se-confirm-row--toggle">
                <span class="se-confirm-key">啟用狀態</span>
                <label class="se-toggle">
                  <input type="checkbox" v-model="form.isEnabled" />
                  <span class="se-toggle-track"></span>
                </label>
              </div>
            </div>
          </div>

          <p class="se-confirm-note">
            <i class="material-symbols-outlined">info</i>
            {{ isEditMode ? '儲存後變更立即生效。' : '建立後請先在「AI 快速測試」通過測試（或選擇略過）才能啟用。' }}
          </p>
        </template>

      </div>

      <!-- 底部導覽 -->
      <div class="se-footer">
        <button v-if="currentStep > 0" class="custom-btn" @click="currentStep--">
          <i class="material-symbols-outlined">arrow_back</i>上一步
        </button>
        <span v-else />
        <div class="se-footer-right">
          <button class="custom-btn" @click="router.push('/view/Skills')">取消</button>
          <button
            v-if="currentStep < STEPS.length - 1"
            class="custom-btn custom-main-btn"
            :disabled="currentStep === 0 && !form.name.trim()"
            @click="currentStep++"
          >
            下一步<i class="material-symbols-outlined">arrow_forward</i>
          </button>
          <button
            v-else
            class="custom-btn custom-main-btn"
            :disabled="!form.name.trim()"
            @click="handleSubmit"
          >
            <i class="material-symbols-outlined">check</i>
            {{ isEditMode ? '儲存變更' : '建立技能' }}
          </button>
        </div>
      </div>

      <!-- 啟用前的測試閘門：個人技能沒通過 AI 快速測試（或沒明確選擇略過）時，
           勾了「啟用狀態」送出也不直接生效，改問清楚要怎麼處理 -->
      <Teleport to="body">
        <Transition name="confirm-fade">
          <div
            v-if="enableGateBlocked"
            class="drawer-confirm-overlay"
            @click.self="enableGateBlocked = false"
          >
            <div class="drawer-confirm-dialog enable-gate-dialog">
              <div class="confirm-icon confirm-icon--update">
                <i class="material-symbols-outlined">rule</i>
              </div>
              <h4>還不能啟用「{{ form.name }}」</h4>
              <p>{{ existingSkill ? describeAiTestGateReason(existingSkill) : '' }}</p>
              <div class="confirm-actions confirm-actions--column">
                <button class="custom-btn" @click="handleEnableGateRevise">
                  <i class="material-symbols-outlined">forum</i>去修改技能內容
                </button>
                <button class="custom-btn custom-main-btn" @click="handleEnableGateOverride">
                  <i class="material-symbols-outlined">check_circle</i>視為通過，直接啟用
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import SkillFileUpload from '@/components/Skill/SkillFileUpload.vue'
import SkillCapabilityEditor from '@/components/Skill/SkillCapabilityEditor.vue'
import { useSkillStore, AVAILABLE_AGENTS, canEnableSkill, describeAiTestGateReason } from '@/stores/skillStore'
import type { DraftSkill, SkillFile, SkillCapability } from '@/stores/skillStore'

const router = useRouter()
const route = useRoute()
const store = useSkillStore()

const STEPS = ['基本資訊', '技能指令', '確認'] as const
const currentStep = ref(0)

const editSkillId = route.query.skillId as string | undefined
const draftId = route.query.draftId as string | undefined
const isEditMode = !!editSkillId
const isDraftMode = !!draftId

const existingSkill = editSkillId ? store.findSkill(editSkillId) : null
const existingDraft = draftId ? (store.myDrafts as DraftSkill[]).find(d => d.id === draftId) ?? null : null

const enableGateBlocked = ref(false)

const hasNameConflict = computed(() => {
  if (!existingSkill || existingSkill.zone !== 'personal' || !existingSkill.derivedFrom) return false
  return store.hasSkillNameConflict(existingSkill.id)
})

const conflictSourceName = computed(() => {
  if (!existingSkill?.derivedFrom) return ''
  return store.findSkill(existingSkill.derivedFrom)?.name ?? existingSkill.derivedFrom
})

const form = reactive({
  name: existingSkill?.name ?? existingDraft?.name ?? '',
  instructions: existingSkill?.instructions ?? existingDraft?.instructions ?? '',
  triggerHint: existingSkill?.triggerHint ?? existingDraft?.triggerHint ?? '',
  assignedAgents: existingSkill?.assignedAgents
    ? [...existingSkill.assignedAgents]
    : existingDraft?.assignedAgents
      ? [...existingDraft.assignedAgents]
      : [] as string[],
  isEnabled: existingSkill?.isEnabled ?? true,
  files: existingSkill?.files ?? existingDraft?.files ?? [] as SkillFile[],
  capabilities: existingSkill?.capabilities ?? [] as SkillCapability[],
})

const fillWidth = computed(() => `${(currentStep.value / (STEPS.length - 1)) * 100}%`)

const instructionsPlaceholder = `你是一個專門處理 ERP 庫存查詢的助理。

## 行為規則
- 收到庫存查詢請求時，先確認產品 ID 格式正確（格式：SKU-XXXXX）
- 查詢範圍涵蓋所有倉庫，預設返回總庫存量
- 若庫存低於安全存量（50 件），主動提示補貨建議

## 輸出格式
以條列式呈現各倉庫庫存，最後附上總計。`

function toggleAgent(agent: string) {
  const idx = form.assignedAgents.indexOf(agent)
  if (idx === -1) form.assignedAgents.push(agent)
  else form.assignedAgents.splice(idx, 1)
}

function buildPayload() {
  return {
    name: form.name.trim(),
    instructions: form.instructions.trim(),
    triggerHint: form.triggerHint.trim(),
    assignedAgents: [...form.assignedAgents],
    isEnabled: form.isEnabled,
    files: [...form.files],
    // 只保留有填名稱的能力，使用者點了「新增能力」卻沒填就送出的空白列不用存
    capabilities: form.capabilities
      .filter(c => c.name.trim())
      .map(c => ({ name: c.name.trim(), description: c.description.trim() })),
  }
}

function handleSubmit() {
  if (!form.name.trim()) return

  // 編輯模式下，如果是「原本停用、這次要切成啟用」而且還沒過測試關卡，攔下整次送出，
  // 不呼叫 updateSkill；只有 zone === 'personal' 的技能受這條規則限制
  if (
    isEditMode && editSkillId && existingSkill?.zone === 'personal' &&
    form.isEnabled && !existingSkill.isEnabled && !canEnableSkill(existingSkill)
  ) {
    enableGateBlocked.value = true
    return
  }

  const payload = buildPayload()
  if (isDraftMode && draftId) {
    store.updateDraft(draftId, payload)
  } else if (isEditMode && editSkillId) {
    store.updateSkill(editSkillId, payload)
  } else {
    // 全新建立一律先進個人技能區，不需要送審就能個人使用（跟「建立副本」同一套模式）
    store.createPersonalSkill(payload)
  }
  router.push('/view/Skills')
}

function handleEnableGateRevise() {
  enableGateBlocked.value = false
  if (!editSkillId) return
  router.push({ name: 'SkillStudio', query: { skillId: editSkillId } })
}

function handleEnableGateOverride() {
  if (!editSkillId) return
  store.overrideAndEnableSkill(editSkillId)
  enableGateBlocked.value = false
  // 覆蓋只處理 isEnabled；表單其餘欄位的變更照樣送出，isEnabled 明確帶 true
  // （剛剛已經翻成 true 的現況），不要帶表單裡過期的 false 把它蓋回去
  store.updateSkill(editSkillId, { ...buildPayload(), isEnabled: true })
  router.push('/view/Skills')
}
</script>
