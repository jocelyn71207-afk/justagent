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
                <template v-else-if="skill.origin === 'manually_created'">
                  <span class="lineage-node lineage-node--current">{{ skill.name }}</span>
                  <span class="lineage-badge lineage-badge--manual">手動建立</span>
                </template>
                <template v-else>
                  <span class="lineage-node lineage-node--current">{{ skill.name }}</span>
                  <span class="lineage-badge">系統技能</span>
                </template>
              </div>
            </div>

            <!-- 覆蓋能力 -->
            <div v-if="skill.capabilities?.length" class="drawer-section">
              <div class="section-label">覆蓋能力</div>
              <div class="capability-grid">
                <div
                  v-for="cap in skill.capabilities"
                  :key="cap.name"
                  class="capability-card"
                >
                  <div class="cap-name">{{ cap.name }}</div>
                  <div class="cap-desc">{{ cap.description }}</div>
                </div>
              </div>
              <div class="skill-summary">{{ skill.description }}</div>
            </div>

            <!-- 可調用此技能的 Agent -->
            <div class="drawer-section">
              <div class="section-label">可調用此技能的 Agent</div>
              <div v-if="skill.assignedAgents?.length" class="agent-tag-list">
                <span v-for="agent in skill.assignedAgents" :key="agent" class="agent-tag">
                  <i class="material-symbols-outlined">smart_toy</i>
                  {{ agent }}
                </span>
              </div>
              <div v-else class="agent-empty">尚未指派給任何 Agent</div>
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
                  <div class="stat-lbl">使用次數</div>
                </div>
                <div class="stat-item">
                  <div class="stat-val">{{ Math.round(skill.testPassRate * 100) }}%</div>
                  <div class="stat-lbl">測試通過率</div>
                </div>
              </div>
            </div>

            <!-- 近 7 天使用趨勢 -->
            <div class="drawer-section">
              <div class="section-label">近 7 天使用趨勢</div>
              <div class="chart-wrap">
                <svg viewBox="0 0 400 100" preserveAspectRatio="none" class="trend-svg">
                  <defs>
                    <linearGradient :id="`grad-${skill.id}`" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#059669" stop-opacity="0.18" />
                      <stop offset="100%" stop-color="#059669" stop-opacity="0" />
                    </linearGradient>
                  </defs>
                  <path :d="chartData.area" :fill="`url(#grad-${skill.id})`" />
                  <path :d="chartData.line" fill="none" stroke="#059669" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" />
                  <circle
                    v-for="(p, i) in chartData.pts"
                    :key="i"
                    :cx="p.x" :cy="p.y" r="2.5"
                    fill="#059669"
                  />
                </svg>
                <div class="chart-x-labels">
                  <span v-for="l in CHART_LABELS" :key="l">{{ l }}</span>
                </div>
              </div>
            </div>

            <!-- AI 分析建議 -->
            <div class="drawer-section">
              <div class="section-label section-label--ai">
                <i class="material-symbols-outlined">auto_awesome</i>
                AI 分析建議
              </div>
              <div class="ai-suggestion-list">
                <div
                  v-for="s in aiSuggestions"
                  :key="s.text"
                  :class="['ai-suggestion-item', `sug--${s.type}`]"
                >
                  <i class="material-symbols-outlined sug-icon">{{ s.icon }}</i>
                  <span>{{ s.text }}</span>
                </div>
              </div>
            </div>

            <!-- 危險操作：僅 extension 技能可刪除 -->
            <div v-if="skill.type === 'extension'" class="drawer-danger-zone">
              <div class="danger-zone-label">危險操作</div>
              <button class="custom-btn btn--danger-ghost drawer-delete-btn" @click="showConfirm = true">
                <i class="material-symbols-outlined">delete</i>
                刪除此技能
              </button>
            </div>

            <!-- 操作 -->
            <div class="drawer-actions">
              <button class="custom-btn" @click="emit('test', skill!)">
                <i class="material-symbols-outlined">science</i>
                對話測試
              </button>
              <button class="custom-btn" @click="emit('edit', skill!)">
                <i class="material-symbols-outlined">edit</i>
                編輯
              </button>
              <button class="custom-btn btn--danger-ghost" @click="emit('toggle', skill!)">
                {{ skill.isEnabled ? '停用' : '啟用' }}
              </button>
            </div>

          </div>
        </div>
      </div>
    </Transition>

    <!-- 刪除確認 -->
    <Transition name="confirm-fade">
      <div v-if="showConfirm && skill" class="drawer-confirm-overlay" @click.self="showConfirm = false">
        <div class="drawer-confirm-dialog">
          <div class="confirm-icon"><i class="material-symbols-outlined">warning</i></div>
          <h4>確定要刪除「{{ skill.name }}」？</h4>
          <p>刪除後此技能將無法繼續使用。</p>
          <div class="confirm-actions">
            <button class="custom-btn" @click="showConfirm = false">取消</button>
            <button class="custom-btn btn--danger-ghost" @click="confirmDelete">確定刪除</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Skill } from '@/stores/skillStore'

const CHART_LABELS = ['6天前', '5天前', '4天前', '3天前', '2天前', '昨天', '今天']

const props = defineProps<{ skill: Skill | null }>()
const emit = defineEmits<{
  close: []
  test: [skill: Skill]
  toggle: [skill: Skill]
  edit: [skill: Skill]
  delete: [skill: Skill]
}>()

const showConfirm = ref(false)

function mockWeeklyData(skill: Skill): number[] {
  const seed = skill.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const base = Math.max(skill.usageCount, 5)
  return Array.from({ length: 7 }, (_, i) =>
    Math.round(base * 0.12 * (0.4 + Math.abs(Math.sin(seed * 0.07 + i * 1.1))))
  )
}

const chartData = computed(() => {
  const skill = props.skill
  if (!skill) return { pts: [], line: '', area: '' }

  const values = mockWeeklyData(skill)
  const W = 400, H = 100
  const px = 8, pt = 8, pb = 12
  const maxVal = Math.max(...values, 1)

  const pts = values.map((v, i) => ({
    x: px + (i / (values.length - 1)) * (W - px * 2),
    y: pt + (1 - v / maxVal) * (H - pt - pb),
  }))

  let line = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2
    line += ` C ${cpx} ${pts[i - 1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`
  }

  const bottomY = H - pb
  const area = `${line} L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`

  return { pts, line, area }
})

const aiSuggestions = computed(() => {
  const s = props.skill
  if (!s) return []
  const list: { icon: string; type: 'good' | 'warn' | 'info'; text: string }[] = []

  if (s.testPassRate >= 0.95) {
    list.push({ icon: 'verified', type: 'good', text: `測試通過率 ${Math.round(s.testPassRate * 100)}%，技能表現穩定，可放心用於生產環境。` })
  } else if (s.testPassRate < 0.9) {
    list.push({ icon: 'warning', type: 'warn', text: `測試通過率 ${Math.round(s.testPassRate * 100)}% 偏低，建議補充邊界測試案例並複查觸發指令。` })
  } else {
    list.push({ icon: 'check_circle', type: 'info', text: '測試通過率正常，建議持續補充情境案例以維持品質。' })
  }

  if (s.upstreamUpdateStatus === 'update_available') {
    list.push({ icon: 'upgrade', type: 'warn', text: '上游系統技能已有新版本，建議合併更新以取得最新改善與安全修正。' })
  } else if (s.usageCount > 100) {
    list.push({ icon: 'insights', type: 'info', text: `本月觸發 ${s.usageCount} 次，屬高頻技能，建議定期審查觸發條件的準確性與覆蓋率。` })
  } else if (s.usageCount === 0) {
    list.push({ icon: 'help_outline', type: 'warn', text: '此技能尚未被觸發，請確認觸發條件是否設定正確，或手動執行測試驗證。' })
  }

  return list
})

const originLabel = computed(() => {
  if (!props.skill) return ''
  if (props.skill.origin === 'conversation_evolved') return '對話演化'
  if (props.skill.origin === 'custom_version') return '自訂版本'
  return '擴充'
})

function confirmDelete() {
  showConfirm.value = false
  emit('delete', props.skill!)
}
</script>
