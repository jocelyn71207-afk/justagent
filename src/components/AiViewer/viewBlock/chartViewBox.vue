<template>
  <div class="viewBoxLoading" v-if="isloading">
    <i class="material-symbols-outlined loading-spinner">progress_activity</i>
    Chart 載入中
  </div>
  <div class="viewBoxFailure" v-if="isFailure">
    <i class="material-symbols-outlined">warning</i>
    Chart 載入失敗
  </div>

  <div class="chartViewBox" v-if="!isloading && !isFailure">
    <div v-if="isBarChart">
      <label class="custom-checkbox m-1"><input type="checkbox" v-model="stacked"><span>柱狀堆疊</span></label>
    </div>
    <div :class="['chart-canvas-box', {isBarChart: isBarChart}]">
      <canvas :id="'chartView' + props.id" ref="canvasRef"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, nextTick } from 'vue';
  import type { PropType } from 'vue';
  import { Chart } from 'chart.js/auto'
  import { chartAdapter } from '@/utils/chart';

  const props = defineProps({
    id: {
      type: String,
      required: true
    },
    source: {
      type: Object as PropType<any>,
      required: true
    }
  });

  // 定義 emit
  const emit = defineEmits<{
    (e: 'failure', value: boolean): void
  }>();

  const isloading = ref(false);
  const isFailure = ref(false);

  let chartInstance = null as any; // 儲存 Chart.js 實例 (注意不能響應)
  const stacked = ref(false); // 是否堆疊柱狀圖
  const isBarChart = ref(props.source.data.chart === 'bar'); // 是否為柱狀圖

  // 監聽 stacked 變化，更新圖表配置
  watch(stacked, (newVal) => {
    if (chartInstance !== null && chartInstance.config.type === 'bar') {
      if (!chartInstance.options.scales) {
        chartInstance.options.scales = {};
      }
      if (!chartInstance.options.scales.x) {
        chartInstance.options.scales.x = {};
      }
      if (!chartInstance.options.scales.y) {
        chartInstance.options.scales.y = {};
      }
      // 更新圖表配置
      chartInstance.options.scales.x.stacked = newVal;
      chartInstance.options.scales.y.stacked = newVal;
      chartInstance.update();
    }
  });

  onMounted(() => {
    // TODO... 之後應該是在讀取完檔案之後在做圖表渲染初始化
    isloading.value = true;


    // TODO... 造假載入中效果
    setTimeout(() => {
      isloading.value = false;
      // isFailure.value = true;
      // return emit('failure', true);

      nextTick(() => {
        // 將後端資料整理成 chatt.js 需要的格式
        const config = chartAdapter(props.source.data);
        if (config.type === 'bar') {
          config.options!.scales = {
            x: { stacked: stacked.value },
            y: { stacked: stacked.value }
          }
        }
        // 使用 Chart.js 繪製圖表
        const chartDom = document.getElementById('chartView'+props.id) as HTMLCanvasElement;
        chartInstance = new Chart(chartDom, config);
      });
    }, 1000);
  });
</script>
