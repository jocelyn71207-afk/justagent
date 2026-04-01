import { test, expect } from '@playwright/test'

test.describe('AppEntrance 入口頁', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/aiviews/')
  })

  test('應顯示入口頁內容', async ({ page }) => {
    await expect(page.locator('.AppEntrance')).toBeVisible()
    await expect(page.locator('.AppEntrance')).toContainText('AppEntrance')
  })

  test('點擊 ProjectDashboard 連結應導覽至 /view/ProjectDashboard', async ({ page }) => {
    await page.getByRole('link', { name: 'ProjectDashboard' }).click()
    await expect(page).toHaveURL(/\/view\/ProjectDashboard/)
  })
})
