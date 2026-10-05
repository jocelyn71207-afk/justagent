<template>
  <div class="SkillSampleOutputTest">
    <div class="ssot-toolbar">
      <span class="system-hint">積木組裝的技能是「依固定章節產出報告」，不是對話引導——用這顆按鈕模擬它實際會產出的內容</span>
      <button type="button" class="custom-btn custom-main-btn" :disabled="!props.sectionIds.length" @click="generate">
        <i class="material-symbols-outlined">auto_awesome</i>一鍵產生範例成果
      </button>
    </div>

    <div v-if="!props.sectionIds.length" class="ssot-empty">
      <i class="material-symbols-outlined">dashboard_customize</i>
      <p>還沒有選擇任何章節，先到「積木組成」加入章節</p>
    </div>
    <div v-else-if="!generated" class="ssot-empty">
      <i class="material-symbols-outlined">science</i>
      <p>點擊上方按鈕，產生一份模擬報告成果</p>
    </div>
    <div v-else class="ssot-report">
      <div v-for="(section, i) in sections" :key="section.id" class="ssot-card">
        <div class="ssot-card-head">
          <span class="ssot-card-index">{{ i + 1 }}</span>
          <span class="ssot-card-name">{{ section.name }}</span>
        </div>
        <div class="ssot-card-body">
          <i class="material-symbols-outlined">{{ sectionIcon(section.description) }}</i>
          <span>{{ section.description }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 積木組裝的技能本質是「依固定章節組出一份報告」，不是多輪對話——SkillTestChat 那種
// 模擬使用者對話的測試方式在這裡沒有意義（sendChatMessage 只會回一句泛用的處理中訊息，
// 不會真的把選定的章節組裝成報告）。改成「一鍵產生範例成果」：純前端模擬，依目前選的章節組出
// 一份假報告預覽，讓使用者檢查章節順序與內容是否符合預期
import { ref, computed } from 'vue'
import { SECTION_MAP } from '@/constants/reportSections'

const props = defineProps<{ sectionIds: string[] }>()
const generated = ref(false)

const sections = computed(() =>
  props.sectionIds.map(id => SECTION_MAP[id]).filter((s): s is NonNullable<typeof s> => !!s)
)

function sectionIcon(description: string): string {
  if (description.includes('熱力圖')) return 'local_fire_department'
  if (description.includes('圖表')) return 'bar_chart'
  if (description.includes('明細')) return 'table_rows'
  return 'article'
}

function generate() {
  if (!props.sectionIds.length) return
  generated.value = true
}
</script>
