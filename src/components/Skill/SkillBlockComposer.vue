<template>
  <div :class="['SkillBlockComposer', { 'is-compact': props.compact }]">
    <div class="sbc-head">
      <label class="sbc-field">
        <span class="sbc-label">技能名稱</span>
        <input class="custom-input sbc-name-input" :value="props.name" placeholder="例：行銷週報" @input="emit('update:name', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="sbc-field">
        <span class="sbc-label">一句說明（選填）</span>
        <input class="custom-input sbc-desc-input" :value="props.description" placeholder="這份報告給誰看、多久產一次" @input="emit('update:description', ($event.target as HTMLInputElement).value)" />
      </label>
      <div v-if="props.nameConflict" class="name-conflict-banner">
        <i class="material-symbols-outlined">info</i>你已經有一個同名的個人技能，建議修改名稱以便區分。
      </div>
    </div>

    <div class="sbc-selected">
      <div class="sbc-selected-head">
        <i class="material-symbols-outlined">stacks</i>已選 {{ props.sectionIds.length }} 個章節
      </div>
      <ol v-if="props.sectionIds.length" class="sbc-list">
        <li
          v-for="sectionId in props.sectionIds"
          :key="sectionId"
          class="sbc-item"
          :class="{ dragging: dragId === sectionId, 'drag-over-before': dragOverId === sectionId && dragOverBefore, 'drag-over-after': dragOverId === sectionId && !dragOverBefore }"
          draggable="true"
          @dragstart.stop="handleDragStart($event, sectionId)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver($event, sectionId)"
          @dragleave="handleDragLeave"
          @drop="handleDrop($event, sectionId)"
        >
          <span class="sbc-handle material-symbols-outlined">drag_indicator</span>
          <span class="sbc-dot" :style="{ '--dot-color': categoryColor(sectionId) }"></span>
          <span class="sbc-item-body">
            <span class="sbc-item-name">{{ sectionName(sectionId) }}</span>
            <span class="sbc-item-desc">{{ sectionDesc(sectionId) }}</span>
          </span>
          <button type="button" class="sbc-remove" v-tooltip="'移除章節'" @click="removeSection(sectionId)">
            <i class="material-symbols-outlined">close</i>
          </button>
        </li>
      </ol>
      <div v-else class="sbc-empty">
        <i class="material-symbols-outlined">library_add</i>還沒有章節，從下方積木庫加入
      </div>
    </div>

    <div class="sbc-palette">
      <details v-for="category in REPORT_CATEGORIES" :key="category.id" class="sbc-category" open>
        <summary>
          <span class="sbc-dot" :style="{ '--dot-color': category.color }"></span>
          <span class="sbc-category-label">{{ category.label }}</span>
          <span class="sbc-category-count">{{ addedCountInCategory(category.id) }}/{{ sectionsByCategory(category.id).length }}</span>
        </summary>
        <div class="sbc-category-items">
          <div v-for="section in sectionsByCategory(category.id)" :key="section.id" class="sbc-palette-item" :class="{ added: props.sectionIds.includes(section.id) }">
            <span class="sbc-item-body">
              <span class="sbc-item-name">{{ section.name }}</span>
              <span class="sbc-item-desc">{{ section.description }}</span>
            </span>
            <button type="button" class="sbc-add-btn" v-tooltip="props.sectionIds.includes(section.id) ? '已加入' : '加入章節'" @click="addSection(section.id)">
              <i class="material-symbols-outlined">{{ props.sectionIds.includes(section.id) ? 'check' : 'add' }}</i>
            </button>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
// 「用行銷積木組裝」的輸入面板：純呈現，選了什麼一律 emit 回去由 composable 推導成草稿。
// 拖曳排序沿用原生 HTML5 drag and drop（自 reportAssemblyViewBox 搬來，不引入新套件）
import { ref } from 'vue'
import { REPORT_CATEGORIES, SECTION_MAP, sectionsByCategory } from '@/constants/reportSections'

const props = defineProps<{
  name: string
  description: string
  sectionIds: string[]
  compact?: boolean
  nameConflict?: boolean
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:description': [value: string]
  'update:sectionIds': [ids: string[]]
}>()

const CATEGORY_MAP = Object.fromEntries(REPORT_CATEGORIES.map(c => [c.id, c]))

function sectionName(id: string): string { return SECTION_MAP[id]?.name ?? id }
function sectionDesc(id: string): string { return SECTION_MAP[id]?.description ?? '' }
function categoryColor(id: string): string {
  const s = SECTION_MAP[id]
  return s ? (CATEGORY_MAP[s.categoryId]?.color ?? 'var(--text-faint)') : 'var(--text-faint)'
}
function addedCountInCategory(categoryId: string): number {
  return sectionsByCategory(categoryId).filter(s => props.sectionIds.includes(s.id)).length
}

function addSection(id: string) {
  if (props.sectionIds.includes(id)) return
  emit('update:sectionIds', [...props.sectionIds, id])
}
function removeSection(id: string) {
  emit('update:sectionIds', props.sectionIds.filter(x => x !== id))
}

const dragId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)
const dragOverBefore = ref(true)

function handleDragStart(event: DragEvent, id: string) {
  dragId.value = id
  event.dataTransfer?.setData('text/plain', id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}
function handleDragEnd() { dragId.value = null; dragOverId.value = null }
function handleDragOver(event: DragEvent, id: string) {
  event.preventDefault()
  if (id === dragId.value) { dragOverId.value = null; return }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dragOverId.value = id
  dragOverBefore.value = (event.clientY - rect.top) < rect.height / 2
}
function handleDragLeave() { dragOverId.value = null }
function handleDrop(event: DragEvent, targetId: string) {
  event.preventDefault()
  dragOverId.value = null
  const from = dragId.value
  if (!from || from === targetId) return
  const next = props.sectionIds.filter(x => x !== from)
  let to = next.indexOf(targetId)
  to = dragOverBefore.value ? to : to + 1
  next.splice(to, 0, from)
  emit('update:sectionIds', next)
}
</script>
