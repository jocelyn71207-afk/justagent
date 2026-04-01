<template>
  <compModal class="AppBuserModal"
    v-model="rootStore.isShowBuserModal"
    :width="'90vw'"
    :height="'90vh'"
    :close-on-mask="true"
  >
    <iframe
      class="appBuserModal-iframe"
      :src="buserUrl"
      title="Buser"
      allowfullscreen
    />
  </compModal>
</template>

<script setup lang="ts">
import compModal from '@/components/compModal/compModal.vue'
import { useRootStore } from '@/stores/rootStore'

const rootStore = useRootStore()
const buserUrl = import.meta.env.VITE_BUSER_URL as string
</script>
