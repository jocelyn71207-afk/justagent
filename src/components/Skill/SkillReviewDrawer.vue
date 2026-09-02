<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="modelValue && skill && reviewingVersion" class="SkillReviewDrawer">
        <div class="drawer-mask" @click="emit('update:modelValue', false)" />
        <div class="srd-panel">

          <div class="srd-head">
            <h3>技能版本審核</h3>
            <button class="drawer-close-btn" @click="emit('update:modelValue', false)">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <div class="srd-body">
            <!-- Skill identity -->
            <div class="srd-info">
              <div class="srd-info-icon">
                <i class="material-symbols-outlined">{{ skill.type === 'system' ? 'psychology' : 'extension' }}</i>
              </div>
              <div class="srd-info-text">
                <div class="srd-skill-name">{{ skill.name }}</div>
                <div class="srd-meta-row">
                  <span class="skill-tag tag--version">
                    v{{ reviewingVersion.versionTag }}<template v-if="reviewingVersion.versionName"> · {{ reviewingVersion.versionName }}</template>
                  </span>
                  <span :class="['skill-tag', skill.type === 'system' ? 'tag--sys' : 'tag--ext']">
                    {{ skill.type === 'system' ? '系統技能' : '企業擴充' }}
                  </span>
                  <span class="srd-status-badge">審核中</span>
                </div>
              </div>
            </div>

            <!-- Submission note -->
            <div v-if="reviewingVersion.reviewNote" class="srd-section">
              <div class="srd-section-label">送審說明</div>
              <div class="srd-note-box">
                <i class="material-symbols-outlined">sticky_note_2</i>
                <span>{{ reviewingVersion.reviewNote }}</span>
              </div>
            </div>

            <!-- Version summary -->
            <div class="srd-section">
              <div class="srd-section-label">版本摘要</div>
              <div class="srd-summary-grid">
                <div class="srd-summary-item">
                  <div class="srd-summary-key">版本號</div>
                  <div class="srd-summary-val">
                    v{{ reviewingVersion.versionTag }}<template v-if="reviewingVersion.versionName"> · {{ reviewingVersion.versionName }}</template>
                  </div>
                </div>
                <div class="srd-summary-item">
                  <div class="srd-summary-key">送審時間</div>
                  <div class="srd-summary-val">{{ formatDate(submittedTime) }}</div>
                </div>
                <div class="srd-summary-item srd-summary-item--full">
                  <div class="srd-summary-key">更新說明</div>
                  <div class="srd-summary-val">{{ reviewingVersion.updateNote || '—' }}</div>
                </div>
                <div class="srd-summary-item srd-summary-item--full">
                  <div class="srd-summary-key">說明</div>
                  <div class="srd-summary-val">{{ reviewingVersion.description }}</div>
                </div>
              </div>
            </div>

            <!-- Compare action -->
            <div class="srd-section" v-if="prevVersion">
              <button class="custom-btn" @click="showCompare = true">
                <i class="material-symbols-outlined">difference</i>
                查看版本差異（v{{ prevVersion.versionTag }}<template v-if="prevVersion.versionName">「{{ prevVersion.versionName }}」</template>
                → v{{ reviewingVersion.versionTag }}<template v-if="reviewingVersion.versionName">「{{ reviewingVersion.versionName }}」</template>）
              </button>
            </div>

            <!-- Review history timeline -->
            <div class="srd-section">
              <div class="srd-section-label">審核記錄</div>
              <div class="srd-timeline">
                <div
                  v-for="rec in reviewingVersion.reviewHistory ?? []"
                  :key="rec.time"
                  class="srd-tl-item"
                >
                  <div :class="['srd-tl-dot', `dot--${rec.action.toLowerCase()}`]"></div>
                  <div class="srd-tl-body">
                    <span class="srd-tl-action">{{ actionLabel(rec.action) }}</span>
                    <span class="srd-tl-by">· {{ rec.by }}</span>
                    <span class="srd-tl-time">{{ formatDate(rec.time) }}</span>
                    <div v-if="rec.note" class="srd-tl-note">{{ rec.note }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Feedback textarea -->
            <div class="srd-section">
              <div class="srd-section-label">退回說明（選填）</div>
              <textarea
                v-model="feedback"
                class="srd-feedback"
                placeholder="若要退回，請說明原因與修改建議..."
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- Footer actions -->
          <div class="srd-footer">
            <button class="custom-btn btn--danger-ghost" @click="handleReject">
              <i class="material-symbols-outlined">cancel</i>退回
            </button>
            <button class="custom-btn custom-main-btn" @click="handleApprove">
              <i class="material-symbols-outlined">check_circle</i>通過審核
            </button>
          </div>

        </div>
      </div>
    </Transition>

    <!-- Compare modal -->
    <SkillVersionCompareModal
      v-if="prevVersion && reviewingVersion"
      v-model="showCompare"
      :skill-id="skillId"
      :v1-id="prevVersion.id"
      :v2-id="reviewingVersion.id"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSkillStore } from '@/stores/skillStore'
import type { SkillReviewRecord } from '@/stores/skillStore'
import SkillVersionCompareModal from '@/components/Skill/SkillVersionCompareModal.vue'

const props = defineProps<{ modelValue: boolean; skillId: string }>()
const emit = defineEmits<{
  'update:modelValue': [boolean]
  approved: []
  rejected: []
}>()

const store = useSkillStore()
const feedback = ref('')
const showCompare = ref(false)

const skill = computed(() => store.findSkill(props.skillId))
const versions = computed(() => store.getSkillVersions(props.skillId))
const reviewingVersion = computed(() => versions.value.find(v => v.status === 'reviewing'))

const prevVersion = computed(() => {
  const idx = versions.value.findIndex(v => v.status === 'reviewing')
  return idx > 0 ? versions.value[idx - 1] : undefined
})

const submittedTime = computed(
  () => reviewingVersion.value?.reviewHistory?.find(r => r.action === 'SUBMITTED')?.time ?? ''
)

function actionLabel(action: SkillReviewRecord['action']): string {
  const map: Record<SkillReviewRecord['action'], string> = {
    SUBMITTED: '送審', APPROVED: '通過', REJECTED: '退回', WITHDRAWN: '撤回',
  }
  return map[action]
}

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function handleApprove() {
  if (!reviewingVersion.value) return
  store.approveSkillVersion(props.skillId, reviewingVersion.value.id)
  emit('approved')
  emit('update:modelValue', false)
}

function handleReject() {
  if (!reviewingVersion.value) return
  store.rejectSkillVersion(props.skillId, reviewingVersion.value.id, feedback.value)
  feedback.value = ''
  emit('rejected')
  emit('update:modelValue', false)
}
</script>
