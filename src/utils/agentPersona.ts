// AiViewer 對話訊息的「發話 agent」形象設定：AI大腦負責確認需求/分派任務，
// 分派完成後由對應的專責 agent 接手實際輸出（見 processConv1Msg 的任務分工）。
// 訊息物件沒有帶 agent 欄位時（例如 conv2-6 目前還沒套用這套形象拆解），
// 一律 fallback 成 'brain'，維持一個統一、有意義的預設頭像，而不是死板文字。

export type AgentKey =
  | 'brain'             // AI大腦：確認需求、分派任務
  | 'productAssistant'  // 產品助理：整理資料、初步/例行工作（檔案格式轉換、翻譯、快速分析）
  | 'productManager'    // 產品經理：產品描述文案撰寫，以及更深入/需要判斷的產品相關工作
                         // （例如競品深度分析）——助理做初步，經理接手深入的部分
  | 'dataManager'       // 數據經理：產品銷售數據分析
  | 'marketingManager'; // 行銷經理：行銷策略分析

interface AgentPersonaMeta {
  name: string;
  icon: string; // material-symbols-outlined 圖示名稱
  tag: string;  // 沿用專案既有的 --tag-* 色票 class（見 _theme.scss）
}

const AGENT_PERSONA_META: Record<AgentKey, AgentPersonaMeta> = {
  brain:            { name: 'AI大腦',   icon: 'neurology',    tag: 'tag-violet' },
  productAssistant: { name: '產品助理', icon: 'inventory_2',  tag: 'tag-teal' },
  productManager:   { name: '產品經理', icon: 'edit_note',    tag: 'tag-amber' },
  dataManager:      { name: '數據經理', icon: 'monitoring',   tag: 'tag-blue' },
  marketingManager: { name: '行銷經理', icon: 'campaign',     tag: 'tag-rose' },
};

// key 不存在或未帶欄位時，一律 fallback 成 AI大腦
function agentPersonaMeta(key?: string): AgentPersonaMeta {
  return AGENT_PERSONA_META[key as AgentKey] ?? AGENT_PERSONA_META.brain;
}

export { AGENT_PERSONA_META, agentPersonaMeta };
