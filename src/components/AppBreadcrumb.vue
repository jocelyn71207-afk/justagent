<template>
  <div class="banner-crumb" v-if="visibleItems.length">
    <template v-for="(item, i) in visibleItems" :key="i">
      <RouterLink v-if="item.to" :to="item.to" class="crumb-link">
        {{ item.label }}
      </RouterLink>
      <span v-else class="crumb-current">{{ item.label }}</span>
      <span v-if="i < visibleItems.length - 1" class="crumb-sep"> / </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBreadcrumb } from '@/composables/useBreadcrumb'

const { items } = useBreadcrumb()

const visibleItems = computed(() =>
  items.value.length > 1 ? items.value : []
)
</script>
