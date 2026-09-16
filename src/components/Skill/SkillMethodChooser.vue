<template>
  <div class="SkillMethodChooser">
    <div class="smc-title">要用哪種方式建立這顆技能？</div>
    <div class="smc-cards">
      <button type="button" class="smc-card smc-card--chat" @click="emit('choose', 'chat')">
        <i class="material-symbols-outlined">forum</i>
        <div class="smc-card-name">用對話建立</div>
        <div class="smc-card-desc">跟 Agent 描述需求，由它擬出設定</div>
      </button>
      <button type="button" class="smc-card smc-card--blocks" @click="emit('choose', 'blocks')">
        <i class="material-symbols-outlined">dashboard_customize</i>
        <div class="smc-card-name">用行銷積木組裝</div>
        <div class="smc-card-desc">勾選報告章節、排序，存成可重複使用的報告技能</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 建立方式二選一，選了就固定（對話與積木刻意不混用）
import type { StudioMethod } from '@/composables/useSkillStudioConversation'
const emit = defineEmits<{ choose: [method: StudioMethod] }>()
</script>
