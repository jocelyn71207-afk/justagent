import{d as te,r as u,x as P,y as K,c as a,e as f,a as l,b as e,F as w,m as W,t as d,p as T,B as ae,l as H,n as y,u as oe,s as ie,q as ne,w as U,h as Q,v as re,f as $,D as de,i as ce,g as Z,C as ue,z as pe,A as ee,G as ve}from"./index-B2Q-IxHT.js";import{_ as fe}from"./compTabs.vue_vue_type_script_setup_true_lang-CG__H4ak.js";import{_ as me}from"./compListCardSwitch.vue_vue_type_script_setup_true_lang-DzhuvnLT.js";import{_ as we}from"./compDropDown.vue_vue_type_script_setup_true_lang-CNjXsvci.js";import{_ as ye}from"./compPagination.vue_vue_type_script_setup_true_lang-d1zkU1PR.js";import{u as le}from"./knowledgeStore-BKH-fkwi.js";import{t as se,w as Ae,m as ge,h as he,e as Te,p as be,a as _e}from"./word-DrYf76ob.js";const ke={key:0,class:"modal-root"},Ce={class:"swal2-popup swal2-modal swal2-show knowledge-wizard-dialog",style:{display:"flex"}},Ne={class:"swal2-content text-left w-100"},Ie={class:"wizard-header"},Ee={class:"wizard-steps"},Me={class:"wizard-step-item"},Se={key:0,class:"material-symbols-outlined"},Re={key:1},xe={key:0,class:"wizard-step-connector"},Be={class:"wizard-file-info"},Oe={class:"material-symbols-outlined"},Le={key:0,class:"wizard-step-content"},De={key:0,class:"wizard-state-center"},Ue={key:1},$e={class:"check-result-banner check-result-banner--warning"},Pe={class:"fw-600"},We={class:"d-flex align-items-center gap-3"},ze={class:"fw-600 fs-14"},Ve={class:"fc-grey-1 fs-12 mt-1"},Fe={key:1,class:"check-result-banner check-result-banner--success"},Qe={key:1,class:"wizard-step-content"},He={class:"template-grid"},Je=["onClick"],Ge={class:"template-card-icon"},je={class:"material-symbols-outlined"},qe={class:"template-card-title"},Ye={class:"template-card-desc"},Ke={key:2,class:"wizard-step-content"},Xe={key:0,class:"wizard-state-center"},Ze={class:"fc-grey-1 fs-13 mt-1"},es={class:"ai-progress-track mt-4"},ss={class:"fc-grey-1 fs-12 mt-2"},ts={key:1,class:"ai-preview-box"},ls={class:"ai-preview-header"},as={class:"d-flex align-items-center gap-2"},os={class:"wizard-template-badge"},is={class:"ai-preview-content"},ns={class:"ai-preview-title"},rs={class:"ai-preview-body"},ds={class:"swal2-actions w-100 mt-2",style:{"flex-wrap":"wrap",gap:"8px"}},cs=["disabled"],us=["disabled"],ps=te({__name:"CreateKnowledgeWizardModal",props:{modelValue:{type:Boolean},file:{}},emits:["update:modelValue","confirm"],setup(X,{emit:J}){const b=X,_=J,k=le(),c=u(1),C=u(!1),N=u([]),m=u(""),S=u(!1),A=u(0),I=u(""),g=["相似性檢查","選擇模板","AI 生成初稿"],G={PUBLISHED:"已發布",REVIEWING:"審核中",DRAFT:"草稿",REJECTED:"已退回"},x=[{value:"PRODUCT",label:"商品 / 銷售資料",icon:"storefront",desc:"商品規格與銷售數據整理，適合庫存管理、銷售報告"},{value:"SOP",label:"SOP 標準流程",icon:"account_tree",desc:"標準作業程序，適合業務流程、操作規範"},{value:"GUIDE",label:"操作說明",icon:"menu_book",desc:"系統功能使用指引，適合軟體操作、功能介紹"},{value:"RULE",label:"規則說明",icon:"gavel",desc:"規則與政策說明，適合商業規則、合規文件"}],h=P(()=>x.find(n=>n.value===m.value)?.label??""),B=P(()=>b.file?.fileName.replace(/\.[^.]+$/,"")??""),R=P(()=>{const n=b.file?.fileType?.toUpperCase()??"";return{EXCEL:"table_view",PDF:"picture_as_pdf",WORD:"description",PPT:"slideshow",IMAGE:"image",TXT:"article",MD:"article",HTML:"html",CHART:"bar_chart"}[n]??"insert_drive_file"});K(()=>b.modelValue,n=>{n&&(c.value=1,m.value="",N.value=[],I.value="",O())});function O(){C.value=!0,setTimeout(()=>{const r=(b.file?.fileName?.toLowerCase()??"").replace(/[._\-\d]/g," ").trim().split(/\s+/).filter(p=>p.length>1);N.value=k.knowledgeList.filter(p=>{const q=p.title.toLowerCase();return r.some(F=>q.includes(F))}),C.value=!1},1800)}function L(){c.value=2}function E(){m.value&&(c.value=3,j())}function j(){S.value=!0,A.value=0;const n=setInterval(()=>{A.value+=Math.floor(Math.random()*12)+5,A.value>=100&&(A.value=100,clearInterval(n),setTimeout(()=>{I.value=z(m.value,b.file?.fileName??""),S.value=!1},300))},200)}function z(n,o){const r=o.replace(/\.[^.]+$/,"");switch(n){case"PRODUCT":return`# ${r} — 商品 / 銷售資料

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
資料來源：${r}，如有更新請以最新版文件為準。`;case"SOP":return`# ${r} — 標準作業程序 (SOP)

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
- 遇不確定情況請即時詢問主管`;case"GUIDE":return`# ${r} — 操作說明

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
| 資料載入失敗 | 網路或權限問題 | 重新整理頁面後再試 |`;case"RULE":return`# ${r} — 規則說明

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
違反本規則者，依公司相關人事規定處理，情節重大者依法追究。`;default:return""}}function V(){_("confirm",{template:h.value,content:I.value}),_("update:modelValue",!1)}function D(){_("update:modelValue",!1)}return(n,o)=>n.modelValue?(l(),a("div",ke,[e("div",{class:"swal2-container swal2-center swal2-backdrop-show",onClick:H(D,["self"])},[e("div",Ce,[e("div",Ne,[e("div",Ie,[o[2]||(o[2]=e("h4",{class:"fw-700 mb-0"},"建立知識條目",-1)),e("div",Ee,[(l(),a(w,null,W(g,(r,p)=>(l(),a(w,{key:p},[e("div",Me,[e("div",{class:y(["wizard-step-dot",{"is-active":c.value>=p+1,"is-done":c.value>p+1}])},[c.value>p+1?(l(),a("i",Se,"check")):(l(),a("span",Re,d(p+1),1))],2),e("span",{class:y(["wizard-step-label",{"is-active":c.value>=p+1}])},d(r),3)]),p<g.length-1?(l(),a("div",xe)):f("",!0)],64))),64))])]),e("div",Be,[e("i",Oe,d(R.value),1),e("span",null,[o[3]||(o[3]=T("來源檔案：",-1)),e("strong",null,d(n.file?.fileName),1)])]),c.value===1?(l(),a("div",Le,[C.value?(l(),a("div",De,[...o[4]||(o[4]=[e("div",{class:"ai-pulse-icon"},[e("i",{class:"material-symbols-outlined"},"manage_search")],-1),e("div",{class:"fw-600 fs-15 mt-3"},"正在掃描相似知識條目...",-1),e("div",{class:"fc-grey-1 fs-13 mt-1"},"系統正在比對知識庫中的現有條目",-1)])])):(l(),a("div",Ue,[N.value.length?(l(),a(w,{key:0},[e("div",$e,[o[6]||(o[6]=e("i",{class:"material-symbols-outlined"},"warning",-1)),e("div",null,[e("div",Pe,"發現 "+d(N.value.length)+" 個可能相關的現有條目",1),o[5]||(o[5]=e("div",{class:"fs-13 mt-1"},"您仍可繼續建立新的知識條目，或選擇編輯現有條目。",-1))])]),(l(!0),a(w,null,W(N.value,r=>(l(),a("div",{class:"similar-item-card",key:r.id},[e("div",We,[o[7]||(o[7]=e("div",{class:"knowledge-icon KnowledgeBase"},[e("i",{class:"material-symbols-outlined"},"menu_book")],-1)),e("div",null,[e("div",ze,d(r.title),1),e("div",Ve,"分類："+d(r.category||"未分類")+"　版本："+d(r.currentVersion),1)])]),e("span",{class:y(["KnowledgeBase status-badge",`status-badge--${r.status}`])},d(G[r.status]),3)]))),128))],64)):(l(),a("div",Fe,[...o[8]||(o[8]=[e("i",{class:"material-symbols-outlined"},"check_circle",-1),e("div",null,[e("div",{class:"fw-600"},"未發現重複條目"),e("div",{class:"fs-13 mt-1"},"知識庫中沒有與此檔案相似的現有條目，可以直接建立。")],-1)])]))]))])):f("",!0),c.value===2?(l(),a("div",Qe,[o[9]||(o[9]=e("div",{class:"fs-14 fc-grey-1 mb-4"}," 選擇最符合此知識條目用途的模板，AI 將據此產出對應格式的初稿。 ",-1)),e("div",He,[(l(),a(w,null,W(x,r=>e("div",{key:r.value,class:y(["template-card",{"is-active":m.value===r.value}]),onClick:p=>m.value=r.value},[e("div",Ge,[e("i",je,d(r.icon),1)]),e("div",qe,d(r.label),1),e("div",Ye,d(r.desc),1)],10,Je)),64))])])):f("",!0),c.value===3?(l(),a("div",Ke,[S.value?(l(),a("div",Xe,[o[10]||(o[10]=e("div",{class:"ai-pulse-icon ai-pulse-icon--generating"},[e("i",{class:"material-symbols-outlined"},"auto_awesome")],-1)),o[11]||(o[11]=e("div",{class:"fw-600 fs-15 mt-3"},"AI 正在根據檔案內容產出初稿...",-1)),e("div",Ze,"使用模板："+d(h.value)+"，請稍候",1),e("div",es,[e("div",{class:"ai-progress-fill",style:ae({width:A.value+"%"})},null,4)]),e("div",ss,d(A.value)+"%",1)])):(l(),a("div",ts,[e("div",ls,[e("div",as,[o[12]||(o[12]=e("i",{class:"material-symbols-outlined",style:{color:"var(--color-main)"}},"auto_awesome",-1)),o[13]||(o[13]=e("span",{class:"fw-700 fs-14"},"AI 初稿已生成",-1)),e("span",os,d(h.value),1)]),o[14]||(o[14]=e("span",{class:"fc-grey-1 fs-12"},"進入編輯器後可修改所有內容",-1))]),e("div",is,[e("div",ns,d(B.value),1),e("pre",rs,d(I.value),1)])]))])):f("",!0)]),e("div",ds,[e("button",{class:"swal2-cancel swal2-styled",onClick:D,style:{margin:"0 !important"}},"取消"),c.value===1?(l(),a("button",{key:0,class:"swal2-confirm swal2-styled btn-secondary",disabled:C.value,onClick:L,style:{margin:"0 !important"}}," 繼續建立知識 ",8,cs)):f("",!0),c.value===2?(l(),a(w,{key:1},[e("button",{class:"swal2-cancel swal2-styled",onClick:o[0]||(o[0]=r=>c.value=1),style:{margin:"0 !important"}}," 上一步 "),e("button",{class:"swal2-confirm swal2-styled btn-secondary",disabled:!m.value,onClick:E,style:{margin:"0 !important"}}," 開始 AI 生成 ",8,us)],64)):f("",!0),c.value===3&&!S.value?(l(),a(w,{key:2},[e("button",{class:"swal2-cancel swal2-styled",onClick:o[1]||(o[1]=r=>c.value=2),style:{margin:"0 !important"}}," 重新選擇模板 "),e("button",{class:"swal2-confirm swal2-styled btn-secondary",onClick:V,style:{margin:"0 !important"}}," 進入編輯器 ")],64)):f("",!0)])])])])):f("",!0)}}),vs="data:image/png;base64,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",fs={class:"ResourceLibrary views-page"},ms={class:"views-page-content-box"},ws={class:"views-page-header"},ys={class:"secondary-box"},As={class:"header-right-box"},gs={class:"resource-filter-row"},hs={class:"filter-right"},Ts={key:0,class:"p-5 mt-4 text-center fc-grey-1"},bs={key:1,class:"card-list-box mt-2"},_s=["onMouseleave"],ks={class:"card-header-box"},Cs={class:"file-name"},Ns=["id"],Is=["onClick"],Es=["onClick"],Ms=["onClick"],Ss=["onClick"],Rs={class:"card-body-box"},xs=["src"],Bs={key:1,class:"material-symbols-outlined other-file-icon"},Os=["src"],Ls={class:"card-footer-box"},Ds={class:"fc-grey-1"},Us={key:2,class:"table-list-box file-list mt-2"},$s={class:"custom-table"},Ps=["onMouseleave"],Ws={class:"file-icon-box"},zs=["src"],Vs={key:1,class:"material-symbols-outlined other-file-icon"},Fs=["src"],Qs=["id"],Hs={class:"fc-grey-1"},Js={class:"material-symbols-outlined"},Gs={class:"fc-grey-1"},js={class:"d-flex"},qs=["onClick"],Ys=["onClick"],Ks=["onClick"],Xs=["onClick"],it=te({__name:"ResourceLibrary",setup(X){const J=ve(),b=le(),_=u(!1),k=u(null),c=ne(),C=oe(),{isEnterAppSearchPage:N,projectListMode:m}=ie(C),S=C.openBatchUploadFn,A=u(c.query.teamId),I=u(c.query.teamName);K(()=>c.query,i=>{A.value=i.teamId,I.value=i.teamName});const g=u("ALL"),G=[{label:"全部檔案",value:"ALL"},{label:"資料入庫型",value:"AI_PARSED"},{label:"原檔保存型",value:"RAW"}],x={uploading:"上傳中",parsing:"解析中",stored:"已入庫",saved:"已儲存",failed:"失敗"},h=u(""),B=u([{showMoreOption:!1,id:"res1",fileName:"26W產品特色簡報.pptx",fileUrl:"",fileType:"PPT",processType:"RAW",status:"saved",creatorType:"USER",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res2",fileName:"25W產品銷售DM.pdf",fileUrl:"",fileType:"PDF",processType:"RAW",status:"saved",creatorType:"USER",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res3",fileName:"Teva202502庫存資料.xlsx",fileUrl:"",fileType:"EXCEL",processType:"AI_PARSED",status:"stored",creatorType:"USER",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res4",fileName:"25W產品特色搭配建議.pdf",fileUrl:"",fileType:"PDF",processType:"RAW",status:"saved",creatorType:"USER",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res5",fileName:"競品戶外涼鞋分析報告.html",fileUrl:"",fileType:"HTML",processType:"RAW",status:"saved",creatorType:"USER",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res6",fileName:"DM設計用背景圖（清晨）.png",fileUrl:"https://picsum.photos/410/240.webp?random=10",fileType:"IMAGE",processType:"RAW",status:"saved",creatorType:"AI",ownerId:"AiAgent1",ownerName:"Ai Agent",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res7",fileName:"DM設計用背景圖（山景）.png",fileUrl:"https://picsum.photos/410/240.webp?random=11",fileType:"IMAGE",processType:"RAW",status:"saved",creatorType:"AI",ownerId:"AiAgent1",ownerName:"Ai Agent",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res8",fileName:"特殊材質名稱轉換清單.md",fileUrl:"",fileType:"MD",processType:"AI_PARSED",status:"parsing",creatorType:"USER",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res9",fileName:"特殊材質名稱轉換清單(新）.txt",fileUrl:"",fileType:"TXT",processType:"RAW",status:"saved",creatorType:"USER",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res10",fileName:"26W電商上架資訊包含SEO.docx",fileUrl:"",fileType:"WORD",processType:"RAW",status:"saved",creatorType:"USER",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res11",fileName:"官網新用戶消費傾向分析.chart",fileUrl:"",fileType:"CHART",processType:"RAW",status:"saved",creatorType:"AI",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"},{showMoreOption:!1,id:"res12",fileName:"unknown.xyz",fileUrl:"",fileType:"OTHER",processType:"RAW",status:"saved",creatorType:"AI",ownerId:"user1",ownerName:"Lucas",lastModify:"2026-02-06 14:15:00"}]),R=u(1),O=u(10),L=P(()=>{let i=B.value;return g.value!=="ALL"&&(i=i.filter(s=>s.processType===g.value)),h.value&&(i=i.filter(s=>s.fileType===h.value)),i});K([g,h],()=>{R.value=1});const E=P(()=>{const i=(R.value-1)*O.value;return L.value.slice(i,i+O.value)});function j(i){R.value=i.pageNo}function z(i){return i.toUpperCase()==="IMAGE"}function V(i){return{PDF:_e,PPT:be,EXCEL:Te,HTML:he,MD:ge,WORD:Ae,TXT:se,CHART:vs}[i.toUpperCase()]||se}function D(i){const s=new Date(i);return`${s.getFullYear()}年${s.getMonth()+1}月${s.getDate()}日 ${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`}const n=u(null);function o(i){i.showMoreOption=!1,console.log("TODO... 編輯檔案名稱",i),n.value={...i},n.value.catch=JSON.parse(JSON.stringify(i)),pe(()=>{const s=document.getElementById("mofidyInput"+i.id);if(s){s.focus();const M=s.value.length;s.setSelectionRange(M,M)}})}function r(){if(!n.value.fileName.trim()){ee.alert("檔案名稱不能為空"),n.value=null;return}if(n.value.fileName===n.value.catch.fileName){n.value=null;return}console.log("TODO...儲存檔案名稱",n.value.fileName),n.value=null}function p(i){i.showMoreOption=!1,k.value={id:i.id,fileName:i.fileName,fileType:i.fileType},_.value=!0}function q(i){if(!k.value)return;const{knowledgeId:s,versionId:M}=b.createFromFile({fileId:k.value.id,fileName:k.value.fileName,template:i.template,content:i.content});J.push({name:"KnowledgeEditor",params:{knowledgeId:s,versionId:M}})}function F(i){i.showMoreOption=!1,ee.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定刪除嗎？</div>
      <div class="fs-16">刪除後將無法復原。</div>
    </div>
  `,()=>{B.value=B.value.filter(s=>s.id!==i.id)})}return(i,s)=>{const M=ue("tooltip");return l(),a(w,null,[U(e("div",fs,[e("div",ms,[e("div",ws,[e("h3",null,[s[11]||(s[11]=T(" 共用檔案管理 ",-1)),e("div",ys,d(I.value),1)]),e("div",As,[Q(me,{modelValue:$(m),"onUpdate:modelValue":s[0]||(s[0]=t=>ce(m)?m.value=t:null)},null,8,["modelValue"])])]),e("div",gs,[Q(fe,{modelValue:g.value,"onUpdate:modelValue":s[1]||(s[1]=t=>g.value=t),tabs:G},null,8,["modelValue"]),e("div",hs,[Q(we,{class:"mr-2",options:[{name:"所有檔案類型",value:""},{name:"PDF",value:"PDF"},{name:"PPT",value:"PPT"},{name:"Excel",value:"EXCEL"},{name:"Image",value:"IMAGE"},{name:"HTML",value:"HTML"},{name:"Word",value:"WORD"},{name:"Markdown",value:"MD"},{name:"文字檔",value:"TXT"},{name:"Chart",value:"CHART"},{name:"其他",value:"OTHER"}],"show-search":!1,showClearTriggerIcon:!1,"default-value":"",width:"170px",placeholder:"所有檔案類型",onSelect:s[2]||(s[2]=t=>{h.value=t.value})}),e("button",{class:"custom-btn custom-main-btn",onClick:s[3]||(s[3]=t=>$(S)())},[...s[12]||(s[12]=[e("i",{class:"material-symbols-outlined"},"add",-1),T(" 上傳檔案 ",-1)])])])]),E.value.length===0?(l(),a("div",Ts,"目前沒有資源")):f("",!0),$(m)==="card"&&E.value.length?(l(),a("div",bs,[(l(!0),a(w,null,W(E.value,(t,Y)=>(l(),a("div",{class:"one-card-box file-card",key:"card"+Y,onMouseleave:v=>t.showMoreOption=!1},[e("div",ks,[e("div",Cs,[!n.value||n.value.id!==t.id?(l(),a(w,{key:0},[T(d(t.fileName),1)],64)):n.value.id===t.id?U((l(),a("input",{key:1,class:"custom-input mofidyInput w-100",id:"mofidyInput"+t.id,"onUpdate:modelValue":s[4]||(s[4]=v=>n.value.fileName=v),onBlur:s[5]||(s[5]=v=>r())},null,40,Ns)),[[Z,n.value.fileName]]):f("",!0)]),e("div",{class:"more-menu-wrap",onClick:s[6]||(s[6]=H(()=>{},["stop"]))},[e("i",{class:"material-symbols-outlined more-btn",onClick:v=>t.showMoreOption=!t.showMoreOption},"more_horiz",8,Is),e("div",{class:y(["next-option-box",{show:t.showMoreOption}])},[e("div",{class:"option-item",onClick:v=>o(t)},"編輯檔案名稱",8,Es),s[13]||(s[13]=e("div",{class:"option-item"},"下載檔案",-1)),e("div",{class:"option-item divider",onClick:v=>p(t)},"建立為知識內容",8,Ms),e("div",{class:"option-item option-item--danger",onClick:v=>F(t)},"刪除",8,Ss)],2)])]),e("div",Rs,[z(t.fileType)?(l(),a("img",{key:0,src:t.fileUrl,alt:"",class:"preview-img"},null,8,xs)):t.fileType==="OTHER"?U((l(),a("i",Bs,[...s[14]||(s[14]=[T("question_mark",-1)])])),[[M,"未知的檔案類型"]]):(l(),a("img",{key:2,src:V(t.fileType),alt:"",class:"file-type-icon"},null,8,Os))]),e("div",Ls,[e("span",{class:y(["status-badge",`status-badge--${t.status}`])},d(x[t.status]),3),e("span",Ds,d(D(t.lastModify)),1)])],40,_s))),128))])):f("",!0),$(m)==="list"&&E.value.length?(l(),a("div",Us,[e("table",$s,[s[17]||(s[17]=e("thead",null,[e("tr",null,[e("th",null,"檔案名稱"),e("th",{width:"90"},"檔案格式"),e("th",{width:"130"},"處理方式"),e("th",{width:"110"},"狀態"),e("th",null,"最後更新時間"),e("th",{width:"60"})])],-1)),e("tbody",null,[(l(!0),a(w,null,W(E.value,(t,Y)=>(l(),a("tr",{key:"list"+Y,onMouseleave:v=>{t.showMoreOption=!1}},[e("td",null,[e("div",Ws,[z(t.fileType)?(l(),a("img",{key:0,src:t.fileUrl,alt:""},null,8,zs)):t.fileType==="OTHER"?U((l(),a("i",Vs,[...s[15]||(s[15]=[T("question_mark",-1)])])),[[M,"未知的檔案類型"]]):(l(),a("img",{key:2,src:V(t.fileType),alt:""},null,8,Fs))]),!n.value||n.value.id!==t.id?(l(),a(w,{key:0},[T(d(t.fileName),1)],64)):n.value.id===t.id?U((l(),a("input",{key:1,class:"custom-input mofidyInput w-80",id:"mofidyInput"+t.id,"onUpdate:modelValue":s[7]||(s[7]=v=>n.value.fileName=v),onBlur:s[8]||(s[8]=v=>r())},null,40,Qs)),[[Z,n.value.fileName]]):f("",!0)]),e("td",Hs,d(t.fileType),1),e("td",null,[e("span",{class:y(["process-type-badge",t.processType==="AI_PARSED"?"badge--ai":"badge--raw"])},[e("i",Js,d(t.processType==="AI_PARSED"?"auto_awesome":"save"),1),T(" "+d(t.processType==="AI_PARSED"?"資料入庫型":"原檔保存型"),1)],2)]),e("td",null,[e("span",{class:y(["status-badge",`status-badge--${t.status}`])},d(x[t.status]),3)]),e("td",Gs,d(D(t.lastModify)),1),e("td",null,[e("div",js,[e("i",{class:"material-symbols-outlined material-fill more-btn",onClick:H(v=>t.showMoreOption=!0,["stop"])},"more_horiz",8,qs)]),e("div",{class:y(["next-option-box",{show:t.showMoreOption}]),onClick:s[9]||(s[9]=H(()=>{},["stop"]))},[e("div",{class:"option-item",onClick:v=>o(t)},"編輯檔案名稱",8,Ys),s[16]||(s[16]=e("div",{class:"option-item"},"下載檔案",-1)),e("div",{class:"option-item divider",onClick:v=>p(t)},"建立為知識內容",8,Ks),e("div",{class:"option-item option-item--danger",onClick:v=>F(t)},"刪除",8,Xs)],2)])],40,Ps))),128))])])])):f("",!0),L.value.length?(l(),de(ye,{key:3,class:"mt-3",pageNo:R.value,numberOfRowsPerPage:O.value,totalRows:L.value.length,onChange:j},null,8,["pageNo","numberOfRowsPerPage","totalRows"])):f("",!0)])],512),[[re,!$(N)]]),Q(ps,{modelValue:_.value,"onUpdate:modelValue":s[10]||(s[10]=t=>_.value=t),file:k.value,onConfirm:q},null,8,["modelValue","file"])],64)}}});export{it as default};
