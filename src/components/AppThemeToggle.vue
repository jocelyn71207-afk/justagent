<template>
  <div class="AppThemeToggle" @click="toggle">
    <span
      class="AppThemeToggle-icon material-symbols-rounded"
      :class="{ 'is-inactive': isDark }"
    >light_mode</span>

    <div class="AppThemeToggle-track" :class="{ 'is-dark': isDark }">
      <div class="AppThemeToggle-thumb" :class="{ 'is-dark': isDark }" />
    </div>

    <span
      class="AppThemeToggle-icon material-symbols-rounded"
      :class="{ 'is-inactive': !isDark }"
    >dark_mode</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isDark = ref(false)

function toggle() {
  isDark.value = !isDark.value
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
}
</script>
