<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="skill" class="UpstreamUpdateDrawer">
        <div class="drawer-mask" @click="emit('close')" />
        <div class="drawer-panel">
          <div class="drawer-head">
            <h3>
              <i class="material-symbols-outlined">upgrade</i>
              上游有新版本
            </h3>
            <button class="drawer-close-btn" @click="emit('close')">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>

          <div class="drawer-body">
            <!-- 版本資訊 -->
            <div class="version-banner">
              你的「{{ skill.name }}」基於系統技能 v{{ skill.forkSourceVersion }}。
              系統技能已更新至 <strong>v{{ upstreamVersion }}</strong>，最新功能可合併。
            </div>

            <!-- 變更內容 -->
            <div class="drawer-section">
              <div class="section-label">新版本帶來什麼</div>
              <div class="diff-block">
                <div class="diff-title">新增：情緒分析功能</div>
                <div class="diff-body">
                  <div class="diff-line diff-add">+ 自動偵測用戶情緒，調整回覆語氣</div>
                  <div class="diff-line diff-add">+ 輸出新增 sentiment 欄位</div>
                </div>
              </div>
              <div class="diff-block">
                <div class="diff-title">Prompt 優化</div>
                <div class="diff-body">
                  <div class="diff-line diff-remove">- 你是一個客服助理</div>
                  <div class="diff-line diff-add">+ 你是一個專業客服助理，使用親切且專業的語氣</div>
                </div>
              </div>
            </div>

            <!-- 衝突分析 -->
            <div class="drawer-section">
              <div class="section-label">對你的影響</div>
              <div class="conflict-item conflict--ok">
                <i class="material-symbols-outlined">check_circle</i>
                可自動合併：情緒分析 Tool + Output Schema 更新
              </div>
              <div class="conflict-item conflict--warn">
                <i class="material-symbols-outlined">warning</i>
                需確認：Prompt 衝突（上游與你都有修改）
              </div>
            </div>

            <!-- 三種操作 -->
            <div class="drawer-section">
              <div class="section-label">你想怎麼做？</div>
              <div class="option-cards">
                <div class="option-card option-card--primary" @click="emit('merge', skill!)">
                  <div class="option-title">合併更新</div>
                  <div class="option-desc">無衝突部分自動套用，Prompt 衝突讓你選擇</div>
                </div>
                <div class="option-card" @click="emit('ignore', skill!)">
                  <div class="option-title">下次再說</div>
                  <div class="option-desc">不影響現有技能，下次更新時再提示</div>
                </div>
                <div class="option-card option-card--danger" @click="emit('detach', skill!)">
                  <div class="option-title">永久分離</div>
                  <div class="option-desc">不再收到更新通知，此操作不可逆</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { Skill } from '@/stores/skillStore'

defineProps<{
  skill: Skill | null
  upstreamVersion?: string
}>()
const emit = defineEmits<{
  close: []
  merge: [skill: Skill]
  ignore: [skill: Skill]
  detach: [skill: Skill]
}>()
</script>
