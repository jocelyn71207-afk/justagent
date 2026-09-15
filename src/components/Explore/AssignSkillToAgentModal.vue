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
        <ul class="assign-agent-list">
          <li
            v-for="agent in filteredAgents"
            :key="agent.id"
            :class="['assign-agent-item', { 'assign-agent-item--assigned': isAssigned(agent.id) }]"
            @click="!isAssigned(agent.id) && onAssign(agent.id)"
          >
            <div :class="['agent-icon', `agent-icon--${agent.colorKey}`]">
              <i class="material-symbols-outlined">{{ agent.icon }}</i>
            </div>
            <span class="assign-agent-name">{{ agent.name }}</span>
            <span v-if="isAssigned(agent.id)" class="assign-agent-status">已裝入</span>
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
import { useExploreStore } from '@/stores/exploreStore'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'
import popDialog from '@/services/popDialog'

const props = defineProps<{
  modelValue: boolean
  skill: Skill | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const exploreStore = useExploreStore()
const skillStore = useSkillStore()

const keyword = ref('')

const filteredAgents = computed(() =>
  exploreStore.agents.filter(a => !keyword.value.trim() || a.name.includes(keyword.value.trim()))
)

function isAssigned(agentId: string): boolean {
  return !!props.skill?.assignedAgents?.includes(agentId)
}

function onAssign(agentId: string) {
  if (!props.skill) return
  const agent = exploreStore.agents.find(a => a.id === agentId)
  skillStore.assignSkillToAgent(props.skill.id, agentId)
  popDialog.toast(`已將「${props.skill.name}」加入「${agent?.name ?? ''}」`)
  emit('update:modelValue', false)
}
</script>
