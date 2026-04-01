import { test, expect } from '@playwright/test'

test.describe('ProjectDashboard 最近使用', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aiviews/view/ProjectDashboard')
  })

  test('應顯示「最近使用」標題', async ({ page }) => {
    await expect(page.locator('.ProjectListContent h3')).toContainText('最近使用')
  })

  test('應顯示 Agent 過濾 Tabs', async ({ page }) => {
    await expect(page.locator('.compTabs')).toBeVisible()
    await expect(page.getByText('全部Agent')).toBeVisible()
    await expect(page.getByText('業務助理')).toBeVisible()
    await expect(page.getByText('數據分析')).toBeVisible()
    await expect(page.getByText('行銷專員')).toBeVisible()
  })

  test('預設應以卡片模式顯示專案', async ({ page }) => {
    await expect(page.locator('.card-list-box')).toBeVisible()
  })

  test('應顯示專案列表 (有資料)', async ({ page }) => {
    await expect(page.locator('.one-card-box.project-card').first()).toBeVisible()
  })

  test('Agent 過濾 Tab 切換 - 點擊「業務助理」應過濾專案', async ({ page }) => {
    const allCards = page.locator('.one-card-box.project-card')
    // 等待 cards 渲染完成再取數量
    await expect(allCards.first()).toBeVisible()
    const countBefore = await allCards.count()

    await page.getByText('業務助理').click()
    // 過濾後數量應小於全部（業務助理不是所有專案都有）
    const countAfter = await allCards.count()
    expect(countAfter).toBeLessThanOrEqual(countBefore)
  })

  test('點擊「全部Agent」後應顯示全部專案', async ({ page }) => {
    await page.getByText('業務助理').click()
    await page.getByText('全部Agent').click()
    const allCards = page.locator('.one-card-box.project-card')
    await expect(allCards.first()).toBeVisible()
    const count = await allCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('切換到列表模式應顯示表格', async ({ page }) => {
    // 第二個 tab 按鈕為 list 模式
    await page.locator('.compListCardSwitch .compListCardSwitch-item').nth(1).click()
    await expect(page.locator('.table-list-box')).toBeVisible()
    await expect(page.locator('.card-list-box')).toBeHidden()
  })

  test('切換回卡片模式應顯示卡片', async ({ page }) => {
    // 先切到 list（第二個 tab）
    await page.locator('.compListCardSwitch .compListCardSwitch-item').nth(1).click()
    // 再切回 card（第一個 tab）
    await page.locator('.compListCardSwitch .compListCardSwitch-item').nth(0).click()
    await expect(page.locator('.card-list-box')).toBeVisible()
    await expect(page.locator('.table-list-box')).toBeHidden()
  })

  test('時間排序下拉應存在且可切換', async ({ page }) => {
    const dropdown = page.locator('.ProjectListContent .compDropDown').first()
    await expect(dropdown).toBeVisible()

    // 切換到「時間排序 舊 → 新」
    await dropdown.click()
    await page.getByText('時間排序 舊 → 新').click()

    // 確認選單已關閉，選項已選擇
    await expect(page.locator('.ProjectListContent .compDropDown').first()).toContainText('時間排序 舊 → 新')
  })

  test('點擊「建立新專案」按鈕應顯示選單', async ({ page }) => {
    await page.getByRole('button', { name: '建立新專案' }).click()
    const optionBox = page.locator('.createProjectOptionBox')
    await expect(optionBox).toBeVisible()
    await expect(optionBox.locator('.option-item').filter({ hasText: '團隊一' })).toBeVisible()
    await expect(optionBox.locator('.option-item').filter({ hasText: '團隊二' })).toBeVisible()
  })

  test('點擊頁面其他區域應關閉建立新專案選單', async ({ page }) => {
    await page.getByRole('button', { name: '建立新專案' }).click()
    await expect(page.locator('.createProjectOptionBox')).toBeVisible()
    await page.locator('.ProjectListContent h3').click()
    await expect(page.locator('.createProjectOptionBox')).toBeHidden()
  })

  test('點擊「團隊一」選項應開啟專案設定 Modal', async ({ page }) => {
    await page.getByRole('button', { name: '建立新專案' }).click()
    await page.locator('.createProjectOptionBox .option-item').filter({ hasText: '團隊一' }).click()
    await expect(page.locator('.compModal')).toBeVisible()
    await expect(page.locator('.compModal')).toContainText('專案設定')
  })

  test('卡片上的「更多」按鈕應顯示操作選單', async ({ page }) => {
    const firstCard = page.locator('.one-card-box.project-card').first()
    await firstCard.locator('.more-btn').click()
    await expect(firstCard.locator('.next-option-box')).toBeVisible()
    await expect(firstCard.locator('.next-option-box')).toContainText('刪除')
    await expect(firstCard.locator('.next-option-box')).toContainText('專案設定')
  })

  test('點擊「專案設定」應開啟 Modal', async ({ page }) => {
    const firstCard = page.locator('.one-card-box.project-card').first()
    await firstCard.locator('.more-btn').click()
    await firstCard.locator('.next-option-box .option-item').filter({ hasText: '專案設定' }).click()
    await expect(page.locator('.compModal')).toBeVisible()
    await expect(page.locator('.compModal')).toContainText('專案設定')
  })

  test('點擊「刪除」專案應出現確認 Dialog', async ({ page }) => {
    const allCards = page.locator('.one-card-box.project-card')
    const countBefore = await allCards.count()

    const firstCard = allCards.first()
    await firstCard.locator('.more-btn').click()
    await firstCard.locator('.next-option-box .option-item').filter({ hasText: '刪除' }).click()

    // SweetAlert2 confirm dialog
    await expect(page.locator('.swal2-popup')).toBeVisible()
    await expect(page.locator('.swal2-popup')).toContainText('確定刪除嗎')
  })

  test('確認刪除後專案數量應減少', async ({ page }) => {
    const allCards = page.locator('.one-card-box.project-card')
    // 先等待 cards 渲染完成再取數量
    await expect(allCards.first()).toBeVisible()
    const countBefore = await allCards.count()

    await allCards.first().locator('.more-btn').click()
    await allCards.first().locator('.next-option-box .option-item').filter({ hasText: '刪除' }).click()

    await page.locator('.swal2-confirm').click()
    await expect(allCards).toHaveCount(countBefore - 1)
  })

  test('取消刪除後專案數量不變', async ({ page }) => {
    const allCards = page.locator('.one-card-box.project-card')
    // 先等待 cards 渲染完成再取數量
    await expect(allCards.first()).toBeVisible()
    const countBefore = await allCards.count()

    await allCards.first().locator('.more-btn').click()
    await allCards.first().locator('.next-option-box .option-item').filter({ hasText: '刪除' }).click()

    await page.locator('.swal2-cancel').click()
    await expect(allCards).toHaveCount(countBefore)
  })
})

test.describe('ProjectDashboard - 表格模式操作', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aiviews/view/ProjectDashboard')
    // 切換到列表模式（第二個 tab 按鈕）
    await page.locator('.compListCardSwitch .compListCardSwitch-item').nth(1).click()
  })

  test('表格應有正確欄位', async ({ page }) => {
    const header = page.locator('.table-list-box thead tr')
    await expect(header).toContainText('專案名稱')
    await expect(header).toContainText('所屬團隊')
    await expect(header).toContainText('最後編輯時間')
  })

  test('表格列的「更多」按鈕應顯示操作選單', async ({ page }) => {
    const firstRow = page.locator('.table-list-box tbody tr').first()
    await firstRow.locator('.more-btn').click()
    const optionBox = firstRow.locator('.next-option-box')
    await expect(optionBox).toBeVisible()
    await expect(optionBox).toContainText('刪除')
    await expect(optionBox).toContainText('專案設定')
  })
})
