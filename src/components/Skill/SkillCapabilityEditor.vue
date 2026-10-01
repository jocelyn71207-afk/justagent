<template>
  <div class="SkillCapabilityEditor">
    <!-- 常見能力預設：常見技能類型都會出現的能力標籤，點一下直接加進清單 -->
    <div class="sce-presets">
      <button
        v-for="preset in CAPABILITY_PRESETS"
        :key="preset"
        type="button"
        class="sce-preset-chip"
        :disabled="isTagAdded(preset)"
        @click="addPreset(preset)"
      >
        <i class="material-symbols-outlined">{{ isTagAdded(preset) ? 'check' : 'add' }}</i>
        #{{ preset }}
      </button>
    </div>

    <div v-if="modelValue.length" class="sce-tag-list">
      <span v-for="(tag, i) in modelValue" :key="`${tag}-${i}`" class="sce-tag-chip">
        #{{ tag }}
        <button
          type="button"
          class="sce-tag-remove"
          aria-label="移除這個標籤"
          @click="removeTag(i)"
        >
          <i class="material-symbols-outlined">close</i>
        </button>
      </span>
    </div>

    <input
      v-model="draftInput"
      class="custom-input sce-tag-input"
      placeholder="輸入覆蓋能力標籤，按 Enter 新增（例如「問題分類」），可一次輸入多個，用空白分隔"
      @keydown.enter.prevent="commitInput"
      @blur="commitInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SkillCapability } from '@/stores/skillStore'
import { parseHashtags } from '@/utils/hashtags'

// 跨技能類型都適用的通用能力範本，不綁定特定業務場景（客服／庫存／會議等
// 專屬能力請使用者自己新增）
const CAPABILITY_PRESETS: SkillCapability[] = [
  '問題分類',
  '資料查詢',
  '內容摘要',
  '格式轉換',
  '多語言支援',
  '情緒風險辨識',
  '資料整合',
]

const props = defineProps<{ modelValue: SkillCapability[] }>()
const emit = defineEmits<{ 'update:modelValue': [capabilities: SkillCapability[]] }>()

const draftInput = ref('')

function isTagAdded(tag: string): boolean {
  return props.modelValue.includes(tag)
}

function addPreset(tag: string) {
  if (isTagAdded(tag)) return
  emit('update:modelValue', [...props.modelValue, tag])
}

// 一次可能輸入多個（空白分隔），逐一加入並去重——已經在清單裡的標籤不重複加
function commitInput() {
  const parsed = parseHashtags(draftInput.value)
  draftInput.value = ''
  if (parsed.length === 0) return
  const merged = [...props.modelValue]
  for (const tag of parsed) {
    if (!merged.includes(tag)) merged.push(tag)
  }
  emit('update:modelValue', merged)
}

function removeTag(index: number) {
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}
</script>
