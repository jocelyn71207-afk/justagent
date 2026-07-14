# Verify Email Template Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重新設計 Justka 驗證信（白底）並新增 JustAgent 版本，兩者共用同一設計語言。

**Architecture:** 兩個獨立的 Thymeleaf HTML 檔案，inline CSS（email 相容），logo 區維持深色背景以保持白色 logo 可見性，內容區白底。JustAgent banner 以 CSS + emoji inline 實作。

**Tech Stack:** HTML, inline CSS, Thymeleaf

---

## 設計 Token 速查

| Token | 值 |
|-------|----|
| 頂部色條 | `linear-gradient(90deg, #3eb5cc, #00A078)`，高度 8px |
| Logo 區背景 | `#1a1a24` |
| 內容區底色 | `#ffffff` |
| 按鈕 / 連結色 | `#1aaf96` |
| 主文字 | `#1a1a24` |
| 次要文字 | `#555555` |
| 說明文字 | `#888888` |
| Footer 背景 | `#f5f5f5` |
| Footer 文字 | `#999999` |
| 外框背景 | `#f0f0f0` |
| 卡片寬度 | `600px` |

---

## Task 1：更新 verify.html（Justka）

**Files:**
- Modify: `~/Downloads/verify.html`

- [ ] **Step 1：重寫 verify.html**

將 `~/Downloads/verify.html` 全部替換為以下內容：

```html
<!DOCTYPE html>
<html lang="zh-TW" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>艾斯企業身份識別中心</title>
</head>
<body style="background-color: #f0f0f0; margin: 0; padding: 0;">
<table cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f0f0;">
  <tr>
    <td style="background-color: #f0f0f0;"></td>
    <td style="width: 600px;">

      <!-- 頂部漸層色條 -->
      <div style="width: 100%; height: 8px; background: linear-gradient(90deg, #3eb5cc, #00A078);"></div>

      <!-- Logo 區（深色背景保持白色 logo 可見） -->
      <div style="background-color: #1a1a24; padding: 16px 20px;">
        <img src="logo.png" alt="Justka" style="height: 40px; width: auto;">
      </div>

      <!-- 內容區（白底） -->
      <div style="background-color: #ffffff; padding: 32px 40px;">

        <!-- Banner：驗證郵件 -->
        <div th:if="${buttonName == '驗證郵件'}" style="text-align: center; margin-bottom: 24px;">
          <img src="https://cdn.justka.ai/common/images/register-image.png" alt="" style="max-width: 100%;">
        </div>

        <!-- Banner：密碼重置 -->
        <div th:if="${buttonName == '密碼重置'}" style="text-align: center; margin-bottom: 24px;">
          <img src="https://cdn.justka.ai/common/images/reset-password-image.png" alt="" style="max-width: 100%;">
        </div>

        <!-- 稱呼 -->
        <div style="margin-bottom: 20px; font-size: 15px; color: #1a1a24; font-weight: 600;">
          <span th:text="'Hi, ' + ${userName} + ' 👋'"></span>
        </div>

        <!-- 說明文字 -->
        <div style="margin-bottom: 28px; line-height: 26px; font-size: 14px; color: #555555;">
          <p th:if="${buttonName == '驗證郵件'}" style="margin: 0;">
            很高興並感謝您註冊 Justka AI Chatbot！
            <br/>
            請協助完成以下 email 驗證後，就可以開始體驗完整的服務了！
          </p>
          <p th:if="${buttonName == '密碼重置'}" style="margin: 0;">
            這是申請忘記密碼通知信，若不是您本人申請，請忽略這封信件。
            <br/>
            請直接點選下方按鈕或複製連結到您的瀏覽器即可開始重設密碼。
          </p>
        </div>

        <!-- CTA 按鈕 -->
        <div style="text-align: center; margin-bottom: 28px;">
          <a th:href="${verifyUrl}" target="_blank"
             style="display: inline-block; text-decoration: none; background-color: #1aaf96; padding: 13px 44px; color: #ffffff; border-radius: 4px; font-size: 14px; font-weight: 600;">
            <span th:text="${buttonName}"></span>
          </a>
        </div>

        <!-- 備用連結 -->
        <div style="margin-bottom: 6px; font-size: 13px; color: #888888;">
          無法自動跳轉至網頁？請手動複製貼上連結至您的瀏覽器網址列中：
        </div>
        <div style="margin-bottom: 40px; font-size: 13px;">
          <a th:href="${verifyUrl}" target="_blank" style="color: #1aaf96;">上方按鈕若無法點擊，請點擊此連結</a>
        </div>

        <!-- 注意事項 -->
        <div style="margin-bottom: 20px; color: #888888; line-height: 24px; font-size: 13px;">
          *注意：驗證連結有效時間為 24 小時，請於 24 小時內完成驗證。
          <br>
          若已超過時效，請重新註冊。
          <br>
          如有任何問題，歡迎您與我們聯絡。
        </div>

        <!-- 署名 -->
        <div style="margin-bottom: 10px; color: #888888; line-height: 26px; font-size: 13px;">
          Thank you for your support!
          <br>
          Justka Team
          <br>
          <a href="mailto:contactus@justka.ai" style="color: #1aaf96;">contactus@justka.ai</a>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 18px 20px; background-color: #f5f5f5;">
        <div style="color: #999999; line-height: 26px; font-size: 12px;">
          這封信為系統自動發出，請勿直接回覆
          <br>
          106 台北市大安區敦化南路二段76號5樓　02 2707 8600
          <br>
          <span th:text="'© ' + ${currentYear} + ' Mobii Genius. ALL RIGHTS RESERVED'"></span>
        </div>
      </div>

    </td>
    <td style="background-color: #f0f0f0;"></td>
  </tr>
</table>
</body>
</html>
```

- [ ] **Step 2：在瀏覽器開啟確認樣式**

```bash
open ~/Downloads/verify.html
```

確認：漸層色條、深色 logo 區、白色內容區、`#1aaf96` 按鈕、淺灰 footer。

- [ ] **Step 3：Commit**

```bash
git -C ~/Downloads add verify.html 2>/dev/null || echo "not a git repo, skip"
```

（Downloads 非 git repo 可略過）

---

## Task 2：新增 verify-justagent.html

**Files:**
- Create: `~/Downloads/verify-justagent.html`

- [ ] **Step 1：建立 verify-justagent.html**

建立 `~/Downloads/verify-justagent.html`，內容如下：

```html
<!DOCTYPE html>
<html lang="zh-TW" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>艾斯企業身份識別中心</title>
</head>
<body style="background-color: #f0f0f0; margin: 0; padding: 0;">
<table cellpadding="0" cellspacing="0" width="100%" style="background-color: #f0f0f0;">
  <tr>
    <td style="background-color: #f0f0f0;"></td>
    <td style="width: 600px;">

      <!-- 頂部漸層色條 -->
      <div style="width: 100%; height: 8px; background: linear-gradient(90deg, #3eb5cc, #00A078);"></div>

      <!-- Logo 區（深色背景保持白色 logo 可見） -->
      <div style="background-color: #1a1a24; padding: 16px 20px;">
        <img src="logo.png" alt="JustAgent" style="height: 40px; width: auto;">
      </div>

      <!-- 內容區（白底） -->
      <div style="background-color: #ffffff; padding: 32px 40px;">

        <!-- Banner：驗證郵件（CSS inline） -->
        <div th:if="${buttonName == '驗證郵件'}"
             style="text-align: center; margin-bottom: 28px; padding: 28px 20px; background-color: #f0fdf9; border-radius: 8px;">
          <div style="font-size: 54px; line-height: 1; margin-bottom: 10px;">✉️</div>
          <div style="font-size: 22px; color: #1aaf96; margin-bottom: 10px; font-weight: 700;">✓</div>
          <div style="font-size: 15px; font-weight: 600; color: #1a1a24; margin-bottom: 4px;">驗證您的電子郵件</div>
          <div style="font-size: 12px; color: #888888;">完成驗證，開始體驗 JustAgent</div>
        </div>

        <!-- Banner：密碼重置（CSS inline） -->
        <div th:if="${buttonName == '密碼重置'}"
             style="text-align: center; margin-bottom: 28px; padding: 28px 20px; background-color: #f0fdf9; border-radius: 8px;">
          <div style="font-size: 54px; line-height: 1; margin-bottom: 10px;">🔒</div>
          <div style="font-size: 15px; font-weight: 600; color: #1a1a24; margin-bottom: 4px;">重設您的密碼</div>
          <div style="font-size: 12px; color: #888888;">請點選下方按鈕安全地重設密碼</div>
        </div>

        <!-- 稱呼 -->
        <div style="margin-bottom: 20px; font-size: 15px; color: #1a1a24; font-weight: 600;">
          <span th:text="'Hi, ' + ${userName} + ' 👋'"></span>
        </div>

        <!-- 說明文字 -->
        <div style="margin-bottom: 28px; line-height: 26px; font-size: 14px; color: #555555;">
          <p th:if="${buttonName == '驗證郵件'}" style="margin: 0;">
            很高興並感謝您註冊 JustAgent！
            <br/>
            請協助完成以下 email 驗證後，就可以開始體驗完整的服務了！
          </p>
          <p th:if="${buttonName == '密碼重置'}" style="margin: 0;">
            這是申請忘記密碼通知信，若不是您本人申請，請忽略這封信件。
            <br/>
            請直接點選下方按鈕或複製連結到您的瀏覽器即可開始重設密碼。
          </p>
        </div>

        <!-- CTA 按鈕 -->
        <div style="text-align: center; margin-bottom: 28px;">
          <a th:href="${verifyUrl}" target="_blank"
             style="display: inline-block; text-decoration: none; background-color: #1aaf96; padding: 13px 44px; color: #ffffff; border-radius: 4px; font-size: 14px; font-weight: 600;">
            <span th:text="${buttonName}"></span>
          </a>
        </div>

        <!-- 備用連結 -->
        <div style="margin-bottom: 6px; font-size: 13px; color: #888888;">
          無法自動跳轉至網頁？請手動複製貼上連結至您的瀏覽器網址列中：
        </div>
        <div style="margin-bottom: 40px; font-size: 13px;">
          <a th:href="${verifyUrl}" target="_blank" style="color: #1aaf96;">上方按鈕若無法點擊，請點擊此連結</a>
        </div>

        <!-- 注意事項 -->
        <div style="margin-bottom: 20px; color: #888888; line-height: 24px; font-size: 13px;">
          *注意：驗證連結有效時間為 24 小時，請於 24 小時內完成驗證。
          <br>
          若已超過時效，請重新註冊。
          <br>
          如有任何問題，歡迎您與我們聯絡。
        </div>

        <!-- 署名 -->
        <div style="margin-bottom: 10px; color: #888888; line-height: 26px; font-size: 13px;">
          Thank you for your support!
          <br>
          JustAgent Team
          <br>
          <a href="mailto:contactus@justka.ai" style="color: #1aaf96;">contactus@justka.ai</a>
        </div>

      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 18px 20px; background-color: #f5f5f5;">
        <div style="color: #999999; line-height: 26px; font-size: 12px;">
          這封信為系統自動發出，請勿直接回覆
          <br>
          106 台北市大安區敦化南路二段76號5樓　02 2707 8600
          <br>
          <span th:text="'© ' + ${currentYear} + ' Mobii Genius. ALL RIGHTS RESERVED'"></span>
        </div>
      </div>

    </td>
    <td style="background-color: #f0f0f0;"></td>
  </tr>
</table>
</body>
</html>
```

- [ ] **Step 2：在瀏覽器開啟確認樣式**

```bash
open ~/Downloads/verify-justagent.html
```

確認：漸層色條、深色 logo 區、白色內容區、emoji banner（✉️ / 🔒）、`#1aaf96` 按鈕、淺灰 footer、署名為「JustAgent Team」。

---

## Task 3：並排對比確認

- [ ] **Step 1：同時開啟兩個檔案確認一致性**

```bash
open ~/Downloads/verify.html ~/Downloads/verify-justagent.html
```

對比清單：
- [ ] 頂部色條一致（同一漸層）
- [ ] Logo 區深色背景一致
- [ ] 按鈕顏色一致（`#1aaf96`）
- [ ] Footer 一致
- [ ] Justka 版署名：「Justka Team」
- [ ] JustAgent 版署名：「JustAgent Team」
- [ ] JustAgent banner 顯示正常（emoji + 淡綠背景）
