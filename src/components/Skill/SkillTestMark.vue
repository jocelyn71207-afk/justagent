<template>
  <!-- 測過沒的標註：不是技能狀態（狀態只有啟用中／停用中），所以不用狀態圓點，
       用小圖示＋文字安靜地標在旁邊。已測試用主色，未測試用淡色 -->
  <span :class="['SkillTestMark', tested ? 'is-tested' : 'is-untested']">
    <i class="material-symbols-outlined">{{ tested ? 'task_alt' : 'science' }}</i>
    <span class="stm-label">{{ tested ? '已測試' : '未測試' }}</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{ tested: boolean }>()
</script>
