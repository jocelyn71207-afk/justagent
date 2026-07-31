<template>
  <div class="AiViewerRightBox" :style="{ width: props.rightWidth + 'px' }"
    @click="nowChoiceAiViewerId = ''"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)">

    <!-- conv1 空白開始狀態全螢幕遮罩 -->
    <div class="conv1-empty-overlay" v-if="currentConversationId === 'conv1' && conv1Msgs.length === 0"
      @click.stop @wheel.stop @touchmove.stop>
      <div class="conv1-empty-content">
        <div class="conv1-empty-title">我可以幫你什麼呢？</div>
        <div class="conv1-empty-input-box">
          <textarea
            class="conv1-empty-textarea"
            v-model="conv1OverlayInput"
            placeholder="請輸入您的需求"
            @keydown.enter.exact.prevent="submitConv1Overlay"
            rows="1"
          ></textarea>
          <div class="conv1-empty-input-actions">
            <div class="conv1-empty-input-left">
              <button><i class="material-symbols-outlined">add</i></button>
              <button><i class="material-symbols-outlined">bolt</i></button>
            </div>
            <button class="conv1-empty-send-btn" @click="submitConv1Overlay">
              <i class="material-symbols-outlined">send</i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 對話標題大區域 -->
    <div class="AiAgentHeaderArea">
      <div class="chat-header-box">
        <div class="project-name" v-tooltip.bottom="currentConversationTitle"
          ref="projectNameDropDown"
          @mouseleave="debugCount = 0;"
          @click="() => {
            isShowMoreChatOptionsBox = true;
            calcMoreChatOptionsBoxStyle();

            // 注意:偷偷藏了方便除錯用的點擊次數事件
            debugCount = debugCount + 1;
            if (debugCount >= 10) {
              lookDebug = true;
              debugCount = 0;
            }
          }">
          {{ currentConversationTitle }}
          <i class="material-symbols-outlined fs-17">keyboard_arrow_down</i>
        </div>
        <i class="material-symbols-outlined ctrl-btn" v-tooltip="'搜尋發話'"
          @click="isOpenSearchUserDialogueBox = true">search</i>
      </div>

      <!-- 更多對話功能小介面 -->
      <div :class="['more-chat-options-box next-option-box', {'show': isShowMoreChatOptionsBox}]"
        ref="moreChatOptionsBox"
        :style="moreChatOptionsBoxStyle">
        <div class="option-item"
          @click="isShowFileListView = true; isShowMoreChatOptionsBox = false;">專案檔案清單</div>
        <div class="option-item"
          @click="isOpenConversationListModal = true; isShowMoreChatOptionsBox = false;">對話列表</div>
      </div>

      <!-- 搜尋對話內容小介面 -->
      <div :class="['search-user-dialogue-box', { show: isOpenSearchUserDialogueBox }]">
        <i class="material-symbols-outlined left-icon fs-19">search</i>
        <input type="text" class="custom-input fs-14" placeholder="搜尋對話內容"/>
        <i class="material-symbols-outlined right-icon fs-22"
          @click="isOpenSearchUserDialogueBox = false">close</i>
      </div>

    </div>

    <!-- 對話訊息大區域 wrapper -->
    <div class="rbox-main-wrapper">

    <!-- 對話訊息大區域 -->
    <VirtualList class="AiAgentChatArea"
      ref="AiAgentChatList"
      :data-key="'id'"
      :data-sources="testMsgs"
      :data-component="AiViewerRecord"
      :keeps="99999999"
      :footer-class="'AiAgentChatArea-footer-box'"
      @totop="scrollCall('DESC')"
      @tobottom="scrollCall('ASC')"
      @click="handleChatAreaClick($event)"
    >
      <template #footer></template>
    </VirtualList>

    <!-- [journey tab removed — execution status lives inside the HTML iframes] -->
    <div v-if="false" class="rbox-journey-area" style="display:none">
      <div class="rbox-jcd-body">
        <template v-if="jcdStats.marketing.total > 0">
          <div class="rbox-jcd-section" @click="openJourneyFullscreen('marketing')">
            <div class="jcd-type-hdr">
              <span class="jcd-type-dot jcd-type-dot--marketing"></span>
              <span class="jcd-type-name">行銷自動化旅程</span>
              <span class="rbox-view-chip">↗ 查看</span>
            </div>
            <div class="jcd-stat-row">
              <div class="jcd-stat"><div class="jcd-stat-val blue">{{ jcdStats.marketing.total }}</div><div class="jcd-stat-lbl">觸發</div></div>
              <div class="jcd-stat"><div class="jcd-stat-val green">{{ jcdStats.marketing.done }}</div><div class="jcd-stat-lbl">完成</div></div>
              <div class="jcd-stat"><div class="jcd-stat-val">{{ jcdStats.marketing.completion }}%</div><div class="jcd-stat-lbl">完成率</div></div>
              <div class="jcd-stat"><div class="jcd-stat-val amber">{{ jcdStats.marketing.total - jcdStats.marketing.done }}</div><div class="jcd-stat-lbl">執行中</div></div>
            </div>
            <div v-for="nc in jcdStats.marketing.nodeCounts" :key="nc.key" class="jcd-node-dist">
              <div class="jcd-node-dist-hdr">
                <span class="jcd-node-dist-key">{{ nc.key }}</span>
                <span class="jcd-node-dist-label">{{ nc.label }}</span>
                <span :class="['jcd-node-dist-count', { running: nc.running > 0 }]">
                  {{ nc.running > 0 ? nc.running + '人' : nc.done + '人' }}
                </span>
              </div>
              <div class="jcd-dist-bar" v-if="jcdStats.marketing.total > 0">
                <div class="jcd-dist-done" :style="{ width: (nc.done / jcdStats.marketing.total * 100) + '%' }"></div>
                <div class="jcd-dist-running" :style="{ width: (nc.running / jcdStats.marketing.total * 100) + '%' }"></div>
              </div>
            </div>
            <div class="jcd-rows-title">個別旅程</div>
            <div v-for="journey in jcdStats.marketing.journeys.slice(0, 8)" :key="journey.id" class="jcd-row">
              <span class="jcd-row-name">{{ journey.userName }}</span>
              <div class="jcd-row-dots">
                <span v-for="node in journey.nodes" :key="node.key"
                  :class="['jcd-rdot', node.status]"
                  :title="node.key + ' ' + node.label"></span>
              </div>
              <span :class="['jcd-row-badge', journey.status]">
                {{ journey.status === 'done' ? '✓' : journey.nodes.filter(n => n.status === 'done').length + '/' + journey.nodes.length }}
              </span>
            </div>
            <div v-if="jcdStats.marketing.total > 8" class="jcd-rows-more">+{{ jcdStats.marketing.total - 8 }} 人</div>
          </div>
        </template>

        <div class="jcd-divider" v-if="jcdStats.marketing.total > 0 && jcdStats.birthday.total > 0"></div>

        <template v-if="jcdStats.birthday.total > 0">
          <div class="rbox-jcd-section" @click="openJourneyFullscreen('birthday')">
            <div class="jcd-type-hdr">
              <span class="jcd-type-dot jcd-type-dot--birthday"></span>
              <span class="jcd-type-name">5月壽星專屬旅程</span>
              <span class="rbox-view-chip" style="background:#f5f3ff;color:#7c3aed;">↗ 查看</span>
            </div>
            <div class="jcd-stat-row">
              <div class="jcd-stat"><div class="jcd-stat-val violet">{{ jcdStats.birthday.total }}</div><div class="jcd-stat-lbl">觸發</div></div>
              <div class="jcd-stat"><div class="jcd-stat-val green">{{ jcdStats.birthday.done }}</div><div class="jcd-stat-lbl">完成</div></div>
              <div class="jcd-stat"><div class="jcd-stat-val">{{ jcdStats.birthday.completion }}%</div><div class="jcd-stat-lbl">完成率</div></div>
              <div class="jcd-stat"><div class="jcd-stat-val amber">{{ jcdStats.birthday.total - jcdStats.birthday.done }}</div><div class="jcd-stat-lbl">執行中</div></div>
            </div>
            <div v-for="nc in jcdStats.birthday.nodeCounts" :key="nc.key" class="jcd-node-dist">
              <div class="jcd-node-dist-hdr">
                <span class="jcd-node-dist-key">{{ nc.key }}</span>
                <span class="jcd-node-dist-label">{{ nc.label }}</span>
                <span :class="['jcd-node-dist-count', { running: nc.running > 0 }]">
                  {{ nc.running > 0 ? nc.running + '人' : nc.done + '人' }}
                </span>
              </div>
              <div class="jcd-dist-bar" v-if="jcdStats.birthday.total > 0">
                <div class="jcd-dist-done" :style="{ width: (nc.done / jcdStats.birthday.total * 100) + '%' }"></div>
                <div class="jcd-dist-running" :style="{ width: (nc.running / jcdStats.birthday.total * 100) + '%' }"></div>
              </div>
            </div>
            <div class="jcd-rows-title">個別旅程</div>
            <div v-for="journey in jcdStats.birthday.journeys.slice(0, 8)" :key="journey.id" class="jcd-row">
              <span class="jcd-row-name">{{ journey.userName }}</span>
              <div class="jcd-row-dots">
                <span v-for="node in journey.nodes" :key="node.key"
                  :class="['jcd-rdot', node.status]"
                  :title="node.key + ' ' + node.label"></span>
              </div>
              <span :class="['jcd-row-badge', journey.status]">
                {{ journey.status === 'done' ? '✓' : journey.nodes.filter(n => n.status === 'done').length + '/' + journey.nodes.length }}
              </span>
            </div>
            <div v-if="jcdStats.birthday.total > 8" class="jcd-rows-more">+{{ jcdStats.birthday.total - 8 }} 人</div>
          </div>
        </template>
      </div><!-- /rbox-jcd-body -->

      <!-- 成效報告 (analytics) -->
      <div class="rbox-analytics">
        <!-- 大數字 stats 卡 -->
        <div class="rbox-analytics-hero-card">
          <div class="rbox-analytics-hero-stat">
            <div class="rbox-hero-val">{{ jcdStats.total.toLocaleString() }}</div>
            <div class="rbox-hero-lbl">總觸發人數</div>
          </div>
          <div class="rbox-analytics-hero-divider"></div>
          <div class="rbox-analytics-hero-stat">
            <div class="rbox-hero-val">{{ (jcdStats.done * 5 + Math.floor(jcdStats.total * 0.7)).toLocaleString() }}</div>
            <div class="rbox-hero-lbl">總送訊息數</div>
          </div>
          <div class="rbox-analytics-hero-divider"></div>
          <div class="rbox-analytics-hero-stat">
            <div class="rbox-hero-val">{{ jcdStats.total > 0 ? (jcdStats.done / jcdStats.total * 100).toFixed(1) : '0.0' }}%</div>
            <div class="rbox-hero-lbl">旅程完成率</div>
          </div>
        </div>

        <!-- 旅程分析圖表 -->
        <div class="rbox-analytics-chart-card">
          <div class="rbox-analytics-chart-hdr">
            <span class="rbox-analytics-chart-title">旅程分析</span>
            <span class="rbox-analytics-date-chip">
              <i class="material-symbols-outlined" style="font-size:12px;vertical-align:middle;">calendar_month</i>
              2025/01/01 – 2025/12/31
            </span>
          </div>
          <div class="rbox-analytics-chart-wrap">
            <canvas ref="analyticsChartRef"></canvas>
          </div>
        </div>
      </div>
    </div><!-- /rbox-journey-area -->

    </div><!-- /rbox-main-wrapper -->

    <!-- user 輸入大區域  TODO... 思考是否要拔出去成為組件 -->
    <div :class="['AiViewrUserInputArea', { enterCannedTask: isShowCannedTaskListBox }]">

      <!-- Conv2 上傳商品懸浮面板 -->
      <div v-show="conv2UploadFpVisible && currentConversationId === 'conv2'" class="conv2-fp" @click.stop>
        <div class="conv2-fp-top">
          <span class="conv2-fp-title">上傳商品資料</span>
          <button class="conv2-fp-close-btn" @click.stop="conv2UploadFpVisible = false">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="conv2-fp-body">
          <div class="conv2-up-panel">
            <div :class="['conv2-up-img-box', {'conv2-up-img-box--empty': !conv2UploadImgLoaded}]" @click.stop="conv2LoadDemoImg()">
              <img v-if="conv2UploadImgLoaded" :src="DEMO_IMG" />
              <div v-else class="conv2-up-img-placeholder">
                <i class="material-symbols-outlined">add_photo_alternate</i>
                <span>點擊上傳圖片</span>
              </div>
            </div>
            <div class="conv2-up-desc-box">
              <div class="conv2-up-lbl">商品描述 <span class="conv2-up-hint">圖片或描述至少填一項</span></div>
              <textarea class="conv2-up-ta" v-model="conv2UploadDesc" rows="3" @click.stop="conv2FillDemoDesc()"></textarea>
              <div :class="['conv2-up-status', {'conv2-up-status--ready': conv2UploadImgLoaded || conv2UploadDesc}]">
                <template v-if="conv2UploadImgLoaded || conv2UploadDesc">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#166534" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ conv2UploadImgLoaded && conv2UploadDesc ? '圖片已上傳・描述已填寫' : conv2UploadImgLoaded ? '圖片已上傳' : '描述已填寫' }}
                </template>
                <template v-else>圖片或描述至少填一項</template>
              </div>
            </div>
          </div>
          <div class="conv2-fp-btn-row">
            <button class="conv2-fp-submit-btn" @click.stop="conv2StartAnalysis()">開始分析 →</button>
          </div>
        </div>
      </div>

      <!-- Conv2 直接生成報告懸浮面板（3步驟） -->
      <div v-show="conv2DirectFpVisible && currentConversationId === 'conv2'" class="conv2-fp" @click.stop>
        <div class="conv2-fp-top">
          <span class="conv2-fp-title">直接生成報告 · Step {{ conv2DirectFpStep }}/3</span>
          <button class="conv2-fp-close-btn" @click.stop="conv2DirectFpVisible = false">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="conv2-fp-body">
          <!-- Step 1: 提供商品資訊方式 -->
          <div v-show="conv2DirectFpStep === 1">
            <div class="conv2-info-note">✦ 選擇提供商品資訊的方式</div>
            <div class="conv2-direct-method-list">
              <div class="conv2-direct-method-item" @click.stop="conv2DirectSelectMethod('image')">
                <span class="conv2-direct-method-icon">🖼️</span>
                <div class="conv2-direct-method-info">
                  <div class="conv2-direct-method-title">圖片上傳</div>
                  <div class="conv2-direct-method-desc">上傳商品圖片，AI 自動辨識</div>
                </div>
                <i class="material-symbols-outlined" style="color:var(--color-text-alpha40);font-size:18px">chevron_right</i>
              </div>
              <div class="conv2-direct-method-item" @click.stop="conv2DirectSelectMethod('sku')">
                <span class="conv2-direct-method-icon">🔢</span>
                <div class="conv2-direct-method-info">
                  <div class="conv2-direct-method-title">輸入貨號</div>
                  <div class="conv2-direct-method-desc">輸入貨號並引用知識庫</div>
                </div>
                <i class="material-symbols-outlined" style="color:var(--color-text-alpha40);font-size:18px">chevron_right</i>
              </div>
            </div>
          </div>
          <!-- Step 2: 輸入商品貨號 -->
          <div v-show="conv2DirectFpStep === 2">
            <div class="conv2-info-note">✦ 輸入商品貨號（可搭配 @ 引用知識庫）</div>
            <div class="conv2-sku-wrap" @click.stop>
              <input class="conv2-fi conv2-fi--full conv2-sku-input" v-model="conv2DirectSkuInput" @click="conv2FillDemoSku()" />
              <div class="conv2-sku-overlay" aria-hidden="true">
                <template v-for="(part, i) in conv2SkuParts" :key="i">
                  <span v-if="part.isRef" class="conv2-sku-ref">{{ part.text }}</span>
                  <span v-else>{{ part.text }}</span>
                </template>
              </div>
            </div>
            <div class="conv2-fp-btn-row" style="margin-top:10px">
              <button class="conv2-fp-sec-btn" @click.stop="conv2DirectFpStep = 1">← 返回</button>
              <button class="conv2-fp-submit-btn" @click.stop="conv2DirectSubmitSku()">確認送出 →</button>
            </div>
          </div>
          <!-- Step 3: 輸入競品網址 -->
          <div v-show="conv2DirectFpStep === 3">
            <div class="conv2-info-note">✦ 提供競品的商品頁面網址（最多 5 個）</div>
            <textarea class="conv2-fi conv2-fi--full conv2-fi--ta" v-model="conv2DirectUrlInput" rows="4" @click.stop="conv2FillDemoUrls()"
              placeholder="每行一個網址&#10;e.g. https://shopee.tw/..." style="margin-top:8px"></textarea>
            <div class="conv2-fp-btn-row" style="margin-top:8px">
              <button class="conv2-fp-submit-btn" @click.stop="conv2DirectSubmitUrls()">開始分析 →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Conv2 深度分析步驟設定懸浮面板 -->
      <div v-show="conv2StepFpVisible && currentConversationId === 'conv2'" class="conv2-fp conv2-step-fp-panel" @click.stop>
        <div class="conv2-fp-top">
          <div class="conv2-step-track-wrap">
            <div class="conv2-step-track">
              <template v-for="(s, si) in conv2StepDefs" :key="s.key">
                <div :class="['conv2-sd', {'conv2-sd--done': isConv2StepDone(s.key), 'conv2-sd--active': conv2CurStep === s.key}]">
                  {{ isConv2StepDone(s.key) ? '✓' : s.label }}
                </div>
                <div class="conv2-sl" v-if="si < conv2StepDefs.length - 1"></div>
              </template>
            </div>
            <span class="conv2-step-title">{{ conv2StepTitleMap[String(conv2CurStep)] }}</span>
          </div>
          <button class="conv2-fp-close-btn" @click.stop="conv2StepFpVisible = false">
            <i class="material-symbols-outlined">close</i>
          </button>
        </div>
        <div class="conv2-fp-body">
          <!-- Step 1: 商品資訊 -->
          <div v-show="conv2CurStep === 1">
            <div class="conv2-info-note" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <span>✦ 圖片選填；商品名稱與描述為必填</span>
              <button v-if="!conv2S1ShowSkuInput" class="conv2-ghost-btn" @click.stop="conv2S1ShowSkuInput = true">從商品貨號帶入</button>
            </div>
            <div v-if="conv2S1ShowSkuInput" class="conv2-sku-prompt" @click.stop>
              <input class="conv2-fi" v-model="conv2S1SkuInput" placeholder="輸入貨號，如 UG1166915BLK" @click.stop style="flex:1;min-width:0" />
              <button class="conv2-fp-btn" style="flex-shrink:0" @click.stop="conv2S1ApplySku()">帶入</button>
              <button class="conv2-fp-sec-btn" style="flex-shrink:0;padding:4px 8px" @click.stop="conv2S1ShowSkuInput = false; conv2S1SkuInput = ''">✕</button>
            </div>
            <div :class="['conv2-up-img-box', {'conv2-up-img-box--empty': !conv2S1ImgLoaded}]" style="margin-bottom:10px" @click.stop="conv2S1ImgLoaded = true">
              <img v-if="conv2S1ImgLoaded" :src="DEMO_IMG" />
              <div v-else class="conv2-up-img-placeholder">
                <i class="material-symbols-outlined">add_photo_alternate</i>
                <span>點擊上傳圖片</span>
              </div>
            </div>
            <div class="conv2-fg">
              <div><div class="conv2-fl">品牌 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi" v-model="conv2S2Brand" @click.stop="!conv2S2Brand && (conv2S2Brand = 'UGG')" /></div>
              <div><div class="conv2-fl">定價 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi" v-model="conv2S2Price" @click.stop="!conv2S2Price && (conv2S2Price = 'NT$5,980')" /></div>
            </div>
            <div style="margin-bottom:7px"><div class="conv2-fl">商品名稱 <span style="color:var(--color-error,#dc2626)">*</span></div><input class="conv2-fi conv2-fi--full" v-model="conv2S2Name" @click.stop="!conv2S2Name && (conv2S2Name = DEMO_NAME)" /></div>
            <div><div class="conv2-fl">商品描述 <span style="color:var(--color-error,#dc2626)">*</span></div><textarea class="conv2-fi conv2-fi--full conv2-fi--ta" v-model="conv2S2Desc" rows="2" @click.stop="!conv2S2Desc && (conv2S2Desc = DEMO_DESC)"></textarea></div>
            <div class="conv2-err">{{ conv2S2Err }}</div>
            <div class="conv2-fp-btn-row">
              <button class="conv2-fp-btn" @click.stop="conv2GoStep1to2()">確認 →</button>
            </div>
          </div>
          <!-- Step 2: 商品類別 -->
          <div v-show="conv2CurStep === 2">
            <div class="conv2-info-note">✦ AI 從圖片識別商品，可調整</div>
            <div class="conv2-chips">
              <div v-for="c in ['室內拖鞋','毛絨拖鞋','動物臉拖鞋','家居鞋']" :key="c"
                :class="['conv2-chip', {sel: conv2S1Cat === c && !conv2S1Custom}]"
                @click.stop="conv2S1Cat = c; conv2S1Custom = ''">{{ c }}</div>
            </div>
            <input class="conv2-fi conv2-fi--full" v-model="conv2S1Custom" placeholder="找不到，自行輸入…" @click.stop style="margin-top:4px" />
            <div class="conv2-fp-btn-row">
              <button class="conv2-fp-sec-btn" @click.stop="conv2GoStep(1)">← 返回</button>
              <button class="conv2-fp-btn" @click.stop="conv2GoStep(3)">確認 →</button>
            </div>
          </div>
          <!-- Step 3: 分析特徵 -->
          <div v-show="conv2CurStep === 3">
            <div class="conv2-pdesc">多選（至少 1 項）</div>
            <div v-for="f in conv2S3Features" :key="f.key"
              :class="['conv2-feat-item', {sel: f.sel}]"
              @click.stop="conv2TogFeat(f)">
              <div class="conv2-fcb">
                <svg v-if="f.sel" width="8" height="6" viewBox="0 0 9 7" fill="none"><path d="M1 3.5L3.5 6L8 1" stroke="#1d4ed8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <div><div class="conv2-ft">{{ f.title }}</div><div class="conv2-fd">{{ f.desc }}</div></div>
            </div>
            <div class="conv2-err">{{ conv2S3Err }}</div>
            <div class="conv2-fp-btn-row">
              <span class="conv2-cbadge">已選 {{ conv2S3Features.filter(f => f.sel).length }} / {{ conv2S3Features.length }}</span>
              <button class="conv2-fp-sec-btn" @click.stop="conv2GoStep(2)">← 返回</button>
              <button class="conv2-fp-btn" @click.stop="conv2GoStep(4)">確認 →</button>
            </div>
          </div>
          <!-- Step 4: 搜索範圍 -->
          <div v-show="conv2CurStep === 4">
            <div class="conv2-chips">
              <div :class="['conv2-chip', {sel: conv2S4Scope === 'tw'}]" @click.stop="conv2S4Scope = 'tw'">台灣市場</div>
              <div :class="['conv2-chip', {sel: conv2S4Scope === 'domain'}]" @click.stop="conv2S4Scope = 'domain'">指定網址</div>
            </div>
            <div v-show="conv2S4Scope === 'domain'" style="margin-top:8px">
              <div class="conv2-fl">指定網址 <span style="font-size:10px;color:var(--color-text-alpha50)">可輸入多個，用逗號分隔</span></div>
              <input class="conv2-fi conv2-fi--full" v-model="conv2S4Domain" placeholder="e.g. shopee.tw, momo.com.tw" @click.stop />
            </div>
            <div style="font-size:11px;color:var(--color-text-alpha50);margin-top:8px">確認後進入設定審核，無誤後 DeepAgent 開始搜索</div>
            <div class="conv2-fp-btn-row">
              <button class="conv2-fp-sec-btn" @click.stop="conv2GoStep(3)">← 返回</button>
              <button class="conv2-fp-btn" @click.stop="conv2GoStep('45')">確認 →</button>
            </div>
          </div>
          <!-- Step 45: 確認設定 -->
          <div v-show="conv2CurStep === '45'">
            <div style="font-size:12px;font-weight:500;margin-bottom:8px">請確認設定是否正確，有誤可點「返回修改」</div>
            <div class="conv2-review-grid">
              <div class="conv2-rv-row"><span class="conv2-rv-k">商品類別</span><span class="conv2-rv-v">{{ conv2S1Custom || conv2S1Cat }}</span></div>
              <div class="conv2-rv-row"><span class="conv2-rv-k">品牌 / 定價</span><span class="conv2-rv-v">{{ conv2S2Brand || '—' }} / {{ conv2S2Price || '—' }}</span></div>
              <div class="conv2-rv-row"><span class="conv2-rv-k">分析特徵</span><span class="conv2-rv-v">{{ conv2S3Features.filter(f => f.sel).length }} 項</span></div>
              <div class="conv2-rv-row"><span class="conv2-rv-k">搜索範圍</span><span class="conv2-rv-v">{{ conv2S4Scope === 'tw' ? '台灣市場' : '指定網址：' + conv2S4Domain }}</span></div>
            </div>
            <div class="conv2-fp-btn-row" style="margin-top:10px">
              <button class="conv2-fp-sec-btn" @click.stop="conv2GoStep(4)">← 返回修改</button>
              <button class="conv2-fp-btn conv2-fp-btn--green" @click.stop="conv2StartSearch()">確認無誤，開始搜索 →</button>
            </div>
          </div>
          <!-- Step 5: 確認競品 -->
          <div v-show="conv2CurStep === 5">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <div style="font-size:12px;color:var(--color-text-alpha50)">DeepAgent 找到 12 個備選競品，最多選 5 個</div>
              <span class="conv2-cbadge">已選 {{ conv2S5SelComps.size }} / 5</span>
            </div>
            <div class="conv2-comp-layout-fp">
              <div class="conv2-comp-list-fp">
                <div v-for="comp in conv2S5Comps" :key="comp.id"
                  :class="['conv2-ci-row', {sel: conv2S5SelComps.has(comp.id), blocked: !conv2S5SelComps.has(comp.id) && conv2S5SelComps.size >= 5}]"
                  @click.stop="conv2TogComp(comp)"
                  @mouseenter="conv2HoverComp = comp">
                  <div class="conv2-ci-ic">{{ comp.icon }}</div>
                  <div class="conv2-ci-info">
                    <div class="conv2-ci-nm">{{ comp.name }}</div>
                    <div class="conv2-ci-mt">{{ comp.price }}</div>
                  </div>
                  <input type="checkbox" class="conv2-ci-chk" :checked="conv2S5SelComps.has(comp.id)" @click.stop />
                </div>
              </div>
              <div class="conv2-prev-col-fp">
                <div class="conv2-prev-img-area-fp">
                  <img v-if="conv2HoverComp?.img" :src="conv2HoverComp.img" style="width:100%;height:100%;object-fit:cover" />
                  <div v-else class="conv2-prev-ph-fp">
                    <i class="material-symbols-outlined">image</i>
                    <span>游標移至競品<br>預覽圖片</span>
                  </div>
                </div>
                <div class="conv2-prev-info-fp">
                  <div class="conv2-prev-nm-fp">{{ conv2HoverComp?.name || '—' }}</div>
                  <div style="font-size:11px;color:var(--color-text-alpha50)">{{ conv2HoverComp?.price || '' }}</div>
                </div>
              </div>
            </div>
            <div class="conv2-err">{{ conv2S5Err }}</div>
            <div class="conv2-fp-btn-row">
              <button class="conv2-fp-sec-btn" @click.stop="conv2ResetComps()">重設</button>
              <button class="conv2-fp-btn" :disabled="conv2S5SelComps.size < 1" @click.stop="conv2DoneComps()">產出報告 →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 要上傳的附件 -->
      <div v-if="!inputAreaHidden" :class="['accessory-box', { hidden: isShowCannedTaskListBox }]"
        :style="{ maxWidth: props.rightWidth - 65 + 'px' }">
        <!-- 已選擇的檔案附件 -->
        <div :class="['accessory-item-box', {'no-accessory-item': userInputModal.userUploadFiles.length === 0 && userInputModal.aiFiles.length === 0}]">
          <!-- 使用者要上傳的檔案列表 -->
          <div :class="['oneFileItem accessory-item', { 'show-delete-btn': isTouchDevice }]" v-for="(item, i) in userInputModal.userUploadFiles" :key="'userUploadFiles-item' + i">

            <!-- 可以預覽用 -->
            <img class="file-icon" :src="item.preview" v-if="item.preview"/>
            <!-- 不可預覽用 icon 表示 -->
            <span class="noFile-icon" v-else>
              <i class="material-symbols-outlined">draft</i>
            </span>

            <div class="file-info-box">
              <div class="file-name">{{ item.file.name }}</div>
              <div class="file-size">{{ item.fileType }}．{{ formatFileSize(item.file.size) }}</div>
            </div>
            <i class="material-symbols-outlined delete-btn" @click="userInputModal.userUploadFiles.splice(i, 1)">close_small</i>
          </div>
          <!-- 由畫布再次帶入的檔案列表 -->
          <div :class="['oneFileItem accessory-item isAgainFile', { 'show-delete-btn': isTouchDevice }]" v-for="(item, i) in userInputModal.aiFiles" :key="'aiFiles-item' + i">
            <!-- 如果 block type 是圖片 -->
            <img class="file-icon" :src="item.data.fileUrl" v-if="item.blockType === 'IMAGE'"/>
            <!-- 在規範內的 block type 使用定義好的 icon  -->
            <img :src="useIconFileTypes[item.blockType]" v-else-if="item.blockType && useIconFileTypes[item.blockType]"/>
            <!-- 不在定義好的 block type -->
            <span class="noFile-icon" v-else>
              <i class="material-symbols-outlined">draft</i>
            </span>
            <i class="material-symbols-outlined delete-btn" @click="userInputModal.aiFiles.splice(i, 1)">close_small</i>
          </div>
        </div>
      </div>
      <!-- 使用者輸入區 -->
      <div :class="['input-group-box', { hidden: isShowCannedTaskListBox }]">
        <!-- Conv2 pills：panel 曾開啟就顯示，點擊可收合/展開 panel -->
        <template v-if="currentConversationId === 'conv2'">
          <div class="conv2-pill-row" v-show="conv2ShowUploadPill || conv2ShowStepPill || conv2ShowDirectPill">
            <div class="conv2-pill" :class="{'conv2-pill--collapsed': !conv2UploadFpVisible}"
              v-show="conv2ShowUploadPill"
              @click.stop="conv2UploadFpVisible = !conv2UploadFpVisible">
              <span class="conv2-pill-dot"></span>上傳商品資料
              <i class="material-symbols-outlined" style="font-size:14px">{{ conv2UploadFpVisible ? 'expand_more' : 'expand_less' }}</i>
            </div>
            <div class="conv2-pill" :class="{'conv2-pill--collapsed': !conv2StepFpVisible}"
              v-show="conv2ShowStepPill"
              @click.stop="conv2StepFpVisible = !conv2StepFpVisible">
              <span class="conv2-pill-dot"></span>
              Step {{ conv2CurStep === '45' ? '確認' : conv2CurStep }} · {{ conv2StepTitleMap[String(conv2CurStep)] }}
              <i class="material-symbols-outlined" style="font-size:14px">{{ conv2StepFpVisible ? 'expand_more' : 'expand_less' }}</i>
            </div>
            <div class="conv2-pill" :class="{'conv2-pill--collapsed': !conv2DirectFpVisible}"
              v-show="conv2ShowDirectPill"
              @click.stop="conv2DirectFpVisible = !conv2DirectFpVisible">
              <span class="conv2-pill-dot"></span>
              Step {{ conv2DirectFpStep }} · {{ ['商品資訊方式','輸入商品貨號','競品網址'][conv2DirectFpStep - 1] }}
              <i class="material-symbols-outlined" style="font-size:14px">{{ conv2DirectFpVisible ? 'expand_more' : 'expand_less' }}</i>
            </div>
          </div>
          <!-- conv2 流程進行中：固定顯示「離開快速任務」 -->
          <div v-if="conv2InputLocked" class="conv2-leave-row">
            <button class="conv2-leave-btn" @click.stop="conv2LeaveFastTask()">
              <i class="material-symbols-outlined">close</i>離開快速任務
            </button>
          </div>
        </template>
        <!-- Conv1 翻譯設定步驟面板 -->
        <div v-show="conv1TranslPanelVisible && currentConversationId === 'conv1'" class="conv2-fp conv1-transl-fp" @click.stop>
          <div class="conv2-fp-top">
            <div class="conv1-transl-step-track">
              <div :class="['conv1-transl-sd', { 'conv1-transl-sd--done': conv1TranslStep > 1, 'conv1-transl-sd--active': conv1TranslStep === 1 }]"></div>
              <div class="conv1-transl-sl"></div>
              <div :class="['conv1-transl-sd', { 'conv1-transl-sd--done': conv1TranslStep > 2, 'conv1-transl-sd--active': conv1TranslStep === 2 }]"></div>
              <div class="conv1-transl-sl"></div>
              <div :class="['conv1-transl-sd', { 'conv1-transl-sd--active': conv1TranslStep === 3 }]"></div>
            </div>
            <span class="conv2-fp-title">{{ ['選擇翻譯文件', '選擇翻譯範圍', '選擇目標語言'][conv1TranslStep - 1] }}</span>
            <button class="conv2-fp-close-btn" @click.stop="conv1TranslPanelVisible = false">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>
          <div class="conv2-fp-body">
            <!-- Step 1: 選擇翻譯文件 -->
            <div v-show="conv1TranslStep === 1">
              <div class="conv2-info-note">✦ 選擇要翻譯的 Excel 檔案</div>
              <!-- 空狀態：上傳 zone -->
              <div v-if="!conv1TranslFile" class="conv1-transl-upload-zone" @click.stop="conv1TranslFile = 'AW26 Product Descriptions.xlsx'">
                <i class="material-symbols-outlined conv1-transl-upload-zone-icon">upload_file</i>
                <div class="conv1-transl-upload-zone-text">點擊上傳本地端檔案</div>
                <div class="conv1-transl-upload-zone-hint">支援 .xlsx、.xls</div>
              </div>
              <!-- 已選擇：顯示檔案卡片 -->
              <div v-else class="conv1-transl-file-card conv1-transl-file-card--selected" @click.stop>
                <span class="conv1-transl-file-icon">📊</span>
                <div class="conv1-transl-file-info">
                  <div class="conv1-transl-file-name">{{ conv1TranslFile }}</div>
                  <div class="conv1-transl-file-meta">XLSX · 2.7 MB · 已上傳</div>
                </div>
                <i class="material-symbols-outlined conv1-transl-file-check">check_circle</i>
              </div>
            </div>
            <!-- Step 2: 選擇翻譯範圍 -->
            <div v-show="conv1TranslStep === 2">
              <div class="conv2-info-note">✦ 選擇工作表</div>
              <div class="conv1-transl-range-list">
                <div v-for="(opt, i) in conv1RangeOptions" :key="i"
                     :class="['conv1-transl-range-item', { 'conv1-transl-range-item--selected': conv1TranslRange === opt.value }]"
                     @click.stop="conv1TranslRange = opt.value; conv1TranslColumns = ''">
                  <div :class="['conv1-transl-radio', { 'conv1-transl-radio--sel': conv1TranslRange === opt.value }]"></div>
                  <div>
                    <div class="conv1-transl-range-title">{{ opt.label }}</div>
                    <div class="conv1-transl-range-sub">{{ opt.sub }}</div>
                  </div>
                </div>
              </div>
              <!-- 指定欄位（僅當選擇特定工作表時顯示） -->
              <template v-if="conv1TranslRange && conv1TranslRange !== '全部工作表'">
                <div class="conv2-info-note" style="margin-top: 12px">✦ 翻譯欄位 <span class="conv1-transl-optional">（選填）</span></div>
                <input
                  class="conv1-transl-col-input"
                  v-model="conv1TranslColumns"
                  placeholder="留空則翻譯該工作表全部欄位"
                  @click.stop
                />
              </template>
            </div>
            <!-- Step 3: 選擇目標語言 -->
            <div v-show="conv1TranslStep === 3">
              <div class="conv2-info-note">✦ 選擇目標語言</div>
              <div class="conv1-transl-lang-grid">
                <div v-for="(lang, i) in conv1LangOptions" :key="i"
                     :class="['conv1-transl-lang-chip', { 'conv1-transl-lang-chip--selected': conv1TranslLang === lang.value }]"
                     @click.stop="conv1TranslLang = lang.value">
                  <div class="conv1-transl-lang-flag">{{ lang.flag }}</div>
                  <div class="conv1-transl-lang-name">{{ lang.label }}</div>
                  <div class="conv1-transl-lang-sub">{{ lang.sub }}</div>
                </div>
              </div>
            </div>
          </div>
          <div class="conv1-transl-footer">
            <button v-if="conv1TranslStep > 1" class="conv2-fp-sec-btn" @click.stop="conv1TranslStep--">← 返回</button>
            <button v-if="conv1TranslStep < 3" class="conv2-fp-btn"
                    :disabled="(conv1TranslStep === 1 && !conv1TranslFile) || (conv1TranslStep === 2 && !conv1TranslRange)"
                    @click.stop="conv1TranslStep++">下一步 →</button>
            <button v-if="conv1TranslStep === 3" class="conv2-fp-btn"
                    :disabled="!conv1TranslLang"
                    @click.stop="conv1TranslSubmit()">確認送出 ✓</button>
          </div>
        </div>
        <!-- Conv1 旅程修改需求懸浮面板 -->
        <div v-if="showJourneyModifyPill && currentConversationId === 'conv1'" class="conv2-fp" @click.stop>
          <div class="conv2-fp-top">
            <span class="conv2-fp-title">旅程修改需求</span>
            <button class="conv2-fp-close-btn" @click.stop="showJourneyModifyPill = false">
              <i class="material-symbols-outlined">close</i>
            </button>
          </div>
          <div class="conv2-fp-body">
            <div class="conv2-info-note">✦ 描述您希望調整的旅程內容</div>
            <textarea class="conv2-fi conv2-fi--full conv2-fi--ta" v-model="journeyModifyInput" rows="3" @click.stop
              placeholder="例如：旅程過於單一，我需要更豐富的旅程設計..."></textarea>
            <div class="conv2-fp-btn-row">
              <button class="conv2-fp-submit-btn" @click.stop="submitJourneyModify()">確認送出 →</button>
            </div>
          </div>
        </div>
        <!-- Conv1 翻譯確認動作列 -->
        <div v-if="conv1TranslConfirmed && currentConversationId === 'conv1'" class="conv1-transl-action-bar" @click.stop>
          <div class="conv1-tab-info">
            <i class="material-symbols-outlined conv1-tab-icon">translate</i>
            <div class="conv1-tab-text">
              <div class="conv1-tab-label">翻譯設定已確認</div>
              <div class="conv1-tab-sub">點擊「開始翻譯」即可啟動</div>
            </div>
          </div>
          <div class="conv1-tab-btns">
            <button class="conv1-tab-btn conv1-tab-btn--sec" @click.stop="conv1OpenTranslPanel()">重新設定</button>
            <button class="conv1-tab-btn conv1-tab-btn--primary" @click.stop="conv1StartTranslation()">
              <i class="material-symbols-outlined" style="font-size:14px;vertical-align:-2px">play_arrow</i>
              開始翻譯
            </button>
          </div>
        </div>
        <!-- fp 互動模式時完全移除輸入框 -->
        <textarea v-if="!inputAreaHidden" :class="['custom-textarea']"
          id="userInput"
          placeholder="請輸入您的需求"
          ref="userInputRef"
          v-model.trim="userInputModal.msg"
          @focus="inputFocus()"
          @blur="inputBlur()"
          @keydown="inputKeyPress($event); handleEnterKeySubmit($event, send)">
        </textarea>
        <div v-if="!inputAreaHidden">
          <!-- 展開快速罐頭任務區塊按鈕 -->
          <button class="custom-btn" v-tooltip.top="'使用快速任務'"
            @click="isShowCannedTaskListBox = true">
            <i class="material-symbols-outlined">bolt</i>
          </button>
          <!-- 展開選擇附件功能選項清單按鈕 -->
          <button class="custom-btn" v-tooltip.top="'附加檔案'"
            @click="isOpenAccessoryFileFnBox = true">
            <i class="material-symbols-outlined">add</i>
          </button>
        </div>
        <!-- 附件功能選項清單 -->
        <div :class="['accessory-file-fn-box next-option-box', {'show': isOpenAccessoryFileFnBox}]"
          ref="accessoryFileFnBox">
          <div class="option-item">從本機檔案新增
            <!-- 本地端上傳的 input file -->
            <label class="accessory-file-input-label">
              <input type="file" ref="fireUploadRef"
                multiple
                :accept="acceptedFileExtensions"
                @change="handleAccessoryFileSelect($event)"/>
            </label>
          </div>
          <div class="option-item">從專案檔案清單新增</div>
          <div class="option-item">從共享資源庫新增</div>
        </div>
        <!-- 發送按鈕 -->
        <button class="custom-btn" v-if="!inputAreaHidden" v-tooltip="'發送訊息'"
          @click="send()"><i class="material-symbols-outlined material-fill">send</i></button>
      </div>

      <!-- 快速罐頭任務大區塊  TODO... 思考是否要拔出去成為組件 -->
      <div class="AiViewerCannedTaskArea" v-show="isShowCannedTaskListBox">

        <div :class="['canned-list-box', {hide: !isShowCannedTaskListBox}]">
          <div :class="['canned-task-item', { 'active': false }]"
            v-for="(item, i) in cannedTaskItems" :key="'cannedTaskItem' + i"
            @click="sendCannedTask(item)">
            {{ item.text }}
          </div>
        </div>

        <div class="d-flex flex-justify-start flex-align-center">
          <!-- 關閉快速罐頭任務區塊按鈕 -->
          <button class="custom-btn"
            @click="isShowCannedTaskListBox = false">
            <i class="material-symbols-outlined">close</i>
          </button>
          <span class="fs-13 ml-1">離開快速任務</span>
        </div>

      </div>

    </div>

    <!-- AI 內容免責聲明 -->
    <div class="ai-disclaimer">
      由 AI 產生的內容，有時可能不完全準確，請再人工查證
      <span class="ai-disclaimer-reset" @click="resetConversation()">還原對話內容</span>
    </div>

    <!-- 評論列表 comment list -->
    <commentListArea :setMainStagePosition="props.setMainStagePosition" />

    <!-- 畫布 block 清單 list -->
    <blockListArea :setMainStagePosition="props.setMainStagePosition"/>

    <!-- 專案檔案清單 list -->
    <fileListArea/>

    <KnowledgeSourceDrawer />

  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { storeToRefs } from 'pinia'
import { useAiviewerStore } from '@/stores/AiViewerStore';
import { useJourneyStore } from '@/stores/journeyStore'
import { handleContentWheel, stopWhellZoomEvent, stopTouchpadZoomEvent, handleEnterKeySubmit, initClickOutsideListener } from '@/utils/utils';
import VirtualList from 'vue3-virtual-scroll-list';
import AiViewerRecord from '@/components/AiViewer/AiViewerRecord.vue';
import KnowledgeSourceDrawer from '@/components/AiViewer/KnowledgeSourceDrawer.vue';
import commentListArea from '@/components/AiViewer/commentListArea.vue';
import fileListArea from '@/components/AiViewer/fileListArea.vue';
import blockListArea from '@/components/AiViewer/blockListArea.vue';
import popDialog from '@/services/popDialog';
import { formatFileSize, getFileMimeType, validateUploadFiles, acceptedFileExtensions } from '@/utils/file';
import htmlIcon from '@/assets/fileTypeIcon/html.png';
import { Chart } from 'chart.js/auto';

interface KnowledgeSource {
  knowledgeId: string
  title: string
  chunkIndexes: number[]
}

const props = defineProps<{
  rightWidth: number;
  setMainStagePosition: (x: number, y: number) => void;
}>();

const aiviewerStore = useAiviewerStore();
const { nowChoiceAiViewerId, copyAiViewerBlock, isStopCopyPasteAiViewerBlock, isMultiChoiceAiViewerMode, nowMultiChoiceAiViewerIds, isShowFileListView } = storeToRefs(aiviewerStore);
const { fullAiViewerBlockId, isAspectRatioMode } = storeToRefs(aiviewerStore);
const { aiViewerBlocks, panToTarget } = storeToRefs(aiviewerStore);
const { sendUserInput, addReportBlock, addChartBlock } = aiviewerStore;
const journeyStore = useJourneyStore()
const { journeyStarted } = storeToRefs(journeyStore)
const journeyDashboardAdded = ref(false)
let _journeyUserCount = 0
const showJourneyModifyPill = ref(false)
const activeRightTab = ref<'chat' | 'journey'>('chat')

// ── jcd stats (mirrored from AiViewer.vue) ──────────────────────────────────
const JOURNEY_TYPE_NODES = {
  marketing: [
    { key: 'D0',  label: '觸發加入旅程' },
    { key: 'D1',  label: '歡迎序列啟動' },
    { key: 'D3',  label: '行為條件分流' },
    { key: 'D7',  label: '產品深度培育' },
    { key: 'D14', label: '購買轉換衝刺' },
    { key: 'D30', label: '購後回購培育' },
  ],
  birthday: [
    { key: 'PRE7', label: '壽星名單篩選' },
    { key: 'D0',   label: '生日驚喜觸發' },
    { key: 'D1',   label: '生日禮追蹤' },
    { key: 'D7',   label: '壽星回購培育' },
    { key: 'D30',  label: '旅程成效報告' },
  ],
} as const;

function getTypeStats(type: 'marketing' | 'birthday') {
  const list = journeyStore.journeys.filter(j => j.journeyType === type);
  const total = list.length;
  const done = list.filter(j => j.status === 'done').length;
  const completion = total > 0 ? Math.round(done / total * 100) : 0;
  const nodeCounts = JOURNEY_TYPE_NODES[type].map(({ key, label }) => {
    let doneCount = 0, runningCount = 0;
    for (const j of list) {
      const node = j.nodes.find(n => n.key === key);
      if (!node) continue;
      if (node.status === 'done') doneCount++;
      else if (node.status === 'running') runningCount++;
    }
    return { key, label, done: doneCount, running: runningCount };
  });
  return { total, done, completion, journeys: list, nodeCounts };
}

const jcdStats = computed(() => {
  const total = journeyStore.journeys.length;
  const done = journeyStore.journeys.filter(j => j.status === 'done').length;
  return {
    total,
    done,
    running: total - done,
    marketing: getTypeStats('marketing'),
    birthday: getTypeStats('birthday'),
  };
});

function openJourneyFullscreen(type: 'marketing' | 'birthday') {
  const keyword = type === 'marketing' ? 'journey_dashboard' : 'birthday_journey';
  const block = (aiViewerBlocks.value as any[]).find(
    (b: any) => b.data?.data?.fileUrl?.includes(keyword)
  );
  if (block) fullAiViewerBlockId.value = block.id;
}

// ── Analytics chart ──────────────────────────────────────────────────────────
const analyticsChartRef = ref<HTMLCanvasElement | null>(null);
let analyticsChart: Chart | null = null;

const ANALYTICS_MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const ANALYTICS_TRIGGER_DATA = [920, 770, 1000, 890, 1100, 650, 710, 930, 510, 950, 670, 730];
const ANALYTICS_MSG_DATA     = [490, 600, 600,  640, 580,  850, 830, 670, 830, 650, 570, 920];

function initAnalyticsChart() {
  if (!analyticsChartRef.value) return;
  if (analyticsChart) { analyticsChart.destroy(); analyticsChart = null; }
  analyticsChart = new Chart(analyticsChartRef.value, {
    type: 'line',
    data: {
      labels: ANALYTICS_MONTHS,
      datasets: [
        {
          label: '觸發次數',
          data: ANALYTICS_TRIGGER_DATA,
          borderColor: '#3b72f6',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0,
          pointRadius: 4,
          pointBackgroundColor: '#3b72f6',
          borderWidth: 2,
        },
        {
          label: '發送訊息數',
          data: ANALYTICS_MSG_DATA,
          borderColor: '#f97316',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0,
          pointRadius: 4,
          pointBackgroundColor: '#f97316',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'start',
          labels: { font: { size: 11 }, boxWidth: 10, padding: 12, color: '#374151' },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: '#111827',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 10,
          callbacks: {
            title: (items) => items[0]?.label ?? '',
            label: (item) => `${item.dataset.label}：${item.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 }, color: '#6b7280' },
          title: { display: true, text: '月份', font: { size: 11 }, color: '#6b7280' },
        },
        y: {
          grid: { color: '#f3f4f6' },
          ticks: { font: { size: 11 }, color: '#6b7280' },
          title: { display: true, text: '觸發次數', font: { size: 11 }, color: '#6b7280' },
          beginAtZero: true,
        },
      },
    },
  });
}

function switchToJourneyTab() {
  activeRightTab.value = 'journey';
  nextTick(initAnalyticsChart);
}

watch(activeRightTab, (tab) => {
  if (tab === 'journey') nextTick(initAnalyticsChart);
});

const { isOpenConversationListModal, currentConversationId, conv1IsEmpty } = storeToRefs(aiviewerStore); // 是否開啟對話列表 Modal

const conv2Title = ref('');
const conv1Title = ref('未命名對話');
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  if (currentConversationId.value === 'conv4') return conv4Title.value || '產品銷售報告整理';
  if (currentConversationId.value === 'conv6') return conv6Title.value || 'TEVA涼鞋銷售分析';
  return conv1Title.value;
});

watch(currentConversationId, (id) => {
  if (id === 'conv1') {
    aiViewerBlocks.value = [];
  } else if (id === 'conv2') {
    aiViewerBlocks.value = [...aiviewerStore.INITIAL_BLOCKS];
  } else if (id === 'conv4') {
    aiViewerBlocks.value = [];
  } else if (id === 'conv6') {
    aiViewerBlocks.value = [];
  }
}, { immediate: true });



const { isTouchDevice } = storeToRefs(aiviewerStore);

// konva.js 主場景物件
const { mainStage } = storeToRefs(aiviewerStore);

// 搜尋對話內容小介面
const isOpenSearchUserDialogueBox = ref(false);

// 更多對話選項的小介面
const isShowMoreChatOptionsBox = ref(false);
const projectNameDropDown = ref<HTMLDivElement|null>(null);
const moreChatOptionsBox = ref<HTMLDivElement|null>(null);
const moreChatOptionsBoxStyle = ref({ left: '0px' });
function calcMoreChatOptionsBoxStyle () {
  // 讓 moreChatOptionsBox 對齊 projectNameDropDown
  if (!projectNameDropDown.value || !moreChatOptionsBox.value) return;
  const temp = projectNameDropDown.value.getBoundingClientRect();
  console.log(temp, moreChatOptionsBox.value.clientWidth);
  moreChatOptionsBoxStyle.value = {
    left: (temp.width - (moreChatOptionsBox.value.clientWidth / 2)) + 'px',
  };
}

onMounted(() => {
  initClickOutsideListener(moreChatOptionsBox.value!, () => {
    isShowMoreChatOptionsBox.value = false;
  });
});

// 使用者輸入參考
const { userInputModal } = storeToRefs(aiviewerStore);
const fireUploadRef = ref<HTMLInputElement|null>(null);
const AiAgentChatList = ref<InstanceType<typeof VirtualList>|null>(null);

// 目前選擇的罐頭任務  TODO... 格式暫定, TODO... 是否要拔到 store 裡？
const isShowCannedTaskListBox = ref(false);
const cannedTaskItems = computed(() => {
  if (currentConversationId.value === 'conv2') {
    return [{ id: 'competitorAnalysis', text: '商品競品分析' }];
  }
  if (currentConversationId.value === 'conv4') {
    return [{ id: 'salesReport', text: '整理上月產品銷售報告' }];
  }
  return [
    { id: 'cannedTask1', text: '快速罐頭任務範例文字1' },
    { id: 'cannedTask2', text: '快速罐頭任務範例文字2' },
    { id: 'cannedTask3', text: '快速罐頭任務範例文字33333333333333333333333' },
    { id: 'cannedTask4', text: '快速罐頭任務範例文字4' },
    { id: 'cannedTask5', text: '快速罐頭任務範例文字5' },
    { id: 'cannedTask6', text: '快速罐頭任務範例文字6' },
  ];
});
// 切換罐頭任務
function sendCannedTask(item: any) {
  isShowCannedTaskListBox.value = false;
  if (currentConversationId.value === 'conv2' && item.id === 'competitorAnalysis') {
    resetConversation();
    nextTick(() => conv2InitFlow());
    return;
  }
  if (currentConversationId.value === 'conv4' && item.id === 'salesReport') {
    resetConversation();
    nextTick(() => conv4InitFlow());
    return;
  }
  send();
}

// 是否焦點在使用者輸入框
const { isFocusUserInput } = storeToRefs(aiviewerStore);

// 輸入框焦點時
async function inputFocus() {
  // copyAiViewerBlock.value = null; // 清空複製區塊變數
  // await navigator.clipboard.writeText(''); // 清空系統剪貼簿內容
  isFocusUserInput.value = true;
}
// 輸入框鍵盤按下事件
async function inputKeyPress(event: KeyboardEvent) {
  const key = event.key;
  const isCtrlOrCmd = event.ctrlKey || event.metaKey; // 是否按下 ctrl 鍵或 command 鍵
  // 貼上判斷
  if (isCtrlOrCmd && key.toLowerCase() === 'v') {
    // TODO... 判斷複製的是否為區塊資料
    const clipboardText = await navigator.clipboard.readText();
    console.log('剪貼簿資料....', clipboardText);
  }
}
// 輸入框失去焦點時
function inputBlur() {
  userInputModal.value.msg = userInputModal.value.msg.trim();
  isFocusUserInput.value = false;
}

const { getBlockTypeByFileMime } = aiviewerStore;
// 附件功能選項清單
const accessoryFileFnBox = ref<HTMLElement|null>(null);
const isOpenAccessoryFileFnBox = ref(false);
onMounted(() => {
  initClickOutsideListener(accessoryFileFnBox.value!, () => {
    isOpenAccessoryFileFnBox.value = false;
  });
});

// 能支援本地端上傳的檔案類型
const supportedFileTypes = aiviewerStore.supportedFileTypes;
// 圖檔類型參考
const supportedImgFileTypes = aiviewerStore.supportedImgFileTypes;
// 檔案類型對應的圖示
const useIconFileTypes = aiviewerStore.useIconFileTypes;

// 使用者選擇檔案 (注意這邊不會是ai產生的檔案,檔案來源: 使用者本地端上傳, 已上傳到專案資料夾路徑, 共享資料夾內的檔案路夾)
function handleAccessoryFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files) return;
  isOpenAccessoryFileFnBox.value = false;
  const files = Array.from(input.files);

  // 驗證類型、數量、大小
  const validation = validateUploadFiles(files, userInputModal.value.userUploadFiles, supportedFileTypes);
  if (!validation.valid) {
    input.value = '';
    const errorMsg = validation.error as string;
    popDialog.alert(errorMsg);
    return;
  }

  // 處理 "本地端選擇" 的檔案
  files.forEach(file => {
    const fileType = getFileMimeType(file);
    const blockType = getBlockTypeByFileMime(fileType); // 提醒: 目前規劃 fileType 也就是 blockType
    console.log('fileType >>> ', fileType);
    console.log('blockType >>> ', blockType);

    // 本地端非圖片類型不建立預覽 URL, 使用 icon 表示
    if (supportedImgFileTypes.indexOf(fileType) === -1) {
      userInputModal.value.userUploadFiles.push({
        file: file,
        fileType: blockType,
        preview: useIconFileTypes[fileType] || null
      });
      return;
    }
    // 本地端的圖片類的要建立預覽 URL
    const previewUrl = (fileType.startsWith('image/')) ? URL.createObjectURL(file) : null;
    userInputModal.value.userUploadFiles.push({
      file: file,
      fileType: blockType,
      preview: previewUrl
    });
  });

  input.value = ''; // 重置 file input
}

// 調整 textarea 高度
const userInputRef = ref<HTMLTextAreaElement|null>(null);
async function adjustTextareaHeight() {
  if (!userInputRef.value) {
    userInputRef.value!.style.height = 'auto';
    return;
  }

  // 取得舊高度
  const oldHeight = userInputRef.value!.style.height;

  // 先重置高度，以便正確計算 scrollHeight
  userInputRef.value!.style.height = 'auto';

  // 取得新高度
  const newHeight = userInputRef.value!.scrollHeight + 2; // 加一些額外空間

  // 回復舊高度以觸發動畫效果
  userInputRef.value!.style.height = oldHeight;
  await new Promise(resolve => setTimeout(resolve, 60));

  // 設定新高度
  userInputRef.value!.style.height = `${newHeight}px`;

  // 如果高度超過最大高度，則添加滾動條
  const maxHeight = 110; // 最大高度
  if (newHeight > maxHeight) {
    userInputRef.value!.classList.add('useScrollBar');
  } else {
    userInputRef.value!.classList.remove('useScrollBar');
  }
}
watch(() => userInputModal.value.msg, () => {
  adjustTextareaHeight();
});

// ── Drawer state (知識來源側邊抽屜) ────────────────────────────────
const drawerOpen = ref(false)
const drawerSources = ref<KnowledgeSource[]>([])

function openDrawer(sources: KnowledgeSource[]) {
  drawerSources.value = sources
  drawerOpen.value = true
}

provide('drawerOpen', drawerOpen)
provide('drawerSources', drawerSources)
provide('openDrawer', openDrawer)

// 發送使用者輸入訊息
function send() {
  if (currentConversationId.value === 'conv1') {
    const msg = userInputModal.value.msg.trim();
    if (!msg) return;
    conv1Msgs.value.push({ id: 'user-' + Date.now(), forUser: true, msg });
    userInputModal.value.msg = '';
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    processConv1Msg(msg);
    return;
  }
  if (currentConversationId.value === 'conv6') {
    const msg = userInputModal.value.msg.trim();
    if (!msg) return;
    conv6Msgs.value.push({ id: 'user-' + Date.now(), forUser: true, msg });
    userInputModal.value.msg = '';
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    processConv6Msg(msg);
    return;
  }
  sendUserInput();
}

const journeyModifyInput = ref('')
function submitJourneyModify() {
  const msg = journeyModifyInput.value.trim();
  if (!msg) return;
  conv1Msgs.value.push({ id: 'user-modify-' + Date.now(), forUser: true, msg });
  journeyModifyInput.value = '';
  showJourneyModifyPill.value = false;
  nextTick(() => AiAgentChatListScrollTo('ASC'));
  processConv1Msg('旅程過於單一');
}

// virtual-list 滾動到頂部或底部的回呼
function scrollCall(direction: 'ASC' | 'DESC') {
  console.log('scrollCall 觸發: ', direction);
}
// virtual-list 執行滾動到頂部或底部
function AiAgentChatListScrollTo(direction: 'ASC' | 'DESC') {
  if (direction === 'DESC') {
    AiAgentChatList.value?.scrollToIndex(0);
  } else {
    AiAgentChatList.value?.scrollToBottom();
  }
}

// TODO... 開發測試用之後刪除
const { touchDebug } = storeToRefs(aiviewerStore);
const tempDebugMsg = computed(() => {
  return `
    <p class="fs-12">
      POC階段這一則訊息的文字,請用滑鼠複製不要用ctrl+c或cmd+c.<br><br>
      nowChoiceAiViewerId: ${ nowChoiceAiViewerId.value }<br><br>
      aiViewerBlocks.length: ${ aiViewerBlocks.value.length }<br><br>

      isMultiChoiceAiViewerMode: ${ isMultiChoiceAiViewerMode.value }<br><br>
      nowMultiChoiceAiViewerIds.length: ${ nowMultiChoiceAiViewerIds.value.length }<br><br>
      nowMultiChoiceAiViewerIds: ${ nowMultiChoiceAiViewerIds.value }<br><br>

      aiViewerBlocks: ${ JSON.stringify(aiViewerBlocks.value) }<br><br>

      userInputModal: ${ JSON.stringify(userInputModal.value) }<br><br>
    </p>

    <p class="fs-12">
      isStopCopyPasteAiViewerBlock: ${ isStopCopyPasteAiViewerBlock.value }<br><br>
      copyAiViewerBlock: ${ copyAiViewerBlock.value }<br><br>
    </p>

    <p class="fs-12">
      fullAiViewerBlockId: ${ fullAiViewerBlockId.value }<br><br>
      isAspectRatioMode: ${ isAspectRatioMode.value }<br><br>
      isTouchDevice: ${ isTouchDevice.value }<br><br>
      touchDebug: ${ touchDebug.value }<br><br>
    </p>

    <hr class="mt-2 mb-2" />

    <p class="fs-12">●●●●● 目前輸入 (拷貝要用滑鼠右鍵) ●●●●●<br>
      testHtmlFileA, testHtmlFileB, testHtmlFileC,
      test_report_251210, 會看到有 iframe 區塊<br>
      chartA, chartB, chartC, chartD 會產生不同的圖表, <br>
      excelA, excelB, 是 X-Spreadshee 套件的呈現 <br>
      excelC, excelD, excelE 是使用 sheetjs 做真實的excel檔案讀取與呈現<br>
      pdfA, pdfB 做真實的 .pdf 檔案讀取與呈現<br>
      txtA, txtB 做真實的 .txt 檔案讀取與呈現<br>
      mdA, mdB 做真實的 .md 檔案讀取與呈現<br>
      imgA, imgB 做真實的圖檔讀取與呈現<br>

      testForm 會看到有表單元素的區塊<br>
    </p>
    <hr class="mt-2 mb-2" />
    <p class="fs-12">
      nowChoiceAiViewerId: ${ nowChoiceAiViewerId.value }
    </p>
    <p class="fs-12">
      userInputModal.userUploadFiles: ${ userInputModal.value.userUploadFiles.length }
    </p>
  `;
});
// Mock thinking data — injected into AI messages so ThinkingChainCard can display them
const MOCK_THINKING_STEPS = [
  { type: 'think' as const, label: '分析問題意圖' },
  { type: 'search' as const, label: '查詢知識庫', detail: '找到 2 篇相關段落' },
  { type: 'synthesize' as const, label: '整合資訊，組織回答' },
]
const MOCK_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k5', title: '商品目錄 Q2', chunkIndexes: [0, 1] },
]

const conv1Msgs = ref<any[]>([]);
// conv1IsEmpty 由實際訊息狀態推導，避免 HMR 殘留舊狀態
watch(
  () => currentConversationId.value === 'conv1' && conv1Msgs.value.length === 0,
  (isEmpty) => { conv1IsEmpty.value = isEmpty; },
  { immediate: true }
);
const conv1OverlayInput = ref('');

function submitConv1Overlay() {
  const msg = conv1OverlayInput.value.trim();
  if (!msg) return;
  conv1Msgs.value.push({ id: 'user-' + Date.now(), forUser: true, msg });
  conv1OverlayInput.value = '';
  nextTick(() => AiAgentChatListScrollTo('ASC'));
  processConv1Msg(msg);
}

// ── Conv1 翻譯設定選項 ──
const conv1RangeOptions = [
  { value: '全部工作表', label: '全部工作表', sub: '所有 Sheet 完整翻譯' },
  { value: 'Features and Benefits (Product Bullets)', label: 'Features and Benefits (Product Bullets)', sub: 'Line Sheet · UGG Footwear Fall · 143 欄位' },
  { value: 'Line Sheet only', label: 'Line Sheet only', sub: '僅翻譯 Line Sheet 頁' },
];
const conv1LangOptions = [
  { value: '繁體中文', label: '繁體中文', flag: '🇹🇼', sub: 'Traditional Chinese' },
  { value: '簡體中文', label: '簡體中文', flag: '🇨🇳', sub: 'Simplified Chinese' },
  { value: '日文', label: '日文', flag: '🇯🇵', sub: 'Japanese' },
  { value: '韓文', label: '韓文', flag: '🇰🇷', sub: 'Korean' },
];

// ── Conv1 下一步追問邏輯 ──
const C1_ALL_STEPS = [
  { key: '行銷策略',       label: '🎯 生成行銷策略',       msg: '生成 Hurricane Trailsetter AW26 行銷策略報告' },
  { key: '用戶畫像',       label: '👤 目標客群用戶畫像',   msg: '分析 Hurricane Trailsetter 目標客群的用戶畫像' },
  { key: '圖表',           label: '📊 產出圖表',           msg: '給我 Hurricane Trailsetter 相關的銷售圖表，我要做報告使用' },
  { key: '行銷自動化旅程', label: '🗺️ 生成行銷自動化旅程', msg: '生成 Hurricane Trailsetter AW26 行銷自動化旅程' },
];
const conv1DoneSteps = ref<Set<string>>(new Set());

function pushConv1NextStepPrompt(doneKey: string) {
  conv1DoneSteps.value.add(doneKey);
  const remaining = C1_ALL_STEPS.filter(s => !conv1DoneSteps.value.has(s.key));
  if (remaining.length === 0) return;
  conv1Msgs.value.push({
    id: 'next-step-' + Date.now(),
    cardType: 'nextStepPrompt',
    msg: '請問接下來還有什麼我可以為您服務的嗎？',
    nextSteps: remaining,
  });
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}

// 在頁面初始化時，將 Hurricane 報告加入畫布，並監聽 iframe chip 點擊
function c1PushThinkingThenReply(
  thinkingDelay: number,
  replyMsg: string,
  files: { name: string; type: string; size: number }[],
  reportUrl: string,
  reportName: string,
  doneKey: string,
) {
  const thinkingId = 'thinking-' + Date.now();
  conv1Msgs.value.push({
    id: thinkingId,
    isThinking: true,
    thinkingSteps: MOCK_THINKING_STEPS,
    sources: MOCK_SOURCES,
  });
  nextTick(() => AiAgentChatListScrollTo('ASC'));
  setTimeout(() => {
    const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
    if (idx !== -1) conv1Msgs.value.splice(idx, 1);
    conv1Msgs.value.push({
      id: 'ai-reply-' + Date.now(),
      finishResponse: true,
      cardType: 'translationComplete',
      msg: replyMsg,
      files,
      thinkingSteps: MOCK_THINKING_STEPS,
      sources: MOCK_SOURCES,
    });
    try { addReportBlock(reportUrl, reportName); } catch (e) { /* ignore */ }
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    pushConv1NextStepPrompt(doneKey);
  }, thinkingDelay);
}

function processConv1Msg(msg: string) {
  // 初始翻譯請求：對話尚未開始（id_3 尚未出現）
  if (!conv1Msgs.value.some((m: any) => m.cardType === 'translationConfirm')) {
    const thinkingId = 'thinking-' + Date.now()
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES })
    nextTick(() => AiAgentChatListScrollTo('ASC'))
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex((m: any) => m.id === thinkingId)
      if (idx !== -1) conv1Msgs.value.splice(idx, 1)
      conv1Title.value = '2026商品文件翻譯'
      conv1Msgs.value.push({ id: 'id_2', msg: '當然可以，麻煩你幫我確認 以下翻譯條件內容，確認後我會立刻開工 💪' })
      conv1Msgs.value.push({
        id: 'id_3',
        forUser: true,
        cardType: 'translationConfirm',
        confirmed: false,
        translationStarted: false,
        file: '',
        fileSize: 2834016,
        range: '',
        lang: '',
        msg: '',
      })
      conv1OpenTranslPanel()
      nextTick(() => AiAgentChatListScrollTo('ASC'))
    }, 1000)
    return
  }
  if (msg.includes('圖表')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);

      // 圖表 1：年度銷售量 bar
      try {
        addChartBlock({
          chart: 'bar',
          title: 'Hurricane Trailsetter 年度銷售量（台灣）',
          y_axis: { title: '銷售量（雙）' },
          data: {
            labels: ['2022', '2023', '2024', '2025', '2026F'],
            values: [{ '銷售量（雙）': [1240, 1580, 1920, 2310, 2775] }],
          },
        }, '年度銷售量.json');
      } catch (e) { /* ignore */ }

      // 圖表 2：年成長率 line
      try {
        addChartBlock({
          chart: 'line',
          title: 'Hurricane Trailsetter 年成長率趨勢',
          y_axis: { title: '成長率 (%)' },
          data: {
            labels: ['2023', '2024', '2025', '2026F'],
            values: [{ '年成長率 (%)': [27.4, 21.5, 20.3, 20.0] }],
          },
        }, '年成長率趨勢.json');
      } catch (e) { /* ignore */ }

      // 圖表 3：各鞋款銷售量 bar
      try {
        addChartBlock({
          chart: 'bar',
          title: '各鞋款銷售量拆分（台灣）',
          data: {
            labels: ['2022', '2023', '2024', '2025'],
            values: [
              { 'Sandal 女款': [434, 553, 672, 809] },
              { 'Sandal 男款': [310, 395, 480, 578] },
              { 'Mid 男款': [248, 316, 384, 462] },
              { 'Mid 女款': [248, 316, 384, 461] },
            ],
          },
        }, '各鞋款銷售量.json');
      } catch (e) { /* ignore */ }

      conv1Msgs.value.push({
        id: 'ai-charts-' + Date.now(),
        finishResponse: true,
        cardType: 'translationComplete',
        msg: '📊 已幫你產出 <strong>3 張銷售分析圖表</strong>，已加到右側畫布：<br>・年度銷售量（長條圖）<br>・年成長率趨勢（折線圖）<br>・各鞋款銷售拆分（堆疊長條圖）<br><br>可直接在畫布上調整大小、截圖使用。',
        files: [
          { name: '年度銷售量.json', type: 'JSON', size: 312 },
          { name: '年成長率趨勢.json', type: 'JSON', size: 248 },
          { name: '各鞋款銷售量.json', type: 'JSON', size: 420 },
        ],
        thinkingSteps: MOCK_THINKING_STEPS,
        sources: MOCK_SOURCES,
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
      pushConv1NextStepPrompt('圖表');
    }, 5000);
  } else if (msg.includes('行銷策略')) {
    c1PushThinkingThenReply(
      5000,
      '已根據 2022–2025 銷售數據分析完成，以下是 Hurricane Trailsetter 系列的 AW26 行銷策略報告，請查閱。',
      [{ name: 'hurricane_trailsetter_marketing_strategy.html', type: 'HTML', size: 13208 }],
      '/justagent/hurricane_trailsetter_marketing_strategy.html',
      'hurricane_trailsetter_marketing_strategy.html',
      '行銷策略',
    );
  } else if (msg.includes('用戶畫像')) {
    c1PushThinkingThenReply(
      5000,
      '已完成目標客群分析，以下是 Hurricane Trailsetter 系列的用戶畫像報告，請查閱。',
      [{ name: 'hurricane_trailsetter_user_persona.html', type: 'HTML', size: 30725 }],
      '/justagent/hurricane_trailsetter_user_persona.html',
      'hurricane_trailsetter_user_persona.html',
      '用戶畫像',
    );
  } else if (msg.includes('行銷自動化旅程')) {
    const thinkingId = 'thinking-' + Date.now()
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES })
    nextTick(() => AiAgentChatListScrollTo('ASC'))
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId)
      if (idx !== -1) conv1Msgs.value.splice(idx, 1)
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        cardType: 'translationComplete',
        msg: '已根據 AW26 銷售數據與用戶行為分析，完成 Hurricane Trailsetter 行銷自動化旅程規劃。旅程涵蓋 D0–D30 共 6 個節點，整合 Email、LINE、廣告、SMS 四大渠道，請在畫布中查閱。',
        files: [{ name: 'hurricane_trailsetter_journey_dashboard.html', type: 'HTML', size: 11986 }],
        thinkingSteps: MOCK_THINKING_STEPS,
        sources: MOCK_SOURCES,
      })
      if (!journeyDashboardAdded.value) {
        addReportBlock('/justagent/hurricane_trailsetter_journey_dashboard.html', '旅程總覽')
        journeyDashboardAdded.value = true
      }
      nextTick(() => AiAgentChatListScrollTo('ASC'))
      pushConv1NextStepPrompt('行銷自動化旅程')
    }, 5000)
  } else if (msg.includes('旅程過於單一') || msg.includes('更豐富的旅程')) {
    const thinkingId = 'thinking-' + Date.now()
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES })
    nextTick(() => AiAgentChatListScrollTo('ASC'))
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId)
      if (idx !== -1) conv1Msgs.value.splice(idx, 1)
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        cardType: 'translationComplete',
        msg: '已重新設計旅程架構，D3 節點升級為三階行為分流（高參與 / 低參與 / 未開啟），新增 Web Push、SMS 觸點，整體旅程觸及率預升 35%，請查看畫布中的「旅程總覽-1」，確認後可啟動旅程。',
        files: [{ name: 'hurricane_trailsetter_journey_dashboard-1.html', type: 'HTML', size: 13065 }],
        thinkingSteps: MOCK_THINKING_STEPS,
        sources: MOCK_SOURCES,
      })
      addReportBlock('/justagent/hurricane_trailsetter_journey_dashboard-1.html', '旅程總覽-1')
      nextTick(() => AiAgentChatListScrollTo('ASC'))
    }, 5000)
  } else if (msg.includes('壽星') || msg.includes('生日旅程')) {
    const thinkingId = 'thinking-' + Date.now()
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES })
    nextTick(() => AiAgentChatListScrollTo('ASC'))
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId)
      if (idx !== -1) conv1Msgs.value.splice(idx, 1)
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        cardType: 'translationComplete',
        msg: '已從 CDP 篩選出台北地區 <strong>1,284 位 5 月壽星</strong>，完成專屬行銷自動化旅程設計。旅程從生日前 7 天預熱啟動，整合 Email、LINE、SMS 三大渠道，並在 D+1 依兌換行為進行分流，預估轉換提升 38%，請在畫布中查閱。',
        files: [{ name: 'hurricane_trailsetter_birthday_journey.html', type: 'HTML', size: 13530 }],
        thinkingSteps: MOCK_THINKING_STEPS,
        sources: MOCK_SOURCES,
      })
      addReportBlock('/justagent/hurricane_trailsetter_birthday_journey.html', '5月壽星專屬旅程')
      nextTick(() => AiAgentChatListScrollTo('ASC'))
    }, 5000)
  } else if (msg.includes('廣告文案')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '以下是 3 條 Hurricane Trailsetter AW26 品牌曝光廣告文案：<br><br>① <strong>「山路之王，秋冬出擊」</strong><br>Hurricane Trailsetter — 專為台灣山林設計，防滑耐磨，陪你征服每一條步道。<br><br>② <strong>「戶外不將就，腳感決定一切」</strong><br>全新 AW26 系列登場，Vibram 大底 × 防水鞋面，由內而外的戶外自信。<br><br>③ <strong>「你的下一段旅程，從這裡開始」</strong><br>Hurricane Trailsetter AW26，限時優惠倒數中。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 5000);
  } else if (msg.includes('歡迎 Email 模板')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '📧 <strong>歡迎 Email 模板</strong><br><br><strong>主旨：</strong>歡迎加入 Hurricane Trailsetter 探險家族 🏔️<br><br><strong>內文：</strong><br>Hi [姓名]，<br><br>感謝你關注 Hurricane Trailsetter！我們為 AW26 秋冬系列注入了全新工藝——<br>・Vibram® 大底，抓地力提升 30%<br>・Gore-Tex® 防水膜，惡劣天氣也不妥協<br>・符合台灣山林地形設計的鞋楦<br><br>身為我們的新朋友，這裡有一份 <strong>專屬 9 折優惠碼：WELCOME26</strong>，有效期 7 天。<br><br>[立即選購] 按鈕<br><br>期待在每條步道上看見你的足跡。<br>Hurricane Trailsetter 團隊',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 5000);
  } else if (msg.includes('LINE 腳本')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '💬 <strong>LINE 歡迎訊息腳本</strong><br><br><strong>主訊息：</strong><br>嗨！感謝加入 Hurricane Trailsetter 官方帳號 🏔️<br>AW26 秋冬新品現正上市，加好友限定 85 折！<br><br><strong>快速回覆按鈕（建議設定 3 個）：</strong><br>・🛒 立即選購<br>・📦 查看新品<br>・🎁 領取優惠碼<br><br><strong>備注：</strong>按鈕點擊後導向官網商品頁，搭配 UTM 參數追蹤轉換。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 5000);
  } else if (msg.includes('再行銷受眾')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '🎯 <strong>再行銷受眾設定建議</strong><br><br><strong>受眾條件（Meta Ads Manager）：</strong><br>・行為事件：<code>ViewContent</code>（商品頁停留 &gt; 15 秒）<br>・時間窗口：過去 <strong>7 天</strong>內瀏覽但未購買<br>・排除條件：過去 30 天內已購買者<br><br><strong>廣告素材建議：</strong><br>・動態商品廣告（DPA）自動帶入瀏覽商品<br>・文案：「還在考慮嗎？限時優惠只剩 2 天 ⏳」<br>・預算：日預算 NT$500，CPM 目標 ≤ NT$180',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 5000);
  } else if (msg.includes('穿搭指南')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '📝 <strong>戶外穿搭指南 Email 內容草稿</strong><br><br><strong>主旨：</strong>這個秋冬，跟著 Hurricane 這樣穿出門 🍂<br><br><strong>Section 1 — 日系機能風</strong><br>Hurricane Trailsetter Mid + 寬版工作褲 + 薄羽絨背心，輕量機能感十足。<br><br><strong>Section 2 — 城市健走風</strong><br>Hurricane Trailsetter Sandal + 修身長褲 + 連帽外套，從捷運到步道無縫接軌。<br><br><strong>Section 3 — 週末山林風</strong><br>Hurricane Trailsetter Mid + 快乾長褲 + 防風外層，應對台灣 2000m 以下山徑全制霸。<br><br>每段附產品連結與 UTM 追蹤參數。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 5000);
  } else if (msg.includes('棄單 SMS')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '📱 <strong>棄單 SMS 提醒文案（2 條）</strong><br><br><strong>版本 A（優惠導向，70 字以內）：</strong><br>「Hurricane Trailsetter 購物車提醒：你的 AW26 鞋款還在等你！現在結帳享 85 折，限今日。點此完成購買：[短網址]」<br><br><strong>版本 B（稀缺感導向，70 字以內）：</strong><br>「你選的 Hurricane Trailsetter 剩最後幾雙，明天可能就沒了！點此立即結帳：[短網址]  回覆 TD 退訂」<br><br><strong>建議發送時間：</strong>棄單後 1 小時，若未購買再於 24 小時後發版本 B。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 5000);
  } else if (msg.includes('忠誠計畫')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex(m => m.id === thinkingId);
      if (idx !== -1) conv1Msgs.value.splice(idx, 1);
      conv1Msgs.value.push({
        id: 'ai-reply-' + Date.now(),
        finishResponse: true,
        msg: '⭐ <strong>購後忠誠計畫建議</strong><br><br><strong>積分規則：</strong><br>・每消費 NT$1 = 1 點<br>・開箱影片投稿 = 500 點<br>・成功推薦好友 = 300 點（雙方各得）<br><br><strong>會員等級（3 級）：</strong><br>・🥾 <strong>Trail Starter</strong>（0–2,999 點）：生日禮 + 新品早鳥 5% off<br>・🏔️ <strong>Trail Explorer</strong>（3,000–9,999 點）：免運 + 季末特賣 10% off<br>・🦅 <strong>Trail Master</strong>（10,000 點以上）：專屬客服 + 限定商品優先購 + 15% off<br><br><strong>升級通知：</strong>LINE 推播 + Email 雙管道，搭配升級限定優惠碼刺激下一單。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 5000);
  } else if (msg.includes('日文')) {
    const thinkingId = 'thinking-' + Date.now()
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES })
    nextTick(() => AiAgentChatListScrollTo('ASC'))
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex((m: any) => m.id === thinkingId)
      if (idx !== -1) conv1Msgs.value.splice(idx, 1)
      conv1Msgs.value.push({ id: 'id_4b', isProcessing: true, msg: '收到！正在啟動日文翻譯引擎，針對品牌術語與敬語表達進行優化處理，請稍候⋯' })
      nextTick(() => AiAgentChatListScrollTo('ASC'))
    }, 900)
    setTimeout(() => {
      conv1Msgs.value.push({
        id: 'id_7',
        finishResponse: true,
        cardType: 'translationComplete',
        msg: '🇯🇵 日文版翻譯完成！同樣處理了 <strong>143 個欄位</strong>，針對日本市場慣用的敬語表達進行了調整與優化，建議確認品牌術語的語氣風格是否符合需求後即可使用。📋 <strong>AW26 Product Descriptions_日本語.xlsx</strong> 已加入左側畫布，請點開查閱。',
        files: [{ name: 'AW26 Product Descriptions_日本語.xlsx', type: 'XLSX', size: 2901234 }],
      })
      nextTick(() => {
        AiAgentChatListScrollTo('ASC')
        pushConv1NextStepPrompt('翻譯完成')
      })
      const jaTemplate = aiviewerStore.INITIAL_BLOCKS.find((b: any) => b.id === 'init-excel-aw26-trans')
      if (jaTemplate) {
        const jaBlock = {
          ...jaTemplate,
          id: 'conv1-excel-ja-' + Date.now(),
          blockName: 'AW26 Product Descriptions_日本語.xlsx',
          x: jaTemplate.x + jaTemplate.width + 40,
          data: {
            ...jaTemplate.data,
            data: { fileUrl: `${import.meta.env.BASE_URL}AW26%20Product%20Descriptions_%E6%97%A5%E6%96%87.xlsx` }
          }
        }
        aiViewerBlocks.value.push(jaBlock)
        panToTarget.value = { x: jaBlock.x, y: jaBlock.y, width: jaBlock.width, height: jaBlock.height }
      }
    }, 3200)
  } else if (msg.includes('Hurricane') || msg.includes('鞋款') || msg.includes('銷售數據')) {
    const thinkingId = 'thinking-' + Date.now()
    conv1Msgs.value.push({ id: thinkingId, isThinking: true, thinkingSteps: MOCK_THINKING_STEPS, sources: MOCK_SOURCES })
    nextTick(() => AiAgentChatListScrollTo('ASC'))
    setTimeout(() => {
      const idx = conv1Msgs.value.findIndex((m: any) => m.id === thinkingId)
      if (idx !== -1) conv1Msgs.value.splice(idx, 1)
      conv1Msgs.value.push({ id: 'id_8b', msg: '正在從商品文件中提取 Hurricane Trailsetter 系列資料，並比對歷年銷售數據⋯' })
      nextTick(() => AiAgentChatListScrollTo('ASC'))
    }, 900)
    setTimeout(() => {
      conv1Msgs.value.push({
        id: 'id_9',
        finishResponse: true,
        cardType: 'translationComplete',
        msg: '📊 找到了！Hurricane Trailsetter 共 <strong>4 個鞋款</strong>（Sandal 男女 + Mid 男女），2022 年起連續三年成長 20%+。<br>完整數據與 2026 預測報告已加到右側畫布，點一下就能展開看。',
        files: [{ name: 'hurricane_trailsetter_sales_report.html', type: 'HTML', size: 6800 }],
      })
      try { addReportBlock('/justagent/hurricane_trailsetter_sales_report.html', 'hurricane_trailsetter_sales_report.html') } catch (e) { /* ignore */ }
      nextTick(() => AiAgentChatListScrollTo('ASC'))
      pushConv1NextStepPrompt('Hurricane')
    }, 3200)
  }
}

function syncJourneyToIframe() {
  const rawJourneys = JSON.parse(JSON.stringify(journeyStore.journeys))
  const marketingJourneys = rawJourneys.filter((j: any) => j.journeyType === 'marketing')
  if (marketingJourneys.length > 0) {
    document.querySelectorAll<HTMLIFrameElement>('iframe[src*="journey_dashboard"]').forEach(iframe => {
      iframe.contentWindow?.postMessage(
        { type: 'journey-state-sync', journeys: marketingJourneys }, '*'
      )
    })
  }
  const birthdayJourneys = rawJourneys.filter((j: any) => j.journeyType === 'birthday')
  console.log('[syncJourney] birthday count:', birthdayJourneys.length)
  const bdIframes = document.querySelectorAll<HTMLIFrameElement>('iframe[src*="birthday_journey"]')
  console.log('[syncJourney] birthday iframes found:', bdIframes.length, Array.from(bdIframes).map(f => f.src))
  if (birthdayJourneys.length > 0) {
    bdIframes.forEach(iframe => {
      iframe.contentWindow?.postMessage(
        { type: 'birthday-journey-state-sync', journeys: birthdayJourneys }, '*'
      )
    })
  }
}

const JOURNEY_SCHEDULES = {
  marketing: [
    { key: 'D0',  runningDelay: 500,   doneDelay: 2000  },
    { key: 'D1',  runningDelay: 2500,  doneDelay: 5000  },
    { key: 'D3',  runningDelay: 5500,  doneDelay: 8500  },
    { key: 'D7',  runningDelay: 9000,  doneDelay: 11500 },
    { key: 'D14', runningDelay: 12000, doneDelay: 15000 },
    { key: 'D30', runningDelay: 15500, doneDelay: 18000 },
  ],
  birthday: [
    { key: 'PRE7', runningDelay: 500,   doneDelay: 2000  },
    { key: 'D0',   runningDelay: 2500,  doneDelay: 5000  },
    { key: 'D1',   runningDelay: 5500,  doneDelay: 8000  },
    { key: 'D7',   runningDelay: 8500,  doneDelay: 11000 },
    { key: 'D30',  runningDelay: 11500, doneDelay: 14000 },
  ],
} as const

function startJourneyExecution(journeyId: string, type: 'marketing' | 'birthday' = 'marketing') {
  for (const { key, runningDelay, doneDelay } of JOURNEY_SCHEDULES[type]) {
    setTimeout(() => { journeyStore.setNodeRunning(journeyId, key); syncJourneyToIframe() }, runningDelay)
    setTimeout(() => { journeyStore.setNodeDone(journeyId, key);    syncJourneyToIframe() }, doneDelay)
  }
}

function handleHurricaneChipMsg(event: MessageEvent) {
  if (event.data?.type !== 'hurricane-chip-click') return;
  const msg = event.data.msg as string;
  if (!msg) return;
  conv1Msgs.value.push({ id: 'chip-user-' + Date.now(), forUser: true, msg });
  nextTick(() => AiAgentChatListScrollTo('ASC'));
  processConv1Msg(msg);
}

function handleJourneyStateRequest(event: MessageEvent) {
  if (event.data?.type !== 'journey-state-request') return
  syncJourneyToIframe()
}

const DEMO_NAMES = [
  '林小明','陳美玲','黃建國','李志強','王怡君','張家豪','吳雅婷','劉俊宏',
  '蔡欣怡','楊博文','鄭淑芬','許志偉','謝佳音','洪宇軒','曾雅惠','廖明哲',
  '賴美慧','簡志豪','柯欣樺','邱建志','周淑珍','游俊傑','葉雅琳','蘇文傑',
  '呂美君','丁志遠','方淑慧','江建宏','石雅萍','何志偉','彭冠廷','龔佳穎',
  '馬俊毅','孫淑芬','陸雨澤','韓思妤','沈冠宇','傅雅如','盧俊豪','鐘宜庭',
  '田承翰','余芷涵','唐浩然','范子晴','姚承恩','夏詩涵','錢志豪','翁美君',
  '戴宗翰','顏佳蓉','尤承翰','巫雅甄','雷俊傑','毛淑芬','歐陽欣','司徒豪',
  '上官婷','諸葛偉','慕容芸','東方凱','獨孤逸','令狐珊','南宮彤','段志遠',
]

function startJourneyBatch(type: 'marketing' | 'birthday') {
  journeyStore.isJcdCollapsed = false
  const BATCH = 64
  const STAGGER = 120 // ms between each person's journey offset
  for (let i = 0; i < BATCH; i++) {
    _journeyUserCount++
    const name = DEMO_NAMES[(_journeyUserCount - 1) % DEMO_NAMES.length]
    const journeyId = journeyStore.createJourney(name, type)
    const offset = i * STAGGER
    for (const { key, runningDelay, doneDelay } of JOURNEY_SCHEDULES[type]) {
      setTimeout(() => { journeyStore.setNodeRunning(journeyId, key); syncJourneyToIframe() }, runningDelay + offset)
      setTimeout(() => { journeyStore.setNodeDone(journeyId, key);    syncJourneyToIframe() }, doneDelay + offset)
    }
  }
  syncJourneyToIframe()
}

function handleJourneyStartRequest(event: MessageEvent) {
  if (event.data?.type !== 'journey-start-request') return
  const jType = event.data.journeyType === 'birthday' ? 'birthday' : 'marketing'
  journeyStarted.value = true
  const selector = jType === 'birthday' ? 'iframe[src*="birthday_journey"]' : 'iframe[src*="journey_dashboard"]'
  document.querySelectorAll<HTMLIFrameElement>(selector).forEach(iframe => {
    iframe.contentWindow?.postMessage({ type: 'journey-started' }, '*')
  })
  startJourneyBatch(jType)
}

function handleBirthdayStateRequest(event: MessageEvent) {
  if (event.data?.type !== 'birthday-journey-state-request') return
  syncJourneyToIframe()
}

function handleJourneyModifyRequest(event: MessageEvent) {
  if (event.data?.type !== 'journey-modify-request') return;
  showJourneyModifyPill.value = true;
  nextTick(() => userInputRef.value?.focus());
}

const _journeySyncStamp = computed(() => {
  const j = journeyStore.journeys
  const mDone = j.filter(x => x.journeyType === 'marketing' && x.status === 'done').length
  const bDone = j.filter(x => x.journeyType === 'birthday' && x.status === 'done').length
  const mRun = j.filter(x => x.journeyType === 'marketing').reduce((s, jj) => s + jj.nodes.filter(n => n.status !== 'pending').length, 0)
  const bRun = j.filter(x => x.journeyType === 'birthday').reduce((s, jj) => s + jj.nodes.filter(n => n.status !== 'pending').length, 0)
  return `${j.length}:${mDone}:${mRun}:${bDone}:${bRun}`
})
watch(_journeySyncStamp, () => syncJourneyToIframe())

onMounted(() => {
  window.addEventListener('message', handleHurricaneChipMsg)
  window.addEventListener('message', handleJourneyStateRequest)
  window.addEventListener('message', handleJourneyStartRequest)
  window.addEventListener('message', handleJourneyModifyRequest)
  window.addEventListener('message', handleBirthdayStateRequest)
})

onUnmounted(() => {
  window.removeEventListener('message', handleHurricaneChipMsg)
  window.removeEventListener('message', handleJourneyStateRequest)
  window.removeEventListener('message', handleJourneyStartRequest)
  window.removeEventListener('message', handleJourneyModifyRequest)
  window.removeEventListener('message', handleBirthdayStateRequest)
  if (analyticsChart) { analyticsChart.destroy(); analyticsChart = null; }
})

// -------- Conversation 2 流程 --------
const DEMO_IMG = 'https://d12ro2iv4p7r0b.cloudfront.net/media/catalog/product/u/g/ug1183390sndc-1.jpg';
const DEMO_DESC = '淺褐色毛絨室內拖鞋，動物臉設計，具有柔潤立體造型和寬闊防滑底，前頭設計，毛茸茸的感覺適合屋家穿著。';
const DEMO_NAME = "Women's Elea Pooch Slip-on";

let conv2IdCounter = 2;
const conv2Mode = ref('');
const conv2InputLocked = ref(false); // 快速按鈕觸發後鎖定輸入框
// 直接生成報告懸浮面板
const conv2DirectFpVisible = ref(false);
const conv2ShowDirectPill = ref(false);
const conv2DirectFpStep = ref(1); // 1:方法選擇 2:輸入貨號 3:競品網址
const conv2DirectMethod = ref('');
const CONV2_DEMO_SKU = 'UG1166915BLK@2025產品總表-Q3';
const conv2DirectSkuInput = ref('');
function conv2FillDemoSku() { if (!conv2DirectSkuInput.value) conv2DirectSkuInput.value = CONV2_DEMO_SKU; }
const conv2SkuParts = computed(() => {
  const parts: { text: string; isRef: boolean }[] = [];
  const raw = conv2DirectSkuInput.value;
  const regex = /@[^\s@]+/g;
  let lastIndex = 0, match;
  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) parts.push({ text: raw.slice(lastIndex, match.index), isRef: false });
    parts.push({ text: match[0], isRef: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < raw.length) parts.push({ text: raw.slice(lastIndex), isRef: false });
  return parts;
});
const CONV2_DIRECT_URL_DEFAULT = 'https://www.zara.com/tw/\nhttps://www.paidal.com.tw/\nhttps://www.zivmode.com/\nhttps://www.parkcat.com.tw/\nhttps://www.parkcat.com.tw/products/aw26-slipper';
const conv2DirectUrlInput = ref('');
function conv2FillDemoUrls() { if (!conv2DirectUrlInput.value) conv2DirectUrlInput.value = CONV2_DIRECT_URL_DEFAULT; }

// ── 懸浮面板 state ──
const conv2UploadFpVisible = ref(false);
const conv2ShowUploadPill = ref(false); // pill 是否顯示（獨立於 panel 展開狀態）
const conv2UploadImgLoaded = ref(false);
const conv2UploadDesc = ref('');

function conv2LoadDemoImg() { conv2UploadImgLoaded.value = true; }
function conv2FillDemoDesc() { if (!conv2UploadDesc.value) conv2UploadDesc.value = DEMO_DESC; }

const conv2StepFpVisible = ref(false);
const conv2ShowStepPill = ref(false); // pill 是否顯示
const conv2CurStep = ref<number | string>(1);

// fp 互動模式中（有 pill 顯示，或流程已啟動）：完全隱藏原始輸入列
const conv2FpActive = computed(() =>
  currentConversationId.value === 'conv2' && (conv2ShowUploadPill.value || conv2ShowStepPill.value || conv2ShowDirectPill.value || conv2InputLocked.value)
);
// 輸入框整體隱藏：conv2 浮層啟用 OR 旅程修改需求浮層啟用
const inputAreaHidden = computed(() => conv2FpActive.value || showJourneyModifyPill.value || conv1TranslPanelVisible.value);
const conv1TranslConfirmed = computed(() => {
  const record = conv1Msgs.value.find((m: any) => m.id === 'id_3');
  return !!(record?.confirmed && !record?.translationStarted);
});

const conv1TranslPanelVisible = ref(false);
const conv1TranslStep = ref(1);
const conv1TranslFile = ref('');
const conv1TranslRange = ref('');
const conv1TranslColumns = ref('');
const conv1TranslLang = ref('繁體中文');

function conv1OpenTranslPanel() {
  conv1TranslStep.value = 1
  conv1TranslFile.value = ''
  conv1TranslRange.value = ''
  conv1TranslColumns.value = ''
  conv1TranslLang.value = '繁體中文'
  conv1TranslPanelVisible.value = true
}

function conv1TranslSubmit() {
  conv1TranslPanelVisible.value = false
  const record = conv1Msgs.value.find((m: any) => m.id === 'id_3')
  if (record) {
    record.confirmed = true
    record.file = conv1TranslFile.value
    record.range = conv1TranslRange.value
    record.columns = conv1TranslColumns.value
    record.lang = conv1TranslLang.value
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'))
}

function conv1StartTranslation() {
  const record = conv1Msgs.value.find((m: any) => m.id === 'id_3')
  if (!record || record.translationStarted) return
  record.translationStarted = true
  const lang = record.lang || conv1TranslLang.value

  const thinkingId = 'thinking-' + Date.now()
  conv1Msgs.value.push({ id: thinkingId, isThinking: true })
  nextTick(() => AiAgentChatListScrollTo('ASC'))

  setTimeout(() => {
    const idx = conv1Msgs.value.findIndex((m: any) => m.id === thinkingId)
    if (idx !== -1) conv1Msgs.value.splice(idx, 1)
    conv1Msgs.value.push({ id: 'id_4', isProcessing: true, msg: '收到！✅ 檔案讀取成功，正在開始處理。<br><br>將依照以下順序進行：<br>① 載入產品文件翻譯的專業規範<br>② 逐欄比對商品術語與品牌用語<br>③ 保留原始格式並輸出對齊版本<br><br>請稍候，即將為您完成 ⚡' })
    nextTick(() => AiAgentChatListScrollTo('ASC'))
  }, 900)

  setTimeout(() => {
    conv1Msgs.value.push({
      id: 'id_5',
      finishResponse: true,
      cardType: 'translationComplete',
      msg: `✅ 翻譯完成！此次共處理 <strong>143 個產品欄位</strong>，品牌術語已保留原文並附上對照表，另外也為您標出了 <strong>12 個商標詞</strong>，整理在 .txt 檔中方便核對。<br><br>📋 <strong>AW26 Product Descriptions_${lang}.xlsx</strong> 已加入左側畫布，隨時可點開查閱。`,
      files: [
        { name: `AW26 Product Descriptions_${lang}.xlsx`, type: 'XLSX', size: 2834016 },
        { name: 'AW26 Product Descriptions_trade_mark.txt', type: 'TXT', size: 133 },
      ],
    })
    const blocks = aiviewerStore.INITIAL_BLOCKS.map((b: any) =>
      b.id === 'init-excel-aw26-trans'
        ? {
            ...b,
            id: 'conv1-excel-trans-' + Date.now(),
            blockName: `AW26 Product Descriptions_${lang}.xlsx`,
            data: {
              ...b.data,
              data: {
                fileUrl: lang === '日文'
                  ? `${import.meta.env.BASE_URL}AW26%20Product%20Descriptions_%E6%97%A5%E6%96%87.xlsx`
                  : b.data.data.fileUrl
              }
            }
          }
        : { ...b }
    )
    aiViewerBlocks.value = blocks
    const excelBlock = blocks.find((b: any) => b.id?.startsWith('conv1-excel-trans-'))
    if (excelBlock) panToTarget.value = { x: excelBlock.x, y: excelBlock.y, width: excelBlock.width, height: excelBlock.height }
    nextTick(() => AiAgentChatListScrollTo('ASC'))
  }, 3200)

  setTimeout(() => {
    conv1Msgs.value.push({
      id: 'id_5b',
      finishResponse: true,
      msg: '請問接下來還有什麼可以為您服務的嗎？',
    })
    nextTick(() => AiAgentChatListScrollTo('ASC'))
  }, 3600)
}

const conv2StepTitleMap: Record<string, string> = {
  '1': '商品資訊確認', '2': '商品類別確認',
  '3': '選擇分析特徵', '4': '設定搜索範圍',
  '45': '確認設定內容', '5': '確認競品',
};
const conv2StepDefs = [
  { key: 1, label: '1' }, { key: 2, label: '2' }, { key: 3, label: '3' },
  { key: 4, label: '4' }, { key: '45', label: '✓' }, { key: 5, label: '5' },
];
const conv2StepOrder: Array<number | string> = [1, 2, 3, 4, '45', 5];
function isConv2StepDone(key: number | string) {
  const ci = conv2StepOrder.indexOf(conv2CurStep.value);
  const ki = conv2StepOrder.indexOf(key);
  return ki < ci;
}
function conv2GoStep(n: number | string) {
  if (n === 1) conv2S2Err.value = '';
  conv2CurStep.value = n;
}
function conv2GoStep1to2() {
  if (!conv2S2Name.value.trim() || !conv2S2Desc.value.trim()) {
    conv2S2Err.value = '商品名稱與描述為必填';
    return;
  }
  conv2S2Err.value = '';
  conv2GoStep(2);
}

// Step 1
const conv2S1Cat = ref('室內拖鞋');
const conv2S1Custom = ref('');
// Step 2保暖厚底毛絨拖鞋
const conv2S1ImgLoaded = ref(false);
const conv2S1ShowSkuInput = ref(false);
const conv2S1SkuInput = ref('');
const conv2S2Brand = ref('');
const conv2S2Price = ref('');
const conv2S2Name = ref('');
const conv2S2Desc = ref('');
const conv2S2Err = ref('');

function conv2S1ApplySku() {
  if (!conv2S1SkuInput.value.trim()) return;
  conv2S1ImgLoaded.value = true;
  conv2S2Brand.value = 'UGG';
  conv2S2Price.value = 'NT$5,980';
  conv2S2Name.value = "Women's Elea Pooch Slip-on";
  conv2S2Desc.value = DEMO_DESC;
  conv2S1ShowSkuInput.value = false;
  conv2S1SkuInput.value = '';
}
// Step 3
const conv2S3Err = ref('');
const conv2S3Features = ref([
  { key: 'material', title: '材質與觸感',   desc: '毛絨材質與質感資料', sel: true },
  { key: 'design',   title: '設計風格',     desc: '動物臉設計、顏色、外觀吸引度', sel: true },
  { key: 'slip',     title: '防滑與耐用性', desc: '適腳設計與使用壽命', sel: false },
  { key: 'warmth',   title: '保暖功能',     desc: '內絨毛與適合季節', sel: false },
  { key: 'price',    title: '性價比',       desc: '定價相對材質功能價值', sel: false },
]);
function conv2TogFeat(f: any) {
  const selCount = conv2S3Features.value.filter(x => x.sel).length;
  if (f.sel && selCount <= 1) { conv2S3Err.value = '至少選 1 個特徵'; return; }
  f.sel = !f.sel;
  conv2S3Err.value = '';
}
// Step 4
const conv2S4Scope = ref('tw');
const conv2S4Domain = ref('');
// Step 5
const conv2S5Err = ref('');
const conv2S5SelComps = ref(new Set<number>());
const conv2HoverComp = ref<any>(null);
const conv2S5Comps = [
  { id: 1,  icon: '🐾', name: '日光手感 日系泰迪毛絨小狗',  price: 'NT$590', img: 'https://image-cdn-flare.qdm.cloud/q66fb53643c070/image/data/2020/10/09/b25b12f8d33e814f3428a2a76c2445da.jpg' },
  { id: 2,  icon: '🐱', name: 'Paidal 野生喵喵怪拖鞋',    price: 'NT$599', img: 'https://img.shoplineapp.com/media/image_clips/6981652da884d3037c5ae27c/original.jpg?1770087725=&owner_id=5866099ed4e395eaf3004ca1' },
  { id: 3,  icon: '🌾', name: '貓樂園 毛絨貓掌保暖拖鞋',      price: 'NT$299', img: 'https://img.cloudimg.in/uploads/shops/3414/products/d9/d963f43791b45f9a9d3f6219f524cc88.jpg' },
  { id: 4,  icon: '🦌', name: 'ZARA CAPYFUN 室內拖鞋',    price: 'NT$890', img: 'https://static.zara.net/assets/public/3a4c/ad65/ad5a4e888669/55073c1abae9/12712730700-e4/12712730700-e4.jpg?ts=1768393349882&w=750' },
  { id: 5,  icon: '🌻', name: '樂天 動物造型厚底加絨',       price: 'NT$390',   img: 'https://tshop.r10s.com/c96/d83/8f84/1b99/112f/3137/7a5b/4fc8648d41da2896df654d.jpg?_ex=1000x1000' },
  { id: 6,  icon: '🏠', name: 'Sugar Jardin 保暖毛絨小熊',  price: 'NT$480', img: 'https://cdn-next.cybassets.com/s/files/30768/ckeditor/pictures/content_81c2afee-4998-4003-a3ce-514fcf40e684.jpg' },
  { id: 7,  icon: '🦦', name: 'Zivmode 刺繡狗狗毛絨拖鞋',     price: 'NT$520', img: 'https://cdn-thumbnail.mamilove.com.tw/8SubydiokodEktTI_7bdC9ifhaQ=/0x0/https://images.mamilove.com.tw/origin/setting/1920/1920-c180f3a19d-1668755069.jpg' },
  { id: 8,  icon: '🐻', name: 'OZKIZ 毛絨防滑萌人拖鞋',   price: 'NT$350', img: 'https://cdn-thumbnail.mamilove.com.tw/Q5hl6_Qu-Ccg2hSMHLKs3lazgr0=/1000x0/https://images.mamilove.com.tw/items/b5ffb1ae-968a-11ef-9ed1-ee2068b1e1c2.jpg' },
  { id: 9,  icon: '🐼', name: 'iSlippers 包頭毛絨拖鞋',   price: 'NT$420', img: 'https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/sd_image/10ef/e630620cbeccec073677c27ed124fccdca08951c3084fd363d6b845c4b9c.png' },
  { id: 10, icon: '🐨', name: '黃阿瑪 萌臉系列毛絨拖鞋',  price: 'NT$580', img: 'https://shoplineimg.com/5cf4a5bd4956340001e08e0d/684bdf69a4b8ed001106690f/800x.jpg?' },
  { id: 11, icon: '🐯', name: 'WUWU 可愛動物厚底拖鞋',    price: 'NT$399', img: 'https://thumbnail.coupangcdn.com/thumbnails/remote/492x492ex/image/retail/images/2024/11/06/10/3/8edc1b3e-640e-4275-9785-dc5b6568d264.jpg' },
  { id: 12, icon: '🦆', name: 'WUWU 可愛動物厚底拖鞋',  price: 'NT$280', img: 'https://media.karousell.com/media/photos/products/2024/11/15/___5cm______d5477_1731708841_ff66f2bc_progressive.jpg' },
];
function conv2TogComp(comp: any) {
  const s = new Set(conv2S5SelComps.value);
  if (s.has(comp.id)) { s.delete(comp.id); }
  else {
    if (s.size >= 5) { conv2S5Err.value = '最多選 5 個競品'; return; }
    s.add(comp.id);
  }
  conv2S5Err.value = '';
  conv2S5SelComps.value = s;
}
function conv2ResetComps() { conv2S5SelComps.value = new Set(); conv2S5Err.value = ''; }
function conv2DoneComps() {
  if (conv2S5SelComps.value.size < 1) return;
  const names = [...conv2S5SelComps.value].map(id => conv2S5Comps.find(c => c.id === id)?.name ?? '').filter(Boolean);
  conv2StepFpVisible.value = false;
  conv2ShowStepPill.value = false;
  c2Push({ forUser: true, msg: `確認以上 ${names.length} 個競品，請生成分析報告。` });
  c2Push({ msg: `已確認 ${names.length} 個競品，開始生成報告⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--done">ProductExtractor 爬取競品頁面資料</div>
  <div class="conv2-ss conv2-ss--active">FeatureAnalyzer 特徵比對與評分中</div>
  <div class="conv2-ss conv2-ss--wait">ReportGenerator 產出 HTML 報告</div>
</div>` });
  c2Scroll();
  setTimeout(() => { conv2ShowReport(); c2Scroll(); }, 2200);
}
function conv2StartSearch() {
  conv2StepFpVisible.value = false;
  c2Push({ forUser: true, msg: '確認無誤，開始搜索。' });
  c2Push({ msg: `設定已確認，DeepAgent 開始深度搜索⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--done">SearchStrategist 產生深度搜索任務</div>
  <div class="conv2-ss conv2-ss--done">GoogleSearchEngine 搜索並過濾關鍵字</div>
  <div class="conv2-ss conv2-ss--active">ImageSimilarityFilter 圖片相似度篩選中</div>
  <div class="conv2-ss conv2-ss--wait">篩選完成，產出備選競品清單</div>
</div>` });
  c2Scroll();
  setTimeout(() => {
    c2Push({ msg: `✅ 搜索完成，找到 <strong>12 個備選競品</strong>，請在下方面板確認要納入報告的競品。` });
    c2Scroll();
    conv2CurStep.value = 5;
    conv2S5SelComps.value = new Set([1, 2, 3, 4]);
    conv2StepFpVisible.value = true;
  }, 1800);
}

const CONV2_MODE_CARD_MSG = `你好！請選擇想要的分析模式：
<div class="ai-mode-card">
  <div class="ai-mode-item" data-action="select-mode" data-value="init">
    <div class="ai-mode-icon">🔍</div>
    <div class="ai-mode-info">
      <div class="ai-mode-title">初步分析</div>
      <div class="ai-mode-desc">快速掌握市場上的直接與功能競品</div>
    </div>
    <i class="material-symbols-outlined ai-mode-arrow">chevron_right</i>
  </div>
  <div class="ai-mode-item" data-action="select-mode" data-value="deep">
    <div class="ai-mode-icon">🧠</div>
    <div class="ai-mode-info">
      <div class="ai-mode-title">深度分析</div>
      <div class="ai-mode-desc">DeepAgent 深度搜尋並產出完整報告</div>
    </div>
    <i class="material-symbols-outlined ai-mode-arrow">chevron_right</i>
  </div>
  <div class="ai-mode-item" data-action="select-mode" data-value="direct">
    <div class="ai-mode-icon">⚡</div>
    <div class="ai-mode-info">
      <div class="ai-mode-title">直接生成報告</div>
      <div class="ai-mode-desc">提供競品網址，直接輸出分析報告</div>
    </div>
    <i class="material-symbols-outlined ai-mode-arrow">chevron_right</i>
  </div>
</div>`;

const conv2Msgs = ref<any[]>([]);

function conv2InitFlow() {
  if (conv2Msgs.value.length > 0) return;
  conv2InputLocked.value = true;
  conv2Title.value = '商品競品分析';
  c2Push({ forUser: true, msg: '商品競品分析' });
  setTimeout(() => {
    c2Push({ msg: CONV2_MODE_CARD_MSG });
    c2Scroll();
  }, 300);
}

function c2Push(msg: any) {
  conv2Msgs.value.push({ id: `c2_${conv2IdCounter++}`, ...msg });
}
function c2Scroll() {
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}

function handleChatAreaClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const el = target.closest('[data-action]') as HTMLElement | null;
  if (!el) return;
  e.stopPropagation();
  const action = el.dataset.action!;
  const value = el.dataset.value ?? '';

  // conv1 下一步快速按鈕
  if (action === 'conv1-next-step') {
    const msg = value;
    conv1Msgs.value.push({ id: 'btn-user-' + Date.now(), forUser: true, msg });
    nextTick(() => AiAgentChatListScrollTo('ASC'));
    processConv1Msg(msg);
    return;
  }

  if (action === 'conv1-open-transl-panel') {
    conv1OpenTranslPanel()
    return
  }

  if (action === 'conv1-start-translation') {
    conv1StartTranslation()
    return
  }

  // conv4 是否建立 Skill 快速按鈕
  if (action === 'conv4-build-skill') {
    conv4BuildSkill();
    return;
  }
  if (action === 'conv4-skip-skill') {
    conv4SkipSkill();
    return;
  }

  if (currentConversationId.value !== 'conv2') return;

  // more-button 開關：直接操作 DOM，不走 reactive 流程
  if (action === 'toggle-file-more') {
    const menu = el.closest('.file-more-wrap')?.querySelector('.more-options-box');
    menu?.classList.toggle('show');
    return;
  }
  if (action === 'file-menu') {
    el.closest('.file-more-wrap')?.querySelector('.more-options-box')?.classList.remove('show');
    return;
  }

  conv2Dispatch(action, value);
}

function conv2Dispatch(action: string, value: string) {
  switch (action) {
    case 'select-mode':    conv2SelectMode(value); break;
    case 'start-analysis': conv2StartAnalysis(); break;
    case 'confirm-product': conv2ConfirmProduct(); break;
    case 'submit-urls':    conv2SubmitUrls(); break;
    case 'init-to-deep':   conv2InitToDeep(); break;
    case 'init-to-direct': conv2InitToDirect(); break;
  }
}

function conv2SelectMode(mode: string) {
  if (conv2Msgs.value.length > 2) return;
  conv2Mode.value = mode;
  // lock mode card visually (index 1 is the AI mode card message)
  conv2Msgs.value[1] = {
    ...conv2Msgs.value[1],
    msg: CONV2_MODE_CARD_MSG.replace('class="ai-mode-card"', 'class="ai-mode-card ai-mode-card--locked"'),
  };
  const labels: Record<string, string> = { init: '初步分析', deep: '深度分析', direct: '直接生成報告' };
  c2Push({ forUser: true, msg: labels[mode] });

  if (mode === 'direct') {
    setTimeout(() => {
      c2Push({ msg: '好的！請在下方面板填寫商品與競品資訊。' });
      c2Scroll();
      conv2DirectFpStep.value = 1;
      conv2DirectFpVisible.value = true;
      conv2ShowDirectPill.value = true;
    }, 400);
    return;
  }

  if (mode === 'deep') {
    setTimeout(() => {
      c2Push({ msg: '好的！請在下方面板完成深度分析設定。' });
      c2Scroll();
      conv2CurStep.value = 1;
      conv2S1ShowSkuInput.value = false;
      conv2S1SkuInput.value = '';
      conv2StepFpVisible.value = true;
      conv2ShowStepPill.value = true;
    }, 400);
    return;
  }

  // init: 開啟上傳懸浮面板
  setTimeout(() => {
    c2Push({ msg: `需要你提供一些商品的圖片或詳細文字描述，才能進行${labels[mode]}，請在下方面板上傳商品資訊。` });
    c2Scroll();
    conv2UploadFpVisible.value = true;
    conv2ShowUploadPill.value = true;
  }, 400);
}

function conv2StartAnalysis() {
  conv2UploadFpVisible.value = false;
  conv2ShowUploadPill.value = false;
  conv2Title.value = "競品分析 · UGG Women's Elea Pooch Slip-on 冬季室內拖鞋";
  c2Push({ forUser: true, msg: `<div style="display:flex;align-items:center;gap:8px"><img style="width:44px;height:44px;border-radius:6px;object-fit:contain;border:1px solid var(--color-border)" src="${DEMO_IMG}"/><span>${conv2UploadDesc.value}</span></div>` });
  c2Push({ isThinking: true, msg: 'AI 正在思考中...' });
  c2Scroll();
  setTimeout(() => {
    const idx = conv2Msgs.value.findIndex((m) => m.isThinking);
    if (idx !== -1) conv2Msgs.value.splice(idx, 1);
    c2Push({ msg: `已識別為<strong>毛絨動物臉室內拖鞋</strong>，捕捉到以下特徵：` });
    const btnLabel = conv2Mode.value === 'deep' ? '確認並開始深度分析 →' : '確認並產出初步分析報告 →';
    c2Push({ msg: `<div class="conv2-product-card">
  <div class="conv2-pc-head">
    <img class="conv2-pc-thumb" src="${DEMO_IMG}"/>
    <div>
      <div class="conv2-pc-sku">圖片分析結果</div>
      <div class="conv2-pc-name">毛絨動物臉室內拖鞋</div>
      <div class="conv2-pc-brand">淺褐色 · 柔潤立體 · 前頭設計</div>
    </div>
  </div>
  <div class="conv2-pc-tags">
    <span class="conv2-tag">毛絨材質</span><span class="conv2-tag">動物臉</span><span class="conv2-tag">柔潤立體</span><span class="conv2-tag">前頭設計</span><span class="conv2-tag">防滑底</span><span class="conv2-tag">保暖</span>
  </div>
  <button class="conv2-action-btn" data-action="confirm-product" style="margin-top:10px">${btnLabel}</button>
</div>` });
    c2Scroll();
  }, 1200);
}

function conv2ConfirmProduct() {
  if (conv2Mode.value === 'init') {
    c2Push({ msg: '正在產出初步分析報告⋯' });
    c2Scroll();
    setTimeout(() => {
      const extIco = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3m0 0v3m0-3L5.5 6.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      c2Push({ msg: `初步分析完成，共找到 <strong>5 個直接競品</strong>、<strong>1 個功能競品</strong>：<div class="conv2-init-list">
  <div class="conv2-comp-item conv2-comp-item--rank">
    <span class="conv2-comp-rank">1</span>
    <div class="conv2-comp-body"><div class="conv2-comp-brand-lbl">ZARA</div><div class="conv2-comp-title">CAPYFUN 室內拖鞋 - 粉色</div><div class="conv2-comp-feat">毛絨材質・動物臉設計・室內防滑底・NT$890</div></div>
    <a class="conv2-comp-ext" href="https://www.zara.com/tw/" target="_blank">${extIco}</a>
  </div>
  <div class="conv2-comp-item conv2-comp-item--rank">
    <span class="conv2-comp-rank">2</span>
    <div class="conv2-comp-body"><div class="conv2-comp-brand-lbl">Paidal</div><div class="conv2-comp-title">萌系嬰兒棉拖鞋</div><div class="conv2-comp-feat">動物臉設計・嬰兒棉質地・萌感外觀・NT$599</div></div>
    <a class="conv2-comp-ext" href="https://www.paidal.com.tw/" target="_blank">${extIco}</a>
  </div>
  <div class="conv2-comp-item conv2-comp-item--rank">
    <span class="conv2-comp-rank">3</span>
    <div class="conv2-comp-body"><div class="conv2-comp-brand-lbl">Zivmode</div><div class="conv2-comp-title">保暖厚底毛絨拖鞋</div><div class="conv2-comp-feat">厚底設計・毛絨材質・室內防滑・NT$520</div></div>
    <a class="conv2-comp-ext" href="https://www.zivmode.com/" target="_blank">${extIco}</a>
  </div>
  <div class="conv2-comp-item conv2-comp-item--rank">
    <span class="conv2-comp-rank">4</span>
    <div class="conv2-comp-body"><div class="conv2-comp-brand-lbl">貝柔</div><div class="conv2-comp-title">絨毛保暖拖鞋</div><div class="conv2-comp-feat">毛絨材質・保暖功能・柔軟底部・NT$299</div></div>
    <a class="conv2-comp-ext" href="https://www.parkcat.com.tw/" target="_blank">${extIco}</a>
  </div>
  <div class="conv2-comp-item conv2-comp-item--rank">
    <span class="conv2-comp-rank">5</span>
    <div class="conv2-comp-body"><div class="conv2-comp-brand-lbl">ZARA</div><div class="conv2-comp-title">動物臉家居鞋 - 黑豆色</div><div class="conv2-comp-feat">毛絨多層・動物臉設計・家居穿著・NT$890</div></div>
    <a class="conv2-comp-ext" href="https://www.zara.com/tw/" target="_blank">${extIco}</a>
  </div>
  <div class="conv2-comp-item conv2-comp-item--rank conv2-comp-item--fn">
    <span class="conv2-comp-rank conv2-comp-rank--fn">f</span>
    <div class="conv2-comp-body"><div class="conv2-comp-brand-lbl">iSlippers</div><div class="conv2-comp-title">輕活系列前頭毛絨家居鞋</div><div class="conv2-comp-feat">前頭設計・毛絨材質・輕量化・NT$420</div></div>
    <a class="conv2-comp-ext" href="https://24h.pchome.com.tw/" target="_blank">${extIco}</a>
  </div>
</div>
<div class="conv2-next-action-row">
  <button class="conv2-fp-sec-btn" data-action="init-to-deep">深度分析 →</button>
  <button class="conv2-action-btn" data-action="init-to-direct">直接生成報告 →</button>
</div>` });
      c2Scroll();
    }, 1000);
    return;
  }
}


function conv2InitToDeep() {
  conv2Mode.value = 'deep';
  c2Push({ forUser: true, msg: '深度分析' });
  c2Push({ msg: '好的，切換至深度分析模式，請在下方面板完成設定。' });
  c2Scroll();
  conv2CurStep.value = 1;
  conv2S1ShowSkuInput.value = false;
  conv2S1SkuInput.value = '';
  conv2StepFpVisible.value = true;
  conv2ShowStepPill.value = true;
}

function conv2InitToDirect() {
  conv2Mode.value = 'direct';
  c2Push({ forUser: true, msg: '直接生成報告' });
  c2Push({ msg: '好的，商品資訊已取得，請在下方面板提供競品網址。' });
  c2Scroll();
  conv2DirectFpStep.value = 3;
  conv2DirectFpVisible.value = true;
  conv2ShowDirectPill.value = true;
}

function conv2LeaveFastTask() {
  conv2InputLocked.value = false;
  conv2ShowUploadPill.value = false;
  conv2UploadFpVisible.value = false;
  conv2ShowStepPill.value = false;
  conv2StepFpVisible.value = false;
  conv2ShowDirectPill.value = false;
  conv2DirectFpVisible.value = false;
}

function conv2DirectSelectMethod(method: string) {
  conv2DirectMethod.value = method;
  conv2DirectFpStep.value = 2;
}

function conv2DirectSubmitSku() {
  conv2DirectFpStep.value = 3;
  c2Push({ forUser: true, msg: `UG1166915BLK <span class="conv2-kb-ref">@2025產品總表-Q3</span>` });
  c2Push({ msg: `收到！正在讀取知識庫並查詢商品資料⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--done">KnowledgeReader 讀取知識庫：2025產品總表-Q3</div>
  <div class="conv2-ss conv2-ss--active">ProductLookup 查詢貨號：UG1166915BLK</div>
  <div class="conv2-ss conv2-ss--wait">識別商品資訊完成</div>
</div>` });
  c2Scroll();
  setTimeout(() => {
    const msgs = conv2Msgs.value;
    let idx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) { if (msgs[i].msg?.includes('conv2-search-card')) { idx = i; break; } }
    if (idx !== -1) {
      conv2Msgs.value[idx] = {
        ...conv2Msgs.value[idx],
        msg: conv2Msgs.value[idx].msg
          .replace('conv2-ss--active', 'conv2-ss--done')
          .replace('conv2-ss--wait', 'conv2-ss--done'),
      };
    }
    c2Push({ msg: `✅ 已從知識庫找到商品資料：<strong>UGG Women's Elea Pooch Slip-on</strong>（UG1166915BLK）` });
    c2Scroll();
  }, 1800);
}

function conv2DirectSubmitUrls() {
  conv2DirectFpVisible.value = false;
  conv2ShowDirectPill.value = false;
  const urls = conv2DirectUrlInput.value.split('\n').map(u => u.trim()).filter(Boolean);
  const urlListHtml = urls.map((u, i) => {
    try { return `${i + 1}. ${new URL(u).hostname}`; } catch { return `${i + 1}. ${u}`; }
  }).join('<br>');
  c2Push({ forUser: true, msg: `提供 ${urls.length} 個競品網址：<br>${urlListHtml}` });
  c2Push({ msg: `收到，開始爬取並分析⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--done">ProductExtractor 爬取商品資料中</div>
  <div class="conv2-ss conv2-ss--active">FeatureAnalyzer 特徵比對分析中</div>
  <div class="conv2-ss conv2-ss--wait">ReportGenerator 生成競品報告</div>
</div>` });
  c2Scroll();
  setTimeout(() => { conv2ShowReport(); c2Scroll(); }, 2400);
}

function conv2SubmitUrls() {
  c2Push({ forUser: true, msg: '提供 3 個競品網址：<br>1. shopee.tw — 日光手感-小狗立體保暖毛絨拖鞋<br>2. paidal.com.tw — 野生喵喵怪毛絨室內拖鞋<br>3. zara.com/tw — CAPYFUN 室內拖鞋' });
  c2Push({ msg: `收到，開始爬取並分析⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--done">ProductExtractor 爬取商品資料中</div>
  <div class="conv2-ss conv2-ss--active">FeatureAnalyzer 特徵比對分析中</div>
  <div class="conv2-ss conv2-ss--wait">ReportGenerator 生成競品報告</div>
</div>` });
  c2Scroll();
  setTimeout(() => { conv2ShowReport(); c2Scroll(); }, 2400);
}

function conv2ShowReport() {
  conv2InputLocked.value = false;
  try {
    addReportBlock(
      'https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/test_report_251210.html',
      'competitor_analysis_report.html'
    );
  } catch (e) { /* canvas may not be initialized in this context */ }
  c2Push({ msg: '✅ 報告已生成完畢，可下載 HTML 檔案。' });
  c2Push({ finishResponse: true, msg: `<div class="oneFileItem" style="cursor:pointer">
  <img class="file-icon" src="${htmlIcon}" />
  <div class="file-info-box">
    <div class="file-name">competitor_analysis_report.html</div>
    <div class="file-size">HTML · 1.95 KB · 已加到畫布</div>
  </div>
  <div class="file-more-wrap">
    <button class="file-more-btn" data-action="toggle-file-more">
      <i class="material-symbols-outlined">more_horiz</i>
    </button>
    <div class="more-options-box next-option-box">
      <div class="option-item" data-action="file-menu" data-value="share">加入共享資源庫</div>
      <div class="option-item" data-action="file-menu" data-value="canvas">加到左側畫布</div>
      <div class="option-item file-menu-delete" data-action="file-menu" data-value="delete">刪除</div>
    </div>
  </div>
</div>` });
}
// -------- end Conversation 2 流程 --------

// -------- Conversation 4 流程 --------
const conv4Msgs = ref<any[]>([]);
let conv4IdCounter = 2;
const conv4Title = ref('');
const conv4SkillChoiceMade = ref(false);

function c4Push(msg: any) {
  conv4Msgs.value.push({ id: `c4_${conv4IdCounter++}`, ...msg });
}
function c4Scroll() {
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}

const CONV4_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k7', title: '2026Q1產品銷售', chunkIndexes: [0, 1] },
  { knowledgeId: 'k8', title: '三諾產品部輸出報告規範', chunkIndexes: [0, 1] },
];

function conv4InitFlow() {
  if (conv4Msgs.value.length > 0) return;
  conv4Title.value = '產品銷售報告整理';
  c4Push({ forUser: true, msg: '請幫我整理上個月的產品銷售報告，相關資料請幫我查詢 @2026Q1產品銷售，輸出格式請參考 @三諾產品部輸出報告規範' });
  setTimeout(() => {
    c4Push({ msg: `收到，我先查詢資料並套用指定的輸出格式規範⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--active">SalesDataQuery 查詢 2026Q1 產品銷售數據</div>
  <div class="conv2-ss conv2-ss--wait">ReportFormatter 套用三諾產品部輸出報告規範</div>
</div>` });
    c4Scroll();
    setTimeout(() => {
      conv4FlipSearchCard(['conv2-ss--active', 'conv2-ss--wait'], ['conv2-ss--done', 'conv2-ss--done']);
      try {
        addReportBlock('/justagent/sanuo_2026_06_sales_report.html', '2026年6月產品銷售報告.html');
      } catch { /* 畫布可能尚未初始化 */ }
      c4Push({
        finishResponse: true,
        msg: `✅ 已完成上個月（6月）產品銷售報告，報告已加入畫布，可直接查看或下載。<div class="oneFileItem">
  <img class="file-icon" src="${htmlIcon}" />
  <div class="file-info-box">
    <div class="file-name">2026年6月產品銷售報告.html</div>
    <div class="file-size">HTML · 5.8 KB · 已加到畫布</div>
  </div>
</div>`,
        sources: CONV4_SOURCES,
      });
      c4Scroll();
      setTimeout(() => conv4AskBuildSkill(), 600);
    }, 1800);
  }, 300);
}

// 尋找最後一則含 'conv2-search-card' 的訊息，把指定 class 依序替換（比照 conv2 系列訊息的做法）
function conv4FlipSearchCard(from: string[], to: string[]) {
  const msgs = conv4Msgs.value;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].msg?.includes('conv2-search-card')) {
      let msg = msgs[i].msg as string;
      from.forEach((f, idx) => { msg = msg.replace(f, to[idx]); });
      conv4Msgs.value[i] = { ...msgs[i], msg };
      return;
    }
  }
}

function conv4AskBuildSkill() {
  c4Push({
    msg: `我留意到「查詢銷售資料＋套用部門報告規範」這類整理流程你之後可能會重複用到。要不要我把這個流程存成一個 Skill，之後產品部同仁都能快速套用？
<div class="conv1-quick-btns" style="margin-top:8px">
  <span class="conv1-quick-btn" data-action="conv4-build-skill">是，幫我建立 Skill</span>
  <span class="conv1-quick-btn" data-action="conv4-skip-skill">不用了</span>
</div>`,
  });
  c4Scroll();
}

function conv4BuildSkill() {
  if (conv4SkillChoiceMade.value) return;
  conv4SkillChoiceMade.value = true;
  c4Push({ forUser: true, msg: '是，幫我建立 Skill' });
  c4Scroll();
  setTimeout(() => {
    c4Push({
      finishResponse: true,
      msg: `<div style="border:1px solid #e4e7ed;border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;gap:10px;align-items:flex-start">
  <span style="font-size:20px;line-height:1">🧩</span>
  <div>
    <div style="font-weight:700">產品銷售報告整理</div>
    <div style="font-size:12px;color:#5c6370;margin-top:2px">查詢指定月份產品銷售數據，並依三諾產品部輸出報告規範自動產出報告</div>
  </div>
</div>✅ Skill「產品銷售報告整理」已建立，之後產品部同仁都能快速套用這個流程。`,
    });
    c4Scroll();
  }, 500);
}

function conv4SkipSkill() {
  if (conv4SkillChoiceMade.value) return;
  conv4SkillChoiceMade.value = true;
  c4Push({ forUser: true, msg: '不用了' });
  c4Scroll();
  setTimeout(() => {
    c4Push({ msg: '好的，這次的報告已保留在畫布中，之後有需要歡迎再跟我說一聲！' });
    c4Scroll();
  }, 500);
}
// -------- end Conversation 4 流程 --------

// -------- start Conversation 6 流程 --------
const conv6Msgs = ref<any[]>([]);
let conv6IdCounter = 2;
const conv6Title = ref('');
const conv6ReportChoiceMade = ref(false);
function c6Push(msg: any) { conv6Msgs.value.push({ id: `c6_${conv6IdCounter++}`, ...msg }); }
function c6Scroll() { nextTick(() => AiAgentChatListScrollTo('ASC')); }

const CONV6_SOURCES: KnowledgeSource[] = [
  { knowledgeId: 'k13', title: 'TEVA涼鞋2026Q2通路銷售數據彙總', chunkIndexes: [1, 2] },
  { knowledgeId: 'k14', title: 'TEVA會員CRM分群與回購定義', chunkIndexes: [1, 2] },
];

function processConv6Msg(msg: string) {
  if (conv6Msgs.value.length > 1) {
    setTimeout(() => { c6Push({ msg: '這個對話目前僅示範單一分析情境，如需查看其他洞察，歡迎開新對話 🙌' }); c6Scroll(); }, 400);
    return;
  }
  const hasTeva = msg.includes('TEVA');
  const hasTopic = ['銷售', '會員', '通路', '業績', '輪廓'].some(k => msg.includes(k));
  if (hasTeva && hasTopic) {
    conv6Title.value = 'TEVA涼鞋銷售分析';
    conv6RunAnalysis();
    return;
  }
  setTimeout(() => { c6Push({ msg: '目前僅能協助 TEVA 涼鞋相關的銷售與會員輪廓分析，請描述您想了解的通路或會員面向 🙏' }); c6Scroll(); }, 400);
}

function conv6RunAnalysis() {
  setTimeout(() => {
    c6Push({ msg: `收到，我先透過 MCP 串接 Adobe Commerce 查詢並比對會員資料⋯<div class="conv2-search-card" style="margin-top:8px">
  <div class="conv2-ss conv2-ss--active">AdobeCommerceConnector（MCP）建立連線</div>
  <div class="conv2-ss conv2-ss--wait">MagentoSalesAPI 查詢 TEVA 涼鞋各通路銷售數據</div>
  <div class="conv2-ss conv2-ss--wait">MemberSegmentAnalyzer 交叉比對會員輪廓</div>
  <div class="conv2-ss conv2-ss--wait">ChannelPerformanceAggregator 彙整分析結果</div>
</div>` });
    c6Scroll();
    setTimeout(() => {
      conv6FlipSearchCard(
        ['conv2-ss--active', 'conv2-ss--wait', 'conv2-ss--wait', 'conv2-ss--wait'],
        ['conv2-ss--done', 'conv2-ss--done', 'conv2-ss--done', 'conv2-ss--done']
      );
      try {
        addChartBlock({
          chart: 'bar',
          title: 'TEVA涼鞋 2026Q2 各通路銷售額（萬元）',
          y_axis: { title: '銷售額（萬元）' },
          data: {
            labels: ['官網直營', '天貓旗艦店', '蝦皮商城', '實體門市', '經銷通路'],
            values: [{ '銷售額（萬元）': [1240, 980, 760, 1530, 610] }],
          },
        }, '各通路銷售表現.json');
      } catch (e) { /* 畫布可能尚未初始化 */ }
      try {
        addChartBlock({
          chart: 'doughnut',
          title: 'TEVA涼鞋會員回購結構',
          data: {
            labels: ['新會員', '回購會員'],
            values: [{ '會員占比（%）': [32, 68] }],
          },
        }, '會員輪廓分布.json');
      } catch (e) { /* 畫布可能尚未初始化 */ }
      c6Push({
        finishResponse: true,
        msg: `✅ 已完成 TEVA 涼鞋 2026Q2 各通路銷售與會員輪廓分析，圖表已加入畫布。<br><br>重點洞察：實體門市貢獻最高但年減 4%，天貓旗艦店成長最快（+32%）；會員回購占比達 68%，顯示既有會員貢獻穩定。`,
        sources: CONV6_SOURCES,
      });
      c6Scroll();
    }, 1800);
  }, 300);
}

// 尋找最後一則含 'conv2-search-card' 的訊息，把指定 class 依序替換（比照 conv4FlipSearchCard）
function conv6FlipSearchCard(from: string[], to: string[]) {
  const msgs = conv6Msgs.value;
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].msg?.includes('conv2-search-card')) {
      let msg = msgs[i].msg as string;
      from.forEach((f, idx) => { msg = msg.replace(f, to[idx]); });
      conv6Msgs.value[i] = { ...msgs[i], msg };
      return;
    }
  }
}
// -------- end Conversation 6 流程 --------

const testMsgs = computed(() => {
  const msgs = currentConversationId.value === 'conv2' ? conv2Msgs.value
    : currentConversationId.value === 'conv4' ? conv4Msgs.value
    : currentConversationId.value === 'conv6' ? conv6Msgs.value
    : conv1Msgs.value;
  // 未確認的 translationConfirm 不在河道上顯示任何泡泡
  return msgs.filter((m: any) => !(m.cardType === 'translationConfirm' && !m.confirmed));
});

function resetConversation() {
  if (currentConversationId.value === 'conv2') {
    conv2IdCounter = 2;
    conv2Mode.value = '';
    conv2Title.value = '';
    conv2Msgs.value = [];
    conv2UploadFpVisible.value = false;
    conv2ShowUploadPill.value = false;
    conv2UploadImgLoaded.value = false;
    conv2UploadDesc.value = '';
    conv2StepFpVisible.value = false;
    conv2ShowStepPill.value = false;
    conv2CurStep.value = 1;
    conv2S1Cat.value = '室內拖鞋';
    conv2S1Custom.value = '';
    conv2S1ImgLoaded.value = false;
    conv2S1ShowSkuInput.value = false;
    conv2S1SkuInput.value = '';
    conv2S2Brand.value = '';
    conv2S2Price.value = '';
    conv2S2Name.value = '';
    conv2S2Desc.value = '';
    conv2S2Err.value = '';
    conv2S3Err.value = '';
    conv2S3Features.value.forEach(f => { f.sel = f.key === 'material' || f.key === 'design'; });
    conv2S4Scope.value = 'tw';
    conv2S4Domain.value = '';
    conv2S5SelComps.value = new Set();
    conv2S5Err.value = '';
    conv2HoverComp.value = null;
    conv2InputLocked.value = false;
    conv2DirectFpVisible.value = false;
    conv2ShowDirectPill.value = false;
    conv2DirectFpStep.value = 1;
    conv2DirectMethod.value = '';
    conv2DirectSkuInput.value = '';
    conv2DirectUrlInput.value = '';
  }
  if (currentConversationId.value === 'conv4') {
    conv4IdCounter = 2;
    conv4Title.value = '';
    conv4Msgs.value = [];
    conv4SkillChoiceMade.value = false;
  }
  if (currentConversationId.value === 'conv6') {
    conv6IdCounter = 2;
    conv6Title.value = '';
    conv6Msgs.value = [];
    conv6ReportChoiceMade.value = false;
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}

// degub 相關
const { debugCount, lookDebug } = storeToRefs(aiviewerStore);

</script>
