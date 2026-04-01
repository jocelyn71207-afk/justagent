// TODO... 這 lucas 是當初自己研究 Konva.js 時寫的 chart 圖表工具 (不採用可刪除)
import Konva from 'konva';

// 紀錄 Konva.Stage 實例
let stage: any = null;

// 統一的顏色配置 - 所有圖表類型共用
const defaultColors = [
  'rgba(54, 162, 235, 0.8)',   // 1. 藍色
  'rgba(255, 99, 132, 0.8)',   // 2. 紅色
  'rgba(255, 206, 86, 0.8)',   // 3. 黃色
  'rgba(75, 192, 192, 0.8)',   // 4. 綠色
  'rgba(153, 102, 255, 0.8)',  // 5. 紫色
  'rgba(255, 159, 64, 0.8)',   // 6. 橘色
  'rgba(46, 125, 180, 0.8)',   // 7. 深藍色
  'rgba(220, 65, 100, 0.8)',   // 8. 深紅色
  'rgba(220, 180, 60, 0.8)',   // 9. 深黃色
  'rgba(60, 160, 160, 0.8)',   // 10. 深綠色
  'rgba(125, 80, 220, 0.8)',   // 11. 深紫色
  'rgba(220, 130, 50, 0.8)',   // 12. 深橘色
  'rgba(100, 200, 255, 0.8)',  // 13. 淺藍色
  'rgba(255, 150, 180, 0.8)',  // 14. 淺紅色
  'rgba(255, 230, 130, 0.8)',  // 15. 淺黃色
  'rgba(120, 220, 220, 0.8)',  // 16. 淺綠色
  'rgba(190, 150, 255, 0.8)',  // 17. 淺紫色
  'rgba(255, 190, 120, 0.8)',  // 18. 淺橘色
  'rgba(80, 80, 80, 0.8)',     // 19. 深灰色
  'rgba(180, 180, 180, 0.8)'   // 20. 淺灰色
];

// 圖例一行的高度
const oneLegendHeight = 20;
const oneLegendRow = 5; // 一行最多四個圖例


// 圖表類專用的 tooltip
// 創建 tooltip
function createTooltip(x: number, y: number, textWord: string, options: any = {}): any {
  const tooltip = new Konva.Label({
    name: 'TOOLTIP', // 設定 name 方便後續尋找和刪除
    x: x,
    y: y,
  });

  const text = new Konva.Text({
    text: textWord,
    fontSize: options.fontSize || 13,
    fontFamily: options.fontFamily || 'Arial',
    fill: options.fill || '#fff',
    padding: options.padding || 5,
    align: options.align || 'center',
    wrap: options.warp ? 'word' : 'none',
    width: options.width || undefined,
    height: options.height || undefined,
  });

  const tag = new Konva.Tag({
    fill: options.fill || 'black',
    pointerDirection: 'down',
    pointerWidth: options.pointerWidth || 10,
    pointerHeight: options.pointerHeight || 10,
    lineJoin: 'round',
    cornerRadius: options.cornerRadius || 5,
    opacity: options.opacity || 1,
  });

  tooltip.add(tag);
  tooltip.add(text);

  return tooltip;
}
// 清除 tooltip
function removeTooltip(chartGroup: any): void {
  const tooltips = chartGroup.find('.TOOLTIP');
  if (tooltips.length > 0) {
    tooltips[0].remove();
  }
}


export const ChartUtils = {
  setStage(stageInstance: any) {
    stage = stageInstance;
  },

  // 取得基本圖表設置 (這邊只放共通設定)
  getChartConfig(chartData: any, chartType: string): { padding: { top: number, right: number, bottom: number, left: number } } {
    const config = {
      padding: { top: 90, right: 50, bottom: 100, left: 110 }
    };
    // 依照圖例數量調整底部邊距 (曲線圖和柱狀圖)
    let legendCount = chartData.chart_prompt.data.values.length;
    if (legendCount > oneLegendRow) {
      const extraLines = Math.floor((legendCount - 1) / oneLegendRow);
      config.padding.bottom += extraLines * oneLegendHeight;
    }
    // 圓餅圖
    if (chartType === 'PIE') {
      // 左邊同右邊距
      config.padding.left = 50;
      config.padding.right = 50;
      config.padding.top = 110;
      // 依照圖例數量調整底部邊距
      legendCount = chartData.chart_prompt.data.labels.length; // 注意圓餅圖的 labels 是圖例, 而不是 x 軸的刻度
      if (legendCount > oneLegendRow) {
        const extraLines = Math.floor((legendCount - 1) / oneLegendRow);
        config.padding.bottom += extraLines * oneLegendHeight;
      }
    }
    return config;
  },

  // 設定圖表的其他屬性 到 otherProps 這個欄位上 (TODO... 思考是否有這個 otherProps 的必要性中)
  otherProps(chartGroup: any, props: any): void {
    if (props) {
      chartGroup.otherProps = props;
    } else {
      return chartGroup.otherProps;
    }
  },

  // 計算圖表寬度
  calculateChartWidth(ary: any[], chartType: string): number {
    const min = 700; // 預設最小寬度

    // 如果是圓餅圖用更寬70的間距, 其他圖表用較窄的60間距
    const calculatedWidth = (chartType !== 'PIE') ? ary.length * 60 : ary.length * 70;

    return Math.max(calculatedWidth, min);
  },

  // 計算圖表高度
  calculateChartHeight(ary: any[], chartType: string): number {
    let min = 440; // 預設最小高度
    // 如果是圓餅圖用更高的最小高度
    if (chartType === 'PIE') {
      min = 500;
    }
    // 目前預設一個圖表的圖例一行只能放四個, 多的要換行, 所以高度要增加
    if (ary.length > oneLegendRow) {
      // 每多四個圖例就增加一行高度
      const extraLines = Math.floor((ary.length - 1) / oneLegendRow);
      min += extraLines * oneLegendHeight;
    }
    return min;
  },

  // 獲取數據系列資料（支援多個數據系列）
  getDataSeries(chartData: any): { series: Array<{ dataKey: string, values: any[], color: string }>, maxValue: number, minValue: number } {
    const valuesArray = chartData.chart_prompt.data.values;
    const series: Array<{ dataKey: string, values: any[], color: string }> = [];
    const allValues: number[] = [];

    // 處理每個數據系列
    valuesArray.forEach((dataSeries: any, index: number) => {
      const dataKey = Object.keys(dataSeries)[0];
      const values = dataSeries[dataKey];
      const color = defaultColors[index % defaultColors.length];

      series.push({
        dataKey,
        values,
        color
      });

      // 收集所有數值來計算最大值和最小值
      allValues.push(...values);
    });

    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);

    return { series, maxValue, minValue };
  },

  // 創建單一個圖表群組
  createChartGroup(uuidName: string,  offsetX: number, offsetY: number): any {
    return new Konva.Group({
      name: uuidName,
      x: offsetX,
      y: offsetY,
      draggable: true,
    });
  },

  // 創建圖表背景
  createChartBackground(chartGroup: any, chartWidth: number, chartHeight: number): void {
    const chartBg = new Konva.Rect({
      x: 0,
      y: 0,
      width: chartWidth,
      height: chartHeight,
      fill: 'white',
      stroke: '#ddd',
      strokeWidth: 1,
      name: 'CHART_BG',
    });
    chartGroup.add(chartBg);
  },

  // 創建主標題
  createTitle(chartGroup: any, chartData: any, chartWidth: number, padding: any): void {
    const titleText = chartData.chart_prompt.title;
    const availableWidth = chartWidth - 40; // 留一些邊距

    // 根據標題長度動態計算字體大小
    let fontSize = 18; // 預設字體大小
    const maxFontSize = 20;
    const minFontSize = 16;

    // 簡單估算：每個字符平均寬度約為字體大小的 1 倍
    const estimatedWidth = titleText.length * fontSize;

    if (estimatedWidth > availableWidth) {
      // 如果文字太長，縮小字體
      fontSize = Math.max(minFontSize, (availableWidth / (titleText.length)));
    } else if (titleText.length < 10) {
      // 如果文字較短，可以放大字體
      fontSize = Math.min(maxFontSize, fontSize);
    }

    const titlePadding = 20; // 標題左右邊距
    const title = new Konva.Text({
      x: titlePadding,
      y: padding.top / 4,
      width: chartWidth - (titlePadding * 2),
      height: 48,
      text: titleText,
      fontSize: Math.round(fontSize),
      fontFamily: 'Arial',
      fill: '#333',
      align: 'left',
      wrap: 'word', // 允許換行
      verticalAlign: 'top',
      ellipsis: true,
    });

    // 檢查文字是否被截斷, 被截斷就加 tooltip
    const isTruncated = ChartUtils.isTextTruncated(title, 'height');
    if (isTruncated) {
      // use tooltip
      title.on('mouseenter', () => {
        const tooltip = createTooltip(
          titlePadding + (chartWidth - titlePadding*2) / 2,
          padding.top / 4,
          titleText,
          {
            width: chartWidth - titlePadding*2,
            warp: 'word',
            align: 'left',
          }
        );
        chartGroup.add(tooltip);
      });
      title.on('mouseleave', () => {
        removeTooltip(chartGroup);
      });
    }

    chartGroup.add(title);
  },

  // 創建座標軸線
  createAxes(chartGroup: any, chartWidth: number, chartHeight: number, padding: any): void {
    // 創建 Y 軸線
    const yAxis = new Konva.Line({
      points: [padding.left, padding.top, padding.left, chartHeight - padding.bottom],
      stroke: '#333',
      strokeWidth: 2
    });
    chartGroup.add(yAxis);

    // 創建 X 軸線
    const xAxis = new Konva.Line({
      points: [padding.left, chartHeight - padding.bottom, chartWidth - padding.right, chartHeight - padding.bottom],
      stroke: '#333',
      strokeWidth: 2
    });
    chartGroup.add(xAxis);
  },

  // 創建XY軸標題
  createAxisTitles(chartGroup: any, chartData: any, chartWidth: number, chartHeight: number, padding: any): void {
    // XY軸共同配置
    const config = {
      fontSize: 14,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      fill: '#666',
      align: 'center',
      ellipsis: true,
    };

    const offset = 40; // 偏移量

    // 創建 X 軸標題
    const xAxisTitle = new Konva.Text(config);
    xAxisTitle.text(chartData.chart_prompt.x_axis.title);
    xAxisTitle.x(padding.left - offset);
    xAxisTitle.y(chartHeight - padding.bottom + offset);
    xAxisTitle.width(chartWidth - padding.left - padding.right + offset);
    xAxisTitle.height(14);
    chartGroup.add(xAxisTitle);

    // 創建 Y 軸標題
    const yAxisTitle = new Konva.Text(config);
    yAxisTitle.text(chartData.chart_prompt.y_axis.title);
    yAxisTitle.x(10);
    yAxisTitle.y(chartHeight - padding.bottom + offset);
    yAxisTitle.width(chartHeight - padding.bottom);
    yAxisTitle.height(14);
    yAxisTitle.rotation(-90); // 逆時針旋轉90度
    yAxisTitle.offsetX(15);
    yAxisTitle.offsetY(0);
    chartGroup.add(yAxisTitle);

    // 檢查文字是否被截斷, 被截斷就加 tooltip
    const xIsTruncated = ChartUtils.isTextTruncated(xAxisTitle, 'height');
    if (xIsTruncated) {
      // use tooltip
      xAxisTitle.on('mouseenter', () => {
        const tooltip = createTooltip(
          chartWidth / 2,
          (chartHeight - padding.bottom + 40),
          chartData.chart_prompt.x_axis.title,
          {
            width: chartWidth - 40,
            warp: 'word',
            align: 'left',
          }
        );
        chartGroup.add(tooltip);
      });
      xAxisTitle.on('mouseleave', () => {
        removeTooltip(chartGroup);
      });
    }

    const yIsTruncated = ChartUtils.isTextTruncated(yAxisTitle, 'height');
    if (yIsTruncated) {
      // use tooltip
      yAxisTitle.on('mouseenter', () => {
        const tooltip = createTooltip(
          15,
          70,
          chartData.chart_prompt.y_axis.title,
          {
            width: 200,
            warp: 'word',
            align: 'left',
          }
        );
        chartGroup.add(tooltip);
      });
      yAxisTitle.on('mouseleave', () => {
        removeTooltip(chartGroup);
      });
    }

  },

  // 創建 Y 軸刻度和標籤文字
  createYAxisScales(chartGroup: any, maxValue: number, minValue: number, chartWidth: number, chartHeight: number, padding: any, plotHeight: number): void {
    const ySteps = 5; // 將 Y 軸分成 5 等分
    const valueRange = maxValue - minValue; // 計算數值範圍

    // 遍歷每個刻度位置
    for (let i = 0; i <= ySteps; i++) {
      const yValue = minValue + (valueRange / ySteps) * i; // 從最小值開始計算
      const yPos = chartHeight - padding.bottom - (plotHeight / ySteps) * i;

      // Y 軸刻度線（畫在 Y 軸左邊）
      const yTick = new Konva.Line({
        points: [padding.left - 10, yPos, padding.left, yPos],
        stroke: '#333',
        strokeWidth: 1
      });
      chartGroup.add(yTick);

      // Y 軸標籤（放在刻度線左邊）
      const textContent = (Math.round(yValue * 100) / 100).toFixed(0).toString();
      const textWidth = ChartUtils.calculateTextWidth(textContent, 12, 'Arial');
      const yText = new Konva.Text({
        x: (padding.left - 10) - textWidth - 5, // 刻度線起始x座標 - 文字寬度 - 5px間距
        y: yPos - 8,
        text: textContent, // 保留兩位小數避免浮點數精度問題
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#666',
        align: 'left', // 改為左對齊，因為位置已經計算好了
        width: textWidth,
      });
      // use tooltip
      yText.on('mouseenter', () => {
        const tooltip = createTooltip(
          padding.left - 0,
          yPos - 0,
          (Math.round(yValue * 100) / 100).toString()
        );
        chartGroup.add(tooltip);
      });
      yText.on('mouseleave', () => {
        removeTooltip(chartGroup);
      });
      chartGroup.add(yText);
    }

    // 檢查 0 是否已經在現有的刻度中
    let hasZeroTick = false;
    for (let i = 0; i <= ySteps; i++) {
      const yValue = minValue + (valueRange / ySteps) * i;
      if (Math.abs(yValue) < 0.01) { // 考慮浮點數精度問題
        hasZeroTick = true;
        break;
      }
    }
    // 當數據範圍包含 0 但 0 不在標準刻度中時，添加 0 刻度線作為參考
    if (!hasZeroTick && minValue < 0 && maxValue > 0) {
      const zeroRatio = (0 - minValue) / valueRange;
      const zeroY = chartHeight - padding.bottom - zeroRatio * plotHeight;

      // 確保 0 刻度線在可視範圍內
      if (zeroY >= padding.top && zeroY <= chartHeight - padding.bottom) {
        // 0 刻度線（使用不同的樣式以便區分）- 橫跨整個圖表寬度
        const zeroTick = new Konva.Line({
          points: [padding.left - 10, zeroY, chartWidth - padding.right, zeroY],
          stroke: '#999', // 使用較淡的顏色
          strokeWidth: 1,
          dash: [3, 3] // 虛線樣式
        });
        chartGroup.add(zeroTick);        // 0 刻度標籤
        const zeroText = new Konva.Text({
          x: padding.left - 13,
          y: zeroY - 10,
          text: '0',
          fontSize: 10,
          fontFamily: 'Arial',
          fill: '#999', // 使用較淡的顏色
        });
        // use tooltip
        zeroText.on('mouseenter', () => {
          const tooltip = createTooltip(
            padding.left - 0,
            zeroY - 0,
            '0'
          );
          chartGroup.add(tooltip);
        });
        zeroText.on('mouseleave', () => {
          removeTooltip(chartGroup);
        });
        chartGroup.add(zeroText);
      }
    }
  },

  // 創建 X 軸標籤文字
  createXAxisLabels(chartGroup: any, labels: string[], chartConfig: any): void {
    const { chartHeight, padding } = chartConfig;
    const plotWidth = chartConfig.chartWidth - padding.left - padding.right;

    labels.forEach((label: string, index: number) => {
      let labelX: number = padding.left; // 初始化 labelX
      const labexX_Width = 48; // 預設標籤寬度

      // 柱狀圖：標籤居中在每個分組
      if (chartConfig.chartType === 'bar') {
        const groupWidth = plotWidth / labels.length;
        labelX = padding.left + groupWidth * index + groupWidth / 2;
      }

      // 折線圖：標籤均勻分佈
      if (chartConfig.chartType === 'line') {
        const pointSpacing = plotWidth / (labels.length - 1);
        labelX = padding.left + pointSpacing * index;
      }

      // 判斷文字長度，如果可能變成兩行就縮小字體
      let align = 'center';
      let fontSize = 12;
      const estimatedWidth = ChartUtils.calculateTextWidth(label, fontSize, 'Arial');
      if (estimatedWidth > labexX_Width) { // 如果超過設定的寬度，可能會換行
        fontSize = 9;
        align = 'left'; // 文字靠左對齊
      }

      const xText = new Konva.Text({
        x: (labelX - (labexX_Width / 2)), // 向左偏移一半寬度
        y: chartHeight - padding.bottom + 10,
        width: labexX_Width, // 設定固定寬度
        height: 30, // 允許三行文字
        text: label,
        fontSize: fontSize,
        fontFamily: 'Arial',
        ellipsis: true,
        fill: '#666',
        align: align,
      });
      // use tooltip
      xText.on('mouseenter', () => {
        const tooltip = createTooltip(
          xText.x() + labexX_Width / 2,
          xText.y() - 10,
          label
        );
        chartGroup.add(tooltip);
      });
      xText.on('mouseleave', () => {
        removeTooltip(chartGroup);
      });

      chartGroup.add(xText);
    });
  },

  // 創建圖例
  createLegend(chartGroup: any, series: Array<{ dataKey: string, values: any[], color: string }>, chartWidth: number, chartHeight: number): void {
    const itemsPerRow = oneLegendRow; // 一行最多四個圖例
    const legendItemWidth = 130; // 每個圖例項目的寬度
    const startX = 15; // 圖例起始 X 位置

    // 計算總行數
    const totalRows = Math.ceil(series.length / itemsPerRow);
    const baseY = chartHeight - 30; // 圖例基準 Y 位置（最底部的一行）

    // 初始化系列顯示狀態追蹤
    if (!chartGroup.seriesVisibility) {
      chartGroup.seriesVisibility = {};
    }

    // 建立圖例項目
    series.forEach((singleSeries, seriesIndex) => {
      // 初始化該系列的顯示狀態為可見
      if (chartGroup.seriesVisibility[singleSeries.dataKey] === undefined) {
        chartGroup.seriesVisibility[singleSeries.dataKey] = true;
      }

      // 每個圖例項目是一個小群組
      const legendGroup = new Konva.Group({
        name: `legend-${seriesIndex}`,
      });

      // 計算當前圖例在第幾行和第幾列
      const row = Math.floor(seriesIndex / itemsPerRow); // 第幾行（從0開始）
      const col = seriesIndex % itemsPerRow; // 第幾列（從0開始）

      // 計算 X 和 Y 位置
      const legendX = startX + col * legendItemWidth;
      // 從最底行開始，往上排列：最底行是 row=0，往上是 row=1, row=2...
      const legendY = baseY - (totalRows - 1 - row) * oneLegendHeight;

      // 圖例色塊
      const legendRect = new Konva.Rect({
        x: legendX,
        y: legendY,
        width: 15,
        height: 15,
        fill: singleSeries.color,
        name: 'legendRect',
      });

      // 圖例文字
      const legendText = new Konva.Text({
        x: legendX + 20, // 緊接在色塊後面
        y: legendY + 2, // 與色塊垂直對齊
        width: 110,
        height: 13,
        text: singleSeries.dataKey,
        fontSize: 12,
        fontFamily: 'Arial',
        fill: '#333',
        ellipsis: true,
        name: 'legendText',
      });

      // use tooltip
      legendGroup.on('mouseenter', () => {
        const tooltip = createTooltip(
          legendX + 7.5,
          legendY,
          singleSeries.dataKey
        );
        chartGroup.add(tooltip);
      });
      legendGroup.on('mouseleave', () => {
        removeTooltip(chartGroup);
      });


      // 更新圖例的視覺狀態（顯示/隱藏狀態）
      const updateLegendVisualState = (legendRect: any, legendText: any, originalColor: string, isVisible: boolean): void => {
        if (isVisible) {
          // 顯示狀態：恢復原始顏色和透明度
          legendRect.fill(originalColor);
          legendRect.opacity(1);
          legendText.fill('#333');
          legendText.opacity(1);
        } else {
          // 隱藏狀態：灰化並降低透明度
          legendRect.fill('#ccc');
          legendRect.opacity(0.5);
          legendText.fill('#999');
          legendText.opacity(0.5);
        }
      };

      // 切換數據系列的顯示狀態
      const toggleDataSeriesVisibility = (chartGroup: any, dataKey: string, seriesIndex: number, isVisible: boolean): void => {
        // 找到所有相關的數據視覺元素
        const allChildren = chartGroup.getChildren();

        allChildren.forEach((child: any) => {
          const childName = child.name();
          if (!childName) return;

          // 柱狀圖和折線圖：使用精確匹配避免誤判
          if (childName.startsWith(`bar-${seriesIndex}-`) ||
              childName === `line-${seriesIndex}` ||
              childName.startsWith(`point-${seriesIndex}-`)) {
            child.visible(isVisible);
          }

          // 圓餅圖：需要特殊處理，因為圓餅圖的每個扇形對應一個圖例項目
          if (childName === `wedge-${seriesIndex}` ||
              childName === `connectionLine-${seriesIndex}`) {
            child.visible(isVisible);
          }

          // 圓餅圖的數值標籤需要單獨處理
          if (childName === `pie-${seriesIndex}`) {
            child.visible(isVisible);
          }
        });
      };

      // 圖例點擊切換顯示/隱藏功能
      const toggleSeriesVisibility = () => {
        const isVisible = chartGroup.seriesVisibility[singleSeries.dataKey];
        chartGroup.seriesVisibility[singleSeries.dataKey] = !isVisible;

        // 更新圖例視覺狀態
        updateLegendVisualState(legendRect, legendText, singleSeries.color, !isVisible);

        // 切換對應數據系列的顯示狀態
        toggleDataSeriesVisibility(chartGroup, singleSeries.dataKey, seriesIndex, !isVisible);

        // 重繪舞台
        stage.batchDraw();
      };
      // 添加點擊事件
      legendGroup.on('click', toggleSeriesVisibility);

      legendGroup.add(legendRect);
      legendGroup.add(legendText);
      chartGroup.add(legendGroup);
    });

  },

  // 輔助函數 顏色加深函數
  darkenColor(color: string, factor: number = 0.1): string {
    // 如果是 rgba 格式
    if (color.startsWith('rgba')) {
      const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (match) {
        const r = Math.max(0, Math.floor(parseInt(match[1]) * (1 - factor)));
        const g = Math.max(0, Math.floor(parseInt(match[2]) * (1 - factor)));
        const b = Math.max(0, Math.floor(parseInt(match[3]) * (1 - factor)));
        const a = match[4];
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }
    }

    // 如果是 rgb 格式
    if (color.startsWith('rgb')) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = Math.max(0, Math.floor(parseInt(match[1]) * (1 - factor)));
        const g = Math.max(0, Math.floor(parseInt(match[2]) * (1 - factor)));
        const b = Math.max(0, Math.floor(parseInt(match[3]) * (1 - factor)));
        return `rgb(${r}, ${g}, ${b})`;
      }
    }

    // 如果是 hex 格式
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = Math.max(0, Math.floor(parseInt(hex.substr(0, 2), 16) * (1 - factor)));
      const g = Math.max(0, Math.floor(parseInt(hex.substr(2, 2), 16) * (1 - factor)));
      const b = Math.max(0, Math.floor(parseInt(hex.substr(4, 2), 16) * (1 - factor)));
      return `rgb(${r}, ${g}, ${b})`;
    }

    // 預設返回原色
    return color;
  },

  // 輔助函數 計算文字寬度
  calculateTextWidth(text: string, fontSize: number, fontFamily: string): number {
    // 創建臨時 canvas 來測量文字寬度
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      context.font = `${fontSize}px ${fontFamily}`;
      return context.measureText(text).width;
    }

    // 如果無法使用 canvas，回退到估算方式
    // 中文字符通常接近字體大小，英文字符約為字體大小的 0.6 倍
    let estimatedWidth = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[\u4e00-\u9fff]/.test(char)) {
        // 中文字符
        estimatedWidth += fontSize * 0.9;
      } else {
        // 英文字符和數字
        estimatedWidth += fontSize * 0.6;
      }
    }
    // 無條件進位到整數
    estimatedWidth = Math.ceil(estimatedWidth);
    return estimatedWidth;
  },

  // 輔助函數 判斷文字是否被截斷 (ellipsis: true 用)
  isTextTruncated(textNode: any, comparison: string): boolean {
    // 複製一個隱藏的 Konva.Text 節點來測量實際寬度
    const tempText = new Konva.Text({
      text: textNode.text(),
      fontSize: textNode.fontSize(),
      fontFamily: textNode.fontFamily(),
      fontStyle: textNode.fontStyle(),
      padding: textNode.padding(),
      wrap: textNode.wrap(),
      width: (comparison === 'width') ? undefined : textNode.width(), // 不限制寬度
      height: (comparison === 'height') ? undefined : textNode.width(),// 不限制高度
    });
    const tempWidth = tempText.width();
    const tempHeight = tempText.height();
    // console.log('比對用的文字實際寬高...', tempWidth, tempHeight);
    return tempWidth > textNode.width() || tempHeight > textNode.height();
  },

  // 創建數值標籤
  createValueLabel(x: number, y: number, value: any, options: any = {}): any {
    const textWord = value.toString();
    const fontSize = options.fontSize || 12;
    const fontFamily = options.fontFamily || 'Arial';
    const textWidth = options.width || ChartUtils.calculateTextWidth(textWord, fontSize, fontFamily);

    const label = new Konva.Label({
      x: x - textWidth / 2, // 向左偏移一半寬度來達到居中效果
      y: y,
      visible: false, // 預設隱藏
    });

    const text = new Konva.Text({
      width: textWidth,
      text: textWord,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: options.fill || '#fff',
      align: 'center',
      wrap: options.wrap || 'none',
      padding: 0, // TODO... 目前不可大於0, 會影響 ChartUtils.calculateTextWidth 寬度計算
    });

    const tag = new Konva.Tag({
      fill: '#000', // 目前用於調試觀看寬度範圍用
      opacity: 0.8,
    });

    label.add(tag).add(text);

    return label
  },

  // ● 創建柱狀圖的 柱子
  createInteractiveBars(chartGroup: any, series: any[], labels: string[], config: any, stage: any): void {
    const { maxValue, minValue, padding, chartHeight, plotHeight, groupWidth, barWidth, barSpacing } = config;
    const valueRange = maxValue - minValue; // 計算數值範圍
    const zeroY = chartHeight - padding.bottom - ((0 - minValue) / valueRange) * plotHeight; // 零線位置

    const valueLabels: any[] = []; // 用來存放所有數值標籤
    series.forEach((singleSeries, seriesIndex) => {
      singleSeries.values.forEach((value: any, dataIndex: any) => {
        const valueRatio = (value - minValue) / valueRange; // 計算相對於最小值的比例
        const barY = chartHeight - padding.bottom - valueRatio * plotHeight;

        // 如果是負值，柱子從零線向下延伸
        const barHeight = Math.abs(barY - zeroY);
        const finalBarY = value >= 0 ? barY : zeroY;

        const groupStartX = padding.left + groupWidth * dataIndex;
        const totalBarsWidth = series.length * barSpacing;
        const barX = groupStartX + seriesIndex * barSpacing + (groupWidth - totalBarsWidth) / 2;

        // 創建柱子
        const bar = new Konva.Rect({
          x: barX,
          y: finalBarY,
          width: barWidth,
          height: barHeight,
          fill: singleSeries.color,
          stroke: singleSeries.color,
          strokeWidth: 1,
          hitStrokeWidth: 4, // 擴大可點擊範圍
          name: `bar-${seriesIndex}-${dataIndex}`, // 添加識別名稱
        });

        // 創建數值標籤
        // const labelY = value >= 0 ? finalBarY - 25 : finalBarY + barHeight + 5; // 正值在柱子上方，負值在柱子下方
        const valueLabel = ChartUtils.createValueLabel(
          barX + barWidth / 2,
          finalBarY - 25,
          value,
        );
        valueLabel.name(`valueLabel-${seriesIndex}-${dataIndex}`); // 添加識別名稱
        valueLabels.push(valueLabel); // 儲存數值標籤以便後續處理

        // 添加互動事件
        ChartUtils.addInteractiveEvents(bar, valueLabel, singleSeries.color, stage, {
          label: labels[dataIndex],
          seriesName: singleSeries.dataKey,
          value: value
        });

        chartGroup.add(bar);
        chartGroup.add(valueLabel);
      });
    });

    // 確保所有標籤在最上層 (避免被柱子遮住)
    valueLabels.forEach(label => label.moveToTop());
  },

  // ● 創建曲線圖的 曲線和點
  createInteractiveLineChart(chartGroup: any, series: any[], labels: string[], config: any, stage: any): void {
    const { maxValue, minValue, padding, chartHeight, plotHeight, pointSpacing } = config;
    const valueRange = maxValue - minValue; // 計算數值範圍

    const valueLabels: any[] = []; // 用來存放所有數值標籤
    series.forEach((singleSeries, seriesIndex) => {
      // 計算所有點的座標
      const points: number[] = [];
      singleSeries.values.forEach((value: any, index: any) => {
        const pointX = padding.left + pointSpacing * index;
        const valueRatio = (value - minValue) / valueRange; // 計算相對於最小值的比例
        const pointY = chartHeight - padding.bottom - valueRatio * plotHeight;
        points.push(pointX, pointY);
      });

      // 創建曲線
      const line = new Konva.Line({
        points: points,
        stroke: singleSeries.color,
        strokeWidth: 3,
        lineCap: 'round',
        lineJoin: 'round',
        tension: 0.3,
        name: `line-${seriesIndex}`, // 添加識別名稱
      });
      chartGroup.add(line);

      // 創建互動式數據點
      singleSeries.values.forEach((value: any, jndex: any) => {
        const pointX = padding.left + pointSpacing * jndex;
        const valueRatio = (value - minValue) / valueRange; // 計算相對於最小值的比例
        const pointY = chartHeight - padding.bottom - valueRatio * plotHeight;

        // 創建數據點
        const point = new Konva.Circle({
          x: pointX,
          y: pointY,
          radius: 5,
          fill: singleSeries.color,
          stroke: 'white',
          strokeWidth: 2,
          name: `point-${seriesIndex}-${jndex}`, // 添加識別名稱
        });

        // 創建數值標籤
        const valueLabel = ChartUtils.createValueLabel(
          pointX,
          pointY - 25,
          value
        );
        valueLabel.name(`valueLabel-${seriesIndex}-${jndex}`); // 添加識別名稱
        valueLabels.push(valueLabel); // 儲存數值標籤以便後續處理

        // 添加互動事件
        ChartUtils.addInteractiveEvents(point, valueLabel, singleSeries.color, stage, {
          label: labels[jndex],
          seriesName: singleSeries.dataKey,
          value: value
        });
        chartGroup.add(point);
        chartGroup.add(valueLabel);
      });
    });
    valueLabels.forEach(label => label.moveToTop()); // 確保所有標籤在最上層 (避免被點遮住)
  },

  // ● 創建互動式圓餅圖的 扇形區塊
  createInteractivePieChart(chartGroup: any, series: any[], labels: string[], config: any, stage: any): Array<{ dataKey: string, values: any[], color: string }> {
    const { padding, chartHeight } = config;
    const plotWidth = config.chartWidth - padding.left - padding.right; // 可繪圖區域寬度

    // 計算圖例佔用的高度
    const itemsPerRow = oneLegendRow; // 一行最多四個圖例
    const totalRows = Math.ceil(labels.length / itemsPerRow);
    const legendHeight = totalRows * oneLegendHeight; // 圖例總高度

    // 下方依照 padding.bottom 還是 圖例高度，取較大值
    const bottom = Math.max(padding.bottom, legendHeight + 10);
    const plotHeight = chartHeight - padding.top - bottom; // 可繪圖區域高度

    // 計算圓餅圖的中心點和半徑
    const centerX = padding.left + plotWidth / 2;
    const centerY = (padding.top + plotHeight / 2) + 10; // 向下偏移10像素以避開標題
    const radius = Math.min(plotWidth, plotHeight) / 2 * 0.85; // 半徑（稍微縮小以留空間給標籤）

    // 使用第一個系列的數據
    const data = series[0].values;
    const total = data.reduce((sum: number, value: number) => sum + value, 0);

    let currentAngle = -90; // 從頂部開始（-90度）

    // 儲存第一筆和最後一筆的資訊，用於重疊檢查
    let firstLabelInfo: any = null;

    // 創建每個扇形區塊
    data.forEach((value: number, index: number) => {
      const percentage = (value / total) * 100; // 百分比
      const originalAngle = (value / total) * 360; // 直接計算度數
      const displayAngle = originalAngle; // 用於顯示的角度（度數）
      const color = defaultColors[index % defaultColors.length];

      // 創建扇形或圓形
      let wedge;
      if (data.length === 1) {
        wedge = new Konva.Circle({
          x: centerX,
          y: centerY,
          radius: radius,
          fill: color,
          strokeWidth: 0,
          hitStrokeWidth: 0,
          name: `wedge-${index}`, // 添加識別名稱
        });
      } else {
        wedge = new Konva.Wedge({
          x: centerX,
          y: centerY,
          radius: radius,
          angle: displayAngle, // 度數
          rotation: currentAngle, // 度數
          fill: color,
          strokeWidth: 0,
          hitStrokeWidth: 0,
          name: `wedge-${index}`, // 添加識別名稱
        });
      }

      // 計算標籤位置（在扇形的中間角度）- 這裡需要轉回弧度用於 Math.cos/sin
      const midAngleRadians = (currentAngle + displayAngle / 2) * Math.PI / 180;
      const labelRadius = radius * 0.7; // 標籤距離中心的距離
      const labelX = centerX + Math.cos(midAngleRadians) * labelRadius;
      const labelY = centerY + Math.sin(midAngleRadians) * labelRadius;

      // 創建百分比標籤
      const labelText = `${Math.round(percentage * 10) / 10}%`;
      const percentageLabel = ChartUtils.createValueLabel(
        labelX,
        labelY - 6, // 稍微向上偏移
        `${labelText}`, // 保留一位小數
        {
          fontSize: percentage < 5 ? 10 : 12, // 小百分比用較小字體
          width: ChartUtils.calculateTextWidth(`${labelText}`, 11, 'Arial') + 10, // 增加額外寬度避免截斷
        }
      );
      percentageLabel.visible(false); // 先隱藏
      percentageLabel.name(`percentageLabel-${index}`); // 添加識別名稱

      // 處理 "數值標籤" 的位置，避免重疊
      // 計算9位數的基準寬度（用於最小間距參考）
      const baseTextWidth = ChartUtils.calculateTextWidth('123456789', 11, 'Arial');

      // 使用奇偶錯層排列來避免重疊
      const baseRadius = radius * 1.2;
      const layerOffset = Math.max(10, Math.ceil(baseTextWidth / 3)); // 增加層間距，更大的落差
      const isOddData = (index + 1) % 2 === 1; // 判斷是第幾筆資料（奇數筆）
      let outerLabelRadius = isOddData ? baseRadius : baseRadius + layerOffset; // 奇數筆用內層，偶數筆用外層

      // 檢查最後一筆與第一筆是否重疊
      if (index === data.length - 1 && firstLabelInfo) {
        const lastAngle = midAngleRadians;
        const firstAngle = firstLabelInfo.angle;

        // 計算角度差異（考慮圓形的360度循環）
        let angleDiff = Math.abs(lastAngle - firstAngle);
        if (angleDiff > Math.PI) {
          angleDiff = 2 * Math.PI - angleDiff; // 取較小的角度差
        }

        // 如果角度差異小於一定閾值，認為可能重疊
        const minAngleDiff = Math.PI / 6; // 30度作為最小安全距離
        if (angleDiff < minAngleDiff) {
          // console.log('最後一筆與第一筆可能重疊，增加距離');
          // 讓最後一筆距離更遠
          outerLabelRadius += layerOffset * 0.8; // 額外增加距離
        }
      }

      const outerLabelX = centerX + Math.cos(midAngleRadians) * outerLabelRadius;
      const outerLabelY = centerY + Math.sin(midAngleRadians) * outerLabelRadius;

      // 儲存第一筆的位置資訊
      if (index === 0) {
        firstLabelInfo = {
          angle: midAngleRadians,
          x: outerLabelX,
          y: outerLabelY,
          radius: outerLabelRadius
        };
      }

      // 創建數值標籤（直接顯示）
      const valueLabel = ChartUtils.createValueLabel(
        outerLabelX,
        outerLabelY - 6,
        `${value}`,
        {
          fontSize: 11,
          width: ChartUtils.calculateTextWidth(`${value}`, 11, 'Arial') + 10, // 增加額外寬度避免截斷
        },
      );
      valueLabel.visible(true); // 直接顯示
      valueLabel.name(`pie-${index}`); // 添加識別名稱

      // 創建連接線（虛線）：從扇形邊緣到數值標籤
      const connectionStartX = centerX + Math.cos(midAngleRadians) * radius; // 扇形邊緣
      const connectionStartY = centerY + Math.sin(midAngleRadians) * radius;
      const connectionEndX = outerLabelX; // 數值標籤位置
      const connectionEndY = outerLabelY;

      const connectionLine = new Konva.Line({
        points: [connectionStartX, connectionStartY, connectionEndX, connectionEndY],
        stroke: '#999', // 淡灰色
        strokeWidth: 1,
        dash: [3, 3], // 虛線樣式
        opacity: 0.7, // 半透明
        name: `connectionLine-${index}`, // 添加識別名稱
      });

      // 添加互動事件（針對圓餅圖特殊化）
      ChartUtils.addPieInteractiveEvents(wedge, percentageLabel, valueLabel, color, stage, {
        label: labels[index],
        value: value,
        percentage: percentage
      });

      chartGroup.add(wedge);
      chartGroup.add(connectionLine); // 連接線添加在扇形之後，標籤之前
      chartGroup.add(percentageLabel);
      chartGroup.add(valueLabel);

      // 角度累積使用實際顯示的角度，確保下一個扇形從正確位置開始
      currentAngle += displayAngle;
    });

    // 返回適合 createLegend 使用的 series 格式
    const legendSeries = labels.map((label, index) => ({
      dataKey: label,
      values: [data[index]],
      color: defaultColors[index % defaultColors.length]
    }));

    return legendSeries;
  },

  // ● 圓餅圖專用的互動事件
  addPieInteractiveEvents(wedge: any, percentageLabel: any, valueLabel: any, originalColor: string, stage: any, clickData: any = {}): void {

    const enterFn = () => {
      // 扇形放大效果
      wedge.scaleX(1.05);
      wedge.scaleY(1.05);
      wedge.fill(ChartUtils.darkenColor(originalColor, 0.1));
      percentageLabel.visible(true);
      percentageLabel.moveToTop(); // 確保標籤在最上層
      valueLabel.scale({x: 1.5, y: 1.5}); // 數值標籤放大
      valueLabel.moveToTop();
      // const Tag = valueLabel.find('Tag')[0];
      // Tag.opacity(1);
      // Tag.fill('#fff');
      // const Text = valueLabel.find('Text')[0];
      // Text.fillAfterStrokeEnabled(true);
      // Text.stroke('#fff');
      // Text.strokeWidth(5);

      stage.batchDraw();
    };

    const leaveFn = () => {
      // 恢復原始大小和顏色
      wedge.scaleX(1);
      wedge.scaleY(1);
      wedge.fill(originalColor);
      percentageLabel.visible(false);
      valueLabel.scale({x:1, y:1}); // 數值標籤放大
      valueLabel.moveDown(); // 移到下層避免被遮住
      // const Tag = valueLabel.find('Tag')[0];
      // Tag.opacity(0.8);
      // Tag.fill('#000');
      // const Text = valueLabel.find('Text')[0];
      // Text.fillAfterStrokeEnabled(false);
      // Text.stroke('#fff');
      // Text.strokeWidth(0);

      stage.batchDraw();
    };

    const clickFn = () => {
      console.log(`點擊了 ${clickData.label || ''}: ${clickData.value || ''} (${clickData.percentage?.toFixed(1) || ''}%)`);
    };

    // 為扇形添加事件
    wedge.on('mouseenter', enterFn);
    wedge.on('mouseleave', leaveFn);
    wedge.on('click', clickFn);

    // 為百分比標籤也添加同樣的事件
    percentageLabel.on('mouseenter', enterFn);
    percentageLabel.on('mouseleave', leaveFn);
    percentageLabel.on('click', clickFn);

    // 為數值標籤也添加同樣的事件
    valueLabel.on('mouseenter', enterFn);
    valueLabel.on('mouseleave', leaveFn);
    valueLabel.on('click', clickFn);
  },

  // ● 圖表添加 UI 互動事件 (思考將核心的互動事件寫在這裡，方便各圖表共用)
  addInteractiveEvents(element: any, valueLabel: any, originalColor: string, stage: any, clickData: any = {}): void {
    element.on('mouseenter', () => {
      element.fill(ChartUtils.darkenColor(originalColor, 0.1));
      if (element.radius) { // 如果是圓形（折線圖的點）
        element.radius(8);
      }
      valueLabel.visible(true);
      stage.batchDraw();
    });

    element.on('mouseleave', () => {
      element.fill(originalColor);
      if (element.radius) { // 如果是圓形（折線圖的點）
        element.radius(5);
      }
      valueLabel.visible(false);
      stage.batchDraw();
    });

    element.on('click', () => {
      console.log(`點擊了 ${clickData.label || ''} - ${clickData.seriesName || ''}: ${clickData.value || ''}`);
    });
  },



};
