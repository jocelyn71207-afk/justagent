<template>
  <div class="AppEntrance">
    <div class="entrance-content lively-stagger">
      <div class="entrance-mark">
        <span class="entrance-dot" aria-hidden="true"></span>
        <span>JustAgent</span>
      </div>
      <div class="entrance-spinner" role="status" aria-label="載入中"></div>
      <p class="entrance-text">正在為您準備工作環境...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const REDIRECT_DELAY_MS = 1000

let redirectTimer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  redirectTimer = setTimeout(() => {
    router.push('/view/ProjectDashboard')
  }, REDIRECT_DELAY_MS)
})

onUnmounted(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
})
</script>
