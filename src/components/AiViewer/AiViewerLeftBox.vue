<template>
  <div class="AiViewerLeftBox" :style="{ width: props.leftWidth + 'px' }"
    @wheel="stopWhellZoomEvent($event)"
    @touchmove="stopTouchpadZoomEvent($event)">
    <div class="p-1 fs-11">
      <input type="checkbox" v-model="lookDebug"/> 顯示除錯資訊<br><br>

      測試用檔案連結:<br><br>

      https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/義美客服測試資料_題卡.xlsx
      <br><br>
      https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/UGG 銷售 all 2023(更改通路屬性)0204.xlsx
      <br><br>
      https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/MONTHLY REPORT SALES DATA SAMPLE_UGG_TW 0812_DAP update - 0213.xlsx
      <br><br>
      https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/0101-0331 sales raw data for UGG.xls
      <br><br>

      https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/Kopernio快速教學手冊.pdf
      <br><br>

      https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/untitled.html
      <br><br>

      https://cdn.justka.ai/sit/provisionSetting/json/lucas_test/LangChain & LangGraph 1.0 里程碑發布.html
      <br><br>

    </div>

    <hr>

    <div class="one-props-setting-box" v-if="nowChoiceAiViewerId && nowChoiceAiViewerInstance">
      <!-- {{ nowChoiceAiViewerInstance }} -->
      內容區塊 ID: {{ nowChoiceAiViewerId }}<br>
      <p>寬度:</p>
      <input type="number" placeholder="請輸入" v-model="nowChoiceAiViewerInstance.width"/>
      <p>高度:</p>
      <input type="number" placeholder="請輸入" v-model="nowChoiceAiViewerInstance.height"/>
      <p>X:</p>
      <input type="number" placeholder="請輸入" v-model="nowChoiceAiViewerInstance.x"/>
      <p>Y:</p>
      <input type="number" placeholder="請輸入" v-model="nowChoiceAiViewerInstance.y"/>
      <br>
      <button class="mt-2 fs-20" @click="() => {
        aiViewerBlocks.forEach((item: any) => {
          if (item.id === nowChoiceAiViewerId) {
            item.width = parseInt(nowChoiceAiViewerInstance.width);
            item.height = parseInt(nowChoiceAiViewerInstance.height);
            item.x = parseInt(nowChoiceAiViewerInstance.x);
            item.y = parseInt(nowChoiceAiViewerInstance.y);
          }
        });
      }">變更</button>

    </div>

  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia'
import { useAiviewerStore } from '@/stores/AiViewerStore';
import { stopWhellZoomEvent, stopTouchpadZoomEvent } from '@/utils/utils';

const aiviewerStore = useAiviewerStore();

const props = defineProps<{
  leftWidth: number;
}>();

const { lookDebug } = storeToRefs(aiviewerStore);
const { aiViewerBlocks } = storeToRefs(aiviewerStore);       // 使用者使用的區塊
const { nowChoiceAiViewerId } = storeToRefs(aiviewerStore);  // 目前選中的內容區塊ID

// 目前選中的內容區塊實例 (目的是了方便在左側屬性設定區修改內容)
const nowChoiceAiViewerInstance: any = computed(() => {
  if (!nowChoiceAiViewerId.value) return null;
  let re = null;
  aiViewerBlocks.value.forEach((obj:any) => {
    if (obj.id === nowChoiceAiViewerId.value) {
      re = obj;
      return ;
    }
  });
  return re;
});




</script>
