<!-- src/components/AppSkeleton.vue -->
<template>
  <!-- 列表骨架：5 列 -->
  <div v-if="type === 'list'" class="app-skeleton app-skeleton--list">
    <div v-for="i in 5" :key="i" class="skeleton-row">
      <div class="skeleton-cell skeleton-cell--icon"></div>
      <div class="skeleton-cell-group">
        <div class="skeleton-cell skeleton-cell--title"></div>
        <div class="skeleton-cell skeleton-cell--subtitle"></div>
      </div>
      <div class="skeleton-cell skeleton-cell--badge"></div>
    </div>
  </div>

  <!-- Card 骨架：spinner -->
  <div v-else-if="type === 'card'" class="app-skeleton app-skeleton--card">
    <div class="skeleton-spinner"></div>
    <div class="skeleton-spinner-label">載入中...</div>
  </div>

  <!-- Detail 骨架：標題 + 段落 -->
  <div v-else-if="type === 'detail'" class="app-skeleton app-skeleton--detail">
    <div class="skeleton-cell skeleton-cell--heading"></div>
    <div class="skeleton-cell skeleton-cell--tag"></div>
    <div class="skeleton-cell skeleton-cell--para"></div>
    <div class="skeleton-cell skeleton-cell--para"></div>
    <div class="skeleton-cell skeleton-cell--para skeleton-cell--para-short"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ type: 'list' | 'card' | 'detail' }>();
</script>
