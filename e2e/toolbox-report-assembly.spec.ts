import { test, expect, type Page } from '@playwright/test'

// 開場的 conv1 空白狀態遮罩（.conv1-empty-overlay）會蓋住整個輸入區，
// 必須先送出一則訊息讓對話「開始」，遮罩才會收起，工具箱按鈕才可點擊。
async function dismissEmptyOverlayAndOpenReportAssembly(page: Page) {
  await page.locator('.conv1-empty-textarea').fill('哈囉')
  await page.locator('.conv1-empty-send-btn').click()
  await expect(page.locator('.conv1-empty-overlay')).toBeHidden()

  await page.locator('button').filter({ has: page.locator('i:text("construction")') }).first().click()
  await expect(page.locator('.toolbox-fn-box')).toHaveClass(/show/)
  await page.locator('.toolbox-item').filter({ hasText: '行銷報告生成' }).click()
}

test.describe('工具箱 × 報告組裝', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/justagent/view/AiViewer')
    await page.waitForLoadState('networkidle')
  })

  test('開啟工具箱顯示 4 個項目，僅行銷報告生成可點', async ({ page }) => {
    await page.locator('.conv1-empty-textarea').fill('哈囉')
    await page.locator('.conv1-empty-send-btn').click()
    await expect(page.locator('.conv1-empty-overlay')).toBeHidden()

    await page.locator('button').filter({ has: page.locator('i:text("construction")') }).first().click()
    await expect(page.locator('.toolbox-fn-box')).toHaveClass(/show/)

    await expect(page.locator('.toolbox-item').filter({ hasText: '行銷報告生成' })).toBeVisible()
    await expect(page.locator('.toolbox-item').filter({ hasText: '圖像生成' })).toHaveClass(/disabled/)
    await expect(page.locator('.toolbox-item').filter({ hasText: '創作音樂' })).toHaveClass(/disabled/)
    await expect(page.locator('.toolbox-item').filter({ hasText: 'Deep Search' })).toHaveClass(/disabled/)
  })

  test('點擊行銷報告生成跑完引導對話後，畫布出現報告組裝 Block', async ({ page }) => {
    await dismissEmptyOverlayAndOpenReportAssembly(page)

    // 等待腳本對話跑完（conv7InitFlow 最後一則訊息在 2000ms 後推入）
    await expect(page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]')).toBeVisible({ timeout: 5000 })

    await page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]').click()

    await expect(page.locator('.reportAssemblyViewBox')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-count')).toHaveText('已選 5 個章節')
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-item')).toHaveCount(5)
  })

  test('報告組裝 Block 內可以加入、移除章節', async ({ page }) => {
    await dismissEmptyOverlayAndOpenReportAssembly(page)
    await expect(page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]')).toBeVisible({ timeout: 5000 })
    await page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]').click()
    await expect(page.locator('.reportAssemblyViewBox')).toBeVisible({ timeout: 5000 })

    // 加入一個尚未加入的章節（性別分布）
    const paletteItem = page.locator('.report-assembly-palette-item').filter({ hasText: '性別分布' })
    await paletteItem.locator('.report-assembly-add-btn').click()
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-count')).toHaveText('已選 6 個章節')
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-item').filter({ hasText: '性別分布' })).toBeVisible()

    // 移除一個已組裝的章節
    await page.locator('.report-assembly-item').filter({ hasText: '前 10 大活動' }).locator('.report-assembly-remove').click()
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-count')).toHaveText('已選 5 個章節')
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-item').filter({ hasText: '前 10 大活動' })).toHaveCount(0)
  })

  test('存成模板顯示 toast 提示', async ({ page }) => {
    await dismissEmptyOverlayAndOpenReportAssembly(page)
    await expect(page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]')).toBeVisible({ timeout: 5000 })
    await page.locator('.conv1-quick-btn[data-action="conv7-confirm-generate"]').click()
    await expect(page.locator('.reportAssemblyViewBox')).toBeVisible({ timeout: 5000 })

    await page.locator('.report-assembly-save-btn').click()
    await expect(page.locator('.pop-toast')).toBeVisible()
  })
})
