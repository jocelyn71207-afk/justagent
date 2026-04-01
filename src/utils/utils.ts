import { onUnmounted } from 'vue';
import { useAiviewerStore } from '@/stores/AiViewerStore';
import { storeToRefs } from 'pinia'

// 初始化建立是否在指定元素外部點擊的事件監聽器
function initClickOutsideListener(parentDOM: HTMLElement, trigger: () => void) {
  const _pparentDOM = parentDOM;
  const _trigger = trigger;

  // 初始化函式
  function initFn(event: MouseEvent | TouchEvent) {
    handleClickOutside(event, _pparentDOM, _trigger);
  }

  // 檢查點擊是否在指定元素外部,若在外部則觸發指定函式
  function handleClickOutside(event: MouseEvent | TouchEvent, parentDOM: HTMLElement, trigger: () => void) {
    if (parentDOM && !parentDOM.contains(event.target as Node)) {
      trigger();
    }
  }

  // 延遲添加事件監聽器,避免立即觸發
  setTimeout(() => {
    document.addEventListener('mouseup', initFn);
    document.addEventListener('touchend', initFn);
  }, 100);

  onUnmounted(() => {
    document.removeEventListener('mouseup', initFn);
    document.removeEventListener('touchend', initFn);
  });
}

// 區塊 scroll 時避免 scroll 的事件反昇到父元素
function handleContentWheel(event: WheelEvent) {
  const target = event.currentTarget as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = target;

  const tolerance = 1; // 容差值,避免浮點數誤差

  // 檢查元素是否可滾動
  const canScrollVertically = scrollHeight > clientHeight;
  const canScrollHorizontally = scrollWidth > clientWidth;

  // 垂直滾動邊界檢查
  const isScrollingUp = event.deltaY < 0;
  const isScrollingDown = event.deltaY > 0;
  const isAtTop = scrollTop <= tolerance;
  const isAtBottom = scrollTop + clientHeight >= scrollHeight - tolerance;

  // 水平滾動邊界檢查
  const isScrollingLeft = event.deltaX < 0;
  const isScrollingRight = event.deltaX > 0;
  const isAtLeft = scrollLeft <= tolerance;
  const isAtRight = scrollLeft + clientWidth >= scrollWidth - tolerance;

  // 判斷是否到達邊界
  const reachedVerticalBoundary =
    (isScrollingUp && isAtTop) ||
    (isScrollingDown && isAtBottom);

  const reachedHorizontalBoundary =
    (isScrollingLeft && isAtLeft) ||
    (isScrollingRight && isAtRight);

  // 如果元素可滾動但到達邊界,阻止預設行為以避免父層滾動
  if (canScrollVertically && event.deltaY !== 0 && reachedVerticalBoundary) {
    event.preventDefault();
  }

  if (canScrollHorizontally && event.deltaX !== 0 && reachedHorizontalBoundary) {
    event.preventDefault();
  }

  // 永遠阻止冒泡,確保父層不會收到滾動事件
  event.stopPropagation();
  event.cancelBubble = true;

  // console.log('isScrollingUp ', isScrollingUp);
  // console.log('isAtTop ', isAtTop);
  // console.log('isScrollingDown ', isScrollingDown);
  // console.log('isAtBottom ', isAtBottom);
  // // console.log('xxxxx ', xxxxxx);
  // // console.log('xxxxx ', xxxxxx);
  // console.log('xx-----xx');

  // // 只有在到達邊界時才阻止事件冒泡
  // if (
  //   (isScrollingUp && isAtTop) ||
  //   (isScrollingDown && isAtBottom) ||
  //   (isScrollingLeft && isAtLeft) ||
  //   (isScrollingRight && isAtRight)
  // ) {
  //   console.log('阻止事件冒泡');
  //   event.preventDefault();
  //   event.stopPropagation();
  // }
}

/* textarea 或 input 元素在鍵盤輸入 enter 時, 執行執行送出行為, 不觸發換行行為, 要換行則使用 shift + enter (只針對桌機,手機跟平板的虛擬鍵盤不處理)
  使用範例:
  @keydown="handleEnterKeySubmit($event, () => {
    modelValue.value = modelValue.value.trim();
  });
*/
function handleEnterKeySubmit(event: KeyboardEvent, submitCallback: () => void) {
  if (isTouchDeviceFn()) return; // 觸控裝置不處理

  const keyboardEvent = event as KeyboardEvent & { isComposing?: boolean; keyCode?: number };

  // IME 組字中（例如注音）按 Enter 是選字，不應觸發送出
  if (keyboardEvent.isComposing || keyboardEvent.keyCode === 229 || keyboardEvent.key === 'Process') return;

  const target = event.target as HTMLElement;
  const isTextInput = target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'text');
  if (isTextInput && !event.shiftKey && event.key === 'Enter') {
    event.preventDefault();
    submitCallback();
  }
}

// 判斷觸發事件輸入的設備特徵以區分是 "滑鼠" 還是 "macbook 觸控板"
function detectInputDevice(event: WheelEvent): any {
  const result = {
    device: 'unknown', // mouse or trackpad
    action: 'scroll',  // scroll 為滾動, zoom 為縮放
    confidence: 0.     // 信心指數,數值越高表示越確定
  };

  // 檢測指標 1：deltaMode
  if (event.deltaMode === 0) {
    result.device = 'trackpad';
    result.confidence += 40;
  } else if (event.deltaMode === 1) {
    result.device = 'mouse';
    result.confidence += 40;
  }

  // 檢測指標 2：delta 值的特徵
  const deltaX = Math.abs(event.deltaX);
  const deltaY = Math.abs(event.deltaY);
  const totalDelta = deltaX + deltaY;

  // 觸控板特徵：小數值、精細控制
  if (totalDelta > 0 && totalDelta < 50 && (deltaX % 1 !== 0 || deltaY % 1 !== 0)) {
    result.device = 'trackpad';
    result.confidence += 30;
  }

  // 滑鼠滾輪特徵：大整數值
  if (totalDelta >= 100 && deltaX % 1 === 0 && deltaY % 1 === 0) {
    result.device = 'mouse';
    result.confidence += 30;
  }

  // 檢測指標 3：ctrlKey + 縮放模式
  if (event.ctrlKey && result.device === 'trackpad') {
    result.action = 'zoom';
    result.confidence += 20;
  }

  // 檢測指標 4：同時有 X 和 Y 軸移動（可能是觸控板滾動）
  if (deltaX > 0 && deltaY > 0 && !event.ctrlKey) {
    result.device = 'trackpad';
    result.action = 'scroll';
    result.confidence += 10;
  }

  return result;
}

// 強制停止whell的縮放事件 (僅在滑鼠縮放或觸控板縮放時)
function stopWhellZoomEvent(event: WheelEvent): boolean {
  // 永遠阻止冒泡
  event.stopPropagation();
  event.cancelBubble = true;

  // 僅在滑鼠縮放或觸控板縮放時
  const inputDevice = detectInputDevice(event);
  if (inputDevice.action === 'zoom') {
    event.preventDefault();
    return true;
  }
  return false;
}

// 強制停止 touchpad 的縮放事件 (僅在觸控板縮放時)
function stopTouchpadZoomEvent(event: TouchEvent): void {
  // 永遠阻止冒泡
  // event.stopPropagation();

  const aiviewerStore = useAiviewerStore();
  const { touchDebug } = storeToRefs(aiviewerStore);
  touchDebug.value = event.touches.length;

  // 只阻擋雙指觸控 (縮放手勢)
  if (event.touches.length >= 2) {
    event.preventDefault();
  }
}


// 偵測是否為觸控裝置
function isTouchDeviceFn(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13+ 會偽裝成 Mac，但有觸控能力
  const isIpad = /iPad/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  return /Android|webOS|iPhone|iPod|BlackBerry|Windows Phone/i.test(ua) || isIpad;
}

// 文字換行符號 /n 轉 br
function nlTobr(str: string) {
  return str.replace(/\n/g, '<br />');
}

// 將時間字串轉為相對時間文字顯示
function formatTimeToDisplay(time: string): string {
  const now = new Date();
  const timeDate = new Date(time);
  const diffInSeconds = Math.floor((now.getTime() - timeDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '剛剛';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} 分鐘前`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} 小時前`;
  }

  // 判斷是否為昨天（以本地日期為準）
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDate = new Date(timeDate.getFullYear(), timeDate.getMonth(), timeDate.getDate());
  const diffInDays = Math.floor((nowDate.getTime() - targetDate.getTime()) / 86400000);

  if (diffInDays === 1) {
    const hh = String(timeDate.getHours()).padStart(2, '0');
    const mm = String(timeDate.getMinutes()).padStart(2, '0');
    return `昨天 ${hh}:${mm}`;
  }

  if (diffInDays < 7) {
    return `${diffInDays} 天前`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInDays < 30) {
    return diffInWeeks === 1 ? '1 週前' : `${diffInWeeks} 週前`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} 個月前`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} 年前`;
}

export {
  initClickOutsideListener,
  handleContentWheel,
  handleEnterKeySubmit,
  detectInputDevice,
  stopWhellZoomEvent,
  stopTouchpadZoomEvent,
  isTouchDeviceFn,
  nlTobr,
  formatTimeToDisplay,
};
