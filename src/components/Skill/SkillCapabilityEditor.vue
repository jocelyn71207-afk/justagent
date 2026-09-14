<template>
  <div class="SkillCapabilityEditor">
    <!-- 常見能力預設：常見技能類型都會出現的能力，點一下直接加進清單，
         使用者可以再自行改寫名稱／說明，不用每次都從空白開始打 -->
    <div class="sce-presets">
      <button
        v-for="preset in CAPABILITY_PRESETS"
        :key="preset.name"
        type="button"
        class="sce-preset-chip"
        :disabled="isPresetAdded(preset.name)"
        @click="addPreset(preset)"
      >
        <i class="material-symbols-outlined">{{ isPresetAdded(preset.name) ? 'check' : 'add' }}</i>
        {{ preset.name }}
      </button>
    </div>

    <div v-if="modelValue.length" class="sce-list">
      <div v-for="(cap, i) in modelValue" :key="i" class="sce-item">
        <div class="sce-item-head">
          <input
            :value="cap.name"
            class="custom-input sce-name-input"
            placeholder="能力名稱，例如「問題分類」"
            maxlength="30"
            @input="updateCapability(i, { name: ($event.target as HTMLInputElement).value })"
          />
          <button
            type="button"
            class="icon-btn sce-remove-btn"
            aria-label="移除這項能力"
            @click="removeCapability(i)"
          >
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <textarea
          :value="cap.description"
          class="custom-input sce-desc-input"
          rows="2"
          placeholder="說明這個能力具體做什麼，例如「依使用者訊息語意自動分類問題類型」"
          maxlength="200"
          @input="updateCapability(i, { description: ($event.target as HTMLTextAreaElement).value })"
        ></textarea>
      </div>
    </div>
    <button type="button" class="custom-btn sce-add-btn" @click="addCapability">
      <i class="material-symbols-outlined">add</i>新增能力
    </button>
  </div>
</template>

<script setup lang="ts">
import type { SkillCapability } from '@/stores/skillStore'

// 跨技能類型都適用的通用能力範本，不綁定特定業務場景（客服／庫存／會議等
// 專屬能力請使用者自己新增），描述先給一個合理預設，使用者可再自行調整
const CAPABILITY_PRESETS: SkillCapability[] = [
  { name: '問題分類', description: '依使用者訊息內容自動分類問題類型，導向對應的處理流程。' },
  { name: '資料查詢', description: '根據使用者提供的條件查詢對應資料，回傳精確結果。' },
  { name: '內容摘要', description: '自動提取重點內容，生成條列式或段落式摘要。' },
  { name: '格式轉換', description: '將輸入資料轉換成指定的結構化格式輸出，方便下游系統使用。' },
  { name: '多語言支援', description: '支援多語言自動偵測與回覆，涵蓋常用語言。' },
  { name: '情緒／風險辨識', description: '識別內容中的情緒或風險訊號，超出範圍時主動示警或轉介人工處理。' },
  { name: '資料整合', description: '彙整多個來源的資料，去除重複與過時資訊，統一輸出格式。' },
]

const props = defineProps<{ modelValue: SkillCapability[] }>()
const emit = defineEmits<{ 'update:modelValue': [capabilities: SkillCapability[]] }>()

function isPresetAdded(name: string): boolean {
  return props.modelValue.some(c => c.name === name)
}

function addPreset(preset: SkillCapability) {
  if (isPresetAdded(preset.name)) return
  emit('update:modelValue', [...props.modelValue, { ...preset }])
}

function addCapability() {
  emit('update:modelValue', [...props.modelValue, { name: '', description: '' }])
}

function removeCapability(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

function updateCapability(index: number, patch: Partial<SkillCapability>) {
  emit('update:modelValue', props.modelValue.map((c, i) => i === index ? { ...c, ...patch } : c))
}
</script>
