import{d as ae,B as N,r as u,C as X,I as ie,o as a,j as K,a as e,c as i,n as p,t as d,F as g,z,p as _,G as re,h,l as ue,s as ce,A as ve,e as O,i as V,q as me,x as P,y as pe,v as te,w as Z,H as fe,D as ge,E as le,u as Ae}from"./index-Dp3BVpx6.js";import{_ as he}from"./compTabs.vue_vue_type_script_setup_true_lang-DQITGWtg.js";import{_ as be}from"./compListCardSwitch.vue_vue_type_script_setup_true_lang-C2PpQQ8A.js";import{_ as _e}from"./compDropDown.vue_vue_type_script_setup_true_lang-CzN9cXrc.js";import{_ as we}from"./compPagination.vue_vue_type_script_setup_true_lang-B2Qo3YBm.js";import{u as ne}from"./knowledgeStore-BnwAOOXz.js";import{u as ye}from"./resourceStore-X_Guharw.js";import{_ as ke}from"./compModal.vue_vue_type_script_setup_true_lang-Cl8H5WMN.js";import{_ as Ce}from"./SourceUpdateModal.vue_vue_type_script_setup_true_lang-DnqTW7bM.js";import{t as oe,w as Te,m as Ee,h as Se,e as Ie,p as Ne,a as xe}from"./word-DrYf76ob.js";const Be={class:"wizard-header-box"},Me={class:"wizard-steps"},Re={key:0,class:"material-symbols-outlined"},$e={key:1},De={class:"wizard-step-label"},Le={key:0,class:"wizard-step-connector"},Oe={class:"wizard-modal-body"},Ve={class:"wizard-file-info"},Pe={class:"file-icon-box"},ze={class:"material-symbols-outlined"},Ue={class:"file-text-content"},Fe={class:"file-name"},Qe={key:0,class:"wizard-step-content"},He={key:0,class:"wizard-state-center"},We={key:1},Je={class:"check-result-banner check-result-banner--warning"},Ge={class:"banner-text"},je={class:"banner-title"},qe={class:"similar-items-list"},Ye={class:"item-main"},Ke={class:"item-info"},Ze={class:"item-title"},Xe={class:"item-meta"},es={key:1,class:"check-result-banner check-result-banner--success"},ss={key:1,class:"wizard-step-content"},ts={class:"template-grid"},ls=["onClick"],os={class:"template-card-icon"},as={class:"material-symbols-outlined"},is={class:"template-card-content"},ns={class:"template-card-title"},ds={class:"template-card-desc"},rs={key:0,class:"template-card-check"},us={key:2,class:"wizard-step-content"},cs={key:0,class:"wizard-state-center"},vs={class:"status-desc"},ms={class:"ai-progress-container mt-4"},ps={class:"ai-progress-track"},fs={class:"progress-text"},gs={key:1,class:"ai-preview-container"},As={class:"ai-preview-header"},hs={class:"header-left"},bs={class:"template-badge"},_s={class:"ai-preview-body"},ws={class:"preview-title"},ys={class:"preview-scroll-area"},ks={class:"preview-text"},Cs={class:"wizard-footer-actions"},Ts={class:"action-right"},Es=["disabled"],Ss=["disabled"],Is=ae({__name:"CreateKnowledgeWizardModal",props:{modelValue:{type:Boolean},file:{}},emits:["update:modelValue","confirm"],setup(ee,{emit:G}){const w=ee,k=G,x=N({get:()=>w.modelValue,set:c=>k("update:modelValue",c)}),C=ne(),r=u(1),T=u(!1),b=u([]),A=u(""),E=u(!1),f=u(0),B=u(""),U=["相似性檢查","選擇模板","AI 生成初稿"],F={PUBLISHED:"已發布",REVIEWING:"審核中",DRAFT:"草稿",REJECTED:"已退回"},y=[{value:"PRODUCT",label:"商品 / 銷售資料",icon:"storefront",desc:"商品規格與銷售數據整理，適合庫存管理、銷售報告"},{value:"SOP",label:"SOP 標準流程",icon:"account_tree",desc:"標準作業程序，適合業務流程、操作規範"},{value:"GUIDE",label:"操作說明",icon:"menu_book",desc:"系統功能使用指引，適合軟體操作、功能介紹"},{value:"RULE",label:"規則說明",icon:"gavel",desc:"規則與政策說明，適合商業規則、合規文件"}],$=N(()=>y.find(c=>c.value===A.value)?.label??""),Q=N(()=>w.file?.fileName.replace(/\.[^.]+$/,"")??""),M=N(()=>{const c=w.file?.fileType?.toUpperCase()??"";return{EXCEL:"table_view",PDF:"picture_as_pdf",WORD:"description",PPT:"slideshow",IMAGE:"image",TXT:"article",MD:"article",HTML:"html",CHART:"bar_chart"}[c]??"insert_drive_file"});X(()=>w.modelValue,c=>{c&&(r.value=1,A.value="",b.value=[],B.value="",j())});function j(){T.value=!0,setTimeout(()=>{const l=(w.file?.fileName?.toLowerCase()??"").replace(/[._\-\d]/g," ").trim().split(/\s+/).filter(v=>v.length>1);b.value=C.knowledgeList.filter(v=>{const W=v.title.toLowerCase();return l.some(J=>W.includes(J))}),T.value=!1},1800)}function R(){r.value=2}function D(){A.value&&(r.value=3,L())}function L(){E.value=!0,f.value=0;const c=setInterval(()=>{f.value+=Math.floor(Math.random()*12)+5,f.value>=100&&(f.value=100,clearInterval(c),setTimeout(()=>{B.value=S(A.value,w.file?.fileName??""),E.value=!1},300))},200)}function S(c,o){const l=o.replace(/\.[^.]+$/,"");switch(c){case"PRODUCT":return`# ${l} — 商品 / 銷售資料

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
資料來源：${l}，如有更新請以最新版文件為準。`;case"SOP":return`# ${l} — 標準作業程序 (SOP)

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
- 遇不確定情況請即時詢問主管`;case"GUIDE":return`# ${l} — 操作說明

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
| 資料載入失敗 | 網路或權限問題 | 重新整理頁面後再試 |`;case"RULE":return`# ${l} — 規則說明

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
違反本規則者，依公司相關人事規定處理，情節重大者依法追究。`;default:return""}}function q(){k("confirm",{template:$.value,content:B.value}),k("update:modelValue",!1)}function H(){k("update:modelValue",!1)}return(c,o)=>(a(),ie(ke,{class:"CreateKnowledgeWizardModal",modelValue:x.value,"onUpdate:modelValue":o[2]||(o[2]=l=>x.value=l),width:660,showClose:!E.value&&!T.value},{title:K(()=>[e("div",Be,[o[3]||(o[3]=e("h4",{class:"wizard-modal-title"},"建立知識條目",-1)),e("div",Me,[(a(),i(g,null,z(U,(l,v)=>(a(),i(g,{key:v},[e("div",{class:_(["wizard-step-item",{"is-active":r.value>=v+1}])},[e("div",{class:_(["wizard-step-dot",{"is-done":r.value>v+1,"is-active":r.value===v+1}])},[r.value>v+1?(a(),i("i",Re,"check")):(a(),i("span",$e,d(v+1),1))],2),e("span",De,d(l),1)],2),v<U.length-1?(a(),i("div",Le)):p("",!0)],64))),64))])])]),footer:K(()=>[e("div",Cs,[e("button",{class:"custom-btn",onClick:H},"取消"),e("div",Ts,[r.value===1?(a(),i("button",{key:0,class:"custom-btn custom-main-btn",disabled:T.value,onClick:R},[...o[17]||(o[17]=[h(" 繼續建立知識 ",-1),e("i",{class:"material-symbols-outlined fs-18 ml-1"},"arrow_forward",-1)])],8,Es)):p("",!0),r.value===2?(a(),i(g,{key:1},[e("button",{class:"custom-btn mr-2",onClick:o[0]||(o[0]=l=>r.value=1)},"上一步"),e("button",{class:"custom-btn custom-main-btn",disabled:!A.value,onClick:D},[...o[18]||(o[18]=[h(" 開始 AI 生成 ",-1),e("i",{class:"material-symbols-outlined fs-18 ml-1"},"bolt",-1)])],8,Ss)],64)):p("",!0),r.value===3&&!E.value?(a(),i(g,{key:2},[e("button",{class:"custom-btn mr-2",onClick:o[1]||(o[1]=l=>r.value=2)},"重新選擇模板"),e("button",{class:"custom-btn custom-main-btn",onClick:q},[...o[19]||(o[19]=[h(" 進入編輯器 ",-1),e("i",{class:"material-symbols-outlined fs-18 ml-1"},"edit_square",-1)])])],64)):p("",!0)])])]),default:K(()=>[e("div",Oe,[e("div",Ve,[e("div",Pe,[e("i",ze,d(M.value),1)]),e("div",Ue,[o[4]||(o[4]=e("span",{class:"file-label"},"來源檔案",-1)),e("span",Fe,d(c.file?.fileName),1)])]),r.value===1?(a(),i("div",Qe,[T.value?(a(),i("div",He,[...o[5]||(o[5]=[e("div",{class:"ai-pulse-icon"},[e("i",{class:"material-symbols-outlined"},"manage_search")],-1),e("div",{class:"status-title"},"正在掃描相似知識條目...",-1),e("div",{class:"status-desc"},"系統正在比對知識庫中的現有條目，確保內容不重複",-1)])])):(a(),i("div",We,[b.value.length?(a(),i(g,{key:0},[e("div",Je,[o[7]||(o[7]=e("i",{class:"material-symbols-outlined"},"warning",-1)),e("div",Ge,[e("div",je,"發現 "+d(b.value.length)+" 個可能相關的現有條目",1),o[6]||(o[6]=e("div",{class:"banner-desc"},"建議先檢查現有內容，您仍可繼續建立新條目或選擇編輯舊有條目。",-1))])]),e("div",qe,[(a(!0),i(g,null,z(b.value,l=>(a(),i("div",{class:"similar-item-card",key:l.id},[e("div",Ye,[o[8]||(o[8]=e("div",{class:"item-icon"},[e("i",{class:"material-symbols-outlined"},"menu_book")],-1)),e("div",Ke,[e("div",Ze,d(l.title),1),e("div",Xe,"分類："+d(l.category||"未分類")+" · 版本："+d(l.currentVersion),1)])]),e("span",{class:_(["status-badge",`status-badge--${l.status}`])},d(F[l.status]),3)]))),128))])],64)):(a(),i("div",es,[...o[9]||(o[9]=[e("i",{class:"material-symbols-outlined"},"check_circle",-1),e("div",{class:"banner-text"},[e("div",{class:"banner-title"},"未發現重複條目"),e("div",{class:"banner-desc"},"知識庫中目前沒有與此檔案內容相似的條目，您可以放心地開始建立。")],-1)])]))]))])):p("",!0),r.value===2?(a(),i("div",ss,[o[11]||(o[11]=e("div",{class:"step-guide-text"}," 選擇最符合此知識條目用途的模板，AI 將據此產出對應格式的初稿。 ",-1)),e("div",ts,[(a(),i(g,null,z(y,l=>e("div",{key:l.value,class:_(["template-card",{"is-active":A.value===l.value}]),onClick:v=>A.value=l.value},[e("div",os,[e("i",as,d(l.icon),1)]),e("div",is,[e("div",ns,d(l.label),1),e("div",ds,d(l.desc),1)]),A.value===l.value?(a(),i("div",rs,[...o[10]||(o[10]=[e("i",{class:"material-symbols-outlined"},"check_circle",-1)])])):p("",!0)],10,ls)),64))])])):p("",!0),r.value===3?(a(),i("div",us,[E.value?(a(),i("div",cs,[o[12]||(o[12]=e("div",{class:"ai-pulse-icon ai-pulse-icon--generating"},[e("i",{class:"material-symbols-outlined"},"auto_awesome")],-1)),o[13]||(o[13]=e("div",{class:"status-title"},"AI 正在根據檔案內容產出初稿...",-1)),e("div",vs,"選用模板："+d($.value),1),e("div",ms,[e("div",ps,[e("div",{class:"ai-progress-fill",style:re({width:f.value+"%"})},null,4)]),e("div",fs,d(f.value)+"%",1)])])):(a(),i("div",gs,[e("div",As,[e("div",hs,[o[14]||(o[14]=e("i",{class:"material-symbols-outlined title-icon"},"auto_awesome",-1)),o[15]||(o[15]=e("span",{class:"header-title"},"AI 初稿預覽",-1)),e("span",bs,d($.value),1)]),o[16]||(o[16]=e("span",{class:"header-hint"},"進入編輯器後可進行細部修改",-1))]),e("div",_s,[e("div",ws,d(Q.value),1),e("div",ys,[e("pre",ks,d(B.value),1)])])]))])):p("",!0)])]),_:1},8,["modelValue","showClose"]))}}),Ns="data:image/png;base64,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",xs={class:"ResourceLibrary views-page"},Bs={class:"views-page-content-box"},Ms={class:"views-page-header"},Rs={class:"secondary-box"},$s={class:"header-right-box"},Ds={class:"resource-filter-row"},Ls={class:"filter-right"},Os={key:0,class:"p-5 mt-4 text-center fc-grey-1"},Vs={key:1,class:"card-list-box mt-2"},Ps=["onMouseleave"],zs={class:"card-header-box"},Us={class:"file-name"},Fs=["id"],Qs=["onClick"],Hs=["onClick"],Ws=["onClick"],Js=["onClick"],Gs={class:"card-body-box"},js=["src"],qs={key:1,class:"material-symbols-outlined other-file-icon"},Ys=["src"],Ks={class:"card-footer-box"},Zs={class:"fc-grey-1"},Xs={key:2,class:"table-list-box file-list mt-2"},et={class:"custom-table"},st=["onMouseleave"],tt={class:"file-icon-box"},lt=["src"],ot={key:1,class:"material-symbols-outlined other-file-icon"},at=["src"],it=["id"],nt={class:"fc-grey-1"},dt={class:"material-symbols-outlined"},rt={class:"fc-grey-1"},ut={class:"d-flex"},ct=["onClick"],vt=["onClick"],mt=["onClick"],pt=["onClick"],Tt=ae({__name:"ResourceLibrary",setup(ee){const G=Ae(),w=ne(),k=ye(),x=u(!1),C=u(null),r=u(!1),T=u(""),b=ve(),A=ue(),{isEnterAppSearchPage:E,projectListMode:f}=ce(A),B=A.openBatchUploadFn,U=u(b.query.teamId),F=u(b.query.teamName);X(()=>b.query,n=>{U.value=n.teamId,F.value=n.teamName});const y=u("ALL"),$=[{label:"全部檔案",value:"ALL"},{label:"資料入庫型",value:"AI_PARSED"},{label:"原檔保存型",value:"RAW"}],Q={uploading:"上傳中",parsing:"解析中",stored:"已入庫",saved:"已儲存",failed:"失敗"},M=u(""),j=N(()=>k.resourceList),R=u(1),D=u(10),L=N(()=>{let n=j.value;return y.value!=="ALL"&&(n=n.filter(s=>s.processType===y.value)),M.value&&(n=n.filter(s=>s.fileType===M.value)),n});X([y,M],()=>{R.value=1});const S=N(()=>{const n=(R.value-1)*D.value;return L.value.slice(n,n+D.value)});function q(n){R.value=n.pageNo}function H(n){return n.toUpperCase()==="IMAGE"}function c(n){return{PDF:xe,PPT:Ne,EXCEL:Ie,HTML:Se,MD:Ee,WORD:Te,TXT:oe,CHART:Ns}[n.toUpperCase()]||oe}function o(n){const s=new Date(n);return`${s.getFullYear()}年${s.getMonth()+1}月${s.getDate()}日 ${String(s.getHours()).padStart(2,"0")}:${String(s.getMinutes()).padStart(2,"0")}`}const l=u(null);function v(n){n.showMoreOption=!1,l.value={...n},l.value.catch=JSON.parse(JSON.stringify(n)),ge(()=>{const s=document.getElementById("mofidyInput"+n.id);if(s){s.focus();const I=s.value.length;s.setSelectionRange(I,I)}})}function W(){if(!l.value.fileName.trim()){le.alert("檔案名稱不能為空"),l.value=null;return}if(l.value.fileName===l.value.catch.fileName){l.value=null;return}console.log("TODO...儲存檔案名稱",l.value.fileName),l.value=null}function J(n){n.showMoreOption=!1,C.value={id:n.id,fileName:n.fileName,fileType:n.fileType},x.value=!0}function de(n){if(!C.value)return;const{knowledgeId:s,versionId:I}=w.createFromFile({fileId:C.value.id,fileName:C.value.fileName,template:n.template,content:n.content});G.push({name:"KnowledgeEditor",params:{knowledgeId:s,versionId:I}})}function se(n){n.showMoreOption=!1,le.confirm(`
    <div class="d-flex flex-justify-center flex-column text-center">
      <div class="fs-22 mb-1 fw-600">確定刪除嗎？</div>
      <div class="fs-16">刪除後將無法復原。</div>
    </div>
  `,()=>{k.deleteFile(n.id)})}return(n,s)=>{const I=fe("tooltip");return a(),i(g,null,[O(e("div",xs,[e("div",Bs,[e("div",Ms,[e("h3",null,[s[12]||(s[12]=h(" 共用檔案管理 ",-1)),e("div",Rs,d(F.value),1)]),e("div",$s,[V(be,{modelValue:P(f),"onUpdate:modelValue":s[0]||(s[0]=t=>pe(f)?f.value=t:null)},null,8,["modelValue"])])]),e("div",Ds,[V(he,{modelValue:y.value,"onUpdate:modelValue":s[1]||(s[1]=t=>y.value=t),tabs:$},null,8,["modelValue"]),e("div",Ls,[V(_e,{class:"mr-2",options:[{name:"所有檔案類型",value:""},{name:"PDF",value:"PDF"},{name:"PPT",value:"PPT"},{name:"Excel",value:"EXCEL"},{name:"Image",value:"IMAGE"},{name:"HTML",value:"HTML"},{name:"Word",value:"WORD"},{name:"Markdown",value:"MD"},{name:"文字檔",value:"TXT"},{name:"Chart",value:"CHART"},{name:"其他",value:"OTHER"}],"show-search":!1,showClearTriggerIcon:!1,"default-value":"",width:"170px",placeholder:"所有檔案類型",onSelect:s[2]||(s[2]=t=>{M.value=t.value})}),e("button",{class:"custom-btn custom-main-btn",onClick:s[3]||(s[3]=t=>P(B)())},[...s[13]||(s[13]=[e("i",{class:"material-symbols-outlined"},"add",-1),h(" 上傳檔案 ",-1)])])])]),S.value.length===0?(a(),i("div",Os,"目前沒有資源")):p("",!0),P(f)==="card"&&S.value.length?(a(),i("div",Vs,[(a(!0),i(g,null,z(S.value,(t,Y)=>(a(),i("div",{class:"one-card-box file-card",key:"card"+Y,onMouseleave:m=>t.showMoreOption=!1},[e("div",zs,[e("div",Us,[!l.value||l.value.id!==t.id?(a(),i(g,{key:0},[h(d(t.fileName),1)],64)):l.value.id===t.id?O((a(),i("input",{key:1,class:"custom-input mofidyInput w-100",id:"mofidyInput"+t.id,"onUpdate:modelValue":s[4]||(s[4]=m=>l.value.fileName=m),onBlur:s[5]||(s[5]=m=>W())},null,40,Fs)),[[te,l.value.fileName]]):p("",!0)]),e("div",{class:"more-menu-wrap",onClick:s[6]||(s[6]=Z(()=>{},["stop"]))},[e("i",{class:"material-symbols-outlined more-btn",onClick:m=>t.showMoreOption=!t.showMoreOption},"more_horiz",8,Qs),e("div",{class:_(["next-option-box",{show:t.showMoreOption}])},[e("div",{class:"option-item",onClick:m=>v(t)},"編輯檔案名稱",8,Hs),s[14]||(s[14]=e("div",{class:"option-item"},"下載檔案",-1)),e("div",{class:"option-item divider",onClick:m=>J(t)},"建立為知識內容",8,Ws),e("div",{class:"option-item option-item--danger",onClick:m=>se(t)},"刪除",8,Js)],2)])]),e("div",Gs,[H(t.fileType)?(a(),i("img",{key:0,src:t.fileUrl,alt:"",class:"preview-img"},null,8,js)):t.fileType==="OTHER"?O((a(),i("i",qs,[...s[15]||(s[15]=[h("question_mark",-1)])])),[[I,"未知的檔案類型"]]):(a(),i("img",{key:2,src:c(t.fileType),alt:"",class:"file-type-icon"},null,8,Ys))]),e("div",Ks,[e("span",{class:_(["status-badge",`status-badge--${t.status}`])},d(Q[t.status]),3),e("span",Zs,d(o(t.lastModify)),1)])],40,Ps))),128))])):p("",!0),P(f)==="list"&&S.value.length?(a(),i("div",Xs,[e("table",et,[s[18]||(s[18]=e("thead",null,[e("tr",null,[e("th",null,"檔案名稱"),e("th",{width:"90"},"檔案格式"),e("th",{width:"130"},"處理方式"),e("th",{width:"110"},"狀態"),e("th",null,"最後更新時間"),e("th",{width:"60"})])],-1)),e("tbody",null,[(a(!0),i(g,null,z(S.value,(t,Y)=>(a(),i("tr",{key:"list"+Y,onMouseleave:m=>{t.showMoreOption=!1}},[e("td",null,[e("div",tt,[H(t.fileType)?(a(),i("img",{key:0,src:t.fileUrl,alt:""},null,8,lt)):t.fileType==="OTHER"?O((a(),i("i",ot,[...s[16]||(s[16]=[h("question_mark",-1)])])),[[I,"未知的檔案類型"]]):(a(),i("img",{key:2,src:c(t.fileType),alt:""},null,8,at))]),!l.value||l.value.id!==t.id?(a(),i(g,{key:0},[h(d(t.fileName),1)],64)):l.value.id===t.id?O((a(),i("input",{key:1,class:"custom-input mofidyInput w-80",id:"mofidyInput"+t.id,"onUpdate:modelValue":s[7]||(s[7]=m=>l.value.fileName=m),onBlur:s[8]||(s[8]=m=>W())},null,40,it)),[[te,l.value.fileName]]):p("",!0)]),e("td",nt,d(t.fileType),1),e("td",null,[e("span",{class:_(["process-type-badge",t.processType==="AI_PARSED"?"badge--ai":"badge--raw"])},[e("i",dt,d(t.processType==="AI_PARSED"?"auto_awesome":"save"),1),h(" "+d(t.processType==="AI_PARSED"?"資料入庫型":"原檔保存型"),1)],2)]),e("td",null,[e("span",{class:_(["status-badge",`status-badge--${t.status}`])},d(Q[t.status]),3)]),e("td",rt,d(o(t.lastModify)),1),e("td",null,[e("div",ut,[e("i",{class:"material-symbols-outlined material-fill more-btn",onClick:Z(m=>t.showMoreOption=!0,["stop"])},"more_horiz",8,ct)]),e("div",{class:_(["next-option-box",{show:t.showMoreOption}]),onClick:s[9]||(s[9]=Z(()=>{},["stop"]))},[e("div",{class:"option-item",onClick:m=>v(t)},"編輯檔案名稱",8,vt),s[17]||(s[17]=e("div",{class:"option-item"},"下載檔案",-1)),e("div",{class:"option-item divider",onClick:m=>J(t)},"建立為知識內容",8,mt),e("div",{class:"option-item option-item--danger",onClick:m=>se(t)},"刪除",8,pt)],2)])],40,st))),128))])])])):p("",!0),L.value.length?(a(),ie(we,{key:3,class:"mt-3",pageNo:R.value,numberOfRowsPerPage:D.value,totalRows:L.value.length,onChange:q},null,8,["pageNo","numberOfRowsPerPage","totalRows"])):p("",!0)])],512),[[me,!P(E)]]),V(Is,{modelValue:x.value,"onUpdate:modelValue":s[10]||(s[10]=t=>x.value=t),file:C.value,onConfirm:de},null,8,["modelValue","file"]),V(Ce,{modelValue:r.value,"onUpdate:modelValue":s[11]||(s[11]=t=>r.value=t),"file-id":T.value},null,8,["modelValue","file-id"])],64)}}});export{Tt as default};
