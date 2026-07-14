import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5199' });

test('AI thinking chain smoke test', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto('http://localhost:5199/justagent/aiviewer');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/tc-01-initial.png' });

  // Find any input to send a message
  const textareas = await page.locator('textarea').count();
  const inputs = await page.locator('input[type="text"]').count();
  console.log('textareas:', textareas, 'text inputs:', inputs);

  // Try conv1 overlay input
  const overlayInputs = page.locator('.conv1-input-wrap textarea, .msg-input-wrap textarea, .ai-input-area textarea, textarea');
  const inputEl = overlayInputs.first();
  if (await inputEl.isVisible()) {
    await inputEl.fill('分析 Hurricane Trailsetter 行銷策略');
    await page.screenshot({ path: '/tmp/tc-02-typed.png' });
    await inputEl.press('Enter');
  } else {
    // try clicking a quick start button
    const quickBtn = page.locator('.conv1-quick-btn, .quick-start-btn, button:has-text("行銷策略")').first();
    if (await quickBtn.isVisible()) await quickBtn.click();
  }

  // Capture thinking state
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/tc-03-thinking.png' });

  // Check for ThinkingChainCard
  const thinkingCard = await page.locator('.thinking-chain-card').count();
  console.log('ThinkingChainCard visible:', thinkingCard);

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/tc-04-thinking-steps.png' });

  // Wait for response
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/tc-05-response.png' });

  // Check for toggle and source chips
  const toggle = await page.locator('.thinking-chain-toggle').count();
  const chips = await page.locator('.source-chip').count();
  console.log('thinking-chain-toggle:', toggle, 'source-chip:', chips);

  if (chips > 0) {
    await page.locator('.source-chip').first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/tc-06-drawer.png' });
    const drawerVisible = await page.locator('.knowledge-drawer.open').isVisible().catch(() => false);
    const chunkCount = await page.locator('.drawer-chunk-item').count();
    console.log('Drawer open:', drawerVisible, 'Chunks:', chunkCount);
    await page.locator('.knowledge-drawer-overlay').click().catch(() => {});
    await page.waitForTimeout(300);
  }

  await page.screenshot({ path: '/tmp/tc-07-final.png' });
});
