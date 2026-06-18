import { expect, test } from '@playwright/test';

/**
 * Main flow: load → play → advance → resume.
 *
 * The CDN is stubbed so the test is deterministic and offline: a 3-row index
 * and a tiny silent MP3 for any audio request.
 */
const CSV = [
  'numero,archivo,texto',
  '1,0001.wav,Hello there',
  '2,0002.wav,Second phrase',
  '3,0003.wav,Third one',
].join('\n');

// Minimal silent MP3 frame (enough for the <audio> element to accept it).
const SILENT_MP3 = Buffer.from(
  'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAAAAAA',
  'base64',
);

test.beforeEach(async ({ page }) => {
  await page.route('**/index.csv', (route) =>
    route.fulfill({ status: 200, contentType: 'text/csv', body: CSV }),
  );
  await page.route('**/audios/**', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/mpeg', body: SILENT_MP3 }),
  );
});

test('load → play → advance → resume', async ({ page }) => {
  await page.goto('/');

  // Loaded: first phrase and counter visible.
  await expect(page.getByText('Hello there')).toBeVisible();
  await expect(page.getByText(/Frase\s+1\s*\/\s*3/)).toBeVisible();

  // Advance to the second phrase.
  await page.getByRole('button', { name: 'Siguiente' }).first().click();
  await expect(page.getByText('Second phrase')).toBeVisible();
  await expect(page.getByText(/Frase\s+2\s*\/\s*3/)).toBeVisible();

  // Reload resumes where we left off.
  await page.reload();
  await expect(page.getByText('Second phrase')).toBeVisible();
  await expect(page.getByText(/Frase\s+2\s*\/\s*3/)).toBeVisible();
});
