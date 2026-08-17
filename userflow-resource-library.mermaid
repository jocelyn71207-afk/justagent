flowchart TD
    START([側邊欄點擊「共享資源庫」]) --> LOAD[載入 ResourceLibrary\n呼叫 resourceStore.resourceList]

    LOAD --> LOADING{API 狀態}
    LOADING -- 載入中 --> SKELETON[顯示 Skeleton 骨架]
    LOADING -- 錯誤 --> ERROR[AppErrorState\n顯示錯誤訊息]
    ERROR --> RETRY[點擊 Retry]
    RETRY --> LOAD
    LOADING -- 成功，清單為空 --> EMPTY[顯示「目前沒有資源」]
    LOADING -- 成功，有資料 --> LIST_VIEW[顯示資源清單]

    %% ── 篩選 ──
    LIST_VIEW --> FILTER_TAB[Tab 篩選\n全部 / 用戶上傳 / Agent 上傳]
    LIST_VIEW --> FILTER_TYPE[檔案類型下拉\nPDF / PPT / Excel / Image\nHTML / Word / MD / TXT / Chart / 其他]
    LIST_VIEW --> VIEW_SWITCH[卡片 / 清單模式切換]
    FILTER_TAB --> FILTERED[過濾後清單\npageNo 重置為 1]
    FILTER_TYPE --> FILTERED
    FILTERED --> PAGINATION[分頁元件\n每頁 10 筆]
    PAGINATION --> LIST_VIEW

    %% ── 上傳檔案 ──
    LIST_VIEW --> BTN_UPLOAD[點擊「上傳檔案」]
    BTN_UPLOAD --> BATCH_MODAL[AppBatchUpload\n批次上傳 Modal 開啟]

    BATCH_MODAL --> STEP1{Step 1\n選擇檔案}
    STEP1 -- 拖曳 --> VALIDATE
    STEP1 -- 點擊選取 --> VALIDATE

    VALIDATE{驗證檔案} -- 類型不符 / 超過數量\n/ 單檔 >5GB --> ALERT[Alert 錯誤提示\n上傳中止]
    VALIDATE -- 通過 --> STEP2[Step 2\n預覽已選清單\n顯示 AI解析入庫 / 原檔保存 標籤]

    STEP2 --> REMOVE[移除單一檔案]
    REMOVE --> STEP2
    STEP2 --> MORE_FILE[選擇更多檔案\n最多 5 個]
    MORE_FILE --> VALIDATE
    STEP2 --> CONFIRM_UPLOAD[確認上傳]

    CONFIRM_UPLOAD --> UPLOADING[上傳中\n右下角進度面板\n每支檔案顯示 % 進度]
    UPLOADING --> CAN_ABORT[點擊取消某支檔案]
    CAN_ABORT --> ABORT[AbortController.abort\n標記 error]
    UPLOADING --> CLOSE_CONFIRM{上傳中關閉？}
    CLOSE_CONFIRM -- 確認 --> ABORT_ALL[取消全部上傳\n關閉 Modal]
    CLOSE_CONFIRM -- 取消 --> UPLOADING

    UPLOADING --> ALL_DONE[全部檔案完成\nisBatchUploadSuccess = true]

    ALL_DONE --> DUP_CHECK{偵測同名檔案}
    DUP_CHECK -- 無重複 --> ADD_NEW[resourceStore.addFile\n新增至清單]
    DUP_CHECK -- 有重複 --> DUP_DIALOG[Confirm Dialog\n「更新舊檔案」or「保留兩者」]

    DUP_DIALOG -- 更新舊檔案 --> VERSION_UP[uploadNewVersion\n版本號 +1\n更新 lastModify\nknowledgeStore.markFileStale]
    DUP_DIALOG -- 保留兩者 --> ADD_NEW
    VERSION_UP --> TOAST_VERSION[Toast: 已更新為新版本\n請至知識庫確認受影響條目]

    ADD_NEW --> LIST_VIEW
    TOAST_VERSION --> LIST_VIEW

    %% ── 檔案操作 ──
    LIST_VIEW --> MORE_MENU[點擊 ⋯ more_horiz]
    MORE_MENU --> OPT_RENAME[編輯檔案名稱]
    MORE_MENU --> OPT_DOWNLOAD[下載檔案]
    MORE_MENU --> OPT_KNOWLEDGE[建立為知識內容]
    MORE_MENU --> OPT_DELETE[刪除]

    %% 編輯名稱
    OPT_RENAME --> INLINE_INPUT[Inline input 取代檔名\n自動 focus 游標至末尾]
    INLINE_INPUT --> BLUR{blur 觸發儲存}
    BLUR -- 名稱為空 --> ALERT2[Alert: 檔案名稱不能為空\n還原]
    BLUR -- 名稱未變更 --> LIST_VIEW
    BLUR -- 名稱已變更 --> SAVE_NAME[TODO: 呼叫 API 儲存\n更新 fileName]
    SAVE_NAME --> LIST_VIEW

    %% 刪除
    OPT_DELETE --> DEL_CONFIRM[Confirm Dialog\n「確定刪除嗎？\n刪除後將無法復原。」]
    DEL_CONFIRM -- 取消 --> LIST_VIEW
    DEL_CONFIRM -- 確認刪除 --> DO_DELETE[resourceStore.deleteFile\n從清單移除]
    DO_DELETE --> LIST_VIEW

    %% 建立知識內容
    OPT_KNOWLEDGE --> WIZARD[CreateKnowledgeWizardModal\n建立知識條目]
    WIZARD --> SOURCE_TYPE{選擇來源類型}

    SOURCE_TYPE -- 上傳檔案 FILE --> FILE_SRC[拖曳上傳\nor 從共用庫選取\nResourceFilePicker]
    SOURCE_TYPE -- API 來源 --> API_SRC[選擇已設定的 API 來源]
    SOURCE_TYPE -- 直接編輯 MANUAL --> MANUAL_SRC[輸入知識條目標題]
    SOURCE_TYPE -- JustKa --> JUSTKA_SRC[選擇機器人\n客服/銷售/退換貨]

    FILE_SRC --> CATEGORY[填寫分類＊\n標籤選填]
    API_SRC --> CATEGORY
    MANUAL_SRC --> CATEGORY
    JUSTKA_SRC --> CATEGORY

    CATEGORY --> CAN_SUBMIT{表單驗證\ncanSubmit}
    CAN_SUBMIT -- 未完成 --> DISABLED[送出按鈕 disabled]
    CAN_SUBMIT -- 通過 --> SUBMIT_BTN[點擊送出]

    SUBMIT_BTN -- FILE\n已預填來源 --> AI_GEN[AI 解析生成知識內容\nchunking → embedding → indexing]
    SUBMIT_BTN -- FILE\n新上傳 --> SAVE_RES[儲存至共用檔案管理\n+ AI 解析生成]
    SAVE_RES --> AI_GEN
    SUBMIT_BTN -- MANUAL --> MANUAL_DRAFT[建立草稿]
    SUBMIT_BTN -- API --> PIPELINE[Pipeline 處理中]
    SUBMIT_BTN -- JUSTKA --> JUSTKA_GEN[AI 整理題庫\nQ&A 結構化]

    AI_GEN --> MARK_KID[resourceStore.markAsKnowledge\n寫入 knowledgeId]
    AI_GEN --> KNOWLEDGE_DETAIL[導向 KnowledgeDetail]
    MANUAL_DRAFT --> KNOWLEDGE_EDITOR[導向 KnowledgeEditor]
    PIPELINE --> KNOWLEDGE_DETAIL
    JUSTKA_GEN --> KNOWLEDGE_DETAIL

    %% Styling
    classDef terminal fill:#1e1e2e,stroke:#1e1e2e,color:#fff
    classDef page fill:#e8f4f8,stroke:#3eb5cc,color:#1a4a55
    classDef action fill:#f0f4ff,stroke:#6b7bcc,color:#2d3566
    classDef modal fill:#f5f0ff,stroke:#9b6bcc,color:#4a206a
    classDef danger fill:#fff0f0,stroke:#cc4444,color:#7a1111
    classDef ai fill:#e6f9f0,stroke:#2db87c,color:#0d4a2d
    classDef warn fill:#fff8e1,stroke:#e6a817,color:#7a4f00

    class START terminal
    class LOAD,LIST_VIEW page
    class WIZARD,BATCH_MODAL modal
    class OPT_DELETE,DEL_CONFIRM,DO_DELETE danger
    class AI_GEN,SAVE_RES,MARK_KID,JUSTKA_GEN,PIPELINE,KNOWLEDGE_DETAIL,KNOWLEDGE_EDITOR ai
    class DUP_DIALOG,VERSION_UP,TOAST_VERSION warn
    class FILTER_TAB,FILTER_TYPE,VIEW_SWITCH,PAGINATION action
    class BTN_UPLOAD,STEP2,CONFIRM_UPLOAD,UPLOADING action
    class MORE_MENU,OPT_RENAME,OPT_DOWNLOAD,OPT_KNOWLEDGE action
    class INLINE_INPUT,SAVE_NAME action
    class SOURCE_TYPE,FILE_SRC,API_SRC,MANUAL_SRC,JUSTKA_SRC,CATEGORY,SUBMIT_BTN action
