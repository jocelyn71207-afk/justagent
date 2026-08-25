<template>
  <div class="GUI views-page" v-show="!isEnterAppSearchPage">
    <div class="views-page-content-box">

      <h1 class="mb-3">GUI</h1>

      <div class=mb-3>
        <h3>測試 http services</h3>
        <button class="custom-btn m-1" @click="testCallAjax">call ajax</button>
        <button class="custom-btn m-1" @click="testAjaxAll">call ajax.all</button>
      </div>

      <div class=mb-3>
        <h3>測試 google Material Design Icons</h3>
        <div class="google-material-box">

          <i class="material-symbols-outlined">shift</i>
          <i class="material-symbols-outlined material-fill">shift</i>
          <i class="material-symbols-outlined material-sharp">shift</i>
          shift
          <br>
          <i class="material-symbols-outlined">keyboard_control_key</i>
          <i class="material-symbols-outlined material-fill">keyboard_control_key</i>
          <i class="material-symbols-outlined material-sharp">keyboard_control_key</i>
          keyboard_control_key
          <br>
          <i class="material-symbols-outlined">keyboard_command_key</i>
          <i class="material-symbols-outlined material-fill">keyboard_command_key</i>
          <i class="material-symbols-outlined material-sharp">keyboard_command_key</i>
          keyboard_command_key
          <br>
          <i class="material-symbols-outlined">keyboard_option_key</i>
          <i class="material-symbols-outlined material-fill">keyboard_option_key</i>
          <i class="material-symbols-outlined material-sharp">keyboard_option_key</i>
          keyboard_option_key
          <br>

          <i class="material-symbols-outlined">search</i>
          <i class="material-symbols-outlined material-fill">search</i>
          <i class="material-symbols-outlined material-sharp">search</i>
          <br>

          <i class="material-symbols-outlined">home</i>
          <i class="material-symbols-outlined material-fill">home</i>
          <i class="material-symbols-outlined material-sharp">home</i>
          <br>

          <i class="material-symbols-outlined">favorite</i>
          <i class="material-symbols-outlined material-fill">favorite</i>
          <i class="material-symbols-outlined material-sharp">favorite</i>
          <br>

          <i class="material-symbols-outlined">settings</i>
          <i class="material-symbols-outlined material-fill">settings</i>
          <i class="material-symbols-outlined material-sharp">settings</i>
          <br>

          <i class="material-symbols-outlined">account_balance_wallet</i>
          <i class="material-symbols-outlined material-fill">account_balance_wallet</i>
          <i class="material-symbols-outlined material-sharp">account_balance_wallet</i>
          <br>

          <i class="material-symbols-outlined">check_circle</i>
          <i class="material-symbols-outlined material-fill">check_circle</i>
          <i class="material-symbols-outlined material-sharp">check_circle</i>
          <br>

        </div>
      </div>

      <div class="mb-3">
        <h3>觀看 a 連結樣式</h3>
        <a class="m-1" href="javascript:;">a link</a> <br>
        <a class="m-1 active" href="javascript:;">a link active</a>
      </div>

      <div class="mb-3">
        <h3>觀看 scrollbar 樣式</h3>
        <div class="testScrollBar m-1">
          scrollbar style
          <br><br><br><br><br><br><br><br><br><br><br><br><br><br>
          <br><br><br><br><br><br><br><br><br><br><br><br><br><br>
          <br><br><br><br><br><br><br><br><br><br><br><br><br><br>
          end
        </div>
      </div>

      <div class="mb-3">
        <h3>觀看色彩計畫（Bootstrap 風格 .bgc-*／.fc-* 工具 class，非主要 token 系統）</h3>
        <p class="fs-13 mb-2" style="color: var(--text-faint);">
          這組是舊式、每個顏色寫死一個 class 的工具集，跟下面「深淺主題」用的 CSS 變數是兩套並存的東西。
          <code>grey-1</code>／<code>red-1</code> 因為全站還有 25＋ 處在用（大多是次要文字／必填標記），已經改接
          <code>var(--text-muted)</code>／<code>var(--danger)</code>，深色模式會正確變色；其餘只剩這個展示頁在用，
          或本身就是 LINE／Facebook 品牌色（<code>green-1</code>／<code>blue-1</code>），刻意維持寫死。
        </p>
        <div class="d-flex flex-wrap gap-3">
          <div v-for="c in legacyColorSwatches" :key="c.cls" class="gui-swatch">
            <div class="gui-swatch-box" :class="c.cls"></div>
            <div class="fs-12 mt-1">.{{ c.cls }}</div>
            <div class="fs-11" style="color: var(--text-faint);">{{ c.note }}</div>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <h3>觀看深淺主題定義（現行 base/_theme.scss token）</h3>
        <p class="fs-13 mb-2" style="color: var(--text-faint);">
          這裡才是實際在用的配色系統。舊版這區展示的是 --color-background／--color-border／--color-text 這組變數，
          但專案重新命名成下面這些 token 之後這區沒有跟著更新，導致每個色塊全部顯示同一片灰藍色（因為那些變數根本不存在）——
          這次順便重寫，改成展示真正還在用的 token，也把色塊本身跟色塊底下的文字分開，不會再有淺色底配淺色字看不清楚的問題。
        </p>
        <div v-for="group in themeTokenGroups" :key="group.title" class="mb-3">
          <h5 class="mt-2">{{ group.title }}</h5>
          <div class="d-flex flex-wrap gap-3">
            <div v-for="t in group.tokens" :key="t" class="gui-swatch">
              <div class="gui-swatch-box" :style="{ background: `var(${t})` }"></div>
              <div class="fs-11 mt-1" style="color: var(--text-muted);">{{ t }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <h3>觀看 Badge / Tag 樣式（統一後）</h3>
        <p class="fs-13 mb-2" style="color: var(--text-faint);">
          全部 badge 現在共用同一份形狀（pill、padding 2px 9px、12px/600），顏色只吃
          base/_theme.scss 的 --tag-violet/blue/amber/teal/green/rust/rose/slate 系列 token，
          切換瀏覽器/系統的深色模式即可檢查這裡的顏色是否正常變化。
        </p>

        <h5 class="mt-2">技能標籤 .skill-tag（技能管理／技能詳情／SkillTest 共用）</h5>
        <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
          <span class="skill-tag tag--sys">系統技能</span>
          <span class="skill-tag tag--ext">擴充技能</span>
          <span class="skill-tag tag--version">v1.2.0</span>
          <span class="skill-tag tag--update">有更新</span>
          <span class="skill-tag tag--reviewing">審核中</span>
          <span class="skill-tag tag--draft">草稿</span>
          <span class="skill-tag tag--available">已上架</span>
          <span class="skill-tag tag--has-library">已建知識庫</span>
          <span class="skill-tag tag--personal">個人</span>
          <span class="skill-tag tag--enterprise">企業技能</span>
          <span class="skill-tag tag--team">團隊技能</span>
          <span class="skill-tag tag--upstream">
            <i class="material-symbols-outlined">arrow_upward</i>採用上游變更
          </span>
        </div>

        <h5 class="mt-3">分類色 .tag-badge（8 色相 token 全覽，目前尚無畫面使用，供未來新元件挑色）</h5>
        <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
          <span class="tag-badge tag-badge--violet">violet</span>
          <span class="tag-badge tag-badge--blue">blue</span>
          <span class="tag-badge tag-badge--amber">amber</span>
          <span class="tag-badge tag-badge--teal">teal</span>
          <span class="tag-badge tag-badge--green">green</span>
          <span class="tag-badge tag-badge--rust">rust</span>
          <span class="tag-badge tag-badge--rose">rose</span>
          <span class="tag-badge tag-badge--slate">slate</span>
        </div>

        <h5 class="mt-3">檔案處理 .status-badge ／ .process-type-badge（知識庫／共用檔案管理）</h5>
        <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
          <span class="status-badge status-badge--uploading">上傳中</span>
          <span class="status-badge status-badge--parsing">解析中</span>
          <span class="status-badge status-badge--stored">已儲存</span>
          <span class="status-badge status-badge--saved">已存檔</span>
          <span class="status-badge status-badge--failed">失敗</span>
          <span class="process-type-badge badge--ai">AI 來源</span>
          <span class="process-type-badge badge--raw">原始上傳</span>
        </div>

        <h5 class="mt-3">知識庫項目狀態 .status-badge--*（KnowledgeBase 專屬 10 態）</h5>
        <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
          <span class="status-badge status-badge--active">已發布</span>
          <span class="status-badge status-badge--processing">處理中</span>
          <span class="status-badge status-badge--reviewing">審核中</span>
          <span class="status-badge status-badge--needs_update">需更新</span>
          <span class="status-badge status-badge--pending">待處理</span>
          <span class="status-badge status-badge--failed">失敗</span>
          <span class="status-badge status-badge--archived">已封存</span>
          <span class="status-badge status-badge--draft">草稿</span>
          <span class="status-badge status-badge--history">歷史版</span>
          <span class="status-badge status-badge--rejected">已退回</span>
        </div>
        <p class="fs-11 mb-2" style="color: var(--text-faint);">
          * 這一排「審核中／草稿」跟上面技能標籤的顏色不同，是刻意保留——知識庫自己有 10 種狀態，
          硬套技能管理那套配色反而會讓「審核中」跟「需更新」撞成同色，不是漏改。
        </p>

        <h5 class="mt-3">已轉為知識 .knowledge-badge（僅 ResourceLibrary 範圍內生效，這裡用外層 class 模擬）</h5>
        <div class="ResourceLibrary d-flex flex-wrap gap-2 align-items-center mb-2">
          <span class="knowledge-badge">已轉為知識</span>
        </div>

        <h5 class="mt-3">版本時間軸狀態 .vt-status-badge ／ 指派 Agent .agent-tag（SkillDetailDrawer 用，已改為全域宣告）</h5>
        <div class="d-flex flex-wrap gap-2 align-items-center mb-2">
          <span class="vt-status-badge vt-status--active">生效中</span>
          <span class="vt-status-badge vt-status--reviewing">審核中</span>
          <span class="vt-status-badge vt-status--history">歷史</span>
          <span class="vt-status-badge vt-status--draft">草稿</span>
          <span class="vt-status-badge vt-status--rejected">已退回</span>
          <span class="agent-tag"><i class="material-symbols-outlined">smart_toy</i>客服助理 Agent</span>
        </div>

        <h5 class="mt-3">側邊區塊標籤 .section-badge ／ 使用中版本 .version-current-tag（僅 SkillTest 的 .test-sidebar 範圍內生效）</h5>
        <div class="SkillTest">
          <div class="test-sidebar" style="background: none; border: none; display: block;">
            <div class="section-badge-row d-flex flex-wrap gap-2 align-items-center">
              <span class="section-badge section-badge--mine">我的技能</span>
              <span class="section-badge section-badge--library">Library 技能</span>
              <span class="version-current-tag">使用中</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mb-3">
        <h3>觀看 button 樣式（hover／error 已改用 token）</h3>
        <p class="fs-13 mb-2" style="color: var(--text-faint);">
          .custom-btn 的 hover/active 改用 var(--primary-hover)，.error 改用 var(--danger)——
          之前這兩個狀態是寫死的 $color_main_2／$color_red_2，深色模式下顏色不會變化。
          custom-main-btn 本身仍刻意保持「企業色，不隨主題變化」，其 .error 用固定常數對齊同一個紅，維持不隨主題變的設計。
        </p>
        <button class="custom-btn m-1">button</button>
        <button class="custom-btn m-1" disabled>button disabled</button>
        <button class="custom-btn error m-1">button error</button>
        <button class="custom-btn no-border no-bg m-1">button (no border bg)</button>
        <button class="custom-btn custom-btn--sm m-1">custom-btn--sm</button>
        <br>
        <button class="custom-btn custom-main-btn m-1">custom-main-btn</button>
        <button class="custom-btn custom-main-btn m-1" disabled>custom-main-btn disabled</button>
        <button class="custom-btn custom-main-btn error m-1">custom-main-btn error</button>
        <button class="custom-btn custom-main-btn no-border no-bg m-1">custom-main-btn (no border bg) <br><span class="fs-11">(custom-main-btn 強制不受影響)</span></button>
        <br>
        <button class="custom-btn m-1">
          <i class="material-symbols-outlined">stylus</i>
          按鈕加上 icon
        </button>
        <button class="custom-btn custom-main-btn m-1">
          <i class="material-symbols-outlined">stylus</i>
          custom-main-btn 按鈕加上 icon
        </button>
        <button class="custom-btn no-border no-bg m-1">
          <i class="material-symbols-outlined">stylus</i>
          沒邊框+背景色 按鈕加上 icon
        </button>
      </div>

      <div class="mb-3">
        <h3>觀看 input 樣式（focus／error 已跟 select/textarea 對齊同一組 token）</h3>
        <input class="custom-input m-1" type="text" placeholder="input">
        <input class="custom-input m-1" type="text" placeholder="input" value="input readonly" readonly>
        <input class="custom-input m-1" type="text" placeholder="input" value="input disabled" disabled>
        <input class="custom-input m-1 error" type="text" placeholder="input error">
        <input class="custom-input m-1" type="date">
        <input class="custom-input m-1" type="time">
        <input class="custom-input m-1" type="datetime-local">
        <input class="custom-input m-1" type="password" placeholder="password">
        <input class="custom-input m-1" type="email" placeholder="email">
        <input class="custom-input m-1" type="number" placeholder="number">
        <input class="custom-input m-1" type="url" placeholder="url">
        <input class="custom-input m-1" type="tel" placeholder="tel">
        <input class="custom-input m-1" type="search" placeholder="search">
        <input class="custom-input m-1" type="file" placeholder="file">
        <input class="custom-input m-1" type="range" placeholder="range">
      </div>

      <div class="mb-3">
        <h3>觀看 select 樣式</h3>
        <p class="fs-13 mb-2" style="color: var(--text-faint);">
          hover/focus 原本用 $color_main_3／$color_main_2（跟 input 的 var(--accent)／var(--primary-hover) 不是同一組），
          深色模式下 select/textarea 的 focus 顏色會跟 input 不一致——已改成同一組 token，三者現在深色模式下顏色一致。
        </p>
        <select class="custom-select m-1">
          <option>請選擇</option>
          <option>項目1</option>
          <option>項目2</option>
          <option>項目3</option>
          <option>項目4</option>
        </select>
        <select class="custom-select m-1" disabled>
          <option>請選擇 disabled</option>
          <option>項目1</option>
          <option selected>項目2</option>
          <option>項目3</option>
          <option>項目4</option>
        </select>
        <select class="custom-select error m-1">
          <option>請選擇 error</option>
          <option>項目1</option>
          <option>項目2</option>
          <option>項目3</option>
          <option>項目4</option>
        </select>
        <select class="custom-select m-1" multiple>
          <option>多選樣式 multiple</option>
          <option>項目1</option>
          <option>項目2</option>
          <option>項目3</option>
          <option>項目4</option>
        </select>
        <select class="custom-select m-1" size="6">
          <option>列表樣式 size</option>
          <option>項目1</option>
          <option>項目2</option>
          <option>項目3</option>
          <option>項目4</option>
          <option>項目5</option>
          <option>項目6</option>
          <option>項目7</option>
          <option>項目8</option>
        </select>
      </div>

      <div class="mb-3">
        <h3>觀看 textarea 樣式</h3>
        <textarea class="custom-textarea m-1" placeholder="textarea" wrap="hard"></textarea>
        <textarea class="custom-textarea m-1" placeholder="textarea" disabled>disabled</textarea>
        <textarea class="custom-textarea error m-1" placeholder="textarea erroe"></textarea>
        <textarea class="custom-textarea m-1" placeholder="textarea" readonly>textarea readonly</textarea>
      </div>

      <div class="mb-3">
        <h3>觀看 checkbox & radio 樣式</h3>
        <label class="custom-checkbox m-1">
          <input type="checkbox">
          <span>checkbox</span>
        </label>
        <label class="custom-checkbox m-1">
          <input type="checkbox" disabled>
          <span>checkbox disabled</span>
        </label>
        <label class="custom-checkbox m-1">
          <input type="checkbox" checked disabled>
          <span>checkbox checked disabled</span>
        </label>
        <br>

        <label class="custom-radio m-1">
          <input type="radio" name="testRadio">
          <span>radio</span>
        </label>
        <label class="custom-radio m-1">
          <input type="radio" name="testRadio" disabled>
          <span>radio disabled</span>
        </label>
        <label class="custom-radio m-1">
          <input type="radio" name="testRadio" disabled checked>
          <span>radio checked disabled</span>
        </label>
      </div>

      <div class="mb-3">
        <h3>表單元件放在一起看</h3>
        <div class="m-1">
          <compAutocomplete
            :options="testCompAutocompleteOptions"
            placeholder="快速查詢"
            width="200px"
            @select="(item: any) => {
              console.log('autocomplete 選單項目', item);
            }"
          />
          <compDropDown
            :options="testCompDropDownOptions"
            :show-search="false"
            :default-value="'option2'"
            @select="(item) => {
              console.log('選擇下拉選單項目', item);
            }"
          />
          <select class="custom-select">
            <option>請選擇</option>
            <option>項目1</option>
            <option>項目2</option>
            <option>項目3</option>
            <option>項目4</option>
          </select>
          <input class="custom-input" type="text" placeholder="input">
          <button class="custom-btn">按鈕</button>

          <label class="custom-checkbox">
            <input type="checkbox">
            <span>項目A</span>
          </label>
          <label class="custom-radio">
            <input type="radio" name="testRadio2">
            <span>選項A</span>
          </label>
          <textarea class="custom-textarea m-1" placeholder="textarea"></textarea>
        </div>
      </div>

      <div class="mb-3">
        <h3>table 樣式</h3>
        <div class="m-1">
          <table class="custom-table">
            <thead>
              <tr>
                <th>表頭1</th>
                <th>
                  <div class="sort-btn">
                    表頭2<i class="material-symbols-outlined">arrow_downward_alt</i>
                  </div>
                </th>
                <th>表頭3</th>
                <th colspan="2">表頭4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>資料1</td>
                <td>資料2</td>
                <td>資料3</td>
                <td>aaaa</td>
                <td>bbbb</td>
              </tr>
              <tr>
                <td>資料4</td>
                <td>資料5</td>
                <td>資料6</td>
                <td colspan="2">cccc</td>
              </tr>
              <tr>
                <td>資料7</td>
                <td>資料8</td>
                <td>資料9</td>
                <td colspan="2">dddd</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 vue-sweetalert2</h3>
        <div class="m-1">
          <button class="custom-btn m-1" @click="() => {
            $swal.fire('測試 fire 1');
          }">測試 fire 1</button>

          <button class="custom-btn m-1" @click="() => {
            $swal.fire({
              title: '你好!',
              text: '這是有title與改變按鈕文字的測試',
              confirmButtonText: '嗯嗯好喔'
            });
          }">測試 fire 2</button>

          <button class="custom-btn m-1" @click="() => {
            $swal.fire({
              html: `<div class='p-3 fs-24'>
                這是自訂的 <strong>HTML</strong> 內容</div>
              `,
              confirmButtonText: '確定',
              showCancelButton: true,
              cancelButtonText: '取消',
              allowOutsideClick: false,
              allowEscapeKey: false,
              reverseButtons: true,
            });
          }">測試 fire 3</button>

        </div>
      </div>

      <div class="mb-3">
        <h3>測試 popDialog</h3>
        <div class="m-1">
          <button class="custom-btn m-1" @click="popDialog.alert('嘿嘿嘿', () => { console.log('嘿嘿嘿....'); })">測試 alert 不使用參數2</button>
          <button class="custom-btn m-1" @click="popDialog.confirm('<div class=\'fs-20\'>哈哈哈</div>', '確定啦', '不要啦', () => { console.log('yes....') }, () => { console.log('no....') })">測試 confirm</button>
          <button class="custom-btn m-1" @click="popDialog.confirm('哈哈哈哈哈哈', () => { console.log('yes....') }, () => { console.log('no....') })">測試 confirm 跳過2,3參數</button>
          <button class="custom-btn m-1" @click="
            popDialog.toast('嗚嚕嚕');
            popDialog.toast('嗚嚕嚕2');
            popDialog.toast('嗚嚕嚕3');
          ">測試 toast 有隊列效果</button>
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 compDropDown 組件</h3>
        <div class="m-1">
          <compDropDown class="mr-1"
            :options="testCompDropDownOptions"
            :show-search="true"
            :default-value="''"
            :max-height="'200px'"
            :width="'30%'"
            :indent="'20px'"
            :placeholder="'請選擇喔'"
            :searchPlaceholder="'查詢關鍵字'"
            :openByDefault="false"
            :alwaysOpen="false"
            @select="(item) => {
              console.log('選擇下拉選單項目', item);
            }"
          />
          <compDropDown
            :options="testCompDropDownOptions"
            :show-search="false"
            :default-value="''"
            :max-height="'200px'"
            :width="'30%'"
            :indent="'20px'"
            :openByDefault="false"
            :alwaysOpen="false"
            @select="(item) => {
              console.log('選擇下拉選單項目', item);
            }"
          />
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 compAutocomplete 組件</h3>
        <div class="m-1">
          <compAutocomplete
            :options="testCompAutocompleteOptions"
            placeholder="請輸入搜尋..."
            width="30%"
            @select="(item: any) => {
              console.log('autocomplete 選單項目', item);
            }"
            @input="(keyword: string) => {
              console.log('autocomplete 組件正在輸入的文字', keyword);
            }"
          />
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 compModal 組件</h3>
        <div class="m-1">
          <button class="custom-btn"
            @click="testOpenModal = true">打開 Modal</button>
          {{ testOpenModal }}
          <compModal
            v-model="testOpenModal"
            :title="'測試 compModal 組件件件件件件件件件件件件件件件件件件件'"
            width="600px"
            :showClose="true"
            :closeOnMask="false"
            @close="testModalCloseCall"
          >
            <div class="mb-3">
              這是 Modal 內容區域域域域域域域域域域域域
              域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域
              域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域
              域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域域
              ～～～
            </div>
            <template #footer>
              <button class="custom-btn mr-1" @click="() => {
                console.log('測試 call popdialog');
                popDialog.confirm('確定要刪除？',
                () => {
                  console.log('yes....');
                }, () => {
                  console.log('no....');
                });
              }">其它測試1</button>
              <button class="custom-btn mr-1" @click="() => {
                testOpenModal2 = true;
              }">其它測試2</button>
              <button class="custom-btn mr-1" @click="() => {
                testOpenModal = false;
              }">關閉 Modal</button>
              <button class="custom-btn custom-main-btn ml-1"
                @click="() => {
                  console.log('完成啦～～～');
                  testOpenModal = false;
                }">完成 Modal</button>
            </template>
          </compModal>

          <compModal
            v-model="testOpenModal2"
            :title="'另外開的 Modal'"
            width="400px"
            :showClose="true"
            :closeOnMask="false"
          >
            <div class="mb-3">
              全部關閉嗎？
            </div>
            <template #footer>
              <button class="custom-btn" @click="() => {
                testOpenModal2 = false;
              }">關閉自己</button>
              <button class="custom-btn" @click="() => {
                testOpenModal = false;
                testOpenModal2 = false;
              }">全部關閉</button>
            </template>
          </compModal>
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 AppBuserModal 組件</h3>
        <div class="m-1">
          <button class="custom-btn" @click="rootStore.isShowBuserModal = true">打開 AppBuserModal</button>
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 compTabs 組件</h3>
        <div class="m-1">
          <compTabs
            v-model="testNowTab"
            :tabs="testTabs"
            @tab-click="(tab) => {
              console.log('點擊的 tab', tab);
            }"
          />
          <div class="pt-2">testNowTab: {{ testNowTab }}</div>
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 compSwitch 組件</h3>
        <div class="m-1">
          <compSwitch class="mr-2"
            v-model="testNowSwitch"
            :options="testSwitch"
            :disabled="false"
            @item-click="(item: any) => {
              console.log('點擊的 compSwitch', item);
            }"
          />
          <compSwitch
            v-model="testNowSwitch2"
            :options="testSwitch"
            :disabled="true"
            @item-click="(item: any) => {
              console.log('點擊的 compSwitch', item);
            }"
          />
          <div class="pt-2">testNowSwitch: {{ testNowSwitch }}</div>
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 compPagination 組件</h3>
        <div class="m-1">
          <compPagination
            :pageNo="testPaginationCurrentPage"
            :numberOfRowsPerPage="testPaginationPageSize"
            :totalRows="testPaginationTotal"
            :perPageOptions="testPaginationPageSizeOptions"
            :showLeftInfo="true"
            :showRightControls="true"
            @change="testPaginationPageChange"
          />
          <div class="pt-4 pb-2">
            testPaginationCurrentPage: {{ testPaginationCurrentPage }}
            testPaginationPageSize: {{ testPaginationPageSize }}
          </div>
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 compListCardSwitch 組件</h3>
        <p class="fs-13 mb-2" style="color: var(--text-faint);">
          用在 AppSearchPage／ProjectListContent／ResourceLibrary 這三個列表頁切換「卡片／列表」檢視。
        </p>
        <div class="m-1">
          <compListCardSwitch
            v-model="testViewMode"
            @change="(m: 'list' | 'card') => {
              console.log('view mode 切換', m);
            }"
          />
          <compListCardSwitch v-model="testViewMode2" :disabled="true" class="ml-2" />
          <div class="pt-2">testViewMode: {{ testViewMode }}</div>
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 AppSkeleton 組件</h3>
        <p class="fs-13 mb-2" style="color: var(--text-faint);">
          用在 ReviewDrawer／ProjectListContent／KnowledgeDetail／ResourceLibrary 的資料載入中畫面，三種 type 各自對應列表/卡片/詳情三種版面。
        </p>
        <div class="d-flex flex-wrap gap-3 align-items-start m-1">
          <div style="width: 260px; border: 1px solid var(--divider-a50); border-radius: 8px; padding: 8px;">
            <div class="fs-11 mb-1" style="color: var(--text-faint);">type="list"</div>
            <AppSkeleton type="list" />
          </div>
          <div style="width: 200px; border: 1px solid var(--divider-a50); border-radius: 8px; padding: 8px;">
            <div class="fs-11 mb-1" style="color: var(--text-faint);">type="card"</div>
            <AppSkeleton type="card" />
          </div>
          <div style="width: 260px; border: 1px solid var(--divider-a50); border-radius: 8px; padding: 8px;">
            <div class="fs-11 mb-1" style="color: var(--text-faint);">type="detail"</div>
            <AppSkeleton type="detail" />
          </div>
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 AppErrorState 組件</h3>
        <p class="fs-13 mb-2" style="color: var(--text-faint);">
          用在 ReviewDrawer／ProjectListContent／KnowledgeDetail／ResourceLibrary 的資料載入失敗畫面，:inline 給嵌在卡片內的較小版面用。
        </p>
        <div class="m-1">
          <AppErrorState message="資料載入失敗，請稍後再試" @retry="() => console.log('retry clicked')" />
          <AppErrorState message="資料載入失敗（inline 版）" :inline="true" @retry="() => console.log('retry clicked')" />
        </div>
      </div>

      <div class="mb-3">
        <h3>測試 ConfirmModal 組件</h3>
        <p class="fs-13 mb-2" style="color: var(--text-faint);">
          跟 compModal／popDialog.confirm 是三套不同的確認彈窗實作（目前只有 UpstreamUpdateDrawer 在用這個），
          帶 variant="danger" 時標題會有警示圖示、確認鈕改用 .cm-btn--danger（已改用 var(--danger) token）。
        </p>
        <div class="m-1">
          <button class="custom-btn" @click="testShowConfirm = true">打開 ConfirmModal（default）</button>
          <button class="custom-btn ml-1" @click="testShowConfirmDanger = true">打開 ConfirmModal（danger）</button>
          <ConfirmModal
            v-model="testShowConfirm"
            title="確認送出"
            message="確定要送出這份表單嗎？"
            @confirm="() => console.log('confirmed')"
          />
          <ConfirmModal
            v-model="testShowConfirmDanger"
            title="確認永久刪除"
            message="此操作不可逆，確定要刪除嗎？"
            confirm-label="刪除"
            variant="danger"
            @confirm="() => console.log('confirmed danger')"
          />
        </div>
      </div>

      <div class="mb-3">
        <h3>AppBreadcrumb 組件（只寫說明，不放實際 Demo）</h3>
        <p class="fs-13" style="color: var(--text-faint);">
          用在 10 個頁面的頂部麵包屑，沒有 props——完全由目前路由的
          <code>meta.title</code> / <code>meta.parentName</code> / <code>meta.parentLabel</code> / <code>meta.useCompanyName</code>
          （加上 <code>route.query.teamName</code>）透過 <code>useBreadcrumb()</code> 這個 composable 算出來，
          只有一層時就不顯示。因為是路由驅動、不是靠傳參數，這裡放上去也只會顯示 GUI 這個路由自己的麵包屑（通常是空的），
          沒辦法示範它「真正」的行為，所以只留文字說明；要看實際效果直接去看技能管理／知識庫等頁面最上方即可。
        </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue';
import { storeToRefs } from 'pinia';
import { httpService } from '@/services/http';
import loginUtils from '@/services/authService';
import { useRootStore } from '@/stores/rootStore';
import popDialog from '@/services/popDialog';
import compDropDown from '@/components/compDropDown/compDropDown.vue';
import compAutocomplete from '@/components/compAutocomplete/compAutocomplete.vue';
import compModal from '@/components/compModal/compModal.vue';
import compTabs from '@/components/compTabs/compTabs.vue';
import compSwitch from '@/components/compSwitch/compSwitch.vue';
import compPagination from '@/components/compPagination/compPagination.vue';
import type { PaginationChangePayload } from '@/components/compPagination/compPagination.vue';
import compListCardSwitch from '@/components/compListCardSwitch/compListCardSwitch.vue';
import type { ListCardMode } from '@/components/compListCardSwitch/compListCardSwitch.vue';
import AppSkeleton from '@/components/AppSkeleton.vue';
import AppErrorState from '@/components/AppErrorState.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

const rootStore = useRootStore();
const { isEnterAppSearchPage } = storeToRefs(rootStore);

const $swal = inject('$swal') as any;

// 測試 loginUtils service
const isLogged = loginUtils.isLogged();
console.log('使用者是否已登入:', isLogged);

// 測試 httpService service
async function testCallAjax () {
  // 注意：此處原本寫死一組借用的 JWT token，已移除（安全疑慮）。
  // 需要手動測試時，請改用目前登入狀態下 httpService 既有的 auth token。
  const param = {
    "clientChannel": "IM", // 借用 IM 的 channel
    "id": null,
    "guestId": null,
    "memberId": "fdcf9bc7-2882-4b68-98f5-f86475ab625c",
    "limit": 50
  }
  const result: any = await httpService.post('/1/justka/chatflow/chat/history/read', param)
  if (result.data.errorCode === '996600001') {
    console.log('API 呼叫成功 - 借用IM的對話紀錄: ', result.data.data)
  } else {
    console.error('API 呼叫失敗，錯誤代碼: ', result.data.errorCode)
  }
}

async function testAjaxAll () {
  const param = {
    "clientChannel": "IM", // 借用 IM 的 channel
    "id": null,
    "guestId": null,
    "memberId": "fdcf9bc7-2882-4b68-98f5-f86475ab625c",
    "limit": 50
  }

  const promiseAry = [
    httpService.post('/1/justka/chatflow/chat/history/read', param),
    httpService.post('/1/justka/chatflow/chat/history/read', param),
    httpService.post('/1/justka/chatflow/chat/history/read', param),
  ];

  try {
    const result = await httpService.all(promiseAry);
    console.log('testAjaxAll', result);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// 測試 compDropDown 組件
const testCompDropDownOptions = [
  { value: 'option1', name: '選項1' },
  { value: 'option2', name: '選項2' },
  { value: 'option3', name: '選項3', children: [
    { value: 'option3-1', name: '選項3-1' },
    { value: 'option3-2', name: '選項項項項項項項項項項項項項項項項3-2', children: [
      { value: 'option3-2-1', name: '選項3-2-1' },
      { value: 'option3-2-2', name: '選項3-2-2' },
    ]},
  ]},
  { value: 'option4', name: '選項4', children: [
    { value: 'option4-1', name: '選項4-1' },
    { value: 'option4-2', name: '選項4-2' },
  ]},
  { value: 'option5', name: '選項5' },
  { value: 'option6', name: '選項6' },
  { value: 'option7', name: '選項7' },
  { value: 'option8', name: '選項8' }
];

// 測試 compAutocomplete 組件
const testCompAutocompleteOptions = [
  { label: 'iphone1', value: 1 },
  { label: 'iphone2', value: 2 },
  { label: 'iphone3', value: 3 },
  { label: 'iphone4', value: 4 },
  { label: 'iphone5', value: 5 },
  { label: 'iphone6', value: 6 },
  { label: 'iphone7', value: 7 },
  { label: 'iphone8', value: 8 },
  { label: 'iphone9', value: 9 },
  { label: 'iphone10', value: 10 },
  { label: 'iphone11', value: 11 },
  { label: 'iphone12', value: 12 },
  { label: 'iphone13', value: 13 },
  { label: 'iphone14', value: 14 },
  { label: 'iphone15', value: 15 },
  { label: 'iphone16', value: 16 },
  { label: 'iphone17', value: 17 },
];

// 測試 compModal 組件
const testOpenModal = ref(false);
const testOpenModal2 = ref(false);
function testModalCloseCall () {
  console.log('Modal 關閉了: ', testOpenModal.value);
}

// 測試 compTabs 組件
const testTabs = [
  { label: '全部Agent', value: 'id1' },
  { label: '業務助理', value: 'id2' },
  { label: '數據分析', value: 'id3', disabled: true },
  { label: '行銷專員', value: 'id4' },
  { label: '標籤5<i>(有 html tag !!)</i>', value: 'id5', others: {test2: '22222'} },
];
const testNowTab = ref('id1');

// 測試 compSwitch 組件
const testSwitch = [
  { label: '企業', value: true },
  { label: '團隊', value: false, others: {test: 'bbb'} },
];
const testNowSwitch = ref(true);
const testNowSwitch2 = ref(true);

// 測試 compPagination 組件
const testPaginationTotal = ref(200); // 總筆數
const testPaginationPageSize = ref(10); // 每頁筆數
const testPaginationCurrentPage = ref(1); // 當前頁碼
const testPaginationPageSizeOptions = [10, 20, 50, 100]; // 每頁筆數選項
function testPaginationPageChange (pagePayload: PaginationChangePayload) {
  console.log('頁碼回呼了: ', pagePayload);
  testPaginationCurrentPage.value = pagePayload.pageNo;
  // 如果改變的每頁顯示的筆數和目前的不同，頁碼回到第一頁
  if (pagePayload.numberOfRowsPerPage !== testPaginationPageSize.value) {
    testPaginationPageSize.value = pagePayload.numberOfRowsPerPage;
    testPaginationCurrentPage.value = 1; // 每次改變每頁筆數都回到第一頁
  }
}


// 觀看色彩計畫：舊式 .bgc-*／.fc-* 工具 class（見 base/_utils.scss 的 $colors map）
const legacyColorSwatches = [
  { cls: 'bgc-main-1', note: '#00A078・產品主色' },
  { cls: 'bgc-main-2', note: '#007F5F' },
  { cls: 'bgc-main-3', note: '#00C896' },
  { cls: 'bgc-main-4', note: '#CFEFE2' },
  { cls: 'bgc-main-5', note: '#E6F7F0' },
  { cls: 'bgc-main-6', note: '#F0FAF6' },
  { cls: 'bgc-grey-1', note: 'var(--text-muted)' },
  { cls: 'bgc-grey-2', note: '#9FABBA' },
  { cls: 'bgc-green-1', note: '#02C300・LINE 品牌色' },
  { cls: 'bgc-blue-1', note: '#1877F2・Facebook 品牌色' },
  { cls: 'bgc-red-1', note: 'var(--danger)' },
  { cls: 'bgc-red-2', note: '#DD4839' },
  { cls: 'bgc-yellow-1', note: '#FCFDCF' },
];

// 觀看深淺主題定義：base/_theme.scss 現行 token（分組對照原始檔案的區塊）
const themeTokenGroups = [
  { title: '品牌色', tokens: ['--primary', '--primary-hover', '--primary-fg', '--accent', '--accent-soft'] },
  { title: '介面底色', tokens: ['--page-bg', '--surface', '--sidebar-bg', '--sidebar-hover', '--sidebar-active', '--divider'] },
  { title: '文字色', tokens: ['--text', '--text-muted', '--text-faint', '--sidebar-fg', '--sidebar-muted'] },
  { title: '語意色', tokens: ['--success', '--warning', '--danger', '--danger-soft', '--hint', '--hint-text'] },
  { title: '常用透明度階梯（以 primary／divider 為例）', tokens: ['--primary-a08', '--primary-a12', '--primary-a20', '--primary-a40', '--divider-a50', '--divider-a30'] },
  { title: '其他', tokens: ['--scrollbar', '--color-tab-active-bg', '--color-switch-active-bg'] },
];

// 測試 compListCardSwitch 組件
const testViewMode = ref<ListCardMode>('card');
const testViewMode2 = ref<ListCardMode>('list');

// 測試 ConfirmModal 組件
const testShowConfirm = ref(false);
const testShowConfirmDanger = ref(false);

onMounted(() => {
  // httpService.cancelAllRequests(); // 測試取消所有請求


});

</script>
