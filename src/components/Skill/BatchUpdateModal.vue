<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="BatchUpdateModal" @click.self="emit('update:modelValue', false)">
        <div class="bum-dialog">
          <div class="bum-head">
            <h3>批量合併上游更新</h3>
            <button class="drawer-close-btn" @click="emit('update:modelValue', false)">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <div class="bum-body">
            <p class="bum-hint">有衝突的技能需個別處理，批量合併時自動跳過。</p>
            <div class="bum-select-all">
              <label class="bum-row">
                <input type="checkbox" :checked="allSelected" :indeterminate="someSelected" @change="toggleAll" />
                全選（{{ nonConflict.length }} 個無衝突技能）
              </label>
            </div>
            <div class="bum-list">
              <div
                v-for="skill in store.pendingUpdateSkills"
                :key="skill.id"
                :class="['bum-item', !!skill.upstreamConflicts?.length && 'bum-item--conflict']"
              >
                <label class="bum-row">
                  <input
                    type="checkbox"
                    :checked="selected.has(skill.id)"
                    :disabled="!!skill.upstreamConflicts?.length"
                    @change="toggleItem(skill.id)"
                  />
                  <div class="bum-info">
                    <span class="bum-name">{{ skill.name }}</span>
                    <span class="bum-ver">{{ skill.forkSourceVersion }} → {{ skill.version }}</span>
                  </div>
                  <span v-if="skill.upstreamConflicts?.length" class="bum-badge bum-badge--warn">
                    <i class="material-symbols-outlined">warning</i>需確認衝突
                  </span>
                  <span v-else class="bum-badge bum-badge--ok">
                    <i class="material-symbols-outlined">check_circle</i>無衝突
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="bum-footer">
            <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
            <button
              class="custom-btn custom-main-btn"
              :disabled="selected.size === 0"
              @click="handleMerge"
            >
              合併已選取（{{ selected.size }} 項）
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  merged: [ids: string[]]
}>()

const store = useSkillStore()
const selected = ref(new Set<string>())

const nonConflict = computed(() =>
  store.pendingUpdateSkills.filter(s => !s.upstreamConflicts?.length)
)
const allSelected = computed(() =>
  nonConflict.value.length > 0 && nonConflict.value.every(s => selected.value.has(s.id))
)
const someSelected = computed(() =>
  nonConflict.value.some(s => selected.value.has(s.id)) && !allSelected.value
)

function toggleAll() {
  if (allSelected.value) {
    selected.value.clear()
  } else {
    nonConflict.value.forEach(s => selected.value.add(s.id))
  }
}

function toggleItem(id: string) {
  selected.value.has(id) ? selected.value.delete(id) : selected.value.add(id)
}

function handleMerge() {
  const merged = store.batchMergeUpstreamUpdates([...selected.value])
  emit('merged', merged)
  emit('update:modelValue', false)
  selected.value.clear()
}
</script>
