// 行銷報告的積木庫（章節目錄）。這是「用行銷積木組裝」技能時的唯一資料來源，
// 前端假資料，等真正串接章節 API 再換。順序＝畫面顯示順序，不帶編號。
export interface ReportCategory { id: string; label: string; color: string }
export interface ReportSection { id: string; categoryId: string; name: string; description: string }

export const REPORT_CATEGORIES: ReportCategory[] = [
  { id: 'ta', label: 'TA 用戶畫像', color: 'var(--tag-blue-text)' },
  { id: 'promo', label: '行銷活動成效', color: 'var(--tag-rust-text)' },
  { id: 'channel', label: '渠道績效', color: 'var(--tag-green-text)' },
]

export const REPORT_SECTIONS: ReportSection[] = [
  { id: 'ta_gender', categoryId: 'ta', name: '性別分布', description: '會員性別分布資料，圖表自動生成。' },
  { id: 'ta_age', categoryId: 'ta', name: '年齡層分布', description: '會員年齡層分布資料，圖表自動生成。' },
  { id: 'ta_gender_age', categoryId: 'ta', name: '性別 × 年齡交叉比較', description: '性別 × 年齡層交叉分布，回答「不同性別的年齡結構」。' },
  { id: 'ta_geo', categoryId: 'ta', name: '地理分布', description: '會員地理分布（佔比 ≥1% 的城市），圖表自動生成。' },
  { id: 'ta_site_register', categoryId: 'ta', name: '站台註冊分布', description: '各站台／來源的註冊會員數與佔比。' },
  { id: 'ta_login_source', categoryId: 'ta', name: '登入來源分布', description: '會員登入方式（帳密、社群、LINE…）分布。' },
  { id: 'ta_member_level', categoryId: 'ta', name: '會員等級分布', description: '各會員等級人數與佔比，含升降級趨勢。' },
  { id: 'ta_persona', categoryId: 'ta', name: '會員人物誌', description: '性別 × 年齡層 × 主力購買品類 × RFM 行為分群的四維輪廓。' },
  { id: 'ta_detail', categoryId: 'ta', name: 'TA 明細資料', description: '符合篩選條件的會員明細清單，可匯出。' },
  { id: 'promo_kpi', categoryId: 'promo', name: '促銷核心 KPI', description: '完成訂單數、GMV、折扣總額、折扣佔比、規則數。' },
  { id: 'promo_ranking', categoryId: 'promo', name: '活動排行', description: '各促銷活動帶動效果排行，並自動生成圖表。' },
  { id: 'promo_type', categoryId: 'promo', name: '活動類型分析', description: '各促銷類型效益（類型分布、有折扣 vs 無折扣 AOV），圖表自動生成。' },
  { id: 'promo_monthly', categoryId: 'promo', name: '月度促銷趨勢', description: '已完成訂單的月度訂單數與 GMV 走勢，圖表自動生成。' },
  { id: 'promo_detail', categoryId: 'promo', name: '完整促銷活動明細', description: '每一檔活動的期間、規則、訂單數、GMV 明細表。' },
  { id: 'promo_coupon', categoryId: 'promo', name: '優惠券使用率明細', description: '各券別發放數、使用數、使用率與帶動 GMV。' },
  { id: 'promo_heatmap', categoryId: 'promo', name: '銷售熱門時段', description: '星期 × 小時的訂單量／GMV 熱力圖，回答「什麼時候該推活動」。' },
  { id: 'ch_kpi', categoryId: 'channel', name: '渠道核心 KPI', description: '各渠道工作階段數、轉換率、收益、每工作階段收益。' },
  { id: 'ch_traffic', categoryId: 'channel', name: '渠道別流量與收益貢獻', description: '各渠道流量佔比與收益貢獻對照，圖表自動生成。' },
  { id: 'ch_device', categoryId: 'channel', name: '使用者活躍時段與裝置輪廓', description: '各渠道使用者活躍時段與裝置（桌機／手機／平板）分布。' },
  { id: 'ch_trend', categoryId: 'channel', name: '渠道整體工作階段數與收益趨勢', description: '整體工作階段數與收益的時間走勢，圖表自動生成。' },
  { id: 'ch_time_cross', categoryId: 'channel', name: '渠道 × 時間交叉分布', description: '渠道 × 星期／小時交叉分布，找出各渠道的黃金時段。' },
]

export const SECTION_MAP: Record<string, ReportSection> = Object.fromEntries(REPORT_SECTIONS.map(s => [s.id, s]))

export function sectionsByCategory(categoryId: string): ReportSection[] {
  return REPORT_SECTIONS.filter(s => s.categoryId === categoryId)
}
