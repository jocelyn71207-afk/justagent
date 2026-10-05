<template>
  <div class="SkillKeywordsEditor">
    <div v-if="modelValue.length" class="sce-tag-list">
      <span v-for="(tag, i) in modelValue" :key="`${tag}-${i}`" class="sce-tag-chip">
        #{{ tag }}
        <button
          type="button"
          class="sce-tag-remove"
          aria-label="移除這個關鍵字"
          @click="removeTag(i)"
        >
          <i class="material-symbols-outlined">close</i>
        </button>
      </span>
    </div>

    <input
      v-model="draftInput"
      class="custom-input sce-tag-input"
      placeholder="輸入會觸發這顆技能的關鍵字，按 Enter 新增，可一次輸入多個，用空白分隔"
      @keydown.enter.prevent="commitInput"
      @blur="commitInput"
    />
  </div>
</template>

<script setup lang="ts">
// 「關鍵字」必填欄位：跟 SkillCapabilityEditor 同一套標籤輸入互動（Enter／空白分隔
// 新增多個、可移除、去重），但獨立成自己的元件——關鍵字沒有「常見範本」這種跨技能
// 都適用的預設清單，跟覆蓋能力的 CAPABILITY_PRESETS 是不同性質的欄位，不共用元件
import { ref } from 'vue'
import { parseHashtags } from '@/utils/hashtags'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [keywords: string[]] }>()

const draftInput = ref('')

// 一次可能輸入多個（空白分隔），逐一加入並去重——已經在清單裡的關鍵字不重複加
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
