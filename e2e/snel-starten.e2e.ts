import { test, expect } from '@playwright/test';

test('Snel Starten toont een zin in de trainer', async ({ page }) => {
  await page.goto('/');

  // Beginscherm
  await expect(page.getByRole('heading', { name: 'Ontleedlab' })).toBeVisible();
  await page.getByRole('button', { name: /Snel Starten/ }).click();

  // Zonder opgeslagen naam vraagt de app eerst wie je bent.
  await expect(page.getByRole('heading', { name: 'Wie ben jij?' })).toBeVisible();
  await page.getByPlaceholder('bijv. Emma').fill('Test');
  await page.getByPlaceholder('V', { exact: true }).fill('T');
  await page.getByPlaceholder('bijv. 2ga').fill('2ga');
  await page.getByRole('button', { name: 'Klaar, laten we beginnen!' }).click();

  // Trainer: eerste zin van een sessie van 3.
  await expect(page.getByRole('heading', { name: 'Stap 1: Zinsdeelproef' })).toBeVisible();
  await expect(page.getByText(/Zin 1 \/ 3/i)).toBeVisible();
});
