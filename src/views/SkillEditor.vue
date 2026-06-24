<template>
  <div class="SkillEditor views-page">
    <div class="views-page-content-box">

      <div class="page-banner">
        <div>
          <AppBreadcrumb />
          <div class="banner-title">{{ isEditMode ? '編輯技能' : '建立技能' }}</div>
        </div>
      </div>

      <!-- 步驟指示器 -->
      <div class="se-stepper">
        <div
          v-for="(label, i) in STEPS"
          :key="i"
          :class="['se-step', { 'is-active': currentStep === i, 'is-done': currentStep > i }]"
          @click="currentStep > i ? (currentStep = i) : undefined"
        >
          <div class="se-step-bubble">
            <i v-if="currentStep > i" class="material-symbols-outlined">check</i>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="se-step-label">{{ label }}</span>
        </div>
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
            <label class="se-label">描述（選填）</label>
            <textarea
              v-model="form.description"
              class="custom-input se-textarea-sm"
              placeholder="這個技能的用途與適用場景"
              rows="3"
              maxlength="200"
            />
          </div>
        </template>

        <!-- Step 1：技能指令 -->
        <template v-else-if="currentStep === 1">
          <div class="se-section">
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
          <div class="se-section">
            <label class="se-label">觸發時機（選填）</label>
            <p class="se-hint">
              描述 Agent 在什麼情境下應優先選用此技能，幫助路由判斷更準確。
            </p>
            <textarea
              v-model="form.triggerHint"
              class="custom-input se-textarea-sm"
              placeholder="例：當用戶詢問庫存數量、倉庫存量、缺貨狀態等相關問題時使用"
              rows="3"
              maxlength="300"
            />
          </div>
          <div class="se-section">
            <label class="se-label">指派 Agent（選填）</label>
            <p class="se-hint">選擇哪些 Agent 可以調用此技能。未指派時技能仍可建立，之後可再補充。</p>
            <div class="se-agent-grid">
              <button
                v-for="agent in AVAILABLE_AGENTS"
                :key="agent"
                type="button"
                :class="['se-agent-chip', { 'is-selected': form.assignedAgents.includes(agent) }]"
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
          <div class="se-confirm-card">
            <div class="se-confirm-row">
              <span class="se-confirm-key">技能名稱</span>
              <span class="se-confirm-val">{{ form.name }}</span>
            </div>
            <div v-if="form.description" class="se-confirm-row">
              <span class="se-confirm-key">描述</span>
              <span class="se-confirm-val">{{ form.description }}</span>
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
              <span class="se-confirm-key">指派 Agent</span>
              <span class="se-confirm-val">
                <span v-if="form.assignedAgents.length">{{ form.assignedAgents.join('、') }}</span>
                <span v-else class="se-empty">（未指派）</span>
              </span>
            </div>
            <div class="se-confirm-row se-confirm-row--toggle">
              <span class="se-confirm-key">{{ isEditMode ? '啟用狀態' : '建立後立即啟用' }}</span>
              <label class="se-toggle">
                <input type="checkbox" v-model="form.isEnabled" />
                <span class="se-toggle-track"></span>
              </label>
            </div>
          </div>

          <p class="se-confirm-note">
            <i class="material-symbols-outlined">info</i>
            {{ isEditMode ? '儲存後變更立即生效。' : '建立後可在技能管理頁隨時編輯或停用此技能。' }}
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

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppBreadcrumb from '@/components/AppBreadcrumb.vue'
import { useSkillStore } from '@/stores/skillStore'

const router = useRouter()
const route = useRoute()
const store = useSkillStore()

const STEPS = ['基本資訊', '技能指令', '確認'] as const
const currentStep = ref(0)

const AVAILABLE_AGENTS = [
  '通用助理', '客服中心助理', '電商小幫手',
  '知識管理助理', '會議記錄助理', '工程助理',
  '業務分析助理', '倉儲管理助理',
]

const editSkillId = route.query.skillId as string | undefined
const isEditMode = !!editSkillId
const existingSkill = editSkillId ? store.findSkill(editSkillId) : null

const form = reactive({
  name: existingSkill?.name ?? '',
  description: existingSkill?.description ?? '',
  instructions: existingSkill?.instructions ?? '',
  triggerHint: existingSkill?.triggerHint ?? '',
  assignedAgents: existingSkill?.assignedAgents ? [...existingSkill.assignedAgents] : [] as string[],
  isEnabled: existingSkill?.isEnabled ?? true,
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

function handleSubmit() {
  if (!form.name.trim()) return
  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    instructions: form.instructions.trim(),
    triggerHint: form.triggerHint.trim(),
    assignedAgents: [...form.assignedAgents],
    isEnabled: form.isEnabled,
  }
  if (isEditMode && editSkillId) {
    store.updateSkill(editSkillId, payload)
  } else {
    store.createSkill(payload)
  }
  router.push('/view/Skills')
}
</script>
