import { expect, test } from '@playwright/test';

test.describe('Core calendar browser journeys', () => {
  test('create, edit, and delete an event in the calendar workspace', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('sidebar-new-event-button').click();
    await page.getByTestId('event-title-input').fill('Journey Event');

    for (let step = 0; step < 4; step += 1) {
      await page.getByTestId('event-wizard-next-button').click();
    }

    await page.getByTestId('event-wizard-finish-button').click();
    const createdEvent = page.getByTestId('calendar-event').filter({ hasText: 'Journey Event' }).first();
    await expect(createdEvent).toBeVisible();

    await createdEvent.click();
    await page.getByTestId('event-title-input').fill('Journey Event Updated');

    for (let step = 0; step < 4; step += 1) {
      await page.getByTestId('event-wizard-next-button').click();
    }

    await page.getByTestId('event-wizard-finish-button').click();
    const updatedEvent = page.getByTestId('calendar-event').filter({ hasText: 'Journey Event Updated' }).first();
    await expect(updatedEvent).toBeVisible();

    await updatedEvent.click();
    await page.getByTestId('event-delete-button').click();
    await expect(page.getByTestId('calendar-event').filter({ hasText: 'Journey Event Updated' })).toHaveCount(0);
  });

  test('create a new calendar topic from the sidebar', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('sidebar-new-topic-button').click();
    await page.getByTestId('calendar-topic-name-input').fill('Journey Topic');
    await page.getByTestId('calendar-topic-save-button').click();

    await expect(page.getByText('Journey Topic')).toBeVisible();
  });
});
