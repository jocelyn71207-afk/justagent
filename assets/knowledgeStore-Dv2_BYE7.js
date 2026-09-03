import{V as ie,r as k}from"./index-ioIZ2k8v.js";function ae(l){return l==="approved"||l==="active"||l==="history"}function re(l){return{商品文件:{chunkSize:200,overlap:20,contextPrefix:"[商品]"},客服知識:{chunkSize:300,overlap:50,contextPrefix:"[客服]"},規則說明:{chunkSize:500,overlap:100,contextPrefix:"[規則]"},系統文件:{chunkSize:400,overlap:80,contextPrefix:"[系統]"}}[l]??{chunkSize:300,overlap:50,contextPrefix:""}}function le(l,m){const p=m.tags.length>0?`[標籤:${m.tags.join(",")}]`:"";return`[分類:${m.category}]${p}[來源:${m.sourceType}] ${l}`}function se(l){return{商品文件:"請詳細描述圖片中商品的外觀、顏色、材質、尺寸和特徵。",系統文件:"請描述圖片中的 UI 元件、操作步驟和按鈕文字。",規則說明:"請識別並列出圖片中的條款文字和章節標題。",客服知識:"請說明圖片中圖示的意義、流程說明和狀態標記。"}[l]??"請描述這張圖片的主要內容。"}async function ue(l,m){return{method:"vision",text:`[AI 視覺描述 - ${m}] ${se(m).slice(0,20)}... (mock)`}}const de=ie("knowledge",()=>{const l=k([{id:"k1",title:"2025產品總表-Q3",category:"商品文件",status:"active",sourceType:"FILE",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2025-08-13 10:30",lastUpdateBy:"Lucas",versions:[{id:"k1-v1.0",knowledgeId:"k1",versionNumber:"v1.0",versionType:null,status:"history",title:"2025產品總表-Q1",summary:"2025延續品",content:"這是 v1.0 的內容...",tags:["產品"],systemTags:[],lastUpdateBy:"Admin",lastUpdateTime:"2025-01-01 09:00",updateNote:"初始建立",sourceFiles:[],chunks:[],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:5},{id:"k1-v1.2",knowledgeId:"k1",versionNumber:"v1.2",versionType:"MINOR",status:"active",title:"2025產品總表-Q3",summary:"新增Q3選品資料",content:`## UGG 鞋款庫存資料

| Model | SC | 年份 |
|---|---|---|
| TV4038BKBR | TV | 2011F |`,tags:["產品"],systemTags:["商品文件"],lastUpdateBy:"Lucas",lastUpdateTime:"2026-08-13 10:30",updateNote:"更新為 UGG 鞋款庫存資料",sourceFiles:[{fileId:"res3",fileName:"UGG2025商品總表.xlsx",linkedVersion:1}],chunks:[{index:1,content:"UGG 鞋款庫存資料整理，包含 2025 年秋冬新款型號、配色與庫存數量說明，TV 系列為主力推廣款式。",tokenCount:312,sourceType:"text"},{index:2,content:"TV4038BKBR 冬季款詳細規格，含尺寸範圍 US5–11、建議售價 NT$6,800 與安全庫存量設定標準。",tokenCount:287,sourceType:"text"},{index:3,content:"Q3 選品策略以秋冬轉換期熱銷品項為主，重點布局 UGG 經典款與新色系，建議備貨量較 Q2 增加 30%。",tokenCount:345,sourceType:"text"}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:3}]},{id:"k2",title:"後台角色權限說明",category:"系統文件",status:"reviewing",sourceType:"MANUAL",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-04-01 11:00",lastUpdateBy:"Rita",activityLog:[{id:"k2-act-1",action:"SUBMITTED",by:"Admin",time:"2025-03-10 09:00",versionId:"k2-v1.0",versionNumber:"v1.0",note:"首次建立後台角色權限規範，請審核後發佈。"},{id:"k2-act-2",action:"APPROVED",by:"Ethan",time:"2025-03-10 09:20",versionId:"k2-v1.0",versionNumber:"v1.0",note:"角色範圍清楚，同意發佈。"},{id:"k2-act-3",action:"PUBLISHED",by:"Ethan",time:"2025-03-10 09:20",versionId:"k2-v1.0",versionNumber:"v1.0"},{id:"k2-act-4",action:"SUBMITTED",by:"Rita",time:"2025-11-20 16:40",versionId:"k2-v1.1",versionNumber:"v1.1",note:"新增客服角色，補充工單中心權限規範，請審核後發佈以取代 v1.0。"},{id:"k2-act-5",action:"APPROVED",by:"Ethan",time:"2025-11-21 09:10",versionId:"k2-v1.1",versionNumber:"v1.1",note:"客服角色範圍合理，同意發佈。"},{id:"k2-act-6",action:"PUBLISHED",by:"Ethan",time:"2025-11-21 09:10",versionId:"k2-v1.1",versionNumber:"v1.1"},{id:"k2-act-7",action:"SUBMITTED",by:"Rita",time:"2026-03-18 10:20",versionId:"k2-v1.2",versionNumber:"v1.2",note:"僅修正客服角色描述用語，未變動任何權限範圍，送審確認語意修正是否恰當。"},{id:"k2-act-8",action:"APPROVED",by:"Ethan",time:"2026-03-19 09:40",versionId:"k2-v1.2",versionNumber:"v1.2",note:"用語修正合理，同意發佈。"},{id:"k2-act-9",action:"SUBMITTED",by:"Rita",time:"2026-04-01 11:00",versionId:"k2-v2.0",versionNumber:"v2.0",note:"已完成新版角色權限重構文件撰寫，權限矩陣與舊角色遷移對應表皆已確認，請審核後發佈以取代 v1.1 現行版本。"}],versions:[{id:"k2-v1.0",knowledgeId:"k2",versionNumber:"v1.0",versionType:null,status:"history",title:"後台角色權限說明",summary:"建立後台管理系統角色與權限的基礎規範",content:`# 後台角色權限說明

## 一、角色定義

後台管理系統初期規劃三種基礎角色，依職務範圍分派存取權限。

| 角色 | 說明 | 可存取模組 |
|------|------|-----------|
| 超級管理員 | 系統所有功能之完整存取權限，含帳號與角色管理 | 全部模組 |
| 編輯者 | 可建立與編輯商品、知識庫等內容，無法變更系統設定 | 商品管理、知識庫、內容管理 |
| 檢視者 | 僅可檢視資料，無任何編輯或刪除權限 | 全部模組（唯讀） |

## 二、權限矩陣

| 功能模組 | 超級管理員 | 編輯者 | 檢視者 |
|---------|:---------:|:------:|:------:|
| 帳號與角色管理 | ✅ | ❌ | ❌ |
| 商品管理 | ✅ | ✅ | 👁️ |
| 知識庫管理 | ✅ | ✅ | 👁️ |
| 系統設定 | ✅ | ❌ | ❌ |
| 操作紀錄查詢 | ✅ | ❌ | 👁️ |

> **備註**：角色權限僅區分「模組」層級，尚未支援欄位或資料列層級的細粒度控管。`,tags:["權限"],systemTags:["系統文件"],lastUpdateBy:"Admin",lastUpdateTime:"2025-03-10 09:00",updateNote:"初始建立，定義三種基礎角色與存取權限",sourceFiles:[],chunks:[{index:1,sectionPath:"一、角色定義",content:"初版角色權限說明，定義超級管理員、編輯者、檢視者三種基礎角色，並以模組層級劃分存取範圍。",tokenCount:214,sourceType:"text",gist:"說明後台系統初期規劃的三種基礎角色與各自可存取的模組範圍。",qaPairs:["後台一開始有哪些角色？","編輯者可以存取哪些模組？"],taxonomyTags:["系統文件/權限管理/角色定義"],citationCount:2}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:1,reviewNote:"首次建立後台角色權限規範，請審核後發佈。",reviewedBy:"Ethan",reviewedTime:"2025-03-10 09:20"},{id:"k2-v1.1",knowledgeId:"k2",versionNumber:"v1.1",versionType:"MINOR",status:"active",title:"後台角色權限說明",summary:"新增客服角色，補充工單中心相關權限規範",content:`# 後台角色權限說明

## 一、角色定義

因客服團隊需協助處理工單與查詢知識庫，新增「客服」角色，現共四種基礎角色。

| 角色 | 說明 | 可存取模組 |
|------|------|-----------|
| 超級管理員 | 系統所有功能之完整存取權限，含帳號與角色管理 | 全部模組 |
| 編輯者 | 可建立與編輯商品、知識庫等內容，無法變更系統設定 | 商品管理、知識庫、內容管理 |
| 客服 | 可處理工單、查詢知識庫，無編輯內容權限 | 工單中心、知識庫（唯讀） |
| 檢視者 | 僅可檢視資料，無任何編輯或刪除權限 | 全部模組（唯讀） |

## 二、權限矩陣

| 功能模組 | 超級管理員 | 編輯者 | 客服 | 檢視者 |
|---------|:---------:|:------:|:----:|:------:|
| 帳號與角色管理 | ✅ | ❌ | ❌ | ❌ |
| 商品管理 | ✅ | ✅ | ❌ | 👁️ |
| 知識庫管理 | ✅ | ✅ | 👁️ | 👁️ |
| 工單中心 | ✅ | ❌ | ✅ | 👁️ |
| 系統設定 | ✅ | ❌ | ❌ | ❌ |
| 操作紀錄查詢 | ✅ | ❌ | ❌ | 👁️ |

## 三、異動說明

- 新增「客服」角色，開放工單中心完整操作權限，並開放知識庫唯讀查詢，以利處理客戶問題。
- 編輯者角色存取範圍不變。

> ⚠️ 本版角色權限仍以「模組」為最小控管單位，尚未支援資料列（如特定商品分類、特定客戶群）層級的權限隔離，此限制將於下一次大改版處理。`,tags:["權限"],systemTags:["系統文件"],lastUpdateBy:"Rita",lastUpdateTime:"2025-11-20 16:40",updateNote:"新增客服角色，補充工單中心權限規範",sourceFiles:[],chunks:[{index:1,sectionPath:"一、角色定義",content:"新增「客服」角色，可處理工單、查詢知識庫，但無編輯內容權限，後台角色由三種擴增為四種。",tokenCount:236,sourceType:"text",gist:"說明新增客服角色的原因與其可存取的模組範圍。",qaPairs:["客服角色可以做什麼？","為什麼要新增客服角色？"],taxonomyTags:["系統文件/權限管理/角色定義"],citationCount:4},{index:2,sectionPath:"三、異動說明",content:"本次異動開放客服角色完整操作工單中心，並唯讀查詢知識庫；權限仍以模組層級控管，尚未支援資料列層級隔離。",tokenCount:198,sourceType:"text",gist:"列出本次版本異動的具體內容與尚未支援的權限限制。",qaPairs:["這次更新了什麼？","目前權限控管的限制是什麼？"],taxonomyTags:["系統文件/權限管理/版本異動"],citationCount:1}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:2,reviewNote:"新增客服角色，補充工單中心權限規範，請審核後發佈以取代 v1.0。",reviewedBy:"Ethan",reviewedTime:"2025-11-21 09:10"},{id:"k2-v1.2",knowledgeId:"k2",versionNumber:"v1.2",versionType:"MINOR",status:"approved",title:"後台角色權限說明",summary:"修正客服角色權限描述用語，避免誤解為可發佈內容",content:`# 後台角色權限說明

## 一、角色定義

因客服團隊需協助處理工單與查詢知識庫，新增「客服」角色，現共四種基礎角色。

| 角色 | 說明 | 可存取模組 |
|------|------|-----------|
| 超級管理員 | 系統所有功能之完整存取權限，含帳號與角色管理 | 全部模組 |
| 編輯者 | 可建立與編輯商品、知識庫等內容，無法變更系統設定 | 商品管理、知識庫、內容管理 |
| 客服 | 可處理工單、查詢知識庫（唯讀），不可編輯或發佈任何內容 | 工單中心、知識庫（唯讀） |
| 檢視者 | 僅可檢視資料，無任何編輯或刪除權限 | 全部模組（唯讀） |

## 二、權限矩陣

| 功能模組 | 超級管理員 | 編輯者 | 客服 | 檢視者 |
|---------|:---------:|:------:|:----:|:------:|
| 帳號與角色管理 | ✅ | ❌ | ❌ | ❌ |
| 商品管理 | ✅ | ✅ | ❌ | 👁️ |
| 知識庫管理 | ✅ | ✅ | 👁️ | 👁️ |
| 工單中心 | ✅ | ❌ | ✅ | 👁️ |
| 系統設定 | ✅ | ❌ | ❌ | ❌ |
| 操作紀錄查詢 | ✅ | ❌ | ❌ | 👁️ |

## 三、異動說明（v1.2 修訂）

- 修正「客服」角色說明用語：原「無編輯內容權限」易被誤解為僅限制編輯、仍可發佈，故修訂為「不可編輯或發佈任何內容」，語意更精確。
- 其餘角色定義與權限矩陣內容不變。

> ⚠️ 本版角色權限仍以「模組」為最小控管單位，尚未支援資料列（如特定商品分類、特定客戶群）層級的權限隔離，此限制將於下一次大改版（見 v2.0）處理。`,tags:["權限"],systemTags:["系統文件"],lastUpdateBy:"Rita",lastUpdateTime:"2026-03-18 10:20",updateNote:"修正客服角色權限描述用語，避免誤解為可發佈內容",sourceFiles:[],chunks:[{index:1,sectionPath:"三、異動說明（v1.2 修訂）",content:"修正客服角色說明用語，將「無編輯內容權限」改為「不可編輯或發佈任何內容」，避免誤解客服仍可發佈內容。",tokenCount:176,sourceType:"text",gist:"說明本次小改版修正的用詞，釐清客服角色確實無法發佈任何內容。",qaPairs:["客服角色可以發佈內容嗎？","這次修訂了什麼？"],taxonomyTags:["系統文件/權限管理/版本異動"],citationCount:1}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:1,reviewNote:"僅修正客服角色描述用語，未變動任何權限範圍，送審確認語意修正是否恰當。",reviewedBy:"Ethan",reviewedTime:"2026-03-19 09:40"},{id:"k2-v2.0",knowledgeId:"k2",versionNumber:"v2.0",versionType:"MAJOR",status:"reviewing",title:"後台角色權限說明 (新版)",summary:"重構權限體系後的說明文件，改採 6 角色制與模組／功能／資料三層級權限模型，並提供舊角色遷移對應表",content:`# 後台角色權限說明（新版）

> **文件版本**：v2.0｜**狀態**：審核中｜**適用範圍**：後台管理系統全模組
> 本次為權限體系的大版本重構，將取代 v1.x 沿用超過一年的三／四角色制，改採更細緻的角色與三層級權限模型。

---

## 一、重構背景

隨著後台功能模組持續擴增（工單中心、知識庫、行銷活動、報表中心等），舊版僅以「超級管理員 / 編輯者 / 客服 / 檢視者」四種角色劃分權限，已無法滿足下列需求：

- 部分角色需要「可編輯但不可發佈」的審核流程（例如知識庫版本需經人工審核才能上線）。
- 客服與行銷團隊的存取範圍經常重疊卻無法個別授權。
- 缺乏操作留痕與角色異動的稽核紀錄。

## 二、新版角色列表

| 角色 | 角色代碼 | 說明 |
|------|---------|------|
| 超級管理員 | \`SUPER_ADMIN\` | 系統所有功能之完整存取權限，唯一可管理角色與權限設定者 |
| 系統管理員 | \`SYS_ADMIN\` | 可管理帳號、API 來源、系統設定，無法變更角色權限本身 |
| 內容編輯 | \`CONTENT_EDITOR\` | 可建立/編輯商品、知識庫草稿，需送審後才可發佈 |
| 審核員 | \`REVIEWER\` | 可審核並發佈知識庫、商品內容變更，無建立權限 |
| 客服人員 | \`SUPPORT\` | 可處理工單、查詢知識庫（唯讀），無內容編輯權限 |
| 唯讀訪客 | \`VIEWER\` | 僅可檢視經發佈之資料，無任何操作權限 |

## 三、三層級權限模型

新版改採「模組 → 功能 → 資料」三層級控管，取代舊版單一模組層級的粗略劃分：

1. **模組層級**：可否進入該模組（例如「知識庫管理」）。
2. **功能層級**：模組內個別功能的存取（例如「建立版本」「核准發佈」「刪除條目」需分別授權）。
3. **資料層級**：依分類、來源或建立者限制可視範圍（例如客服僅能查看「客服知識」分類）。

### 權限矩陣（模組 × 角色）

| 功能模組 | 超級管理員 | 系統管理員 | 內容編輯 | 審核員 | 客服人員 | 唯讀訪客 |
|---------|:---------:|:---------:|:-------:|:------:|:-------:|:-------:|
| 帳號與角色管理 | ✅ | 👁️ | ❌ | ❌ | ❌ | ❌ |
| 商品管理（建立/編輯） | ✅ | ❌ | ✅ | ❌ | ❌ | 👁️ |
| 知識庫（建立草稿） | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| 知識庫（審核發佈） | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| 知識庫（唯讀查詢） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 工單中心 | ✅ | 👁️ | ❌ | ❌ | ✅ | ❌ |
| 系統設定 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 操作紀錄查詢 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

符號說明：✅ 完整存取｜👁️ 唯讀｜❌ 無權限

## 四、舊角色對應表（遷移指引）

既有帳號將依下表規則自動對應至新角色，遷移完成後舊角色定義即失效：

| 舊角色（v1.x） | 對應新角色 | 備註 |
|---------------|-----------|------|
| 超級管理員 | 超級管理員 | 無變動 |
| 編輯者 | 內容編輯 | 新增「送審」流程，不再可直接發佈 |
| 客服 | 客服人員 | 權限範圍不變 |
| 檢視者 | 唯讀訪客 | 無變動 |

> ⚠️ **重大變更**：舊版「編輯者」可直接發佈內容，新版「內容編輯」僅能建立草稿並送審，發佈權限收斂至「審核員」與「超級管理員」。此變更將影響 12 位既有編輯者帳號，需於上線前完成教育訓練與流程公告。

## 五、稽核與留痕

新版強制要求下列操作寫入稽核紀錄，供合規查詢：

- 角色指派與異動（由誰在何時指派給誰）
- 知識庫版本的送審／核准／退回紀錄
- 高風險操作（刪除、批次匯出）需二次確認並留痕

## 六、上線排程

| 階段 | 內容 | 預計時間 |
|------|------|---------|
| 審核 | 權限文件與角色矩陣人工審核 | 2026-04-01 ～ 2026-04-10 |
| 灰度 | 於系統管理員與審核員角色先行上線驗證 | 2026-04-11 ～ 2026-04-18 |
| 全量 | 全體帳號遷移至新角色體系，舊角色下線 | 2026-04-20 |`,tags:["權限","安全"],systemTags:["系統文件"],lastUpdateBy:"Rita",lastUpdateTime:"2026-04-01 11:00",updateNote:"大版本升級，改採 6 角色制與三層級權限模型，移除舊有角色定義",sourceFiles:[],chunks:[{index:1,sectionPath:"一、重構背景",content:"舊版四角色制無法滿足細緻審核流程、重疊權限與稽核留痕需求，因此進行 v2.0 重構。",tokenCount:268,sourceType:"text",gist:"說明本次權限體系重構的三大背景原因：缺乏送審流程、角色權限重疊、缺乏稽核留痕。",qaPairs:["為什麼要重構角色權限？","舊版權限制度有哪些問題？","新版要解決什麼痛點？"],taxonomyTags:["系統文件/權限管理/重構背景"],citationCount:3},{index:2,sectionPath:"二、新版角色列表",content:"新版共 6 種角色：超級管理員、系統管理員、內容編輯、審核員、客服人員、唯讀訪客，各角色代碼與說明如上表。",tokenCount:312,sourceType:"text",gist:"列出新版 6 種角色的代碼與職責範圍，取代舊版四角色制。",qaPairs:["新版有哪些角色？","審核員可以做什麼？","內容編輯和審核員的差別是什麼？","客服人員的權限範圍？"],taxonomyTags:["系統文件/權限管理/角色定義"],citationCount:8},{index:3,sectionPath:"三、三層級權限模型",content:"新版採「模組→功能→資料」三層級控管，並提供模組 × 角色權限矩陣，取代舊版單一模組層級劃分。",tokenCount:401,sourceType:"text",gist:"說明三層級權限模型的設計，並附上完整的模組 × 角色權限矩陣表。",qaPairs:["什麼是三層級權限模型？","功能層級和資料層級的差別？","審核員能否建立知識庫草稿？","客服人員能查詢知識庫嗎？"],taxonomyTags:["系統文件/權限管理/權限模型"],citationCount:15},{index:4,sectionPath:"四、舊角色對應表（遷移指引）",content:"舊角色將自動對應至新角色：編輯者→內容編輯（新增送審流程）、客服→客服人員、檢視者→唯讀訪客、超級管理員不變。",tokenCount:287,sourceType:"text",gist:"提供新舊角色對應規則，並提醒編輯者角色將新增送審流程，影響既有 12 位帳號。",qaPairs:["舊的編輯者帳號會變成什麼角色？","新角色遷移後編輯者還能直接發佈內容嗎？","有多少既有帳號受影響？"],taxonomyTags:["系統文件/權限管理/遷移指引"],citationCount:6},{index:5,sectionPath:"六、上線排程",content:"上線分三階段：審核（4/1-4/10）、灰度驗證（4/11-4/18）、全量（4/20），全體帳號將於全量階段遷移至新角色體系。",tokenCount:198,sourceType:"text",gist:"列出審核、灰度、全量三階段的上線時程規劃。",qaPairs:["新版權限什麼時候正式上線？","灰度驗證階段是哪些角色先行？","舊角色什麼時候下線？"],taxonomyTags:["系統文件/權限管理/上線排程"],citationCount:2}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:5,reviewNote:"已完成新版角色權限重構文件撰寫，權限矩陣與舊角色遷移對應表皆已確認，請審核後發佈以取代 v1.1 現行版本。",conversionLog:[{stage:"chunking",status:"success",startedAt:"2026-04-01 10:58",durationMs:2600,detail:{strategy:"Section-aware",chunkCount:5,avgTokens:293,imageCount:0,tableCount:4,sourceFormat:"MANUAL"}},{stage:"embedding",status:"success",startedAt:"2026-04-01 10:58",durationMs:6100,detail:{model:"text-embedding-3-large",dimension:3072,denseCount:5,sparseCount:5,batchSize:16}},{stage:"indexing",status:"success",startedAt:"2026-04-01 10:59",durationMs:210,detail:{collection:"knowledge_chunks",pointCount:5,indexType:"HNSW"}}]}]},{id:"k3",title:"客服 FAQ：退貨流程",category:"客服知識",status:"processing",sourceType:"FILE",pipelineProgress:60,pipelineStage:"embedding",pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-04-01 15:00",lastUpdateBy:"Jocelyn",versions:[{id:"k3-v1.0",knowledgeId:"k3",versionNumber:"v1.0",versionType:null,status:"draft",title:"客服 FAQ：退貨流程",summary:"草擬退貨 SOP",content:`1. 收到申請
2. 審核照片
3. 安排退貨...`,tags:["客服","退貨"],systemTags:[],lastUpdateBy:"Jocelyn",lastUpdateTime:"2026-04-01 15:00",updateNote:"初始草稿",sourceFiles:[],chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0}]},{id:"k4",title:"信用卡申辦資格說明",category:"產品資訊",status:"needs_update",sourceType:"FILE",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!0,staleSourceFileIds:["res-cc-1"],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-04-12 09:00",lastUpdateBy:"Alice",versions:[{id:"k4-v1.3",knowledgeId:"k4",versionNumber:"v1.3",versionType:"MINOR",status:"active",title:"信用卡申辦資格說明",summary:"說明各卡種申辦條件",content:`## 申辦資格

年滿 20 歲，年收入 30 萬以上...`,tags:["信用卡","申辦"],systemTags:["產品資訊"],lastUpdateBy:"Alice",lastUpdateTime:"2026-04-12 09:00",updateNote:"更新年收入門檻",sourceFiles:[{fileId:"res-cc-1",fileName:"信用卡申辦規則_2026Q1.pdf",linkedVersion:1}],chunks:[{index:1,content:"申辦資格：年滿 20 歲，年收入 30 萬以上，需提供薪資證明或最近一年報稅資料，外籍人士另需居留證。",tokenCount:198,sourceType:"text"}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:1}]},{id:"k5",title:"商品目錄即時資料",category:"商品文件",status:"active",sourceType:"API",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:"2026-04-12 09:00",apiSourceId:"api-1",apiSourceName:"商品目錄 API",lastUpdateTime:"2026-04-12 09:00",lastUpdateBy:"API 同步",versions:[{id:"k5-v3.0",knowledgeId:"k5",versionNumber:"v3.0",versionType:"MAJOR",status:"active",title:"商品目錄即時資料",summary:"由商品目錄 API 同步更新，涵蓋 2026 春夏主打選品、即時庫存狀態與最新定價活動，共 3 個知識單元。",content:`# 商品目錄即時資料（2026-04-12 最新同步）

> **資料來源**：商品目錄 API｜**同步時間**：2026-04-12 09:00｜**版本**：v3.0

---

## 一、2026 春夏主打選品

本季主打商品共 **11 款**，含 8 款新品與 3 款延續熱銷品項。

| 商品編號 | 品名 | 類型 | 建議陳列 |
|---------|------|------|---------|
| P2026-S01 | 輕量透氣上衣 | 新品 | 主視覺區 |
| P2026-S02 | 彈性機能褲 | 新品 | 搭配區 |
| P2026-S03 | UPF50 防曬外套 | 新品 | 主視覺區 |
| P2026-S04 | 涼感短袖T恤 | 新品 | 平台陳列 |
| P2026-C01 | 經典素色Polo衫 | 延續 | 側牆掛架 |
| P2026-C02 | 百搭直筒牛仔褲 | 延續 | 搭配區 |

促銷時程：4/15–5/31 春夏新品 85 折，滿 2,000 加購配件 7 折。

---

## 二、即時庫存狀態

庫存狀態每日 08:00 同步更新，客服查詢時請以本資料為準。

| 狀態 | 代表意義 | 庫存量 |
|------|---------|--------|
| 🟢 正常 | 可正常供貨 | ≥ 50 件 |
| 🟡 低庫存 | 建議詢問到貨日 | 1–19 件 |
| 🔴 售完 | 無法出貨，引導至預購 | 0 件 |

**目前低庫存警示品項**（截至 2026-04-12）：
- P2026-S03 UPF50 防曬外套：剩 12 件，預計 4/20 補貨
- P2026-C01 經典素色Polo衫：剩 8 件，不補貨

---

## 三、定價與優惠活動

| 活動名稱 | 折扣 | 適用品項 | 期間 |
|---------|------|---------|------|
| 春夏新品優惠 | 85 折 | P2026-S01~S04 | 4/15–5/31 |
| 延續款清倉 | 7 折 | P2026-C01~C02 | 5/1–5/31 |
| 會員專屬加碼 | 額外 95 折 | 全品項 | 長期 |

> ⚠️ **客服注意事項**：促銷折扣不得與員工優惠併用；延續款清倉活動不接受退換貨。`,tags:["商品","API"],systemTags:["商品文件"],lastUpdateBy:"API 同步",lastUpdateTime:"2026-04-12 09:00",updateNote:"API 自動同步，新增春夏選品 11 款，更新庫存與定價活動資料",sourceFiles:[],chunks:[{index:1,sectionPath:"一、2026 春夏主打選品",content:"本季主打商品共 11 款，含 8 款新品與 3 款延續熱銷品項，附建議陳列方式。促銷時程：4/15–5/31 春夏新品 85 折，滿 2,000 加購配件 7 折。",tokenCount:428,sourceType:"text",gist:"2026 春夏主打共 11 款（8 款新品、3 款延續款），說明各品項建議陳列位置與促銷時程。",qaPairs:["2026 春夏有哪些新品？","延續熱銷品項有哪些？","春夏促銷期間是什麼時候？","滿額加購優惠的條件？","陳列位置如何安排？"],taxonomyTags:["商品文件/季節商品/春夏選品"],citationCount:5},{index:2,sectionPath:"二、即時庫存狀態",content:"庫存狀態每日 08:00 同步更新。綠色（≥50件）正常、黃色（1–19件）低庫存、紅色（0件）售完。目前低庫存：P2026-S03 剩 12 件預計 4/20 補貨；P2026-C01 剩 8 件不補貨。",tokenCount:356,sourceType:"text",gist:"說明庫存狀態色碼規則，並列出目前低庫存品項與預計補貨資訊，供客服即時查詢使用。",qaPairs:["庫存狀態如何判讀？","低庫存的定義是什麼？","售完商品何時補貨？","P2026-S03 何時補貨？","P2026-C01 還會補貨嗎？"],taxonomyTags:["商品文件/庫存管理/即時狀態"],citationCount:22},{index:3,sectionPath:"三、定價與優惠活動",content:"春夏新品 85 折（4/15–5/31）；延續款清倉 7 折（5/1–5/31）；會員額外 95 折長期有效。折扣不與員工優惠併用，清倉活動不接受退換貨。",tokenCount:389,sourceType:"text",gist:"彙整目前進行中的促銷活動，包含折扣幅度、適用品項、期間及注意事項。",qaPairs:["目前有哪些優惠活動？","折扣可以疊加嗎？","會員優惠如何計算？","清倉商品可以退換貨嗎？","春夏新品優惠什麼時候結束？"],taxonomyTags:["商品文件/價格管理/優惠活動"],citationCount:9}],embeddingModel:"BAAI/bge-m3",embeddingDimension:1024,embeddingCount:3,conversionLog:[{stage:"chunking",status:"success",startedAt:"2026-04-12 08:55",durationMs:4100,detail:{strategy:"Section-aware",chunkCount:3,avgTokens:391,imageCount:0,tableCount:2,sourceFormat:"API"}},{stage:"embedding",status:"success",startedAt:"2026-04-12 08:55",durationMs:9300,detail:{model:"BAAI/bge-m3",dimension:1024,denseCount:3,sparseCount:3,batchSize:32}},{stage:"indexing",status:"success",startedAt:"2026-04-12 08:56",durationMs:380,detail:{collection:"knowledge_chunks",pointCount:3,indexType:"HNSW"}}]}]},{id:"k6",title:"外幣業務操作手冊 v2.0",category:"規則說明",status:"failed",sourceType:"FILE",pipelineProgress:45,pipelineStage:"embedding",pipelineError:`EmbeddingError: CUDA out of memory. Tried to allocate 2.5 GiB
(GPU 0; 24.0 GiB total capacity)
at /opt/bge-m3/model.py:line 234
RuntimeError: CUBLAS_STATUS_ALLOC_FAILED when calling cublasCreate(handle)`,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-05-30 03:15",lastUpdateBy:"Pipeline",versions:[{id:"k6-v2.0",knowledgeId:"k6",versionNumber:"v2.0",versionType:"MAJOR",status:"draft",title:"外幣業務操作手冊 v2.0",summary:"新版外幣業務操作手冊，涵蓋即期、遠期及換匯交易流程",content:`## 第一章 外幣業務概述

本手冊適用於本行所有外幣業務人員...`,tags:["外幣","業務手冊"],systemTags:["規則說明"],lastUpdateBy:"Pipeline",lastUpdateTime:"2026-05-30 03:15",updateNote:"大版本更新，重構章節結構",sourceFiles:[{fileId:"res-forex-1",fileName:"外幣業務操作手冊_2026v2.pdf",linkedVersion:1}],chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0}]},{id:"k7",title:"2026Q1產品銷售數據彙總",category:"商品文件",status:"active",sourceType:"FILE",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-07-01 09:00",lastUpdateBy:"Lucas",versions:[{id:"k7-v1.0",knowledgeId:"k7",versionNumber:"v1.0",versionType:"MAJOR",status:"active",title:"2026Q1產品銷售數據彙總",summary:"2026年6月（上月）產品銷售數據彙總，含總營業額、品類佔比與熱銷品項明細。",content:`# 2026年6月產品銷售數據彙總

總營業額 NT$19,650,000，較上月成長 6.1%，熱銷品項 10 項，訂單數約 3,420 筆。品類佔比：涼鞋 30%、機能健走鞋 26%、靴類 25%、生活配件 12%、拖鞋 7%。`,tags:["銷售","產品部"],systemTags:["商品文件"],lastUpdateBy:"Lucas",lastUpdateTime:"2026-07-01 09:00",updateNote:"建立 2026年6月銷售數據彙總",sourceFiles:[{fileId:"res-sales-2026-06",fileName:"2026年6月銷售明細.xlsx",linkedVersion:1}],chunks:[{index:1,sectionPath:"一、銷售總覽",content:"2026年6月總營業額 NT$19,650,000，較上月成長 6.1%。訂單數約 3,420 筆，熱銷品項共 10 項。品類佔比：涼鞋 30%、機能健走鞋 26%、靴類 25%、生活配件 12%、拖鞋 7%。",tokenCount:268,sourceType:"text",gist:"2026年6月銷售總覽：總營業額 NT$19,650,000、較上月成長 6.1%、熱銷品項 10 項、品類佔比明細。",qaPairs:["2026年6月總營業額是多少？","較上月成長多少？","這個月熱銷品項有幾項？","各品類佔比如何分配？"],taxonomyTags:["商品文件/銷售報表/月度彙總"],citationCount:3},{index:2,sectionPath:"二、熱銷品項明細",content:"熱銷前五名：UGG Classic Mini II 雪靴（NT$3,720,000）、Hurricane Trailsetter 健走鞋（NT$3,348,000）、TEVA Hurricane XLT2 涼鞋（NT$2,795,000）、TEVA Original Universal（NT$1,988,000）、Hurricane Verge 水陸機能鞋（NT$1,672,000）。",tokenCount:245,sourceType:"text",gist:"列出 2026年6月銷售金額前五名的品項與對應營業額。",qaPairs:["這個月賣最好的商品是什麼？","UGG Classic Mini II 賣了多少錢？","熱銷前五名有哪些？"],taxonomyTags:["商品文件/銷售報表/熱銷品項"],citationCount:2}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:2}]},{id:"k8",title:"三諾產品部輸出報告規範 v1.0",category:"規則說明",status:"active",sourceType:"FILE",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-03-02 14:20",lastUpdateBy:"Admin",versions:[{id:"k8-v1.0",knowledgeId:"k8",versionNumber:"v1.0",versionType:"MAJOR",status:"active",title:"三諾產品部輸出報告規範 v1.0",summary:"三諾產品部對外輸出報告的必要章節、視覺風格與命名規則。",content:`# 三諾產品部輸出報告規範

所有對外輸出報告須包含摘要卡、品類佔比、明細表格三個區塊，並沿用部門既定的視覺配色與檔名規則。`,tags:["報告規範","產品部"],systemTags:["規則說明"],lastUpdateBy:"Admin",lastUpdateTime:"2026-03-02 14:20",updateNote:"初版發布",sourceFiles:[{fileId:"res-report-spec-1",fileName:"三諾產品部輸出報告規範.pdf",linkedVersion:1}],chunks:[{index:1,sectionPath:"一、必要章節",content:"報告須包含三個區塊：（1）摘要卡：總營業額、較上月成長、熱銷品項數、訂單數；（2）品類佔比：以 chip 形式呈現各品類銷售佔比；（3）明細表格：至少含品名、品牌、類別、銷售數量、銷售金額、較上月成長六個欄位。",tokenCount:312,sourceType:"text",gist:"報告必須包含摘要卡、品類佔比、明細表格三個區塊，並列出各區塊的必要欄位。",qaPairs:["報告一定要有哪些區塊？","摘要卡要放哪些數字？","明細表格至少要有哪些欄位？"],taxonomyTags:["規則說明/報告規範/必要章節"],citationCount:4},{index:2,sectionPath:"二、視覺與命名規則",content:"視覺風格沿用部門既有報告色票（CSS 變數命名慣例：--bg、--surface、--border、--blue）；輸出檔名格式為 sanuo_西元年_兩位數月份_sales_report.html。",tokenCount:198,sourceType:"text",gist:"說明報告的配色 CSS 變數慣例與輸出檔名的命名規則。",qaPairs:["報告的配色規則是什麼？","報告檔名要怎麼命名？"],taxonomyTags:["規則說明/報告規範/視覺與命名"],citationCount:1}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:2}]},{id:"k13",title:"TEVA涼鞋2026Q2通路銷售數據彙總",category:"商品文件",status:"active",sourceType:"FILE",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-07-05 10:00",lastUpdateBy:"Lucas",versions:[{id:"k13-v1.0",knowledgeId:"k13",versionNumber:"v1.0",versionType:"MAJOR",status:"active",title:"TEVA涼鞋2026Q2通路銷售數據彙總",summary:"TEVA涼鞋2026年第二季（4-6月）各通路銷售額、年成長率與熱銷款式彙總。",content:`# TEVA涼鞋 2026Q2 通路銷售數據彙總

總銷售額 NT$51,200,000，較去年同期成長 12.6%。通路別：官網直營 1,240萬（+18%）、天貓旗艦店 980萬（+32%）、蝦皮商城 760萬（+9%）、實體門市 1,530萬（-4%）、經銷通路 610萬（+6%）。`,tags:["銷售","TEVA","通路"],systemTags:["商品文件"],lastUpdateBy:"Lucas",lastUpdateTime:"2026-07-05 10:00",updateNote:"建立 2026Q2 TEVA涼鞋通路銷售數據彙總",sourceFiles:[{fileId:"res-teva-sales-2026-q2",fileName:"TEVA_2026Q2銷售明細.xlsx",linkedVersion:1}],chunks:[{index:1,sectionPath:"一、通路銷售總覽",content:"TEVA涼鞋2026Q2總銷售額 NT$51,200,000，較去年同期成長 12.6%。五大通路：官網直營 1,240萬元（YoY +18%）、天貓旗艦店 980萬元（YoY +32%）、蝦皮商城 760萬元（YoY +9%）、實體門市 1,530萬元（YoY -4%）、經銷通路 610萬元（YoY +6%）。",tokenCount:256,sourceType:"text",gist:"TEVA涼鞋2026Q2各通路銷售額與年成長率彙總。",qaPairs:["TEVA涼鞋這一季總銷售額是多少？","哪個通路成長最快？","實體門市這一季表現如何？"],taxonomyTags:["商品文件/銷售報表/通路彙總"],citationCount:2},{index:2,sectionPath:"二、熱銷款式與尺碼分布",content:"熱銷前三名款式：TEVA Hurricane XLT2（占通路總銷量 28%）、TEVA Original Universal（22%）、TEVA Midform Universal（15%）。尺碼分布集中於 US 7-9（女）與 US 9-11（男），合計占比 64%。",tokenCount:210,sourceType:"text",gist:"TEVA涼鞋熱銷款式排行與主力尺碼分布。",qaPairs:["這一季賣最好的TEVA款式是什麼？","尺碼主要集中在哪個區間？"],taxonomyTags:["商品文件/銷售報表/熱銷款式"],citationCount:1}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:2}]},{id:"k14",title:"TEVA會員CRM分群與回購定義",category:"規則說明",status:"active",sourceType:"FILE",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-02-10 11:00",lastUpdateBy:"Admin",versions:[{id:"k14-v1.0",knowledgeId:"k14",versionNumber:"v1.0",versionType:"MAJOR",status:"active",title:"TEVA會員CRM分群與回購定義",summary:"會員分群邏輯：新會員／回購會員的定義與回購期間門檻。",content:`# TEVA會員CRM分群與回購定義

新會員：首次購買 TEVA 商品且無 12 個月內購買紀錄；回購會員：12 個月內有第 2 次（含）以上購買紀錄。2026Q2 回購會員占比 68%。`,tags:["會員","CRM","TEVA"],systemTags:["規則說明"],lastUpdateBy:"Admin",lastUpdateTime:"2026-02-10 11:00",updateNote:"初版發布",sourceFiles:[{fileId:"res-teva-crm-def",fileName:"TEVA會員CRM分群定義.pdf",linkedVersion:1}],chunks:[{index:1,sectionPath:"一、會員分群定義",content:"新會員：首次購買 TEVA 商品，且過去 12 個月內無其他購買紀錄。回購會員：過去 12 個月內累計購買達 2 次（含）以上。分群依購買時間軸每月重新計算一次。",tokenCount:220,sourceType:"text",gist:"說明新會員與回購會員的判定條件與計算週期。",qaPairs:["什麼是回購會員？","新會員怎麼定義？","分群多久重新計算一次？"],taxonomyTags:["規則說明/會員規則/分群定義"],citationCount:3},{index:2,sectionPath:"二、2026Q2回購結構",content:"2026Q2 TEVA涼鞋購買會員中，回購會員占比 68%，新會員占比 32%。回購會員平均年貢獻金額為新會員的 2.3 倍。",tokenCount:168,sourceType:"text",gist:"2026Q2 TEVA涼鞋會員回購占比與貢獻度比較。",qaPairs:["這一季回購會員占比多少？","回購會員貢獻度跟新會員比起來如何？"],taxonomyTags:["規則說明/會員規則/回購結構"],citationCount:1}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:2}]},{id:"k9",title:"Teva 商品庫存即時資料",category:"商品文件",status:"active",sourceType:"API",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:"2026-07-30 08:00",apiSourceId:"api-3",apiSourceName:"Teva 商品庫存 API",lastUpdateTime:"2026-07-30 08:00",lastUpdateBy:"API 同步",versions:[{id:"k9-v1.0",knowledgeId:"k9",versionNumber:"v1.0",versionType:"MAJOR",status:"active",title:"Teva 商品庫存即時資料",summary:"由 Teva 商品庫存 API 同步更新，涵蓋主力品項現有庫存量與低庫存警示，共 2 個知識單元。",content:`# Teva 商品庫存即時資料（2026-07-30 最新同步）

> **資料來源**：Teva 商品庫存 API｜**同步時間**：2026-07-30 08:00｜**版本**：v1.0

---

## 一、Teva 商品線總覽

| 商品編號 | 品名 | 現有庫存 | 狀態 |
|---------|------|---------|------|
| TEVA-XLT2-2026 | TEVA Hurricane XLT2 涼鞋 | 320 件 | 🟢 正常 |
| TEVA-VERGE-2026 | TEVA Hurricane Verge 水陸機能鞋 | 210 件 | 🟢 正常 |
| TEVA-RIDGE-2026 | TEVA Ridgeview 秋冬機能涼鞋（新品） | 260 件 | 🟢 正常，新品剛到貨 |
| TEVA-OU-2026 | TEVA Original Universal | 18 件 | 🟡 低庫存 |

---

## 二、低庫存警示

**TEVA Original Universal**（現有庫存 18 件）：因 6 月銷售暢旺（單月銷售額 NT$1,988,000，為當月熱銷第 4 名），現貨去化速度快，目前僅剩 18 件，預計 8/20 補貨到位。⚠️ **不建議作為大規模曝光的主打商品**，適合改以限量／稀缺角度操作。`,tags:["商品","Teva","API"],systemTags:["商品文件"],lastUpdateBy:"API 同步",lastUpdateTime:"2026-07-30 08:00",updateNote:"API 自動同步，更新 Teva 商品線庫存與低庫存警示",sourceFiles:[],chunks:[{index:1,sectionPath:"一、Teva 商品線總覽",content:"Teva 商品線現有庫存：Hurricane XLT2 320 件（正常）、Hurricane Verge 210 件（正常）、新品 Ridgeview 260 件（正常，剛到貨）、Original Universal 18 件（低庫存）。",tokenCount:312,sourceType:"text",gist:"列出 Teva 四款主力品項的現有庫存量與狀態燈號。",qaPairs:["Teva 目前有哪些主力品項？","Hurricane XLT2 現在庫存多少？","新品 Ridgeview 庫存狀況如何？","哪一款 Teva 商品庫存偏低？"],taxonomyTags:["商品文件/庫存管理/Teva商品線"],citationCount:3},{index:2,sectionPath:"二、低庫存警示",content:"Original Universal 因 6 月銷售暢旺（NT$1,988,000，當月熱銷第4名）去化快，現貨僅剩 18 件，預計 8/20 補貨。不建議作為大規模曝光主打，適合改以限量／稀缺角度操作。",tokenCount:268,sourceType:"text",gist:"Original Universal 因熱賣導致庫存偏低，說明原因、補貨時程與行銷操作建議。",qaPairs:["Original Universal 為什麼庫存只剩18件？","Original Universal 何時補貨？","庫存這麼低適合當促銷主打嗎？","低庫存商品可以怎麼操作行銷？"],taxonomyTags:["商品文件/庫存管理/低庫存警示"],citationCount:6}],embeddingModel:"BAAI/bge-m3",embeddingDimension:1024,embeddingCount:2}]},{id:"k10",title:"2026換季社群輿情彙整",category:"市場情報",status:"active",sourceType:"API",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:"2026-07-29 07:00",apiSourceId:"api-4",apiSourceName:"社群輿情監測 API",lastUpdateTime:"2026-07-29 07:00",lastUpdateBy:"API 同步",versions:[{id:"k10-v1.0",knowledgeId:"k10",versionNumber:"v1.0",versionType:"MAJOR",status:"active",title:"2026換季社群輿情彙整",summary:"社群輿情監測 API 彙整近期機能戶外穿搭聲量與熱門標籤、色彩偏好，共 1 個知識單元。",content:`# 2026換季社群輿情彙整（2026-07-29 最新同步）

> **資料來源**：社群輿情監測 API｜**同步時間**：2026-07-29 07:00｜**版本**：v1.0

---

## 一、社群聲量與熱門標籤

近 30 天「機能涼鞋」「戶外機能穿搭」相關貼文聲量較上季成長 42%。熱門標籤：#機能涼鞋 #水陸兩用 #Gorpcore #秋冬過渡穿搭。使用者偏好色彩以大地色系（卡其、軍綠、棕）為主，搭配螢光點綴色（螢光黃、螢光橘）作為視覺焦點。`,tags:["市場情報","社群","Teva"],systemTags:["市場情報"],lastUpdateBy:"API 同步",lastUpdateTime:"2026-07-29 07:00",updateNote:"API 自動同步，更新換季社群聲量與色彩偏好",sourceFiles:[],chunks:[{index:1,sectionPath:"一、社群聲量與熱門標籤",content:"近30天機能涼鞋／戶外機能穿搭聲量較上季成長42%。熱門標籤：#機能涼鞋 #水陸兩用 #Gorpcore #秋冬過渡穿搭。色彩偏好：大地色系為主，螢光點綴色為視覺焦點。",tokenCount:245,sourceType:"text",gist:"說明近期社群上機能戶外穿搭的聲量成長幅度、熱門標籤與色彩偏好。",qaPairs:["機能涼鞋在社群上的聲量如何？","目前有哪些熱門標籤？","消費者偏好什麼顏色？"],taxonomyTags:["市場情報/社群輿情/換季趨勢"],citationCount:4}],embeddingModel:"BAAI/bge-m3",embeddingDimension:1024,embeddingCount:1}]},{id:"k11",title:"時尚雜誌趨勢報導彙整",category:"市場情報",status:"active",sourceType:"FILE",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-07-25 10:00",lastUpdateBy:"Ivy",versions:[{id:"k11-v1.0",knowledgeId:"k11",versionNumber:"v1.0",versionType:"MAJOR",status:"active",title:"時尚雜誌趨勢報導彙整",summary:"彙整近期時尚雜誌對機能穿搭與永續材質趨勢的報導重點，共 1 個知識單元。",content:`# 時尚雜誌趨勢報導彙整

彙整國內外時尚雜誌 7 月報導重點：Gorpcore（機能露營風）持續發燒，機能涼鞋搭配機能襪成為秋冬過渡穿搭示範重點；多篇報導點名永續回收材質是各品牌本季行銷主打話題。`,tags:["市場情報","雜誌","Teva"],systemTags:["市場情報"],lastUpdateBy:"Ivy",lastUpdateTime:"2026-07-25 10:00",updateNote:"彙整7月時尚雜誌報導重點",sourceFiles:[{fileId:"res-magazine-trend-2026-07",fileName:"2026年7月時尚雜誌趨勢彙整.pdf",linkedVersion:1}],chunks:[{index:1,sectionPath:"一、機能穿搭與永續材質趨勢",content:"Gorpcore機能露營風持續發燒，機能涼鞋+機能襪成秋冬過渡穿搭示範重點；永續回收材質是各品牌本季行銷主打話題。",tokenCount:210,sourceType:"text",gist:"說明時尚雜誌報導的機能穿搭風格與永續材質行銷話題。",qaPairs:["時尚雜誌現在都在報導什麼穿搭風格？","機能涼鞋要怎麼搭配？","永續材質是熱門話題嗎？"],taxonomyTags:["市場情報/雜誌報導/機能穿搭"],citationCount:2}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:1}]},{id:"k12",title:"戶外機能鞋產業趨勢報告",category:"市場情報",status:"active",sourceType:"FILE",pipelineProgress:100,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:"2026-07-20 09:30",lastUpdateBy:"Ivy",versions:[{id:"k12-v1.0",knowledgeId:"k12",versionNumber:"v1.0",versionType:"MAJOR",status:"active",title:"戶外機能鞋產業趨勢報告",summary:"產業分析報告彙整戶外機能鞋市場成長率、材質偏好與競品促銷風險，共 1 個知識單元。",content:`# 戶外機能鞋產業趨勢報告

2026年戶外機能鞋市場年增率預估達 11%；消費者對永續回收材質的偏好持續上升。需留意競品品牌陸續祭出換季促銷折扣，價格戰風險升高，建議促銷方案應同步規劃差異化話題操作，而非單純比價。`,tags:["市場情報","產業報告","Teva"],systemTags:["市場情報"],lastUpdateBy:"Ivy",lastUpdateTime:"2026-07-20 09:30",updateNote:"新增2026戶外機能鞋產業趨勢報告",sourceFiles:[{fileId:"res-industry-trend-2026",fileName:"2026戶外機能鞋產業趨勢報告.pdf",linkedVersion:1}],chunks:[{index:1,sectionPath:"一、市場成長與競品風險",content:"2026年戶外機能鞋市場年增率預估11%；消費者對永續回收材質偏好上升；競品陸續祭出換季促銷，價格戰風險升高，建議搭配差異化話題操作。",tokenCount:232,sourceType:"text",gist:"說明戶外機能鞋市場成長率、材質偏好趨勢，以及競品促銷帶來的價格戰風險。",qaPairs:["戶外機能鞋市場成長率多少？","消費者材質偏好趨勢是什麼？","競品促銷會帶來什麼風險？"],taxonomyTags:["市場情報/產業報告/市場趨勢"],citationCount:3}],embeddingModel:"text-embedding-3-large",embeddingDimension:3072,embeddingCount:1}]}]),m=k([{id:"api-1",name:"商品目錄 API",url:"https://api.example.com/products",method:"GET",headers:[{key:"Authorization",value:"Bearer demo-token"}],body:"",titleField:"productName",contentField:"description",schedule:"DAILY",enabled:!0,lastSyncAt:"2026-04-12 09:00",lastSyncStatus:"SUCCESS",lastSyncCount:5,lastSyncError:null},{id:"api-2",name:"庫存狀態 API",url:"https://erp.internal/inventory",method:"POST",headers:[{key:"X-API-Key",value:"erp-key-456"}],body:'{"storeId": "TW001"}',titleField:"itemName",contentField:"stockInfo",schedule:"MANUAL",enabled:!1,lastSyncAt:"2026-04-10 14:30",lastSyncStatus:"FAILED",lastSyncCount:0,lastSyncError:"連線逾時：無法連接至 erp.internal"},{id:"api-3",name:"Teva 商品庫存 API",url:"https://erp.internal/teva/inventory",method:"GET",headers:[{key:"X-API-Key",value:"erp-key-teva-01"}],body:"",titleField:"skuName",contentField:"stockQty",schedule:"DAILY",enabled:!0,lastSyncAt:"2026-07-30 08:00",lastSyncStatus:"SUCCESS",lastSyncCount:4,lastSyncError:null},{id:"api-4",name:"社群輿情監測 API",url:"https://social-listening.example.com/reports",method:"GET",headers:[{key:"Authorization",value:"Bearer social-demo-token"}],body:"",titleField:"topic",contentField:"summary",schedule:"DAILY",enabled:!0,lastSyncAt:"2026-07-29 07:00",lastSyncStatus:"SUCCESS",lastSyncCount:1,lastSyncError:null}]),p=i=>l.value.find(e=>e.id===i),N=(i,e)=>p(i)?.versions.find(n=>n.id===e);function v(i,e){i.activityLog||(i.activityLog=[]),i.activityLog.push({id:`act-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,...e})}const A=(i,e,t)=>{const n=p(i);if(!n)return;const s=n.versions.find(c=>c.status==="active");if(!s)return;const o=s.versionNumber,[a,u]=o.replace("v","").split(".").map(Number),d=e==="MAJOR"?`v${a+1}.0`:`v${a}.${u+1}`,r={...JSON.parse(JSON.stringify(s)),id:`${d}-draft-${Date.now()}`,versionNumber:d,status:"draft",lastUpdateBy:"Current User",lastUpdateTime:new Date().toISOString().replace("T"," ").slice(0,16),updateNote:t};return n.versions.push(r),r.id},U=(i,e,t)=>{const n=p(i);if(!n)return;const s=n.versions.find(o=>o.id===e);s&&s.status==="draft"&&(Object.assign(s,t),s.lastUpdateTime=new Date().toISOString().replace("T"," ").slice(0,16),n.lastUpdateTime=s.lastUpdateTime)},P=(i,e,t,n)=>{const s=p(i);if(!s)return;const o=s.versions.find(a=>a.id===e);if(o&&(o.status==="draft"||o.status==="rejected")){const a=new Date().toISOString().replace("T"," ").slice(0,16);o.status="reviewing",o.reviewNote=n,s.status="reviewing",v(s,{action:"SUBMITTED",by:t,time:a,versionId:o.id,versionNumber:o.versionNumber,note:n})}},w=(i,e,t)=>{const n=p(i);if(!n)return;const s=n.versions.find(g=>g.id===e);if(!s)return;const o=n.versions.find(g=>g.status==="active"),a=o?o.versionNumber:s.versionNumber,[u,d]=a.replace("v","").split(".").map(Number),r=`v${u}.${d+1}`,c={...JSON.parse(JSON.stringify(s)),id:`${r}-restore-${Date.now()}`,versionNumber:r,status:"draft",updateNote:`還原自 ${s.versionNumber}：${t}`,lastUpdateTime:new Date().toISOString().replace("T"," ").slice(0,16)};return n.versions.push(c),n.status="pending",c.id},h=(i,e,t)=>{const n=p(i);if(!n)return;const s=n.versions.find(r=>r.id===e);if(!s||s.status!=="reviewing")return;const o=new Date().toISOString().replace("T"," ").slice(0,16),a=n.versions.find(r=>r.status==="active"),u=new Set((a?.sourceFiles??[]).map(r=>r.fileId)),d=new Set(s.sourceFiles.map(r=>r.fileId));for(const r of n.versions)r.status==="active"&&(r.status="history");if(s.status="active",s.reviewedBy="Current User",s.reviewedTime=o,v(n,{action:"APPROVED",by:"Current User",time:o,versionId:s.id,versionNumber:s.versionNumber}),v(n,{action:"PUBLISHED",by:"Current User",time:o,versionId:s.id,versionNumber:s.versionNumber}),t){const r=[...d].filter(g=>!u.has(g)),c=[...u].filter(g=>!d.has(g));(r.length||c.length)&&t({added:r,removed:c,knowledgeId:i})}n.lastUpdateBy="Current User",n.sourceType==="MANUAL"?(n.status="processing",setTimeout(()=>{n.status="active",n.lastUpdateTime=new Date().toISOString().replace("T"," ").slice(0,16)},2e3)):(n.status="active",n.lastUpdateTime=o)},C=(i,e)=>{const t=p(i);if(!t)return;const n=t.versions.find(a=>a.id===e);if(!n||n.status!=="history")return;const s=new Date().toISOString().replace("T"," ").slice(0,16),o=t.versions.find(a=>a.status==="active");for(const a of t.versions)a.status==="active"&&(a.status="history");n.status="active",t.status="active",t.lastUpdateTime=s,t.lastUpdateBy="Current User",v(t,{action:"SWITCHED",by:"Current User",time:s,versionId:n.id,versionNumber:n.versionNumber,replacedVersionId:o?.id,replacedVersionNumber:o?.versionNumber})},E=(i,e)=>{const t=p(i);if(!t)return;const n=t.versions.find(o=>o.id===e);if(!n||n.status!=="approved")return;const s=new Date().toISOString().replace("T"," ").slice(0,16);for(const o of t.versions)o.status==="active"&&(o.status="history");n.status="active",t.lastUpdateBy="Current User",v(t,{action:"PUBLISHED",by:"Current User",time:s,versionId:n.id,versionNumber:n.versionNumber}),t.sourceType==="MANUAL"?(t.status="processing",setTimeout(()=>{t.status="active",t.lastUpdateTime=new Date().toISOString().replace("T"," ").slice(0,16)},2e3)):(t.status="active",t.lastUpdateTime=s)},x=(i,e)=>{const t=p(i);if(!t)return;const n=t.versions.find(o=>o.id===e);if(!n||n.status!=="reviewing")return;const s=new Date().toISOString().replace("T"," ").slice(0,16);n.status="approved",n.reviewedBy="Current User",n.reviewedTime=s,t.status="approved",t.lastUpdateBy="Current User",v(t,{action:"APPROVED",by:"Current User",time:s,versionId:n.id,versionNumber:n.versionNumber})},F=(i,e,t)=>{const n=p(i);if(!n)return;const s=n.versions.find(a=>a.id===e);if(!s||s.status!=="reviewing")return;const o=new Date().toISOString().replace("T"," ").slice(0,16);s.status="rejected",s.reviewFeedback=t,n.status="pending",v(n,{action:"REJECTED",by:"Current User",time:o,versionId:s.id,versionNumber:s.versionNumber,note:t})},D=(i,e)=>{const t=p(i);if(!t)return;const n=t.versions.find(o=>o.id===e);if(!n||n.status!=="reviewing")return;const s=new Date().toISOString().replace("T"," ").slice(0,16);n.status="draft",t.status="pending",v(t,{action:"WITHDRAWN",by:"Current User",time:s,versionId:n.id,versionNumber:n.versionNumber})},$=i=>{const e=i.files[0],t=new Date().toISOString().replace("T"," ").slice(0,16),n=`k-${Date.now()}`,s=`v1.0-draft-${Date.now()}`,o=e.fileName.replace(/\.[^.]+$/,""),a=i.files.length>1?`由「${e.fileName}」等 ${i.files.length} 個來源檔案生成的知識條目草稿`:`由「${e.fileName}」生成的知識條目草稿`,u=i.files.length>1?`從共用檔案「${i.files.map(r=>r.fileName).join("、")}」建立，使用模板：${i.template}`:`從共用檔案「${e.fileName}」建立，使用模板：${i.template}`,d={id:n,title:o,category:i.category,status:"pending",sourceType:"FILE",pipelineProgress:0,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:t,lastUpdateBy:"AI 生成",versions:[{id:s,knowledgeId:n,versionNumber:"v1.0",versionType:null,status:"draft",title:o,summary:a,content:i.content,tags:[],systemTags:[],lastUpdateBy:"AI 生成",lastUpdateTime:t,updateNote:u,sourceFiles:i.files.map(r=>({fileId:r.fileId,fileName:r.fileName,linkedVersion:1})),chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0}]};return l.value.unshift(d),{knowledgeId:n,versionId:s}},B=i=>{const e=new Date().toISOString().replace("T"," ").slice(0,16),t=`k-${Date.now()}`,n=`v1.0-draft-${Date.now()}`,s=`${i.botName} 題庫`,o={id:t,title:s,category:i.category,status:"pending",sourceType:"JUSTKA",pipelineProgress:0,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:i.botId,apiSourceName:i.botName,lastUpdateTime:e,lastUpdateBy:"AI 生成",versions:[{id:n,knowledgeId:t,versionNumber:"v1.0",versionType:null,status:"draft",title:s,summary:`從 JustKa「${i.botName}」整理 ${i.cardCount} 張題卡生成的知識條目草稿`,content:"",tags:[],systemTags:[],lastUpdateBy:"AI 生成",lastUpdateTime:e,updateNote:`從 JustKa 機器人「${i.botName}」匯入，共 ${i.cardCount} 題卡`,sourceFiles:[],chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0}]};return l.value.unshift(o),{knowledgeId:t,versionId:n}};function M(i,e){for(const t of l.value){const n=t.versions.find(o=>o.status==="active"||o.status==="reviewing"||o.status==="draft");if(!n?.sourceFiles)continue;n.sourceFiles.some(o=>o.fileId===i&&o.linkedVersion<e)&&(t.sourceStale=!0,t.staleSourceFileIds=[...t.staleSourceFileIds.filter(o=>o!==i),i])}}function V(i,e){const t=p(i);if(!t)return;const n=t.versions.find(c=>c.status==="active")??t.versions[t.versions.length-1],[s,o]=n.versionNumber.replace("v","").split(".").map(Number),a=`v${s}.${o+1}`,u=n.sourceFiles.map(c=>{const g=e(c.fileId);return g?{...c,linkedVersion:g.version}:c}),d=t.staleSourceFileIds.map(c=>e(c)?.fileName??c).join("、"),r={...JSON.parse(JSON.stringify(n)),id:`${a}-source-update-${Date.now()}`,versionNumber:a,status:"draft",updateNote:`根據來源檔案更新（${d}）由 AI 自動建立草稿`,lastUpdateBy:"AI 生成",lastUpdateTime:new Date().toISOString().replace("T"," ").slice(0,16),sourceFiles:u};return t.versions.push(r),t.status="pending",t.sourceStale=!1,t.staleSourceFileIds=[],r.id}const O=(i,e)=>{const t=p(i);if(!t)return;const n=t.versions.find(d=>d.status==="active")??t.versions[t.versions.length-1];if(!n)return;const[s,o]=n.versionNumber.replace("v","").split(".").map(Number),a=`v${s}.${o+1}`,u={...JSON.parse(JSON.stringify(n)),id:`${a}-member-update-${Date.now()}`,versionNumber:a,status:"draft",updateNote:`調整檔案來源成員（共 ${e.length} 個來源檔案）`,lastUpdateBy:"Current User",lastUpdateTime:new Date().toISOString().replace("T"," ").slice(0,16),sourceFiles:e.map(d=>({fileId:d.fileId,fileName:d.fileName,linkedVersion:d.linkedVersion}))};return t.versions.push(u),t.status="pending",u.id};function L(i){const e=p(i);e&&(e.sourceStale=!1,e.staleSourceFileIds=[])}function R(i){const e={...i,id:`api-${Date.now()}`,lastSyncAt:null,lastSyncStatus:null,lastSyncCount:0,lastSyncError:null};return m.value.unshift(e),e.id}function J(i){const e=new Date().toISOString().replace("T"," ").slice(0,16),t=`k-api-${Date.now()}`,n=`v1.0-draft-${Date.now()}`,s={id:t,title:i.name,category:i.category,status:"pending",sourceType:"API",pipelineProgress:0,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:i.apiSourceId,apiSourceName:i.apiSourceName,lastUpdateTime:e,lastUpdateBy:"API 同步",versions:[{id:n,knowledgeId:t,versionNumber:"v1.0",versionType:null,status:"draft",title:i.name,summary:`由 API 來源「${i.apiSourceName}」同步建立`,content:"",tags:[],systemTags:[],lastUpdateBy:"API 同步",lastUpdateTime:e,updateNote:`由 API 來源「${i.apiSourceName}」自動建立`,sourceFiles:[],chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0}]};return l.value.unshift(s),t}function q(i,e){const t=m.value.find(n=>n.id===i);t&&Object.assign(t,e)}function G(i){m.value=m.value.filter(e=>e.id!==i)}function Q(i){const e=m.value.find(t=>t.id===i);e&&(e.enabled=!e.enabled)}function H(i){const e=m.value.find(t=>t.id===i);return e?new Promise(t=>{setTimeout(()=>{const n=Math.random()>.2,s=new Date().toISOString().replace("T"," ").slice(0,16);if(n){const o=Math.floor(Math.random()*8)+1;e.lastSyncStatus="SUCCESS",e.lastSyncAt=s,e.lastSyncCount=o,e.lastSyncError=null;const a=l.value.find(u=>u.apiSourceId===i);if(a){const u=a.versions.find(b=>b.status==="active")??a.versions[a.versions.length-1],[d,r]=u.versionNumber.replace("v","").split(".").map(Number),c=`v${d}.${r+1}`,g=Array.from({length:o},(b,ne)=>`## ${e.titleField} 條目 ${ne+1}

${e.contentField} 的示範內容（由 API 來源「${e.name}」同步）。`).join(`

`),T={id:`${c}-api-${Date.now()}`,knowledgeId:a.id,versionNumber:c,versionType:"MINOR",status:"draft",title:a.title,summary:`由 API 來源「${e.name}」同步更新（${o} 筆資料）`,content:g,tags:[],systemTags:[],lastUpdateBy:"API 同步",lastUpdateTime:s,updateNote:`API 同步（${e.name}），共 ${o} 筆`,sourceFiles:[],chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0};a.versions.push(T),a.status="pending",a.lastUpdateTime=s,a.lastUpdateBy="API 同步",y(a.id,g)}}else e.lastSyncStatus="FAILED",e.lastSyncAt=s,e.lastSyncCount=0,e.lastSyncError="連線失敗：API 回應狀態 503";t()},2e3)}):Promise.resolve()}function _(i){const e=new Date().toISOString().replace("T"," ").slice(0,16),t=`k-${Date.now()}`,n=i.fileName.replace(/\.[^.]+$/,""),s={id:t,title:n,category:i.category,status:"pending",sourceType:"FILE",pipelineProgress:0,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:e,lastUpdateBy:"Current User",versions:[{id:`${t}-v1.0`,knowledgeId:t,versionNumber:"v1.0",versionType:null,status:"draft",title:n,summary:"",content:"",tags:i.tags,systemTags:[],lastUpdateBy:"Current User",lastUpdateTime:e,updateNote:`從檔案「${i.fileName}」建立`,sourceFiles:[{fileId:`file-${Date.now()}`,fileName:i.fileName,linkedVersion:1}],chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0}]};return l.value.unshift(s),t}function K(i){const e=new Date().toISOString().replace("T"," ").slice(0,16),t=`k-${Date.now()}`,n=`${t}-v1.0`,s={id:t,title:i.title,category:i.category,status:"pending",sourceType:"MANUAL",pipelineProgress:0,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:e,lastUpdateBy:"Current User",versions:[{id:n,knowledgeId:t,versionNumber:"v1.0",versionType:null,status:"draft",title:i.title,summary:"",content:"",tags:i.tags,systemTags:[],lastUpdateBy:"Current User",lastUpdateTime:e,updateNote:"手動建立",sourceFiles:[],chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0}]};return l.value.unshift(s),{knowledgeId:t,versionId:n}}function y(i,e){[{stage:"chunking",pct:0,delay:0},{stage:"embedding",pct:33,delay:1500},{stage:"indexing",pct:67,delay:3500}].forEach(({stage:n,pct:s,delay:o})=>{setTimeout(()=>S(i,n,s),o)}),setTimeout(()=>{I(i,[{index:1,content:"（Pipeline 完成，實際分段由後端提供）",tokenCount:0,sourceType:"text"}],e)},4500)}function S(i,e,t){const n=l.value.find(s=>s.id===i);n&&(n.status="processing",n.pipelineStage=e,n.pipelineProgress=t)}function I(i,e,t){const n=l.value.find(o=>o.id===i);if(!n)return;n.status="reviewing",n.pipelineProgress=100,n.pipelineStage=null,n.pipelineError=null;const s=n.versions.find(o=>o.status==="draft")??n.versions[n.versions.length-1];if(s){s.status="reviewing",s.chunks=e,s.embeddingModel="BAAI/bge-m3",s.embeddingDimension=1024,s.embeddingCount=e.length,t&&(s.content=t);const o=new Date().toISOString().replace("T"," ").slice(0,16),a=e.length?Math.round(e.reduce((d,r)=>d+r.tokenCount,0)/e.length):320,u={FILE:"PDF",API:"API",SHAREPOINT:"PDF",JUSTKA:"JSON",MANUAL:"TEXT"};s.conversionLog=[{stage:"chunking",status:"success",startedAt:o,durationMs:3200,detail:{strategy:"Section-aware",chunkCount:e.length,avgTokens:a,imageCount:0,tableCount:0,sourceFormat:u[n.sourceType]??"PDF"}},{stage:"embedding",status:"success",startedAt:o,durationMs:8700,detail:{model:"BAAI/bge-m3",dimension:1024,denseCount:e.length,sparseCount:e.length,batchSize:32}},{stage:"indexing",status:"success",startedAt:o,durationMs:400,detail:{collection:"knowledge_chunks",pointCount:e.length,indexType:"HNSW"}}]}}function j(i,e){const t=l.value.find(n=>n.id===i);t&&(t.status="failed",t.pipelineError=e,t.pipelineStage=null)}function Y(i){const e=l.value.find(t=>t.id===i);e&&(e.status="processing",e.pipelineProgress=0,e.pipelineStage="chunking",e.pipelineError=null,e.sourceStale=!1,e.staleSourceFileIds=[])}function f(i){const e=l.value.find(t=>t.id===i);e&&(e.status="archived")}function z(i){for(const e of i)f(e)}function W(i){l.value=l.value.filter(e=>!i.includes(e.id))}function X(i){const e=p(i);!e||e.status!=="needs_update"||(e.status="active",e.sourceStale=!1,e.staleSourceFileIds=[])}function Z(i){const e=new Date().toISOString().replace("T"," ").slice(0,16);for(const t of i){const n=`sp-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,s=`${n}-v1.0`;l.value.unshift({id:n,title:t.title,category:t.category,status:"pending",sourceType:"SHAREPOINT",pipelineProgress:0,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:e,apiSourceId:null,apiSourceName:"SharePoint",lastUpdateTime:e,lastUpdateBy:"SharePoint 同步",versions:[{id:s,knowledgeId:n,versionNumber:"v1.0",versionType:null,status:"draft",title:t.title,summary:"",content:"",tags:[],systemTags:[],lastUpdateBy:"SharePoint 同步",lastUpdateTime:e,updateNote:"SharePoint 自動匯入",sourceFiles:[],chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0}]}),y(n)}}function ee(i,e,t,n,s,o){const a=new Date().toISOString().replace("T"," ").slice(0,16),u=`k-notion-${Date.now()}`,d=`v1.0-draft-${Date.now()}`,r={id:u,title:t,category:s,status:"pending",sourceType:"NOTION",pipelineProgress:0,pipelineStage:null,pipelineError:null,sourceStale:!1,staleSourceFileIds:[],lastSyncAt:null,apiSourceId:null,apiSourceName:null,lastUpdateTime:a,lastUpdateBy:"Notion 同步",integrationSourceId:i,notionPageId:e,versions:[{id:d,knowledgeId:u,versionNumber:"v1.0",versionType:null,status:"draft",title:t,summary:"由 Notion 同步建立",content:n,tags:o,systemTags:[],lastUpdateBy:"Notion 同步",lastUpdateTime:a,updateNote:"Notion 首次同步",sourceFiles:[],chunks:[],embeddingModel:null,embeddingDimension:null,embeddingCount:0}]};return l.value.unshift(r),y(u,n),u}function te(i,e,t,n,s){const o=l.value.find(T=>T.id===i);if(!o)return"";const a=o.versions.find(T=>T.status==="active")??o.versions[o.versions.length-1],[u,d]=a.versionNumber.replace("v","").split(".").map(Number),r=`v${u}.${d+1}`,c=new Date().toISOString().replace("T"," ").slice(0,16),g={...JSON.parse(JSON.stringify(a)),id:`${r}-notion-sync-${Date.now()}`,versionNumber:r,versionType:"MINOR",status:"draft",title:e,content:t,tags:s,lastUpdateBy:"Notion 同步",lastUpdateTime:c,updateNote:"Notion 自動同步更新",chunks:[]};return o.versions.push(g),o.status="pending",o.lastUpdateTime=c,o.lastUpdateBy="Notion 同步",y(o.id,t),g.id}return{knowledgeList:l,getKnowledgeById:p,getVersionById:N,createDraftFromPublished:A,createFromFile:$,createFromJustka:B,saveDraft:U,submitForReview:P,restoreToDraft:w,approveVersion:h,approveVersionPending:x,publishApprovedVersion:E,switchToVersion:C,rejectVersion:F,withdrawReview:D,markFileStale:M,createDraftFromSourceUpdate:V,createDraftFromMemberUpdate:O,dismissSourceStale:L,apiSources:m,createApiSource:R,createKnowledgeFromApiSource:J,updateApiSource:q,deleteApiSource:G,toggleApiSourceEnabled:Q,triggerSync:H,createFromUpload:_,createManualDraft:K,startPipelineSimulation:y,updatePipelineProgress:S,markPipelineDone:I,markPipelineFailed:j,retriggerPipeline:Y,ignoreUpdate:X,createFromSharePoint:Z,archiveKnowledge:f,batchArchive:z,batchDelete:W,createKnowledgeFromIntegration:ee,createDraftFromIntegrationSync:te}});export{le as buildChunkContent,re as getChunkingConfig,se as getVisionPrompt,ae as hasEarnedVersionNumber,ue as processImage,de as useKnowledgeStore};
