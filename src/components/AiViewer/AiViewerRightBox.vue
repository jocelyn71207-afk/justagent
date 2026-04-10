<template>
  <div class="AiViewerRightBox" :style="{ width: props.rightWidth + 'px' }"
    @click="nowChoiceAiViewerId = ''"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)">

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

    <!-- 對話訊息大區域 -->
    <!-- <div class="AiAgentChatArea" @wheel.stop="handleContentWheel($event); stopWhellZoomEvent($event);"> -->
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
    <!-- </div> -->


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
            <div class="conv2-up-img-box">
              <img :src="DEMO_IMG" />
            </div>
            <div class="conv2-up-desc-box">
              <div class="conv2-up-lbl">商品描述 <span class="conv2-up-hint">圖片或描述至少填一項</span></div>
              <textarea class="conv2-up-ta" v-model="conv2UploadDesc" rows="3" @click.stop></textarea>
              <div class="conv2-up-status conv2-up-status--ready">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#166534" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                圖片已上傳・描述已填寫
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
            <input class="conv2-fi conv2-fi--full" v-model="conv2DirectSkuInput" @click.stop style="margin-top:8px;font-family:monospace" />
            <div class="conv2-fp-btn-row" style="margin-top:10px">
              <button class="conv2-fp-sec-btn" @click.stop="conv2DirectFpStep = 1">← 返回</button>
              <button class="conv2-fp-submit-btn" @click.stop="conv2DirectSubmitSku()">確認送出 →</button>
            </div>
          </div>
          <!-- Step 3: 輸入競品網址 -->
          <div v-show="conv2DirectFpStep === 3">
            <div class="conv2-info-note">✦ 提供競品的商品頁面網址（最多 5 個）</div>
            <textarea class="conv2-fi conv2-fi--full conv2-fi--ta" v-model="conv2DirectUrlInput" rows="4" @click.stop
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
          <!-- Step 1: 商品類別 -->
          <div v-show="conv2CurStep === 1">
            <div class="conv2-info-note">✦ AI 從圖片識別商品，可調整</div>
            <div class="conv2-chips">
              <div v-for="c in ['室內拖鞋','毛絨拖鞋','動物臉拖鞋','家居鞋']" :key="c"
                :class="['conv2-chip', {sel: conv2S1Cat === c && !conv2S1Custom}]"
                @click.stop="conv2S1Cat = c; conv2S1Custom = ''">{{ c }}</div>
            </div>
            <input class="conv2-fi conv2-fi--full" v-model="conv2S1Custom" placeholder="找不到，自行輸入…" @click.stop style="margin-top:4px" />
            <div class="conv2-fp-btn-row">
              <button class="conv2-fp-btn" @click.stop="conv2GoStep(2)">確認 →</button>
            </div>
          </div>
          <!-- Step 2: 商品資訊 -->
          <div v-show="conv2CurStep === 2">
            <div class="conv2-info-note">✦ AI 從圖片與描述自動帶入，非必填</div>
            <div class="conv2-fg">
              <div><div class="conv2-fl">品牌 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi" v-model="conv2S2Brand" @click.stop /></div>
              <div><div class="conv2-fl">定價 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi" v-model="conv2S2Price" @click.stop /></div>
            </div>
            <div style="margin-bottom:7px"><div class="conv2-fl">商品名稱 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><input class="conv2-fi conv2-fi--full" v-model="conv2S2Name" @click.stop /></div>
            <div><div class="conv2-fl">商品描述 <span style="font-size:10px;color:var(--color-text-alpha50)">選填</span></div><textarea class="conv2-fi conv2-fi--full conv2-fi--ta" v-model="conv2S2Desc" rows="2" @click.stop></textarea></div>
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
      <div v-if="!conv2FpActive" :class="['accessory-box', { hidden: isShowCannedTaskListBox }]"
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
        <!-- fp 互動模式時完全移除輸入框 -->
        <textarea v-if="!conv2FpActive" :class="['custom-textarea']"
          id="userInput"
          placeholder="請輸入您的需求"
          ref="userInputRef"
          v-model.trim="userInputModal.msg"
          @focus="inputFocus()"
          @blur="inputBlur()"
          @keydown="inputKeyPress($event); handleEnterKeySubmit($event, sendUserInput)">
        </textarea>
        <div v-if="!conv2FpActive">
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
        <button class="custom-btn" v-if="!conv2FpActive" v-tooltip="'發送訊息'"
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

  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { storeToRefs } from 'pinia'
import { useAiviewerStore } from '@/stores/AiViewerStore';
import { handleContentWheel, stopWhellZoomEvent, stopTouchpadZoomEvent, handleEnterKeySubmit, initClickOutsideListener } from '@/utils/utils';
import VirtualList from 'vue3-virtual-scroll-list';
import AiViewerRecord from '@/components/AiViewer/AiViewerRecord.vue';
import commentListArea from '@/components/AiViewer/commentListArea.vue';
import fileListArea from '@/components/AiViewer/fileListArea.vue';
import blockListArea from '@/components/AiViewer/blockListArea.vue';
import popDialog from '@/services/popDialog';
import { formatFileSize, getFileMimeType, validateUploadFiles, acceptedFileExtensions } from '@/utils/file';
import htmlIcon from '@/assets/fileTypeIcon/html.png';

const props = defineProps<{
  rightWidth: number;
  setMainStagePosition: (x: number, y: number) => void;
}>();

const aiviewerStore = useAiviewerStore();
const { nowChoiceAiViewerId, copyAiViewerBlock, isStopCopyPasteAiViewerBlock, isMultiChoiceAiViewerMode, nowMultiChoiceAiViewerIds, isShowFileListView } = storeToRefs(aiviewerStore);
const { fullAiViewerBlockId, isAspectRatioMode } = storeToRefs(aiviewerStore);
const { aiViewerBlocks } = storeToRefs(aiviewerStore);
const { sendUserInput, addReportBlock, addChartBlock } = aiviewerStore;
const { isOpenConversationListModal, currentConversationId } = storeToRefs(aiviewerStore); // 是否開啟對話列表 Modal

const conv2Title = ref('');
const currentConversationTitle = computed(() => {
  if (currentConversationId.value === 'conv2') return conv2Title.value || '未命名對話';
  return '2026商品文件翻譯';
});

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

// 發送使用者輸入訊息
function send() {
  sendUserInput();
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
const conv1Msgs = ref([
  // 1. 使用者發起請求
  {
    id: 'id_1',
    forUser: true,
    msg: '我有一份 AW26 的英文商品文件，需要翻成繁體中文，可以幫我處理嗎？',
  },
  // 2. AI 熱情確認，一次詢問必要資訊
  {
    id: 'id_2',
    msg: '當然可以！🙌 幫我確認幾個細節，就可以馬上開始：<br><br>📄 <strong>翻譯文件</strong>：請上傳或指定 Excel 檔案<br>📌 <strong>翻譯範圍</strong>：全文 or 特定工作表 / 欄位？<br>🌐 <strong>目標語言</strong>：繁體中文、簡體、日文……？<br><br>確認後我會立刻開工 💪',
  },
  // 3. 使用者以確認卡片樣式回覆（confirmed=true 代表已點擊「開始翻譯」）
  {
    id: 'id_3',
    forUser: true,
    cardType: 'translationConfirm',
    confirmed: true,
    file: 'AW26 Product Descriptions.xlsx',
    fileSize: 2834016,
    range: 'Line Sheet - Teva Footwear Fal/Features and Benefits (Product Bullets)',
    lang: '繁體中文',
    msg: '',
  },
  // 4. AI 確認並說明進度
  {
    id: 'id_4',
    msg: '收到！✅ 檔案已讀取，開始處理囉～<br><br>我會依照以下順序進行：<br>① 載入產品文件翻譯的專業流程規範<br>② 逐欄比對商品術語與品牌用語<br>③ 保留原始格式，輸出對齊版本<br><br>稍等一下，馬上好 ⚡',
  },
  // 5. AI 翻譯完成（含下載檔案卡片）
  {
    id: 'id_5',
    finishResponse: true,
    cardType: 'translationComplete',
    msg: '✅ 翻譯完成！共處理 <strong>143 個產品欄位</strong>，品牌術語保留原文並附對照表。<br>另外幫你標出了 <strong>12 個商標詞</strong>，整理在 .txt 檔供你核對。',
    files: [
      { name: 'AW26 Product Descriptions_翻譯.xlsx', type: 'XLSX', size: 2834016 },
      { name: 'AW26 Product Descriptions_trade_mark.txt', type: 'TXT', size: 133 },
    ],
  },
  // 6. 使用者追問日文
  {
    id: 'id_6',
    forUser: true,
    msg: '很好！同一份檔案可以也翻成日文嗎？',
  },
  // 7. AI 回覆日文翻譯完成
  {
    id: 'id_7',
    finishResponse: false,
    cardType: 'translationComplete',
    msg: '🇯🇵 日文版翻譯完成！同樣處理了 <strong>143 個欄位</strong>，針對日本市場慣用的敬語語氣做了調整，請確認風格是否符合需求。',
    files: [
      { name: 'AW26 Product Descriptions_日本語.xlsx', type: 'XLSX', size: 2901234 },
    ],
  },
  // 8. 使用者追問 Hurricane Trailsetter 銷售數據
  {
    id: 'id_8',
    forUser: true,
    msg: '幫我從這份文件裡抓出 Hurricane Trailsetter 系列的所有鞋款，順便給我歷年銷售數據跟今年的預測',
  },
  // 9. AI 回覆：Hurricane Trailsetter 銷售數據（附 HTML 報告到畫布）
  {
    id: 'id_9',
    finishResponse: true,
    cardType: 'translationComplete',
    msg: '📊 找到了！Hurricane Trailsetter 共 <strong>4 個鞋款</strong>（Sandal 男女 + Mid 男女），2022 年起連續三年成長 20%+。<br>完整數據與 2026 預測報告已加到右側畫布，點一下就能展開看。',
    files: [
      { name: 'hurricane_trailsetter_sales_report.html', type: 'HTML', size: 6800 },
    ],
  },
]) as Ref<any[]>;

// 在頁面初始化時，將 Hurricane 報告加入畫布，並監聽 iframe chip 點擊
function c1PushThinkingThenReply(
  thinkingDelay: number,
  replyMsg: string,
  files: { name: string; type: string; size: number }[],
  reportUrl: string,
  reportName: string,
) {
  const thinkingId = 'thinking-' + Date.now();
  conv1Msgs.value.push({ id: thinkingId, isThinking: true });
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
    });
    try { addReportBlock(reportUrl, reportName); } catch (e) { /* ignore */ }
    nextTick(() => AiAgentChatListScrollTo('ASC'));
  }, thinkingDelay);
}

function handleHurricaneChipMsg(event: MessageEvent) {
  if (event.data?.type !== 'hurricane-chip-click') return;
  const msg = event.data.msg as string;
  if (!msg) return;

  conv1Msgs.value.push({ id: 'chip-user-' + Date.now(), forUser: true, msg });
  nextTick(() => AiAgentChatListScrollTo('ASC'));

  if (msg.includes('圖表')) {
    const thinkingId = 'thinking-' + Date.now();
    conv1Msgs.value.push({ id: thinkingId, isThinking: true });
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
        }, '年度銷售量.chart');
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
        }, '年成長率趨勢.chart');
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
        }, '各鞋款銷售量.chart');
      } catch (e) { /* ignore */ }

      conv1Msgs.value.push({
        id: 'ai-charts-' + Date.now(),
        finishResponse: true,
        msg: '📊 已幫你產出 <strong>3 張銷售分析圖表</strong>，已加到右側畫布：<br>・年度銷售量（長條圖）<br>・年成長率趨勢（折線圖）<br>・各鞋款銷售拆分（堆疊長條圖）<br><br>可直接在畫布上調整大小、截圖使用。',
      });
      nextTick(() => AiAgentChatListScrollTo('ASC'));
    }, 2200);
  } else if (msg.includes('行銷策略')) {
    c1PushThinkingThenReply(
      1800,
      '已根據 2022–2025 銷售數據分析完成，以下是 Hurricane Trailsetter 系列的 AW26 行銷策略報告，請查閱。',
      [{ name: 'hurricane_trailsetter_marketing_strategy.html', type: 'HTML', size: 13208 }],
      '/justagent/hurricane_trailsetter_marketing_strategy.html',
      'hurricane_trailsetter_marketing_strategy.html',
    );
  } else if (msg.includes('用戶畫像')) {
    c1PushThinkingThenReply(
      2000,
      '已完成目標客群分析，以下是 Hurricane Trailsetter 系列的用戶畫像報告，請查閱。',
      [{ name: 'hurricane_trailsetter_user_persona.html', type: 'HTML', size: 30725 }],
      '/justagent/hurricane_trailsetter_user_persona.html',
      'hurricane_trailsetter_user_persona.html',
    );
  }
}

onMounted(() => {
  try {
    addReportBlock(
      '/justagent/hurricane_trailsetter_sales_report.html',
      'hurricane_trailsetter_sales_report.html'
    );
  } catch (e) { /* canvas 尚未初始化時略過 */ }
  window.addEventListener('message', handleHurricaneChipMsg);
});

onUnmounted(() => {
  window.removeEventListener('message', handleHurricaneChipMsg);
});

// -------- Conversation 2 流程 --------
const DEMO_IMG = 'https://d12ro2iv4p7r0b.cloudfront.net/media/catalog/product/u/g/ug1183390sndc-1.jpg';
const DEMO_DESC = '淺褐色毛絨室內拖鞋，動物臉設計，具有柔潤立體造型和寬闊防滑底，前頭設計，毛茸茸的感覺適合屋家穿著。';

let conv2IdCounter = 2;
const conv2Mode = ref('');
const conv2InputLocked = ref(false); // 快速按鈕觸發後鎖定輸入框
// 直接生成報告懸浮面板
const conv2DirectFpVisible = ref(false);
const conv2ShowDirectPill = ref(false);
const conv2DirectFpStep = ref(1); // 1:方法選擇 2:輸入貨號 3:競品網址
const conv2DirectMethod = ref('');
const conv2DirectSkuInput = ref('UG1166915BLK@2025產品總表-Q3');
const CONV2_DIRECT_URL_DEFAULT = 'https://www.zara.com/tw/\nhttps://www.paidal.com.tw/\nhttps://www.zivmode.com/\nhttps://www.parkcat.com.tw/\nhttps://www.zara.com/tw/';
const conv2DirectUrlInput = ref(CONV2_DIRECT_URL_DEFAULT);

// ── 懸浮面板 state ──
const conv2UploadFpVisible = ref(false);
const conv2ShowUploadPill = ref(false); // pill 是否顯示（獨立於 panel 展開狀態）
const conv2UploadDesc = ref(DEMO_DESC);

const conv2StepFpVisible = ref(false);
const conv2ShowStepPill = ref(false); // pill 是否顯示
const conv2CurStep = ref<number | string>(1);

// 任一 fp 面板開啟中（隱藏輸入框用）
const conv2AnyFpOpen = computed(() =>
  currentConversationId.value === 'conv2' && (conv2UploadFpVisible.value || conv2StepFpVisible.value)
);
// fp 互動模式中（有 pill 顯示，或流程已啟動）：完全隱藏原始輸入列
const conv2FpActive = computed(() =>
  currentConversationId.value === 'conv2' && (conv2ShowUploadPill.value || conv2ShowStepPill.value || conv2ShowDirectPill.value || conv2InputLocked.value)
);

const conv2StepTitleMap: Record<string, string> = {
  '1': '商品類別確認', '2': '商品資訊確認',
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
function conv2GoStep(n: number | string) { conv2CurStep.value = n; }

// Step 1
const conv2S1Cat = ref('室內拖鞋');
const conv2S1Custom = ref('');
// Step 2保暖厚底毛絨拖鞋
const conv2S2Brand = ref('UGG');
const conv2S2Price = ref('NT$5,980');
const conv2S2Name = ref("Women's Elea Pooch Slip-on");
const conv2S2Desc = ref(DEMO_DESC);
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
  if (currentConversationId.value !== 'conv2') return;
  const target = e.target as HTMLElement;
  const el = target.closest('[data-action]') as HTMLElement | null;
  if (!el) return;
  e.stopPropagation();
  const action = el.dataset.action!;
  const value = el.dataset.value ?? '';

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
  // deep mode: 開啟步驟設定懸浮面板
  c2Push({ msg: '商品特徵已確認，請在下方面板完成深度分析設定。' });
  c2Scroll();
  conv2CurStep.value = 1;
  conv2StepFpVisible.value = true;
  conv2ShowStepPill.value = true;
}


function conv2InitToDeep() {
  conv2Mode.value = 'deep';
  c2Push({ forUser: true, msg: '深度分析' });
  c2Push({ msg: '好的，切換至深度分析模式，請在下方面板完成設定。' });
  c2Scroll();
  conv2CurStep.value = 1;
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
  c2Push({ forUser: true, msg: '提供 3 個競品網址：<br>1. shopee.tw — 日光手感-小狗立體保暖毛絨拖鞋<br>2. paidal.com.tw — 野生喵喵怪毛絨室內拖鞋<br>3. zara.com/tw — CAPYFUN 室內拖鞋' });
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

const testMsgs = computed(() =>
  currentConversationId.value === 'conv2' ? conv2Msgs.value : conv1Msgs.value
);

function resetConversation() {
  if (currentConversationId.value === 'conv2') {
    conv2IdCounter = 2;
    conv2Mode.value = '';
    conv2Title.value = '';
    conv2Msgs.value = [];
    conv2UploadFpVisible.value = false;
    conv2ShowUploadPill.value = false;
    conv2UploadDesc.value = DEMO_DESC;
    conv2StepFpVisible.value = false;
    conv2ShowStepPill.value = false;
    conv2CurStep.value = 1;
    conv2S1Cat.value = '室內拖鞋';
    conv2S1Custom.value = '';
    conv2S2Brand.value = 'UGG';
    conv2S2Price.value = 'NT$5,980';
    conv2S2Name.value = "Women's Elea Pooch Slip-on";
    conv2S2Desc.value = DEMO_DESC;
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
    conv2DirectSkuInput.value = 'UG1166915BLK@2025產品總表-Q3';
    conv2DirectUrlInput.value = CONV2_DIRECT_URL_DEFAULT;
  }
  nextTick(() => AiAgentChatListScrollTo('ASC'));
}

// degub 相關
const { debugCount, lookDebug } = storeToRefs(aiviewerStore);

</script>
