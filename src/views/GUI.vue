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
        <h3>觀看色彩計畫</h3>
        <div :class="['lookColor', `bgc-main-${n}`] " v-for="n in 6" :key="'color-main'+n">.{{ `bgc-main-${n}` }}
          <div class="pt-1" v-if="n === 1">#3eb5cc; <br> 產品主色</div>
          <div class="pt-1" v-if="n === 2">#22c2d3;</div>
          <div class="pt-1" v-if="n === 3">#76cbdd;</div>
          <div class="pt-1" v-if="n === 4">#ceecf2;</div>
          <div class="pt-1" v-if="n === 5">#e9f9fb;</div>
          <div class="pt-1" v-if="n === 6">#ecfbff;</div>
        </div> <br>

        <div :class="['lookColor', `bgc-grey-${n}`] " v-for="n in 2" :key="'color-grey'+n">.{{ `bgc-grey-${n}` }}
          <div class="pt-1" v-if="n === 1">#8b90a0</div>
          <div class="pt-1" v-if="n === 2">#9fabba</div>
        </div> <br>

        <div :class="['lookColor', `bgc-green-${n}`] " v-for="n in 1" :key="'color-green'+n">.{{ `bgc-green-${n}` }}
          <div class="pt-1" v-if="n === 1">#02C300</div>
        </div> <br>

        <div :class="['lookColor', `bgc-blue-${n}`] " v-for="n in 1" :key="'color-blue'+n">.{{ `bgc-blue-${n}` }}
          <div class="pt-1" v-if="n === 1">#1877F2</div>
        </div> <br>

        <div :class="['lookColor', `bgc-red-${n}`] " v-for="n in 2" :key="'color-red'+n">.{{ `bgc-red-${n}` }}
          <div class="pt-1" v-if="n === 1">#dd4b39</div>
          <div class="pt-1" v-if="n === 2">#dd4839</div>
        </div> <br>

        <div :class="['lookColor', `bgc-yellow-${n}`] " v-for="n in 1" :key="'color-yellow'+n">.{{ `bgc-yellow-${n}` }}
          <div class="pt-1" v-if="n === 1">#fcfdcf</div>
        </div>

      </div>

      <div class="mb-3">
        <h3>觀看深淺主題定義</h3>
        <h5 class="mt-2">主背景色</h5>
        <div style="background-color: #aac5d6;">
          <div class="lookThemeMode" style="background-color: var(--color-background);">--color-background</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-alpha90);">--color-background-alpha90</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-alpha80);">--color-background-alpha80</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-alpha70);">--color-background-alpha70</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-alpha60);">--color-background-alpha60</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-alpha50);">--color-background-alpha50</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-alpha40);">--color-background-alpha40</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-alpha30);">--color-background-alpha30</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-alpha20);">--color-background-alpha20</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-alpha10);">--color-background-alpha10</div>
        </div>

        <h5 class="mt-2">次背景色-1</h5>
        <div style="background-color: #aac5d6;">
          <div class="lookThemeMode" style="background-color: var(--color-background-1);">--color-background-1</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-1-alpha90);">--color-background-1-alpha90</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-1-alpha80);">--color-background-1-alpha80</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-1-alpha70);">--color-background-1-alpha70</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-1-alpha60);">--color-background-1-alpha60</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-1-alpha50);">--color-background-1-alpha50</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-1-alpha40);">--color-background-1-alpha40</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-1-alpha30);">--color-background-1-alpha30</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-1-alpha20);">--color-background-1-alpha20</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-1-alpha10);">--color-background-1-alpha10</div>
        </div>

        <h5 class="mt-2">次背景色-2</h5>
        <div style="background-color: #aac5d6;">
          <div class="lookThemeMode" style="background-color: var(--color-background-2);">--color-background-2</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-2-alpha90);">--color-background-2-alpha90</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-2-alpha80);">--color-background-2-alpha80</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-2-alpha70);">--color-background-2-alpha70</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-2-alpha60);">--color-background-2-alpha60</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-2-alpha50);">--color-background-2-alpha50</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-2-alpha40);">--color-background-2-alpha40</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-2-alpha30);">--color-background-2-alpha30</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-2-alpha20);">--color-background-2-alpha20</div>
          <div class="lookThemeMode" style="background-color: var(--color-background-2-alpha10);">--color-background-2-alpha10</div>
        </div>

        <h5 class="mt-2">主線條顏色</h5>
        <div style="background-color: #aac5d6;">
          <div class="lookThemeMode" style="background-color: var(--color-border);">--color-border</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-alpha90);">--color-border-alpha90</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-alpha80);">--color-border-alpha80</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-alpha70);">--color-border-alpha70</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-alpha60);">--color-border-alpha60</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-alpha50);">--color-border-alpha50</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-alpha40);">--color-border-alpha40</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-alpha30);">--color-border-alpha30</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-alpha20);">--color-border-alpha20</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-alpha10);">--color-border-alpha10</div>
        </div>

        <h5 class="mt-2">次線條顏色-1</h5>
        <div style="background-color: #aac5d6;">
          <div class="lookThemeMode" style="background-color: var(--color-border-1);">--color-border-1</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-1-alpha90);">--color-border-1-alpha90</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-1-alpha80);">--color-border-1-alpha80</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-1-alpha70);">--color-border-1-alpha70</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-1-alpha60);">--color-border-1-alpha60</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-1-alpha50);">--color-border-1-alpha50</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-1-alpha40);">--color-border-1-alpha40</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-1-alpha30);">--color-border-1-alpha30</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-1-alpha20);">--color-border-1-alpha20</div>
          <div class="lookThemeMode" style="background-color: var(--color-border-1-alpha10);">--color-border-1-alpha10</div>
        </div>

        <h5 class="mt-2">標題文字顏色</h5>
        <div class="lookThemeMode" style="background-color: var(--color-heading);">--color-heading</div>

        <h5 class="mt-2">文字顏色</h5>
        <div class="lookThemeMode" style="background-color: var(--color-text);">--color-text</div>
        <div class="lookThemeMode" style="background-color: var(--color-text-alpha90);">--color-text-alpha90</div>
        <div class="lookThemeMode" style="background-color: var(--color-text-alpha80);">--color-text-alpha80</div>
        <div class="lookThemeMode" style="background-color: var(--color-text-alpha70);">--color-text-alpha70</div>
        <div class="lookThemeMode" style="background-color: var(--color-text-alpha60);">--color-text-alpha60</div>
        <div class="lookThemeMode" style="background-color: var(--color-text-alpha50);">--color-text-alpha50</div>
        <div class="lookThemeMode" style="background-color: var(--color-text-alpha40);">--color-text-alpha40</div>
        <div class="lookThemeMode" style="background-color: var(--color-text-alpha30);">--color-text-alpha30</div>
        <div class="lookThemeMode" style="background-color: var(--color-text-alpha20);">--color-text-alpha20</div>
        <div class="lookThemeMode" style="background-color: var(--color-text-alpha10);">--color-text-alpha10</div>

        <h5 class="mt-2">連結文字顏色</h5>
        <div class="lookThemeMode" style="background-color: var(--color-link-text);">--color-link-text</div>
        <div class="lookThemeMode" style="background-color: var(--color-link-text-active);">--color-link-text-active</div>

        <h5 class="mt-2">陰影顏色</h5>
        <div class="lookThemeMode" style="background-color: var(--color-shadow);">--color-shadow</div>

        <h5 class="mt-2">scrollbar 顏色</h5>
        <div class="lookThemeMode" style="background-color: var(--color-scrollbar);">--color-scrollbar</div>
        <div class="lookThemeMode" style="background-color: var(--color-scrollbar-alpha50);">--color-scrollbar-alpha50</div>

        <h5 class="mt-2">對話紀錄背景色</h5>
        <div class="lookThemeMode" style="background-color: var(--color-userSay-record);">--color-userSay-record</div>

        <h5 class="mt-2">頁籤 active 背景色</h5>
        <div class="lookThemeMode" style="background-color: var(--color-tab-active-bg);">--color-tab-active-bg</div>

        <h5 class="mt-2">switch active 背景色</h5>
        <div class="lookThemeMode" style="background-color: var(--color-switch-active-bg);">--color-switch-active-bg</div>
      </div>

      <div class="mb-3">
        <h3>觀看 button 樣式</h3>
        <button class="custom-btn m-1">button</button>
        <button class="custom-btn m-1" disabled>button disabled</button>
        <button class="custom-btn error m-1">button error</button>
        <button class="custom-btn no-border no-bg m-1">button (no border bg)</button>
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
        <h3>觀看 input 樣式</h3>
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

const rootStore = useRootStore();
const { isEnterAppSearchPage } = storeToRefs(rootStore);

const $swal = inject('$swal') as any;

// 測試 loginUtils service
const isLogged = loginUtils.isLogged();
console.log('使用者是否已登入:', isLogged);

// 測試 httpService service
async function testCallAjax () {
  // 借用 IM 的 token
  httpService.setAuthToken('eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI3NWVlZDZmOC02NWNhLTQ2OGItOTg3YS0wMTA5MTgzY2M1ZmUiLCJhdWQiOiJjN2E1NzQ2My0yYTJiLTQ4MzQtOWNiZi0yNzAwZmM4M2NmOGMiLCJvcGVuSWRQcm92aWRlciI6eyJvcGVuSWRVc2VySWQiOiJudWxsIiwibmFtZSI6IkV5ZXNtZWRpYSIsInJlZklkIjoibnVsbCJ9LCJleHAiOjE3NjI1OTY2MjYsImlhdCI6MTc2MDAwNDYyNiwidXNlciI6eyJhY2NvdW50SWQiOiI4NDc1OTRlYy05NDc5LTQwNTEtODAzYi1jZjA0NWRjZjQ5NjQiLCJuYW1lIjoi57Ch56eL55GeIiwibW9iaWxlIjoiOTE1KioqNjg1IiwiaWQiOiI3NWVlZDZmOC02NWNhLTQ2OGItOTg3YS0wMTA5MTgzY2M1ZmUiLCJhdmF0YXIiOm51bGwsImNvdW50cnlNY29kZSI6Ijg4NiIsImVtYWlsIjpudWxsLCJhY2NvdW50VXNlcklkIjoiZmRjZjliYzctMjg4Mi00YjY4LTk4ZjUtZjg2NDc1YWI2MjVjIiwicmVnaXN0ZXJEYXRlIjoiMTY3ODg3NDY0NyJ9LCJpc3MiOiJleWVzbWVkaWEuY29tLnR3In0.VbqGgW1B18Ro_XMzYPj8KscLbGlkMcB0tfGqDOU20yEltkObox7Q1qg0oKAscx3ph7xs7_xHbTm5ARZ4q9W90A1JFwbluzqx5BDVyUL-MdlO3nbaFMJ6zPrM29YLO3yCbSR9mhSkc9G5ZRC28zGqLm4Os9SEmGfqs-FAv1nUnroEvwzZl4o00ocrFI4XYPpjOfeHyCb0YMkPnhKfLNcHRFTQUEvmmP0DgT5SyK7gVeAA4-6DcHLThqnamPvYrsnZ3-vUZrl40IWWj7yPI9q_5aLTMz4YM9NR50MIvBVDTCsTIuwdwKpw7Me5sNzardenYxsVFlRoPu9bm5r36tnxuQ')
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
testCallAjax();
testCallAjax();

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


onMounted(() => {
  // httpService.cancelAllRequests(); // 測試取消所有請求


});

</script>
