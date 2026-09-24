<template>
  <Teleport to="body">
    <Transition name="ssd-fade">
      <div v-if="props.open" class="SkillStudioDrawer">
        <div class="ssd-mask" @click="emit('close')" />
        <div class="ssd-panel">
          <div class="ssd-head">
            <SkillStudioModeHeader
              :mode="workspaceRef?.mode ?? 'create'"
              :skill-name="workspaceRef?.skillName ?? ''"
            />
            <button type="button" class="ssd-close-btn" @click="emit('close')">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>
          <div class="ssd-body">
            <SkillStudioWorkspace ref="workspaceRef" :initial-query="props.query" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { LocationQuery } from 'vue-router'
import SkillStudioWorkspace from '@/components/Skill/SkillStudioWorkspace.vue'
import SkillStudioModeHeader from '@/components/Skill/SkillStudioModeHeader.vue'

const props = defineProps<{ open: boolean; query: LocationQuery }>()
const emit = defineEmits<{ close: [] }>()

const workspaceRef = ref<InstanceType<typeof SkillStudioWorkspace> | null>(null)

defineExpose({
  isDirty: computed(() => workspaceRef.value?.isDirty ?? false),
  applyQuery: (q: LocationQuery) => workspaceRef.value?.applyQuery(q),
})
</script>
