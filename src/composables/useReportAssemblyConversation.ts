import { ref } from 'vue';
import { useAiviewerStore } from '@/stores/AiViewerStore';

// 報告組裝引導對話（conv7）：從工具箱點「行銷報告生成」後，
// 走一段腳本化的澄清對話，最終在畫布建立可互動的報告組裝 Block。
export function useReportAssemblyConversation() {
  const aiviewerStore = useAiviewerStore();

  const conv7Msgs = ref<any[]>([]);
  let conv7IdCounter = 2;
  const conv7Title = ref('');
  const conv7Confirmed = ref(false);
  const conv7Adjusted = ref(false);

  const DEFAULT_SECTION_IDS = ['promo_kpi', 'promo_top10', 'promo_type', 'promo_monthly', 'time_heatmap'];

  function c7Push(msg: any) {
    conv7Msgs.value.push({ id: `c7_${conv7IdCounter++}`, ...msg });
  }

  function resetConv7() {
    conv7IdCounter = 2;
    conv7Title.value = '';
    conv7Msgs.value = [];
    conv7Confirmed.value = false;
    conv7Adjusted.value = false;
  }

  function conv7InitFlow() {
    if (conv7Msgs.value.length > 0) return;
    conv7Title.value = '行銷報告組裝';
    c7Push({ forUser: true, msg: '我想看一下最近的促銷活動效果' });
    setTimeout(() => {
      c7Push({ msg: '好，我來幫你看行銷活動成效報告。想先確認一下方向——你是想知道「這次/最近的活動該不該延續」，還是想比較「哪種促銷類型最有效，下次要選哪種」？' });
    }, 500);
    setTimeout(() => {
      c7Push({ forUser: true, msg: '我覺得上個月那個促銷活動好像沒什麼用' });
    }, 1200);
    setTimeout(() => {
      c7Push({
        msg: `了解，那我打算生成「行銷活動成效報告」，重點放在促銷活動成效與趨勢分析，可以嗎？
<div class="conv1-quick-btns" style="margin-top:8px">
  <span class="conv1-quick-btn" data-action="conv7-confirm-generate">可以</span>
</div>`,
      });
    }, 2000);
  }

  function conv7ConfirmGenerate() {
    if (conv7Confirmed.value) return;
    conv7Confirmed.value = true;
    c7Push({ forUser: true, msg: '可以' });
    setTimeout(() => {
      aiviewerStore.addReportAssemblyBlock([...DEFAULT_SECTION_IDS]);
      c7Push({
        finishResponse: true,
        msg: `報告生成好了，畫布上可以看到內容。這樣的報告你滿意嗎？
<div class="conv1-quick-btns" style="margin-top:8px">
  <span class="conv1-quick-btn" data-action="conv7-satisfied">滿意，先這樣</span>
  <span class="conv1-quick-btn" data-action="conv7-adjust">我要調整一下</span>
</div>`,
      });
    }, 600);
  }

  function conv7Satisfied() {
    c7Push({ forUser: true, msg: '滿意，先這樣' });
    setTimeout(() => {
      c7Push({ msg: '太好了！如果之後還想再看一次，可以直接調整章節或存成模板。' });
    }, 400);
  }

  function conv7Adjust() {
    if (conv7Adjusted.value) return;
    conv7Adjusted.value = true;
    c7Push({ forUser: true, msg: '我要調整一下' });
    setTimeout(() => {
      c7Push({ msg: '好，你可以直接在畫布上的報告組裝區塊拖曳調整順序、點 × 移除，或從積木盒加新的章節進來。' });
    }, 400);
  }

  return {
    conv7Msgs,
    conv7Title,
    resetConv7,
    conv7InitFlow,
    conv7ConfirmGenerate,
    conv7Satisfied,
    conv7Adjust,
  };
}
