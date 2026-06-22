<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="skill" class="SkillDetailDrawer">
        <div class="drawer-mask" @click="emit('close')" />
        <div class="drawer-panel">
          <div class="drawer-head">
            <h3>{{ skill.name }}</h3>
            <button class="drawer-close-btn" @click="emit('close')">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <div class="drawer-body">
            <!-- 來源關係 -->
            <div class="drawer-section">
              <div class="section-label">來源關係</div>
              <div class="lineage-row">
                <template v-if="skill.type === 'extension' && skill.forkSourceId">
                  <span class="lineage-node">系統技能</span>
                  <i class="material-symbols-outlined lineage-arrow">arrow_forward</i>
                  <span class="lineage-node lineage-node--origin">{{ originLabel }}</span>
                  <i class="material-symbols-outlined lineage-arrow">arrow_forward</i>
                  <span class="lineage-node lineage-node--current">{{ skill.name }}</span>
                </template>
                <template v-else>
                  <span class="lineage-node lineage-node--current">{{ skill.name }}</span>
                  <span class="lineage-badge">系統技能</span>
                </template>
              </div>
            </div>

            <!-- 演化上下文（僅 conversation_evolved） -->
            <div v-if="skill.evolutionContext" class="drawer-section">
              <div class="section-label">演化上下文</div>
              <div class="evolution-context">{{ skill.evolutionContext }}</div>
            </div>

            <!-- 運行統計 -->
            <div class="drawer-section">
              <div class="section-label">運行統計</div>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-val">{{ skill.usageCount }}</div>
                  <div class="stat-lbl">自動觸發次數</div>
                </div>
                <div class="stat-item">
                  <div class="stat-val">{{ Math.round(skill.testPassRate * 100) }}%</div>
                  <div class="stat-lbl">測試通過率</div>
                </div>
                <div class="stat-item">
                  <div class="stat-val">{{ skill.avgLatencyMs }}ms</div>
                  <div class="stat-lbl">平均延遲</div>
                </div>
              </div>
            </div>

            <!-- 操作 -->
            <div class="drawer-actions">
              <button class="custom-btn" @click="emit('test', skill!)">
                <i class="material-symbols-outlined">science</i>
                對話測試
              </button>
              <button class="custom-btn" disabled>
                <i class="material-symbols-outlined">edit</i>
                編輯（後續規劃）
              </button>
              <button class="custom-btn btn--danger-ghost" @click="emit('toggle', skill!)">
                {{ skill.isEnabled ? '停用' : '啟用' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Skill } from '@/stores/skillStore'

const props = defineProps<{ skill: Skill | null }>()
const emit = defineEmits<{
  close: []
  test: [skill: Skill]
  toggle: [skill: Skill]
}>()

const originLabel = computed(() => {
  if (!props.skill) return ''
  if (props.skill.origin === 'conversation_evolved') return '對話演化'
  if (props.skill.origin === 'custom_version') return '自訂版本'
  return '擴充'
})
</script>
