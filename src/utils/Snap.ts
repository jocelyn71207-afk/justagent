// 官方範例 https://konvajs.org/docs/sandbox/Objects_Snapping.html
// 官方物件吸附範例
/** 目前規劃的吸附功能只針對群組 (Group) 物件
  只要在建立群組時，設定屬性 useSnap 為 true 即可啟用吸附功能
  例如：
    const group = new Konva.Group({
      x: 50,
      y: 60,
      draggable: true,
      name: 'object',
      id: 'group1',
      useSnap: true, // 啟用吸附功能
    });

  注意：如果沒有設定 useSnap 屬性，則不會被吸附
  這樣可以讓使用者選擇性地啟用吸附功能，而不是所有物件都被吸附
  這樣也可以避免一些不必要的計算，提高效能.
*/

import Konva from 'konva';

const GUIDELINE_OFFSET = 5; // 捕捉的距離
let stage: any = null;
let layer: any = null;

// 取得所有的邊緣線 (舞台 + 形狀)
function getLineGuideStops(skipShape: any) {

  /* 邊緣線的視覺化理解：
              x=100      x=130      x=160
              |         |         |
      y=50  ——+————————————————————+——  上邊緣
              |         |         |
      y=70  ——+————————————————————+——  水平中心線
              |         |         |
      y=90  ——+————————————————————+——  下邊緣
              |         |         |
            左邊緣   垂直中心線   右邊緣
  */

  // 捕捉舞台 邊緣線 與 中心線
  /* 所有 垂直的邊緣線
    可以想像成:
    |   |   |
  */
  const vertical: any = [
    0,                     // 舞台左邊緣線 的 x 座標
    stage.width() / 2,     // 舞台垂直中心線 的 x 座標
    stage.width()          // 舞台右邊緣線 的 x 座標
  ];
  /* 所有 水平線的邊緣線
    可以想像成:
    ——
    ——
    ——
  */
  const horizontal: any = [
    0,                     // 舞台上邊緣線 的 y 座標
    stage.height() / 2,    // 舞台水平中心線 的 y 座標
    stage.height()         // 舞台下邊緣線 的 y 座標
  ];

  // 我們捕捉畫布上每個形狀物件的 邊緣線 與 中心線
  const snapGroups = stage.find('Group').filter((group: any) => group.attrs.useSnap === true); // 注意限制只抓有 useSnap 屬性的群組
  snapGroups.forEach((guideItem: any) => {
  // stage.find('.object').forEach((guideItem: any) => {
    // 跳過正在拖拽的形狀
    if (guideItem === skipShape) {
      return;
    }
    const box = guideItem.getClientRect();
    // (注意是在push一個陣列喔)
    /* 垂直的邊緣線
      可以想像成:
      |   |   |
    */
    vertical.push([
      box.x,                  // 形狀左邊緣線 的 x 座標
      box.x + box.width / 2,  // 形狀垂直中心線 的 x 座標
      box.x + box.width,      // 形狀右邊緣線 的 x 座標
    ]);
    /* 水平線的邊緣線
    可以想像成:
      ——
      ——
      ——
    */
    horizontal.push([
      box.y,                  // 形狀上邊緣線 的 y 座標
      box.y + box.height / 2, // 形狀水平中心線 的 y 座標
      box.y + box.height,     // 形狀下邊緣線 的 y 座標
    ]);
  });

  // console.log('vertical >>> ', vertical.flat());
  // console.log('horizontal >>> ', horizontal.flat());

  // flat() 是把多層陣列攤平成一層陣列
  return {
    vertical: vertical.flat(),
    horizontal: horizontal.flat(),
  };
}

/** 取得當前拖曳形狀的邊緣線
 *
 * @param node 當前拖曳的形狀
 * @returns 當前拖曳形狀的邊緣線
 */
function getObjectSnappingEdges(node: any) {
  const box = node.getClientRect();
  const absPos = node.absolutePosition();

  return {
    // 垂直 邊緣線
    vertical: [
      {
        guide: Math.round(box.x),
        offset: Math.round(absPos.x - box.x),
        snap: 'start',
      },
      {
        guide: Math.round(box.x + box.width / 2),
        offset: Math.round(absPos.x - box.x - box.width / 2),
        snap: 'center',
      },
      {
        guide: Math.round(box.x + box.width),
        offset: Math.round(absPos.x - box.x - box.width),
        snap: 'end',
      },
    ],
    // 水平 邊緣線
    horizontal: [
      {
        guide: Math.round(box.y),
        offset: Math.round(absPos.y - box.y),
        snap: 'start',
      },
      {
        guide: Math.round(box.y + box.height / 2),
        offset: Math.round(absPos.y - box.y - box.height / 2),
        snap: 'center',
      },
      {
        guide: Math.round(box.y + box.height),
        offset: Math.round(absPos.y - box.y - box.height),
        snap: 'end',
      },
    ],
  };
}

// find all snapping possibilities
/** 找到所有 snap 可能性
 *
 * @param lineGuideStops 所有邊緣線
 * @param itemBounds 當前拖曳形狀的邊緣線
 * @returns snap 的邊緣線
*/
function getGuides(lineGuideStops: any, itemBounds: any) {
  const resultV: any = [];  // 垂直的結果
  const resultH: any = [];  // 水平的結果

  // 對每一條邊緣線進行第一次的比對
  // 與當前拖曳形狀的邊緣線進行比對
  // 如果距離小於 GUIDELINE_OFFSET 就加入結果陣列
  // 垂直比對
  lineGuideStops.vertical.forEach((lineGuide: any) => {
    itemBounds.vertical.forEach((itemBound: any) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      // 如果公會線和物件捕捉點之間的距離很近，我們可以考慮將其用於捕捉
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });
  // 水平比對
  lineGuideStops.horizontal.forEach((lineGuide: any) => {
    itemBounds.horizontal.forEach((itemBound: any) => {
      const diff = Math.abs(lineGuide - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultH.push({
          lineGuide: lineGuide,
          diff: diff,
          snap: itemBound.snap,
          offset: itemBound.offset,
        });
      }
    });
  });

  // 紀錄最終結果陣列 [0] 是垂直的 [1] 是水平的
  const guides = [];

  // 再將第一次比對出來的線, 找到最近的一條線
  const minV = resultV.sort((a: any, b: any) => a.diff - b.diff)[0];
  const minH = resultH.sort((a: any, b: any) => a.diff - b.diff)[0];

  // 垂直線與水平線分開處理
  // 因為有可能只有垂直線或水平線有比對到
  // 最接近的垂直線
  if (minV) {
    guides.push({
      lineGuide: minV.lineGuide,
      offset: minV.offset,
      orientation: 'V',
      snap: minV.snap,
    });
  }
  // 最接近的水平線
  if (minH) {
    guides.push({
      lineGuide: minH.lineGuide,
      offset: minH.offset,
      orientation: 'H',
      snap: minH.snap,
    });
  }
  return guides;
}

function drawGuides(guides: any) {
  guides.forEach((lg: any) => {
    if (lg.orientation === 'H') {
      const line = new Konva.Line({
        points: [-6000, 0, 6000, 0],
        stroke: 'rgb(0, 161, 255)',
        strokeWidth: 1,
        name: 'guid-line',
        dash: [4, 6],
      });
      layer.add(line);
      line.absolutePosition({
        x: 0,
        y: lg.lineGuide,
      });
    } else if (lg.orientation === 'V') {
      const line = new Konva.Line({
        points: [0, -6000, 0, 6000],
        stroke: 'rgb(0, 161, 255)',
        strokeWidth: 1,
        name: 'guid-line',
        dash: [4, 6],
      });
      layer.add(line);
      line.absolutePosition({
        x: lg.lineGuide,
        y: 0,
      });
    }
  });
}

export const Snap = {
  setStage(stageInstance: any) {
    stage = stageInstance;
  },
  setLayer (layerInstance: any) {
    layer = layerInstance;
  },
  addEventListener() {
    // 監聽 dragmove 事件
    layer.on('dragmove', function (e: any) {
      // 清除螢幕上所有先前的線條
      layer.find('.guid-line').forEach((line: any) => line.destroy());

      // 取得舞台與所有形狀的邊緣線
      const lineGuideStops = getLineGuideStops(e.target);
      // console.log('lineGuideStops >>> ', lineGuideStops)

      // 找到當前拖曳形狀的邊緣線
      const itemBounds = getObjectSnappingEdges(e.target);

      // 現在找到我們可以在哪裡捕捉當前對象
      const guides = getGuides(lineGuideStops, itemBounds);

      // 沒有邊緣線就不做任何事或不吸附
      if (!guides.length) {
        return;
      }

      // 畫線條
      drawGuides(guides);

      const absPos = e.target.absolutePosition();

      // 現在強制物件位置
      guides.forEach((lg: any) => {
        switch (lg.orientation) {
          case 'V': {
            absPos.x = lg.lineGuide + lg.offset;
            break;
          }
          case 'H': {
            absPos.y = lg.lineGuide + lg.offset;
            break;
          }
        }
      });
      e.target.absolutePosition(absPos);
    });
    // 監聽 dragend 事件
    layer.on('dragend', () => {
      // 清除螢幕上所有先前的線條
      layer.find('.guid-line').forEach((line: any) => line.destroy());
    });
  }
};
