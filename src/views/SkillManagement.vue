<template>
  <div class="SkillManagement views-page">
    <div class="views-page-content-box">
      <SkillCard :skill="store.skills[0]"
        @click="selectedSkill = $event"
        @test="() => {}" @toggle="store.toggleSkill($event.id)" @update="() => {}" />
      <SkillDetailDrawer :skill="selectedSkill" @close="selectedSkill = null"
        @test="() => {}" @toggle="store.toggleSkill($event.id)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SkillCard from '@/components/Skill/SkillCard.vue'
import SkillDetailDrawer from '@/components/Skill/SkillDetailDrawer.vue'
import { useSkillStore } from '@/stores/skillStore'
import type { Skill } from '@/stores/skillStore'
const store = useSkillStore()
const selectedSkill = ref<Skill | null>(null)
</script>
