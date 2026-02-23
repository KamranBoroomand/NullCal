import { expect, test } from '@playwright/test';

const findA11yIssues = () => {
  const controls = Array.from(document.querySelectorAll('input, select, textarea, button'));
  const issues: string[] = [];

  const hasName = (value: string | null | undefined) => Boolean(value && value.trim().length > 0);

  controls.forEach((control) => {
    const element = control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement;
    if (element instanceof HTMLInputElement && element.type === 'hidden') {
      return;
    }
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return;
    }
    if (element.hasAttribute('disabled')) {
      return;
    }
    const id = element.getAttribute('id');
    const withFor = id ? document.querySelector(`label[for="${id}"]`) : null;
    const wrappedByLabel = element.closest('label');
    const labelFromAria = element.getAttribute('aria-label');
    const labelledById = element.getAttribute('aria-labelledby');
    const labelledBy =
      labelledById && document.getElementById(labelledById) ? document.getElementById(labelledById)?.textContent : null;
    const placeholder =
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
        ? element.getAttribute('placeholder')
        : null;
    const title = element.getAttribute('title');
    const textContent = element.textContent;

    const hasAccessibleName =
      hasName(withFor?.textContent) ||
      Boolean(wrappedByLabel && hasName(wrappedByLabel.textContent)) ||
      hasName(labelFromAria) ||
      hasName(labelledBy) ||
      hasName(placeholder) ||
      hasName(title) ||
      (element instanceof HTMLButtonElement && hasName(textContent));

    if (!hasAccessibleName) {
      const snippet = element.outerHTML.replace(/\s+/g, ' ').slice(0, 160);
      issues.push(`${element.tagName.toLowerCase()} missing accessible name: ${snippet}`);
    }
  });

  const main = document.querySelector('main');
  if (!main) {
    issues.push('missing <main> landmark');
  }

  return issues;
};

test.describe('Accessibility checks', () => {
  test('home route controls are labeled', async ({ page }) => {
    await page.goto('/home');
    await page.waitForSelector('main, [role="main"]');
    const issues = await page.evaluate(findA11yIssues);
    expect(issues).toEqual([]);
  });

  test('safety route controls are labeled', async ({ page }) => {
    await page.goto('/safety');
    await page.waitForSelector('main, [role="main"]');
    const issues = await page.evaluate(findA11yIssues);
    expect(issues).toEqual([]);
  });
});
