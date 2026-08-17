# Verify Email Template Redesign — Justka & JustAgent

**Date:** 2026-05-11

## Background

現有 `verify.html` 僅供 Justka 產品使用（深色主題）。本次重新設計為兩個產品共用的白色主題模板，並新增 JustAgent 版本。

## 輸出檔案

| 檔案 | 用途 |
|------|------|
| `verify.html` | Justka 產品（驗證郵件 / 密碼重置） |
| `verify-justagent.html` | JustAgent 產品（驗證郵件 / 密碼重置） |

## 設計規格

### 配色

| 元素 | 值 |
|------|----|
| 頁面外框背景 | `#f0f0f0` |
| 卡片底色 | `#ffffff` |
| 頂部色條 | 漸層 `#3eb5cc → #00A078`，高度 8px |
| 按鈕 / 連結色 | `#1aaf96` |
| 主文字 | `#1a1a24` |
| 次要文字 | `#555555` |
| 說明文字 | `#888888` |
| Footer 背景 | `#f5f5f5` |
| Footer 文字 | `#999999` |

### 結構（兩個模板共用）

1. 頂部漸層色條（8px）
2. Logo 區域
3. 內容區
   - Banner 圖片（`th:if` 區分驗證郵件 / 密碼重置）
   - `Hi, {userName} 👋`
   - 說明文字（`th:if` 區分功能）
   - CTA 按鈕
   - 備用連結文字
   - 注意事項
   - 署名（Team 名稱隨產品不同）
4. Footer（公司資訊、版權）

### 兩個產品的差異

| 項目 | Justka | JustAgent |
|------|--------|-----------|
| `<title>` | 艾斯企業身份識別中心 | 艾斯企業身份識別中心 |
| Logo | `logo.png`（桌面同一份） | `logo.png`（桌面同一份） |
| 產品名稱文案 | Justka AI Chatbot | JustAgent |
| 署名 | Justka Team | JustAgent Team |
| 聯絡信箱 | `contactus@justka.ai` | `contactus@justka.ai`（共用） |
| Banner 圖片 | CDN 現有圖片 | 以 CSS inline 設計（無現成素材） |

### Thymeleaf 變數（沿用現有）

- `${userName}` — 收件人姓名
- `${buttonName}` — `'驗證郵件'` 或 `'密碼重置'`
- `${verifyUrl}` — 驗證 / 重置連結
- `${currentYear}` — 年份

### Logo 可見性說明

`logo.png` 是白色透明背景，白底上不可見。Logo 區塊維持深色背景 `#1a1a24`，其餘內容區為白色。

### JustAgent Banner 設計規格（CSS inline）

用 CSS + emoji 取代圖片素材，兼容主流 email 用戶端：

- **驗證郵件 banner**：信封 + 打勾圖示，綠色系，傳達「收到 → 完成驗證」
- **密碼重置 banner**：鎖頭圖示，藍綠色系，傳達「安全重置」

## 不在本次範圍內

- CDN 上傳 logo 圖片
- 後端 template 路徑設定
