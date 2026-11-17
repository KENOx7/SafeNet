import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { getCases } from '../src/game/scenarios.ts'
import { lessonFor, unlocked } from '../src/game/guide.ts'
import { toolNames } from '../src/game/rules.ts'
import { proofFor } from '../src/game/proofs.ts'

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true })
const next = (page: Page, last = false) => button(page, last ? 'Nəticələrə bax' : 'Növbəti məktub')

test('the game fills its viewport and fullscreen can be toggled in play', async ({ page }) => {
  await page.goto('/?app=trust')
  const app = page.locator('.app')
  const viewport = page.viewportSize()!
  await expect(app).toHaveCSS('height', (viewport.height - 74) + 'px', { timeout: 20_000 })
  await expect(page.locator('.footer')).toHaveCount(0)
  await button(page, 'Tam ekran').click()
  await expect(button(page, 'Tam ekrandan çıx')).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.fullscreenElement?.className)).toBe('app')

  await button(page, 'Oyuna başla').click()
  await button(page, 'Məktubu aç').click()
  await expect(button(page, 'Təsdiqlə')).toBeVisible()
  await page.keyboard.press('f')
  await expect(button(page, 'Tam ekran')).toBeVisible()
  await expect(button(page, 'Təsdiqlə')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(viewport.height)
})

test('a restricted fullscreen request leaves the current letter playable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true, value: () => Promise.reject(new DOMException('Fullscreen denied')),
    })
  })
  await page.goto('/?app=trust')
  await button(page, 'Oyuna başla').click()
  await button(page, 'Tam ekran').click()
  await expect(page.getByText('Bu pəncərədə tam ekran açıla bilmir.')).toBeVisible()
  await button(page, 'Məktubu aç').click()
  await button(page, 'Təsdiqlə').click()
  await expect(page.getByRole('status').getByText('Afərin, düzgün qərardır!')).toBeVisible()
})

test('a child starts with one action and unlocks tools through practice', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?app=trust')
  await button(page, 'Oyuna başla').click()
  const mail = page.getByRole('region', { name: 'Cari məktub' })
  await expect(mail.getByRole('button')).toHaveCount(1)
  await button(page, 'Məktubu aç').click()
  await expect(mail.getByRole('button')).toHaveCount(1)
  await expect(button(page, 'Təsdiqlə')).toBeVisible()
  await expect(button(page, 'Blokla')).toHaveCount(0)
  await page.reload()
  await button(page, 'Təsdiqlə').click()
  await next(page).click()

  await expect(page.getByText('Yeni bacarıq · Ünvanı yoxla')).toBeVisible()
  await expect(button(page, 'Blokla')).toHaveCount(0)
  await expect(button(page, 'Kimliyi yoxla')).toHaveCount(0)
  await button(page, 'Domeni yoxla').click()
  await expect(page.locator('dd').getByText('oyu-support.example', { exact: true })).toBeVisible()
  await expect(page.locator('dd').getByText('oyu.example', { exact: true })).toBeVisible()
  await button(page, 'scholarship').click()
  await expect(page.getByRole('status').getByText(/@ işarəsindən/)).toBeVisible()
  await expect(button(page, 'Blokla')).toHaveCount(0)
  await button(page, 'oyu-support.example').click()
  await page.reload()
  await expect(page.locator('.proof-slot').getByText('oyu-support.example')).toBeVisible()
  await button(page, 'Blokla').click()
  await next(page).click()

  await expect(page.getByText('Yeni bacarıq · Kömək istə')).toBeVisible()
  await expect(button(page, 'Təsdiqlə')).toHaveCount(0)
  await page.getByRole('button', { name: /^Yoxlat/ }).click()
  await expect(page.getByText('2 haqqın qalıb')).toBeVisible()
  await expect(page.getByText('Məktəbin cavabı')).toBeVisible()
  await button(page, 'Blokla').click()
  await next(page).click()
  await expect(button(page, 'Kimliyi yoxla')).toBeVisible()
  await expect(button(page, 'Keçidi yoxla')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})

test('plays all shifts with classroom assessments and offline coaching', async ({ page }) => {
  const errors: Error[] = []
  page.on('pageerror', error => errors.push(error))
  await page.route('**/api/ai/coach', route => route.fulfill({ status: 503, json: { error: 'offline' } }))
  await page.goto('/?app=trust')
  await button(page, 'Səsi söndür').click()
  await page.getByText('Müəllimlər üçün', { exact: true }).click()
  await button(page, 'İlkin ölçmə ilə başla').click()

  for (const shift of [0, 1, 2, 3, 4]) {
    await button(page, 'Masaya keç').click()
    const cases = getCases(shift)
    for (const [index, entry] of cases.entries()) {
      if (entry.id === 'D1-01') await button(page, 'Məktubu aç').click()
      await expect(page.getByRole('heading', { name: entry.title, exact: true })).toBeVisible()

      const lesson = lessonFor(entry.id)
      if (lesson?.tool) await button(page, toolNames[lesson.tool]).click()
      if (entry.link && unlocked(shift, index).tools.includes('link')) {
        await button(page, 'Keçidi yoxla').click()
        await expect(page.locator('dd').getByText(entry.link, { exact: true })).toBeVisible()
        await expect(page).toHaveURL(/4173\/\?app=trust$/)
      }

      if (entry.id === 'D2-01') {
        await button(page, 'Söhbəti aç').click()
        await button(page, 'Rəsmi sorğu nömrəsi varmı?').click()
        await expect(page.getByText(entry.conversation![1])).toBeVisible()
      }

      if (entry.priority) {
        await expect(button(page, 'Blokla')).toHaveCount(0)
        await button(page, 'Domeni yoxla').click()
        await button(page, 'Kimliyi yoxla').click()
        await expect(page.getByText('Qərardan əvvəl üç ipucuna bax · 2 / 3')).toBeVisible()
        await button(page, 'Dəlilləri müqayisə et').click()
        await expect(button(page, 'Blokla')).toHaveCount(0)
      }

      const proof = proofFor(entry.id)
      if (proof) {
        for (const answer of proof.answers) await button(page, proof.options[answer]).click()
      }

      if (entry.needsVerification) {
        const verify = page.getByRole('button', { name: /^Yoxlat/ })
        const remaining = Number((await verify.locator('small').innerText()).split(' ')[0])
        await verify.click()
        await expect(page.getByText(entry.verification)).toBeVisible()
        await expect(page.getByRole('button', { name: /^Yoxlanıldı/ })).toBeDisabled()
        await expect(page.getByText((remaining - 1) + ' haqqın qalıb')).toBeVisible()
      }

      if (entry.id === 'D1-02') {
        await expect(page.locator('dd').getByText('oyu-support.example', { exact: true })).toBeVisible()
        await button(page, 'Təsdiqlə').click()
        await expect(page.getByRole('status').getByText('Bu sorğu riskli idi')).toBeVisible()
        await page.reload()
        await expect(page.getByRole('status').getByText('Bu sorğu riskli idi')).toBeVisible()
      } else if (entry.id === 'D1-04') {
        await button(page, 'Blokla').click()
        await expect(page.getByRole('status').getByText('Bu sorğu etibarlı idi')).toBeVisible()
      } else {
        await button(page, entry.verdict === 'approve' ? 'Təsdiqlə' : 'Blokla').click()
        if (shift >= 1 && shift <= 3) await expect(page.getByRole('status').getByText('Afərin, düzgün qərardır!')).toBeVisible()
      }
      await next(page, index === cases.length - 1).click()
    }

    if (shift === 1) {
      await page.getByText('Növbənin nəticələri', { exact: true }).click()
      await expect(page.getByText('Yanlış blok', { exact: true })).toBeVisible()
      await expect(page.locator('.dispatch').getByText('85', { exact: true })).toBeVisible()
    }
    if (shift < 4) await button(page, shift === 0 ? 'İlk növbəyə keç' : shift === 3 ? 'Son sınağa keç' : 'Növbəti növbə').click()
    if (shift === 1) await expect(page.getByText('Təqaüd bildirişinə görə bir neçə tələbə hesabı təhlükəsizlik baxışına alındı.')).toBeVisible()
  }

  await expect(page.getByRole('heading', { name: 'Üç növbənin nəticəsi' })).toBeVisible()
  await expect(page.getByText('0 faiz bəndi')).toBeVisible()
  await button(page, 'AI məşqçisinə müraciət et').click()
  await expect(page.getByRole('status').getByText(/AI məşqçisi əlçatan deyil/)).toBeVisible()
  await button(page, 'Sonluğu gör').click()
  await expect(page.getByRole('heading', { name: 'Səhərə qədər nəzarət' })).toBeVisible()

  page.once('dialog', dialog => dialog.accept())
  await button(page, 'Yenidən başla').click()
  await page.reload()
  await expect(button(page, 'Oyuna başla')).toBeVisible()
  await expect(button(page, 'Səsi aç')).toBeVisible()
  expect(errors).toEqual([])
})

test('the draggable envelope routes into both trays and scores once per letter', async ({ page }) => {
  await page.goto('/?app=trust')
  await button(page, 'Oyuna başla').click()
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()
  await canvas.scrollIntoViewIfNeeded()
  const original = await canvas.elementHandle()
  const box = (await canvas.boundingBox())!
  const point = (x: number, y: number): [number, number] => [box.x + x * box.width / 980, box.y + y * box.height / 180]
  await expect.poll(async () => {
    await page.mouse.move(...point(490, 90))
    const cursor = await canvas.evaluate(element => (element as HTMLCanvasElement).style.cursor)
    if (cursor !== 'pointer') await page.mouse.move(...point(20, 20))
    return cursor
  }).toBe('pointer')
  await page.mouse.click(...point(490, 90))
  await expect(page.getByRole('heading', { name: getCases(1)[0].title })).toBeVisible()
  await page.mouse.down()
  await page.mouse.move(...point(218, 90), { steps: 15 })
  await page.mouse.up()
  await expect(page.getByRole('status').getByText('Afərin, düzgün qərardır!')).toBeVisible()
  await next(page).click()
  await button(page, 'Domeni yoxla').click()
  await button(page, 'oyu-support.example').dragTo(page.locator('.proof-slot'))
  await expect(button(page, 'Blokla')).toBeVisible()
  await page.mouse.move(...point(490, 90))
  await page.mouse.down()
  await page.mouse.move(...point(762, 90), { steps: 15 })
  await page.mouse.up()
  await expect(page.getByRole('status').getByText('+125 XP · 2 ardıcıl düzgün qərar')).toBeVisible()
  await page.mouse.click(...point(762, 90))
  const count = await page.evaluate(() => JSON.parse(localStorage.getItem('trust-please-v2')!).state.decisions.length)
  expect(count).toBe(2)
  expect(await canvas.evaluate((element, before) => element === before, original)).toBe(true)
})
