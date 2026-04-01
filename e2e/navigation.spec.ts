import { test, expect } from '@playwright/test'

test.describe('AppMenuTree 側邊導覽', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aiviews/view/ProjectDashboard')
  })

  test('應顯示使用者名稱', async ({ page }) => {
    await expect(page.locator('.user-name')).toContainText('Lucas.chien')
  })

  test('點擊使用者名稱應開啟使用者選單', async ({ page }) => {
    await page.locator('.user-name').click()
    await expect(page.locator('.more-userOption-box')).toBeVisible()
    await expect(page.locator('.more-userOption-box')).toContainText('個人設定')
    await expect(page.locator('.more-userOption-box')).toContainText('登出')
  })

  test('點擊頁面其他區域應關閉使用者選單', async ({ page }) => {
    await page.locator('.user-name').click()
    await expect(page.locator('.more-userOption-box')).toBeVisible()
    await page.locator('.AppMenuTree .menu-footer').click()
    await expect(page.locator('.more-userOption-box')).toBeHidden()
  })

  test('應顯示通用搜尋欄位', async ({ page }) => {
    await expect(page.locator('.universal-search-box input')).toBeVisible()
  })

  test('輸入搜尋關鍵字應顯示清除按鈕', async ({ page }) => {
    const searchInput = page.locator('.universal-search-box input')
    await searchInput.fill('test')
    await expect(page.locator('.universal-search-box .clear-btn')).toBeVisible()
  })

  test('清除搜尋關鍵字後清除按鈕應消失', async ({ page }) => {
    const searchInput = page.locator('.universal-search-box input')
    await searchInput.fill('test')
    await page.locator('.universal-search-box .clear-btn').click()
    await expect(page.locator('.universal-search-box .clear-btn')).toBeHidden()
    await expect(searchInput).toHaveValue('')
  })

  test('點擊「最近使用」應導覽至 ProjectDashboard', async ({ page }) => {
    await page.goto('/aiviews/view/TeamProject?teamId=testTeam1&teamName=團隊一')
    await page.getByRole('link', { name: '最近使用' }).click()
    await expect(page).toHaveURL(/\/view\/ProjectDashboard/)
  })

  test('側邊欄應有企業選擇下拉', async ({ page }) => {
    const select = page.locator('.company-box select')
    await expect(select).toBeVisible()
    await expect(select.locator('option[value="企業A"]')).toBeAttached()
    await expect(select.locator('option[value="企業B"]')).toBeAttached()
  })

  test('點擊「企業/團隊設定」應導覽至 CompanyTeamSettings', async ({ page }) => {
    await page.getByRole('link', { name: '企業/團隊設定' }).click()
    await expect(page).toHaveURL(/\/view\/CompanyTeamSettings/)
  })

  test('點擊團隊名稱應展開/收合團隊選單', async ({ page }) => {
    const firstGroup = page.locator('.one-group-box').first()
    const groupNameBox = firstGroup.locator('.group-name-box')
    const groupBtnBox = firstGroup.locator('.group-btn-box')

    // 預設收合，點擊展開
    await groupNameBox.click()
    await expect(groupBtnBox).toBeVisible()

    // 再點擊收合
    await groupNameBox.click()
    await expect(groupBtnBox).toBeHidden()
  })

  test('展開後應顯示團隊專案、共享資源庫、權限管理連結', async ({ page }) => {
    const firstGroup = page.locator('.one-group-box').first()
    // 先展開
    await firstGroup.locator('.group-name-box').click()
    await expect(firstGroup.getByRole('link', { name: '團隊專案' })).toBeVisible()
    await expect(firstGroup.getByRole('link', { name: '共享資源庫' })).toBeVisible()
    await expect(firstGroup.getByRole('link', { name: '權限管理' })).toBeVisible()
  })

  test('點擊「團隊專案」應導覽至 TeamProject 並帶入 teamId', async ({ page }) => {
    const firstGroup = page.locator('.one-group-box').first()
    // 先展開
    await firstGroup.locator('.group-name-box').click()
    await firstGroup.getByRole('link', { name: '團隊專案' }).click()
    await expect(page).toHaveURL(/\/view\/TeamProject\?teamId=/)
  })
})
