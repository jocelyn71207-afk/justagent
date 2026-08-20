import { test, expect, type Page } from '@playwright/test'

// 開場的 conv1 空白狀態遮罩（.conv1-empty-overlay）會蓋住整個輸入區，
// 必須先送出一則訊息讓對話「開始」，遮罩才會收起，工具箱按鈕才可點擊。
// 點擊「行銷報告生成」後，報告組裝 Block 會立刻出現在畫布上（不需要再等腳本對話跑完才確認）。
async function dismissEmptyOverlayAndOpenReportAssembly(page: Page) {
  await page.locator('.conv1-empty-textarea').fill('哈囉')
  await page.locator('.conv1-empty-send-btn').click()
  await expect(page.locator('.conv1-empty-overlay')).toBeHidden()

  await page.locator('button').filter({ has: page.locator('i:text("construction")') }).first().click()
  await expect(page.locator('.toolbox-fn-box')).toHaveClass(/show/)
  await page.locator('.toolbox-item').filter({ hasText: '行銷報告生成' }).click()

  await expect(page.locator('.reportAssemblyViewBox')).toBeVisible({ timeout: 5000 })
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

  test('點擊行銷報告生成後，報告組裝 Block 立刻出現在畫布上', async ({ page }) => {
    await dismissEmptyOverlayAndOpenReportAssembly(page)

    await expect(page.locator('.reportAssemblyViewBox .report-assembly-count')).toContainText('已選 5 個章節')
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-item')).toHaveCount(5)

    // 輸入框 placeholder 應同時切換成引導描述文字
    await expect(page.locator('#userInput')).toHaveAttribute('placeholder', '描述您的行銷報告')
  })

  test('腳本對話跑完後，畫布上會多一個靜態行銷報告 Block', async ({ page }) => {
    await dismissEmptyOverlayAndOpenReportAssembly(page)

    // 等腳本對話跑完（最後一則訊息在 2000ms 後推入，附滿意/調整快速回覆）
    await expect(page.locator('.conv1-quick-btn[data-action="conv7-satisfied"]')).toBeVisible({ timeout: 5000 })

    // 報告組裝 Block（互動式）與靜態行銷報告 Block（HTML）應同時存在
    await expect(page.locator('.reportAssemblyViewBox')).toBeVisible()
    await expect(page.locator('.for-HTML')).toBeVisible()
  })

  test('報告組裝 Block 內可以加入、移除章節', async ({ page }) => {
    await dismissEmptyOverlayAndOpenReportAssembly(page)

    // 加入一個尚未加入的章節（性別分布）
    const paletteItem = page.locator('.report-assembly-palette-item').filter({ hasText: '性別分布' })
    await paletteItem.locator('.report-assembly-add-btn').click()
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-count')).toContainText('已選 6 個章節')
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-item').filter({ hasText: '性別分布' })).toBeVisible()

    // 移除一個已組裝的章節
    await page.locator('.report-assembly-item').filter({ hasText: '前 10 大活動' }).locator('.report-assembly-remove').click()
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-count')).toContainText('已選 5 個章節')
    await expect(page.locator('.reportAssemblyViewBox .report-assembly-item').filter({ hasText: '前 10 大活動' })).toHaveCount(0)
  })

  test('存成模板顯示提示使用者向 AI 要求重新生成的 toast', async ({ page }) => {
    await dismissEmptyOverlayAndOpenReportAssembly(page)

    await page.locator('.report-assembly-save-btn').click()
    await expect(page.locator('.pop-toast')).toBeVisible()
    await expect(page.locator('.pop-toast')).toContainText('用新的組合幫我生成新的報告')
  })

  test('拖曳排序後驗證順序有變化', async ({ page }) => {
    await dismissEmptyOverlayAndOpenReportAssembly(page)

    // 限定在「已組裝」的 <ol> 清單內，避免選到下方積木盒同樣叫 .report-assembly-item-name 的項目
    const assembledNames = page.locator('.reportAssemblyViewBox .report-assembly-list .report-assembly-item-name')
    const assembledItems = page.locator('.reportAssemblyViewBox .report-assembly-list .report-assembly-item')

    const namesBefore = await assembledNames.allTextContents()
    expect(namesBefore).toEqual(['促銷核心 KPI', '前 10 大活動', '活動類型分析', '月度促銷趨勢', '銷售熱門時段'])

    // 把第 1 個章節拖到第 3 個章節上
    await assembledItems.nth(0).dragTo(assembledItems.nth(2))

    const namesAfter = await assembledNames.allTextContents()
    expect(namesAfter).not.toEqual(namesBefore)
    // 章節數量不應變動，只是順序改變（純拖曳排序，不會新增/移除章節）
    expect(namesAfter).toHaveLength(namesBefore.length)
    expect(namesAfter.slice().sort()).toEqual(namesBefore.slice().sort())
    // 「促銷核心 KPI」應該被移動到「活動類型分析」之前，不再是第一個
    expect(namesAfter[0]).not.toBe('促銷核心 KPI')
    expect(namesAfter.indexOf('促銷核心 KPI')).toBeLessThan(namesAfter.indexOf('活動類型分析'))
  })
})
