<template>
  <compModal
    :modelValue="modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
    :title="skill ? `將「${skill.name}」加入 Agent` : ''"
    :width="440"
    :closeOnMask="true"
  >
    <template v-if="skill">
      <div class="Explore explore-modal-box">
        <div class="assign-agent-search">
          <i class="material-symbols-outlined">search</i>
          <input type="text" v-model="keyword" placeholder="搜尋 Agent..." />
        </div>
        <div v-if="!filteredAgents.length" class="explore-empty-state">找不到符合條件的 Agent</div>
        <ul v-else class="assign-agent-list">
          <li
            v-for="agent in filteredAgents"
            :key="agent"
            :class="['assign-agent-item', { 'assign-agent-item--assigned': isAssigned(agent) }]"
            @click="!isAssigned(agent) && onAssign(agent)"
          >
            <div class="assign-agent-icon">
              <i class="material-symbols-outlined">smart_toy</i>
            </div>
            <span class="assign-agent-name">{{ agent }}</span>
            <span v-if="isAssigned(agent)" class="assign-agent-status">已裝入</span>
          </li>
        </ul>
      </div>
    </template>
    <template #footer>
      <div class="Explore explore-modal-footer">
        <button class="custom-btn" @click="emit('update:modelValue', false)">取消</button>
      </div>
    </template>
  </compModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import compModal from '@/components/compModal/compModal.vue'
import { useSkillStore, AVAILABLE_AGENTS } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'
import popDialog from '@/services/popDialog'

const props = defineProps<{
  modelValue: boolean
  skill: Skill | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const skillStore = useSkillStore()

const keyword = ref('')

const filteredAgents = computed(() =>
  AVAILABLE_AGENTS.filter(a => !keyword.value.trim() || a.includes(keyword.value.trim()))
)

function isAssigned(agentName: string): boolean {
  return !!props.skill?.assignedAgents?.includes(agentName)
}

function onAssign(agentName: string) {
  if (!props.skill) return
  skillStore.assignSkillToAgent(props.skill.id, agentName)
  popDialog.toast(`已將「${props.skill.name}」加入「${agentName}」`)
  emit('update:modelValue', false)
}
</script>
