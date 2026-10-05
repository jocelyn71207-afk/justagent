<template>
  <div class="SkillBlockBasicsForm">
    <label class="sbc-field">
      <span class="sbc-label">技能名稱</span>
      <input class="custom-input sbbf-name-input" :value="props.name" placeholder="例：行銷週報" @input="emit('update:name', ($event.target as HTMLInputElement).value)" />
    </label>
    <div v-if="props.nameConflict" class="name-conflict-banner">
      <i class="material-symbols-outlined">info</i>你已經有一個同名的個人技能，建議修改名稱以便區分。
    </div>

    <div class="sbbf-field">
      <div class="sbbf-label-row">
        <span class="sbc-label">說明 <span class="se-required">*</span></span>
        <button
          type="button"
          class="custom-btn sbbf-ai-btn"
          :disabled="!props.sectionIds.length"
          @click="applyDescriptionSuggestion"
        >
          <i class="material-symbols-outlined">auto_awesome</i>AI 建議
        </button>
      </div>
      <p v-if="!props.sectionIds.length" class="se-hint">請先在「積木組成」選擇章節，才能產生建議</p>
      <textarea
        class="custom-input sbbf-textarea"
        :value="props.description"
        placeholder="這份報告給誰看、多久產一次"
        rows="3"
        @input="emit('update:description', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div class="sbbf-field">
      <div class="sbbf-label-row">
        <span class="sbc-label">觸發情境 <span class="se-required">*</span></span>
        <button
          type="button"
          class="custom-btn sbbf-ai-btn"
          :disabled="!props.sectionIds.length"
          @click="applyTriggerHintSuggestion"
        >
          <i class="material-symbols-outlined">auto_awesome</i>AI 建議
        </button>
      </div>
      <p v-if="!props.sectionIds.length" class="se-hint">請先在「積木組成」選擇章節，才能產生建議</p>
      <textarea
        class="custom-input sbbf-textarea"
        :value="props.triggerHint"
        placeholder="例：當使用者要求產出本月行銷週報時"
        rows="3"
        @input="emit('update:triggerHint', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div class="sbbf-field">
      <div class="sbbf-label-row">
        <span class="sbc-label">覆蓋能力 <span class="se-required">*</span></span>
        <button
          type="button"
          class="custom-btn sbbf-ai-btn"
          :disabled="!props.sectionIds.length"
          @click="applyCapabilitiesSuggestion"
        >
          <i class="material-symbols-outlined">auto_awesome</i>AI 建議
        </button>
      </div>
      <SkillCapabilityEditor :model-value="props.capabilities" @update:model-value="emit('update:capabilities', $event)" />
    </div>

    <div class="sbbf-field">
      <span class="sbc-label">指派 Agent <span class="se-required">*</span></span>
      <p class="se-hint">選擇哪些 Agent 可以調用這顆技能，至少指派一位。</p>
      <AgentAssignGrid :model-value="props.assignedAgents" @update:model-value="emit('update:assignedAgents', $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 積木流程「基本設定」步驟：技能名稱／說明／觸發情境／覆蓋能力／指派 Agent 都是
// 使用者手動輸入的必填欄位，不再隨「積木組成」步驟選的章節自動覆蓋——
// 觸發情境／覆蓋能力可以按「AI 建議」套用依目前已選章節算出來的建議內容，
// 但套用與否、要不要覆蓋既有輸入由這裡的確認對話框把關，不會悄悄蓋掉手改的內容
import type { SkillCapability } from '@/stores/skillStore'
import { deriveFromSections, suggestDescriptionFromSections } from '@/composables/useSkillStudioConversation'
import SkillCapabilityEditor from '@/components/Skill/SkillCapabilityEditor.vue'
import AgentAssignGrid from '@/components/Skill/AgentAssignGrid.vue'
import popDialog from '@/services/popDialog'

const props = defineProps<{
  name: string
  description: string
  triggerHint: string
  capabilities: SkillCapability[]
  assignedAgents: string[]
  sectionIds: string[]
  nameConflict?: boolean
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:description': [value: string]
  'update:triggerHint': [value: string]
  'update:capabilities': [value: SkillCapability[]]
  'update:assignedAgents': [value: string[]]
}>()

function applyDescriptionSuggestion() {
  if (!props.sectionIds.length) return
  const suggestion = suggestDescriptionFromSections(props.sectionIds)
  if (!suggestion) return
  if (!props.description.trim()) {
    emit('update:description', suggestion)
    return
  }
  popDialog.confirm(
    `套用 AI 建議的說明？將取代目前輸入的內容：\n「${suggestion}」`,
    '套用建議',
    '保留原內容',
    () => emit('update:description', suggestion),
  )
}

function applyTriggerHintSuggestion() {
  if (!props.sectionIds.length) return
  const suggestion = deriveFromSections(props.sectionIds).triggerHint
  if (!suggestion) return
  if (!props.triggerHint.trim()) {
    emit('update:triggerHint', suggestion)
    return
  }
  popDialog.confirm(
    `套用 AI 建議的觸發情境？將取代目前輸入的內容：\n「${suggestion}」`,
    '套用建議',
    '保留原內容',
    () => emit('update:triggerHint', suggestion),
  )
}

function applyCapabilitiesSuggestion() {
  if (!props.sectionIds.length) return
  const suggestion = deriveFromSections(props.sectionIds).capabilities
  if (!suggestion.length) return
  if (!props.capabilities.length) {
    emit('update:capabilities', suggestion)
    return
  }
  popDialog.confirm(
    `套用 AI 建議的覆蓋能力？將取代目前的 ${props.capabilities.length} 項標籤`,
    '套用建議',
    '保留原內容',
    () => emit('update:capabilities', suggestion),
  )
}
</script>
