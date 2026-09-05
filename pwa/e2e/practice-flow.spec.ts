import { expect, test } from '@playwright/test';

/**
 * Main flow: load → play → advance → resume, plus switching lists.
 *
 * The CDN is stubbed so the test is deterministic and offline: a 3-row index
 * for Home, a 2-row one for Commons and a tiny silent MP3 for any audio.
 */
const CSV = [
  'numero,archivo,texto',
  '1,0001.wav,Hello there',
  '2,0002.wav,Second phrase',
  '3,0003.wav,Third one',
].join('\n');

const COMMONS_CSV = [
  'numero,archivo,en,es',
  '1,0001.mp3,Common first,Común primera',
  '2,0002.mp3,Common second,Común segunda',
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
  await page.route('**/commons.csv', (route) =>
    route.fulfill({ status: 200, contentType: 'text/csv', body: COMMONS_CSV }),
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

test('cambiar de lista desde el menú y volver donde se estaba', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Hello there')).toBeVisible();
  await page.getByRole('button', { name: 'Siguiente' }).first().click();
  await expect(page.getByText('Second phrase')).toBeVisible();

  // Menú de listas → Commons: misma pantalla, otras frases.
  await page.getByRole('button', { name: 'Listas' }).click();
  await page.getByRole('button', { name: 'Commons' }).click();
  await expect(page.getByText('Common first')).toBeVisible();
  await expect(page.getByText('Común primera')).toBeVisible();
  await expect(page.getByText(/Frase\s+1\s*\/\s*2/)).toBeVisible();

  // Al recargar se abre en Commons.
  await page.reload();
  await expect(page.getByText('Common first')).toBeVisible();

  // Volver a Home retoma la frase en la que se dejó.
  await page.getByRole('button', { name: 'Listas' }).click();
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByText('Second phrase')).toBeVisible();
  await expect(page.getByText(/Frase\s+2\s*\/\s*3/)).toBeVisible();
});
