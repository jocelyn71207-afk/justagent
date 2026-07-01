<template>
  <div class="ConflictResolveStep">
    <div class="crs-progress">
      衝突項目 {{ currentIdx + 1 }} / {{ conflicts.length }}
    </div>

    <div v-if="current" class="crs-conflict">
      <div class="crs-field-label">{{ current.label }}</div>
      <div class="crs-options">
        <label :class="['crs-option', resolutions[current.field] === 'mine' && 'is-selected']">
          <input type="radio" :value="'mine'" v-model="resolutions[current.field]" name="conflict" />
          <div class="crs-option-body">
            <div class="crs-option-tag">保留我的</div>
            <div class="crs-option-text">{{ current.mine }}</div>
          </div>
        </label>
        <label :class="['crs-option', resolutions[current.field] === 'upstream' && 'is-selected']">
          <input type="radio" :value="'upstream'" v-model="resolutions[current.field]" name="conflict" />
          <div class="crs-option-body">
            <div class="crs-option-tag crs-option-tag--upstream">採用上游的</div>
            <div class="crs-option-text">{{ current.upstream }}</div>
          </div>
        </label>
      </div>
    </div>

    <div class="crs-footer">
      <button class="custom-btn" @click="emit('back')">
        <i class="material-symbols-outlined">arrow_back</i>回到選項
      </button>
      <button
        class="custom-btn custom-main-btn"
        :disabled="!allResolved"
        @click="handleConfirm"
      >
        確認合併<i class="material-symbols-outlined">check</i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ConflictItem, ConflictResolution } from '@/stores/skillStore'

const props = defineProps<{ conflicts: ConflictItem[] }>()
const emit = defineEmits<{
  back: []
  confirm: [resolutions: ConflictResolution[]]
}>()

const currentIdx = ref(0)
const current = computed(() => props.conflicts[currentIdx.value] ?? null)
const resolutions = ref<Record<string, 'mine' | 'upstream'>>({})

const allResolved = computed(() =>
  props.conflicts.every(c => resolutions.value[c.field])
)

function handleConfirm() {
  const result: ConflictResolution[] = props.conflicts.map(c => ({
    field: c.field,
    choice: resolutions.value[c.field],
  }))
  emit('confirm', result)
}
</script>
