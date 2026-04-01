<template>
  <div class="viewBoxLoading" v-if="isloading">
    <i class="material-symbols-outlined loading-spinner">progress_activity</i>
    Markdown 載入中
  </div>
  <div class="viewBoxFailure" v-if="isFailure">
    <i class="material-symbols-outlined">warning</i>
    Markdown 載入失敗
  </div>

  <div class="markdownViewBox" v-show="!isloading && !isFailure">
    <!-- 注意: markdown-body 是套件 github-markdown-css 的樣式 -->
    <div class="markdown-body" v-html="html"></div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import MarkdownIt from 'markdown-it';
  // markdown code syntax highlighting
  import hljs from 'highlight.js'
  import 'highlight.js/styles/github.css'
  // GitHub 風格的 Markdown CSS
  import 'github-markdown-css/github-markdown.css'
  // KaTeX 數學公式渲染
  import 'katex/dist/katex.min.css'

  const props = defineProps({
    isFullView: {
      type: Boolean,
      default: false
    },
    id: {
      type: String,
      required: true
    },
    source: {
      type: Object,
      required: true
    }
  });

  // 定義 emit
  const emit = defineEmits<{
    (e: 'failure', value: boolean): void
  }>();

  const isloading = ref(false);
  const isFailure = ref(false);

  const html = ref('');
  // 初始化 markdown-it 物件
  const md = new MarkdownIt('default', {
    html: true,               // 允許 HTML 標籤
    xhtmlOut: false,          // 不使用 XHTML 風格
    breaks: true,             // 換行轉為 <br>
    langPrefix: 'language-',  // 程式碼區塊類別前綴
    linkify: true,            // 自動連結化 URL
    typographer: true,        // 啟用排版功能
    // 語法高亮設定
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(str, { language: lang }).value;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (__) {}
      }
      return ''; // 使用外部預設轉義
    }
  });

  // 自訂連結渲染規則,強制所有連結在新分頁開啟 (_blank)
  const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules.link_open = function (tokens: any, idx, options, env, self) {
    const aIndex = tokens[idx].attrIndex('target');
    if (aIndex < 0) {
      tokens[idx].attrPush(['target', '_blank']);
    } else {
      tokens[idx].attrs[aIndex][1] = '_blank';
    }

    // 添加 rel="noopener noreferrer" 以提高安全性
    const relIndex = tokens[idx].attrIndex('rel');
    if (relIndex < 0) {
      tokens[idx].attrPush(['rel', 'noopener noreferrer']);
    } else {
      tokens[idx].attrs[relIndex][1] = 'noopener noreferrer';
    }

    return defaultRender(tokens, idx, options, env, self);
  };



  // 初始化 markdown-it 相關的套件 plugins
  async function initMarkdownPlugins() {
    try {
      // 由於 markdown-it 很多插件都沒有預設匯出，因此使用解構賦值取得插件的變數名稱

      // 動態匯入 emoji 插件 - 使用 full 版本 (包含所有 emoji)
      const { full: emojiPlugin } = await import('markdown-it-emoji');
      md.use(emojiPlugin);

      // 載入 KaTeX 數學公式插件
      // @ts-expect-error - markdown-it-katex 類型定義不完整
      const katex = (await import('markdown-it-katex')).default;
      md.use(katex);


    } catch (error) {
      console.error('初始化 markdown 失敗:', error);
    }
  }

  // 載入 markdown 檔案
  async function fetchMarkdownFile () {
    isloading.value = true;
    try {

      // TODO... 暫時處理檢查副檔名, 之後應該不用這樣處理
      if (!props.source.data.fileUrl.endsWith('.md')) {
        throw new Error('無法載入 Markdown 檔案');
        return;
      }

      const response = await fetch(props.source.data.fileUrl);
      if (!response.ok) {
        throw new Error('無法載入 Markdown 檔案');
      }

      response.text().then((text) => {
        html.value = md.render(text);
        isloading.value = false;
      });
    } catch (error) {
      console.error('載入 Markdown 檔案失敗:', error);
      isloading.value = false;
      isFailure.value = true;
      emit('failure', true);
    }
  }

  onMounted(async() => {
    await initMarkdownPlugins();
    await fetchMarkdownFile();
  });
</script>
