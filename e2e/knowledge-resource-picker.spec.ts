import { test, expect } from '@playwright/test'

test.describe('知識彈窗 × 共用檔案管理整合', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aiviews/view/KnowledgeBase')
    await page.waitForLoadState('networkidle')
  })

  test('FILE 上傳區顯示提示文字與「從共用檔案管理選取」按鈕', async ({ page }) => {
    await page.locator('button, .custom-btn').filter({ hasText: '建立知識條目' }).first().click()
    await page.waitForTimeout(400)

    await expect(page.locator('text=上傳的檔案將同時儲存至共用檔案管理')).toBeVisible()
    await expect(page.locator('button').filter({ hasText: '從共用檔案管理選取' })).toBeVisible()
  })

  test('開啟 ResourceFilePicker、搜尋篩選、選取並回填 wizard', async ({ page }) => {
    await page.locator('button, .custom-btn').filter({ hasText: '建立知識條目' }).first().click()
    await page.waitForTimeout(400)

    // Open picker
    await page.locator('button').filter({ hasText: '從共用檔案管理選取' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('text=選取共用檔案')).toBeVisible()

    // Search filter
    await page.locator('.picker-search input').fill('PDF')
    await page.waitForTimeout(200)
    const rows = page.locator('.picker-row:not(.is-disabled)')
    for (const row of await rows.all()) {
      const name = await row.locator('.picker-row-name span').textContent()
      expect(name?.toUpperCase()).toContain('PDF')
    }

    // Clear filter and select first enabled file
    await page.locator('.picker-search input').fill('')
    await page.waitForTimeout(150)
    const firstRow = page.locator('.picker-row:not(.is-disabled)').first()
    const pickedName = await firstRow.locator('.picker-row-name span').textContent()
    await firstRow.click()
    await page.waitForTimeout(200)

    // Selected hint shows the filename
    await expect(page.locator('.picker-selected-hint')).toContainText(pickedName!.trim())

    // Confirm
    await page.locator('button').filter({ hasText: '確認選取' }).first().click()
    await page.waitForTimeout(400)

    // Wizard shows selected state
    await expect(page.locator('text=來自共用檔案管理')).toBeVisible()
    await expect(page.locator('.custom-main-btn')).toContainText('建立草稿並編輯')
  })

  test('「更換」按鈕清除選取並恢復上傳區', async ({ page }) => {
    await page.locator('button, .custom-btn').filter({ hasText: '建立知識條目' }).first().click()
    await page.waitForTimeout(400)

    await page.locator('button').filter({ hasText: '從共用檔案管理選取' }).first().click()
    await page.waitForTimeout(400)
    await page.locator('.picker-row:not(.is-disabled)').first().click()
    await page.waitForTimeout(200)
    await page.locator('button').filter({ hasText: '確認選取' }).first().click()
    await page.waitForTimeout(300)

    await expect(page.locator('text=來自共用檔案管理')).toBeVisible()

    // Click 更換
    await page.locator('button').filter({ hasText: '更換' }).first().click()
    await page.waitForTimeout(200)
    await expect(page.locator('.upload-dropzone')).toBeVisible()
    await expect(page.locator('text=來自共用檔案管理')).not.toBeVisible()
  })

  test('關閉 wizard 後重開，狀態已重置', async ({ page }) => {
    const openBtn = page.locator('button, .custom-btn').filter({ hasText: '建立知識條目' }).first()
    await openBtn.click()
    await page.waitForTimeout(400)

    // Select library file
    await page.locator('button').filter({ hasText: '從共用檔案管理選取' }).first().click()
    await page.waitForTimeout(400)
    await page.locator('.picker-row:not(.is-disabled)').first().click()
    await page.waitForTimeout(200)
    await page.locator('button').filter({ hasText: '確認選取' }).first().click()
    await page.waitForTimeout(300)

    // Close modal
    await page.locator('.custom-btn').filter({ hasText: '取消' }).first().click()
    await page.waitForTimeout(300)

    // Reopen
    await openBtn.click()
    await page.waitForTimeout(400)

    // Upload zone should be back (state reset)
    await expect(page.locator('.upload-dropzone')).toBeVisible()
    await expect(page.locator('text=來自共用檔案管理')).not.toBeVisible()
  })

  test('disabled 狀態的檔案無法選取', async ({ page }) => {
    await page.locator('button, .custom-btn').filter({ hasText: '建立知識條目' }).first().click()
    await page.waitForTimeout(400)
    await page.locator('button').filter({ hasText: '從共用檔案管理選取' }).first().click()
    await page.waitForTimeout(500)

    const disabledRows = page.locator('.picker-row.is-disabled')
    const count = await disabledRows.count()
    if (count > 0) {
      await disabledRows.first().click()
      await page.waitForTimeout(200)
      // Confirm button should still be disabled (nothing selected)
      await expect(page.locator('button').filter({ hasText: '確認選取' })).toBeDisabled()
    }
  })
})
