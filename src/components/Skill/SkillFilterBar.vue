<template>
  <div class="SkillFilterBar">
    <div class="sfb-search">
      <i class="material-symbols-outlined">search</i>
      <input
        v-model="local.query"
        class="sfb-input"
        placeholder="搜尋技能名稱或描述"
        @input="sync"
      />
    </div>
    <select v-model="local.type" class="custom-select sfb-select" @change="sync">
      <option value="all">全部類型</option>
      <option value="system">系統技能</option>
      <option value="extension">企業擴充</option>
    </select>
    <select v-model="local.status" class="custom-select sfb-select" @change="sync">
      <option value="all">全部狀態</option>
      <option value="enabled">啟用中</option>
      <option value="disabled">已停用</option>
    </select>
    <select v-model="local.update" class="custom-select sfb-select" @change="sync">
      <option value="all">全部</option>
      <option value="has_update">有更新</option>
    </select>
    <button v-if="hasActiveFilter" class="custom-btn sfb-clear" @click="clearFilter">
      <i class="material-symbols-outlined">close</i>清除
    </button>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'

export interface SkillFilterState {
  query: string
  type: 'all' | 'system' | 'extension'
  status: 'all' | 'enabled' | 'disabled'
  update: 'all' | 'has_update'
}

const props = defineProps<{ modelValue: SkillFilterState }>()
const emit = defineEmits<{ 'update:modelValue': [SkillFilterState] }>()

const local = reactive<SkillFilterState>({ ...props.modelValue })

const hasActiveFilter = computed(() =>
  local.query !== '' || local.type !== 'all' || local.status !== 'all' || local.update !== 'all'
)

function sync() {
  emit('update:modelValue', { ...local })
}

function clearFilter() {
  Object.assign(local, { query: '', type: 'all', status: 'all', update: 'all' })
  sync()
}
</script>
