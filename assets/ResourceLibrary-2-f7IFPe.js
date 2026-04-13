import{d as ce,B as x,r as v,C as se,H as W,o,j as X,a as e,c as a,n as f,t as d,F as g,z as O,p as _,D as pe,h as k,l as fe,s as ge,A as Ae,e as L,i as D,q as he,x as y,y as _e,v as de,w as ee,E as be,J as we,G as re,u as ye}from"./index-D8hBBW0a.js";import{_ as ke}from"./compTabs.vue_vue_type_script_setup_true_lang-DTmBsQ7A.js";import{_ as Ce}from"./compListCardSwitch.vue_vue_type_script_setup_true_lang-24NVkJ9J.js";import{_ as Te}from"./compDropDown.vue_vue_type_script_setup_true_lang-CIObKxv7.js";import{_ as Ee}from"./compPagination.vue_vue_type_script_setup_true_lang-CXcJyOvU.js";import{u as ve}from"./knowledgeStore-NetTF6GN.js";import{u as Se}from"./resourceStore-DGcdMa87.js";import{_ as Ie}from"./compModal.vue_vue_type_script_setup_true_lang-nR-fZKaH.js";import{_ as Ne}from"./SourceUpdateModal.vue_vue_type_script_setup_true_lang-wD2MTcDu.js";import{u as xe,_ as Be,a as Me}from"./useApiCall-CbnNVpDh.js";import{t as ue,w as Re,m as $e,h as Le,e as De,p as Oe,a as Ve}from"./word-DrYf76ob.js";const Pe={class:"wizard-header-box"},ze={class:"wizard-steps"},Ue={key:0,class:"material-symbols-outlined"},Fe={key:1},Qe={class:"wizard-step-label"},He={class:"wizard-modal-body"},We={class:"wizard-file-info"},Je={class:"file-icon-box"},Ge={class:"material-symbols-outlined"},je={class:"file-text-content"},qe={class:"file-name"},Ye={key:0,class:"wizard-step-content"},Ke={key:0,class:"wizard-state-center"},Ze={key:1},Xe={class:"check-result-banner check-result-banner--warning"},es={class:"banner-text"},ss={class:"banner-title"},ts={class:"similar-items-list"},ls={class:"item-main"},os={class:"item-info"},as={class:"item-title"},is={class:"item-meta"},ns={key:1,class:"check-result-banner check-result-banner--success"},ds={key:1,class:"wizard-step-content"},rs={class:"template-grid"},us=["onClick"],cs={class:"template-card-icon"},vs={class:"material-symbols-outlined"},ms={class:"template-card-content"},ps={class:"template-card-title"},fs={class:"template-card-desc"},gs={key:0,class:"template-card-check"},As={key:2,class:"wizard-step-content"},hs={key:0,class:"wizard-state-center"},_s={class:"status-desc"},bs={class:"ai-progress-container mt-4"},ws={class:"ai-progress-track"},ys={class:"progress-text"},ks={key:1,class:"ai-preview-container"},Cs={class:"ai-preview-header"},Ts={class:"header-left"},Es={class:"template-badge"},Ss={class:"ai-preview-body"},Is={class:"preview-title"},Ns={class:"preview-scroll-area"},xs={class:"preview-text"},Bs={class:"wizard-footer-actions"},Ms={class:"action-right"},Rs=["disabled"],$s=["disabled"],Ls=ce({__name:"CreateKnowledgeWizardModal",props:{modelValue:{type:Boolean},file:{}},emits:["update:modelValue","confirm"],setup(te,{emit:J}){const C=te,T=J,V=x({get:()=>C.modelValue,set:c=>T("update:modelValue",c)}),G=ve(),u=v(1),E=v(!1),S=v([]),A=v(""),h=v(!1),b=v(0),B=v(""),M=["相似性檢查","選擇模板","AI 生成初稿"],P={PUBLISHED:"已發布",REVIEWING:"審核中",DRAFT:"草稿",REJECTED:"已退回"},z=[{value:"PRODUCT",label:"商品 / 銷售資料",icon:"storefront",desc:"商品規格與銷售數據整理，適合庫存管理、銷售報告"},{value:"SOP",label:"SOP 標準流程",icon:"account_tree",desc:"標準作業程序，適合業務流程、操作規範"},{value:"GUIDE",label:"操作說明",icon:"menu_book",desc:"系統功能使用指引，適合軟體操作、功能介紹"},{value:"RULE",label:"規則說明",icon:"gavel",desc:"規則與政策說明，適合商業規則、合規文件"}],w=x(()=>z.find(c=>c.value===A.value)?.label??""),j=x(()=>C.file?.fileName.replace(/\.[^.]+$/,"")??""),q=x(()=>{const c=C.file?.fileType?.toUpperCase()??"";return{EXCEL:"table_view",PDF:"picture_as_pdf",WORD:"description",PPT:"slideshow",IMAGE:"image",TXT:"article",MD:"article",HTML:"html",CHART:"bar_chart"}[c]??"insert_drive_file"});se(()=>C.modelValue,c=>{c&&(u.value=1,A.value="",S.value=[],B.value="",U())});function U(){E.value=!0,setTimeout(()=>{const n=(C.file?.fileName?.toLowerCase()??"").replace(/[._\-\d]/g," ").trim().split(/\s+/).filter(m=>m.length>1);S.value=G.knowledgeList.filter(m=>{const Q=m.title.toLowerCase();return n.some(H=>Q.includes(H))}),E.value=!1},1800)}function I(){u.value=2}function Y(){A.value&&(u.value=3,F())}function F(){h.value=!0,b.value=0;const c=setInterval(()=>{b.value+=Math.floor(Math.random()*12)+5,b.value>=100&&(b.value=100,clearInterval(c),setTimeout(()=>{B.value=R(A.value,C.file?.fileName??""),h.value=!1},300))},200)}function R(c,l){const n=l.replace(/\.[^.]+$/,"");switch(c){case"PRODUCT":return`# ${n} — 商品 / 銷售資料

## 商品概覽
本文件整理相關商品規格與銷售數據，供業務人員及管理層查閱參考。

## 商品資料表
| 商品名稱 | 商品編號 | 規格 | 售價 | 庫存量 |
|---|---|---|---|---|
| 商品 A | SKU-001 | 標準款 | NT$1,200 | 350 |
| 商品 B | SKU-002 | 進階款 | NT$2,500 | 120 |
| 商品 C | SKU-003 | 旗艦款 | NT$4,800 | 45 |

## 銷售數據摘要

### 本期銷售概況
- **銷售總額**：NT$2,340,000
- **銷售筆數**：1,245 筆
- **平均客單價**：NT$1,880
- **同期成長率**：+12.3%

### 各通路銷售分布
| 通路 | 銷售額 | 佔比 |
|---|---|---|
| 官方電商 | NT$1,100,000 | 47% |
| 實體門市 | NT$820,000 | 35% |
| 第三方平台 | NT$420,000 | 18% |

## 庫存警示
- 庫存低於安全水位（< 50）之品項，請優先安排補貨
- 滯銷品（30 天無銷售紀錄）建議啟動促銷活動

## 備註
資料來源：${n}，如有更新請以最新版文件為準。`;case"SOP":return`# ${n} — 標準作業程序 (SOP)

## 1. 目的
本 SOP 旨在確保相關作業之一致性與正確性，降低人為錯誤風險。

## 2. 適用範圍
本程序適用於所有執行相關業務的人員。

## 3. 作業流程

### Step 1：前置準備
- 確認所需資料及文件已備妥
- 確認系統存取權限正常

### Step 2：執行作業
1. 開啟相關系統，確認連線正常
2. 依標準格式輸入或核對資料
3. 執行雙重確認程序

### Step 3：結果驗證
- 核對輸出結果與預期值一致
- 如有差異，啟動異常處理流程

### Step 4：存檔與回報
- 將結果存入指定路徑
- 通知相關主管或部門

## 4. 注意事項
- 作業前請確認已完成必要教育訓練
- 遇不確定情況請即時詢問主管`;case"GUIDE":return`# ${n} — 操作說明

## 功能概述
本說明文件提供完整的操作指引，協助使用者正確、有效率地使用相關功能。

## 系統需求
- 瀏覽器：Chrome 90+ / Edge 90+
- 權限：需具備相應操作角色

## 操作步驟

### 1. 進入功能
登入系統後，從主選單點選對應功能模組進入操作頁面。

### 2. 設定查詢條件
依業務需求設定篩選條件：
- 日期區間
- 資料類別
- 部門或人員範圍

### 3. 執行操作
確認設定無誤後，點擊「確認」按鈕開始處理。

### 4. 查閱與匯出結果
處理完成後即可瀏覽結果，並透過「匯出」功能下載報表。

## 常見錯誤排除
| 錯誤訊息 | 可能原因 | 解決方式 |
|---|---|---|
| 無法登入 | 帳號密碼有誤 | 確認帳密或聯繫管理員 |
| 資料載入失敗 | 網路或權限問題 | 重新整理頁面後再試 |`;case"RULE":return`# ${n} — 規則說明

## 1. 適用範圍
本規則適用於所有涉及相關業務之人員及作業活動。

## 2. 基本原則
- 所有操作須符合公司規定及相關法規要求
- 資料安全與保密依資訊安全政策執行
- 異常情況須即時回報並完整記錄

## 3. 執行標準

### 3.1 時效要求
標準流程須在規定時間內完成，逾期須提出說明並獲主管核准。

### 3.2 品質要求
輸出結果須符合既定品質標準，不符規格者須重新處理。

### 3.3 記錄要求
所有重要操作須留存完整紀錄，保存期限依規定辦理。

## 4. 例外處理
特殊情況無法遵循標準程序時：
1. 說明原因並取得主管書面授權
2. 記錄例外情況與實際處理過程
3. 事後補充完整文件並歸檔

## 5. 違規處理
違反本規則者，依公司相關人事規定處理，情節重大者依法追究。`;default:return""}}function K(){T("confirm",{template:w.value,content:B.value}),T("update:modelValue",!1)}function $(){T("update:modelValue",!1)}return(c,l)=>(o(),W(Ie,{class:"CreateKnowledgeWizardModal",modelValue:V.value,"onUpdate:modelValue":l[2]||(l[2]=n=>V.value=n),width:660,showClose:!h.value&&!E.value},{title:X(()=>[e("div",Pe,[l[3]||(l[3]=e("h4",{class:"wizard-modal-title"},"建立知識條目",-1)),e("div",ze,[(o(),a(g,null,O(M,(n,m)=>(o(),a(g,{key:m},[e("div",{class:_(["wizard-step-item",{"is-active":u.value>=m+1}])},[e("div",{class:_(["wizard-step-dot",{"is-done":u.value>m+1,"is-active":u.value===m+1}])},[u.value>m+1?(o(),a("i",Ue,"check")):(o(),a("span",Fe,d(m+1),1))],2),e("span",Qe,d(n),1)],2),m<M.length-1?(o(),a("div",{key:0,class:_(["wizard-step-connector",{"is-done":u.value>m+1}])},null,2)):f("",!0)],64))),64))])])]),footer:X(()=>[e("div",Bs,[e("button",{class:"custom-btn",onClick:$},"取消"),e("div",Ms,[u.value===1?(o(),a("button",{key:0,class:"custom-btn custom-main-btn",disabled:E.value,onClick:I},[...l[17]||(l[17]=[k(" 繼續建立知識 ",-1),e("i",{class:"material-symbols-outlined fs-18 ml-1"},"arrow_forward",-1)])],8,Rs)):f("",!0),u.value===2?(o(),a(g,{key:1},[e("button",{class:"custom-btn mr-2",onClick:l[0]||(l[0]=n=>u.value=1)},"上一步"),e("button",{class:"custom-btn custom-main-btn",disabled:!A.value,onClick:Y}," 確定 ",8,$s)],64)):f("",!0),u.value===3&&!h.value?(o(),a(g,{key:2},[e("button",{class:"custom-btn mr-2",onClick:l[1]||(l[1]=n=>u.value=2)},"重新選擇模板"),e("button",{class:"custom-btn custom-main-btn",onClick:K},[...l[18]||(l[18]=[k(" 進入編輯器 ",-1),e("i",{class:"material-symbols-outlined fs-18 ml-1"},"edit_square",-1)])])],64)):f("",!0)])])]),default:X(()=>[e("div",He,[e("div",We,[e("div",Je,[e("i",Ge,d(q.value),1)]),e("div",je,[l[4]||(l[4]=e("span",{class:"file-label"},"來源檔案",-1)),e("span",qe,d(c.file?.fileName),1)])]),u.value===1?(o(),a("div",Ye,[E.value?(o(),a("div",Ke,[...l[5]||(l[5]=[e("div",{class:"ai-pulse-icon"},[e("i",{class:"material-symbols-outlined"},"manage_search")],-1),e("div",{class:"status-title"},"正在掃描相似知識條目...",-1),e("div",{class:"status-desc"},"系統正在比對知識庫中的現有條目，確保內容不重複",-1)])])):(o(),a("div",Ze,[S.value.length?(o(),a(g,{key:0},[e("div",Xe,[l[7]||(l[7]=e("i",{class:"material-symbols-outlined"},"warning",-1)),e("div",es,[e("div",ss,"發現 "+d(S.value.length)+" 個可能相關的現有條目",1),l[6]||(l[6]=e("div",{class:"banner-desc"},"建議先檢查現有內容，您仍可繼續建立新條目或選擇編輯舊有條目。",-1))])]),e("div",ts,[(o(!0),a(g,null,O(S.value,n=>(o(),a("div",{class:"similar-item-card",key:n.id},[e("div",ls,[l[8]||(l[8]=e("div",{class:"item-icon"},[e("i",{class:"material-symbols-outlined"},"menu_book")],-1)),e("div",os,[e("div",as,d(n.title),1),e("div",is,"分類："+d(n.category||"未分類")+" · 版本："+d(n.currentVersion),1)])]),e("span",{class:_(["status-badge",`status-badge--${n.status}`])},d(P[n.status]),3)]))),128))])],64)):(o(),a("div",ns,[...l[9]||(l[9]=[e("i",{class:"material-symbols-outlined"},"check_circle",-1),e("div",{class:"banner-text"},[e("div",{class:"banner-title"},"未發現重複條目"),e("div",{class:"banner-desc"},"知識庫中目前沒有與此檔案內容相似的條目，您可以放心地開始建立。")],-1)])]))]))])):f("",!0),u.value===2?(o(),a("div",ds,[l[11]||(l[11]=e("div",{class:"step-guide-text"}," 選擇最符合此知識條目用途的模板，AI 將據此產出對應格式的初稿。 ",-1)),e("div",rs,[(o(),a(g,null,O(z,n=>e("div",{key:n.value,class:_(["template-card",{"is-active":A.value===n.value}]),onClick:m=>A.value=n.value},[e("div",cs,[e("i",vs,d(n.icon),1)]),e("div",ms,[e("div",ps,d(n.label),1),e("div",fs,d(n.desc),1)]),A.value===n.value?(o(),a("div",gs,[...l[10]||(l[10]=[e("i",{class:"material-symbols-outlined"},"check_circle",-1)])])):f("",!0)],10,us)),64))])])):f("",!0),u.value===3?(o(),a("div",As,[h.value?(o(),a("div",hs,[l[12]||(l[12]=e("div",{class:"ai-pulse-icon ai-pulse-icon--generating"},[e("i",{class:"material-symbols-outlined"},"auto_awesome")],-1)),l[13]||(l[13]=e("div",{class:"status-title"},"AI 正在根據檔案內容產出初稿...",-1)),e("div",_s,"選用模板："+d(w.value),1),e("div",bs,[e("div",ws,[e("div",{class:"ai-progress-fill",style:pe({width:b.value+"%"})},null,4)]),e("div",ys,d(b.value)+"%",1)])])):(o(),a("div",ks,[e("div",Cs,[e("div",Ts,[l[14]||(l[14]=e("i",{class:"material-symbols-outlined title-icon"},"auto_awesome",-1)),l[15]||(l[15]=e("span",{class:"header-title"},"AI 初稿預覽",-1)),e("span",Es,d(w.value),1)]),l[16]||(l[16]=e("span",{class:"header-hint"},"進入編輯器後可進行細部修改",-1))]),e("div",Ss,[e("div",Is,d(j.value),1),e("div",Ns,[e("pre",xs,d(B.value),1)])])]))])):f("",!0)])]),_:1},8,["modelValue","showClose"]))}}),Ds="data:image/png;base64,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",Os={class:"ResourceLibrary views-page"},Vs={class:"views-page-content-box"},Ps={class:"views-page-header"},zs={class:"secondary-box"},Us={class:"header-right-box"},Fs={class:"resource-filter-row"},Qs={class:"filter-right"},Hs={key:0,class:"p-5 mt-4 text-center fc-grey-1"},Ws={key:1,class:"card-list-box mt-2"},Js=["onMouseleave"],Gs={class:"card-header-box"},js={class:"file-name"},qs=["id"],Ys=["onClick"],Ks=["onClick"],Zs=["onClick"],Xs=["onClick"],et={class:"card-body-box"},st=["src"],tt={key:1,class:"material-symbols-outlined other-file-icon"},lt=["src"],ot={class:"card-footer-box"},at={class:"fc-grey-1"},it={key:2,class:"table-list-box file-list mt-2"},nt={class:"custom-table"},dt=["onMouseleave"],rt={class:"file-icon-box"},ut=["src"],ct={key:1,class:"material-symbols-outlined other-file-icon"},vt=["src"],mt=["id"],pt={class:"fc-grey-1"},ft={class:"material-symbols-outlined"},gt={class:"fc-grey-1"},At={class:"d-flex"},ht=["onClick"],_t=["onClick"],bt=["onClick"],wt=["onClick"],Rt=ce({__name:"ResourceLibrary",setup(te){const J=ye(),C=ve(),T=Se(),{data:V,isLoading:G,hasError:u,errorMessage:E,retry:S}=xe(()=>T.resourceList),A=v(!1),h=v(null),b=v(!1),B=v(""),M=Ae(),P=fe(),{isEnterAppSearchPage:z,projectListMode:w}=ge(P),j=P.openBatchUploadFn,q=v(M.query.teamId),U=v(M.query.teamName);se(()=>M.query,i=>{q.value=i.teamId,U.value=i.teamName});const I=v("ALL"),Y=[{label:"全部檔案",value:"ALL"},{label:"資料入庫型",value:"AI_PARSED"},{label:"原檔保存型",value:"RAW"}],F={uploading:"上傳中",parsing:"解析中",stored:"已入庫",saved:"已儲存",failed:"失敗"},R=v(""),K=x(()=>V.value??[]),$=v(1),c=v(10),l=x(()=>{let i=K.value;return I.value!=="ALL"&&(i=i.filter(s=>s.processType===I.value)),R.value&&(i=i.filter(s=>s.fileType===R.value)),i});se([I,R],()=>{$.value=1});const n=x(()=>{const i=($.value-1)*c.value;return l.value.slice(i,i+c.value)});function m(i){$.value=i.pageNo}function Q(i){return i.toUpperCase()==="IMAGE"}function H(i){return{PDF:Ve,PPT:Oe,EXCEL:De,HTML:Le,MD:$e,WORD:Re,TXT:ue,CHART:Ds}[i.toUpperCase()]||ue}function le(i){const s=new Date(i);return`${s.getFullYear()}年${s.getMonth()+1}月${s.getDate()}日 ${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`}const r=v(null);function oe(i){i.showMoreOption=!1,r.value={...i},r.value.catch=JSON.parse(JSON.stringify(i)),we(()=>{const s=document.getElementById("mofidyInput"+i.id);if(s){s.focus();const N=s.value.length;s.setSelectionRange(N,N)}})}function ae(){if(!r.value.fileName.trim()){re.alert("檔案名稱不能為空"),r.value=null;return}if(r.value.fileName===r.value.catch.fileName){r.value=null;return}console.log("TODO...儲存檔案名稱",r.value.fileName),r.value=null}function ie(i){i.showMoreOption=!1,h.value={id:i.id,fileName:i.fileName,fileType:i.fileType},A.value=!0}function me(i){if(!h.value)return;const{knowledgeId:s,versionId:N}=C.createFromFile({fileId:h.value.id,fileName:h.value.fileName,template:i.template,content:i.content});J.push({name:"KnowledgeEditor",params:{knowledgeId:s,versionId:N}})}function ne(i){i.showMoreOption=!1,re.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定刪除嗎？</div>
      <div class="fs-16">刪除後將無法復原。</div>
    </div>
  `,()=>{T.deleteFile(i.id)})}return(i,s)=>{const N=be("tooltip");return o(),a(g,null,[L(e("div",Os,[e("div",Vs,[e("div",Ps,[e("h3",null,[s[12]||(s[12]=k(" 共用檔案管理 ",-1)),e("div",zs,d(U.value),1)]),e("div",Us,[D(Ce,{modelValue:y(w),"onUpdate:modelValue":s[0]||(s[0]=t=>_e(w)?w.value=t:null)},null,8,["modelValue"])])]),e("div",Fs,[D(ke,{modelValue:I.value,"onUpdate:modelValue":s[1]||(s[1]=t=>I.value=t),tabs:Y},null,8,["modelValue"]),e("div",Qs,[D(Te,{class:"mr-2",options:[{name:"所有檔案類型",value:""},{name:"PDF",value:"PDF"},{name:"PPT",value:"PPT"},{name:"Excel",value:"EXCEL"},{name:"Image",value:"IMAGE"},{name:"HTML",value:"HTML"},{name:"Word",value:"WORD"},{name:"Markdown",value:"MD"},{name:"文字檔",value:"TXT"},{name:"Chart",value:"CHART"},{name:"其他",value:"OTHER"}],"show-search":!1,showClearTriggerIcon:!1,"default-value":"",width:"170px",placeholder:"所有檔案類型",onSelect:s[2]||(s[2]=t=>{R.value=t.value})}),e("button",{class:"custom-btn custom-main-btn",onClick:s[3]||(s[3]=t=>y(j)())},[...s[13]||(s[13]=[e("i",{class:"material-symbols-outlined"},"add",-1),k(" 上傳檔案 ",-1)])])])]),y(G)?(o(),W(Be,{key:0,type:"list",class:"mt-4"})):y(u)?(o(),W(Me,{key:1,message:y(E),onRetry:y(S)},null,8,["message","onRetry"])):(o(),a(g,{key:2},[n.value.length===0?(o(),a("div",Hs,"目前沒有資源")):f("",!0),y(w)==="card"&&n.value.length?(o(),a("div",Ws,[(o(!0),a(g,null,O(n.value,(t,Z)=>(o(),a("div",{class:"one-card-box file-card",key:"card"+Z,onMouseleave:p=>t.showMoreOption=!1},[e("div",Gs,[e("div",js,[!r.value||r.value.id!==t.id?(o(),a(g,{key:0},[k(d(t.fileName),1)],64)):r.value.id===t.id?L((o(),a("input",{key:1,class:"custom-input mofidyInput w-100",id:"mofidyInput"+t.id,"onUpdate:modelValue":s[4]||(s[4]=p=>r.value.fileName=p),onBlur:s[5]||(s[5]=p=>ae())},null,40,qs)),[[de,r.value.fileName]]):f("",!0)]),e("div",{class:"more-menu-wrap",onClick:s[6]||(s[6]=ee(()=>{},["stop"]))},[e("i",{class:"material-symbols-outlined more-btn",onClick:p=>t.showMoreOption=!t.showMoreOption},"more_horiz",8,Ys),e("div",{class:_(["next-option-box",{show:t.showMoreOption}])},[e("div",{class:"option-item",onClick:p=>oe(t)},"編輯檔案名稱",8,Ks),s[14]||(s[14]=e("div",{class:"option-item"},"下載檔案",-1)),e("div",{class:"option-item divider",onClick:p=>ie(t)},"建立為知識內容",8,Zs),e("div",{class:"option-item option-item--danger",onClick:p=>ne(t)},"刪除",8,Xs)],2)])]),e("div",et,[Q(t.fileType)?(o(),a("img",{key:0,src:t.fileUrl,alt:"",class:"preview-img"},null,8,st)):t.fileType==="OTHER"?L((o(),a("i",tt,[...s[15]||(s[15]=[k("question_mark",-1)])])),[[N,"未知的檔案類型"]]):(o(),a("img",{key:2,src:H(t.fileType),alt:"",class:"file-type-icon"},null,8,lt))]),e("div",ot,[e("span",{class:_(["status-badge",`status-badge--${t.status}`])},d(F[t.status]),3),e("span",at,d(le(t.lastModify)),1)])],40,Js))),128))])):f("",!0),y(w)==="list"&&n.value.length?(o(),a("div",it,[e("table",nt,[s[18]||(s[18]=e("thead",null,[e("tr",null,[e("th",null,"檔案名稱"),e("th",{width:"90"},"檔案格式"),e("th",{width:"130"},"處理方式"),e("th",{width:"110"},"狀態"),e("th",null,"最後更新時間"),e("th",{width:"60"})])],-1)),e("tbody",null,[(o(!0),a(g,null,O(n.value,(t,Z)=>(o(),a("tr",{key:"list"+Z,onMouseleave:p=>{t.showMoreOption=!1}},[e("td",null,[e("div",rt,[Q(t.fileType)?(o(),a("img",{key:0,src:t.fileUrl,alt:""},null,8,ut)):t.fileType==="OTHER"?L((o(),a("i",ct,[...s[16]||(s[16]=[k("question_mark",-1)])])),[[N,"未知的檔案類型"]]):(o(),a("img",{key:2,src:H(t.fileType),alt:""},null,8,vt))]),!r.value||r.value.id!==t.id?(o(),a(g,{key:0},[k(d(t.fileName),1)],64)):r.value.id===t.id?L((o(),a("input",{key:1,class:"custom-input mofidyInput w-80",id:"mofidyInput"+t.id,"onUpdate:modelValue":s[7]||(s[7]=p=>r.value.fileName=p),onBlur:s[8]||(s[8]=p=>ae())},null,40,mt)),[[de,r.value.fileName]]):f("",!0)]),e("td",pt,d(t.fileType),1),e("td",null,[e("span",{class:_(["process-type-badge",t.processType==="AI_PARSED"?"badge--ai":"badge--raw"])},[e("i",ft,d(t.processType==="AI_PARSED"?"auto_awesome":"save"),1),k(" "+d(t.processType==="AI_PARSED"?"資料入庫型":"原檔保存型"),1)],2)]),e("td",null,[e("span",{class:_(["status-badge",`status-badge--${t.status}`])},d(F[t.status]),3)]),e("td",gt,d(le(t.lastModify)),1),e("td",null,[e("div",At,[e("i",{class:"material-symbols-outlined material-fill more-btn",onClick:ee(p=>t.showMoreOption=!0,["stop"])},"more_horiz",8,ht)]),e("div",{class:_(["next-option-box",{show:t.showMoreOption}]),onClick:s[9]||(s[9]=ee(()=>{},["stop"]))},[e("div",{class:"option-item",onClick:p=>oe(t)},"編輯檔案名稱",8,_t),s[17]||(s[17]=e("div",{class:"option-item"},"下載檔案",-1)),e("div",{class:"option-item divider",onClick:p=>ie(t)},"建立為知識內容",8,bt),e("div",{class:"option-item option-item--danger",onClick:p=>ne(t)},"刪除",8,wt)],2)])],40,dt))),128))])])])):f("",!0),l.value.length?(o(),W(Ee,{key:3,class:"mt-3",pageNo:$.value,numberOfRowsPerPage:c.value,totalRows:l.value.length,onChange:m},null,8,["pageNo","numberOfRowsPerPage","totalRows"])):f("",!0)],64))])],512),[[he,!y(z)]]),D(Ls,{modelValue:A.value,"onUpdate:modelValue":s[10]||(s[10]=t=>A.value=t),file:h.value,onConfirm:me},null,8,["modelValue","file"]),D(Ne,{modelValue:b.value,"onUpdate:modelValue":s[11]||(s[11]=t=>b.value=t),"file-id":B.value},null,8,["modelValue","file-id"])],64)}}});export{Rt as default};
