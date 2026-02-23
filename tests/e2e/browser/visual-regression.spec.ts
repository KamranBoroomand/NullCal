import { expect, test } from '@playwright/test';

const disableMotion = `
*,
*::before,
*::after {
  animation: none !important;
  transition: none !important;
}
`;

test.describe('Visual regression snapshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addStyleTag({ content: disableMotion });
  });

  test('home page visual baseline', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    });
  });

  test('about page visual baseline', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveScreenshot('about-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02
    });
  });
});
