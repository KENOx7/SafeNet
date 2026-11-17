import { expect, test } from '@playwright/test'
import { visitors } from '../src/junior/cases.ts'

test('starts Junior from the PC and completes all twelve visitors with real totals', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Kiber Qalxan Junior aç', exact: true }).click()
  await page.getByRole('button', { name: 'Növbəyə başla', exact: true }).click()
  for (const [day, cases] of visitors.entries()) {
    await page.getByRole('button', { name: 'Postu aç', exact: true }).click()
    for (const [index, entry] of cases.entries()) {
      const canvas = page.locator('.jun-visitor-scene canvas')
      await expect(canvas).toBeVisible({ timeout: 15000 })
      await expect.poll(() => canvas.evaluate(element => Math.abs((element as HTMLCanvasElement).width - element.parentElement!.clientWidth))).toBeLessThanOrEqual(1)
      await expect(page.getByRole('button', { name: /^Təhlükəsiz/ })).toBeVisible()
      await expect(page.getByRole('button', { name: /Karta bax|Mesajı aç/ })).toHaveCount(0)
      await expect(page.getByRole('blockquote', { name: entry.message, exact: true })).toBeVisible()
      if (day === 0 && index === 1) {
        await page.getByRole('button', { name: 'PC masaüstünə qayıt' }).click()
        await page.getByRole('button', { name: 'Kiber Qalxan Junior', exact: true }).click()
        await expect(page.getByRole('blockquote', { name: entry.message, exact: true })).toBeVisible()
        await page.reload()
        await expect(page.getByRole('blockquote', { name: entry.message, exact: true })).toBeVisible()
      }
      if (day === 1 && index === 0) {
        await page.getByRole('button', { name: 'Qayda kitabçası', exact: true }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expect(page.getByRole('dialog').getByText('Şifrə və giriş kodu', { exact: true })).toBeVisible()
        await expect(page.getByRole('dialog').getByText('Yeni hesabı yoxla', { exact: true })).toHaveCount(0)
        await page.keyboard.press('Escape')
      }
      await page.getByRole('button', { name: entry.clue, exact: true }).click()
      await expect(page.getByText('✓ İpucu işarələndi', { exact: true })).toBeVisible()
      await page.getByRole('button', { name: entry.safe ? /^Təhlükəsiz/ : /^Blokla/ }).click()
      await expect(page.getByRole('status').getByText('Düzgün qərardır!')).toBeVisible()
      await expect.poll(() => canvas.evaluate(element => Math.abs((element as HTMLCanvasElement).width - element.parentElement!.clientWidth))).toBeLessThanOrEqual(1)
      await expect(page.getByRole('button', { name: /^Təhlükəsiz/ })).toHaveCount(0)
      if (entry.replies && entry.reply !== undefined) {
        await expect(page.locator('.jun-reply button').first()).toBeFocused()
        await expect(page.getByRole('button', { name: 'Günün hesabatı', exact: true })).toBeDisabled()
        const wrong = (entry.reply + 1) % 3
        await page.getByRole('button', { name: entry.replies[wrong], exact: true }).click()
        await expect(page.getByRole('alert')).toBeVisible()
        await page.getByRole('button', { name: entry.replies[entry.reply], exact: true }).click()
        await expect(page.getByText('✓ Təhlükəsiz cavabı seçdin.', { exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Günün hesabatı', exact: true })).toBeFocused()
      }
      await page.getByRole('button', { name: index === cases.length - 1 ? 'Günün hesabatı' : 'Növbəti qonaq', exact: true }).click()
    }
    await expect(page.getByRole('heading', { name: 'Mükəmməl növbə!' })).toBeVisible()
    const report = page.locator('.jun-result-grid')
    await expect(report.getByText('40/40', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: day === 2 ? 'Yekun nəticə' : (day + 2) + '-ci günə keç', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'Kiber qəhrəman!' })).toBeVisible()
  await expect(page.locator('.jun-result-grid').getByText('120/120', { exact: true })).toBeVisible()
  await expect(page.locator('.jun-result-grid').getByText('60', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Yenidən oyna', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Növbəyə başla', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('three mistakes stop the post and retry restores the current day', async ({ page }) => {
  await page.goto('/?app=junior')
  await page.getByRole('button', { name: 'Növbəyə başla', exact: true }).click()
  await page.getByRole('button', { name: 'Postu aç', exact: true }).click()
  for (const [index, entry] of visitors[0].slice(0, 3).entries()) {
    await page.getByRole('button', { name: entry.safe ? /^Blokla/ : /^Təhlükəsiz/ }).click()
    await page.getByRole('button', { name: index === 2 ? 'Növbənin nəticəsi' : 'Növbəti qonaq', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'Qalxanı birlikdə bərpa edək.' })).toBeVisible()
  await expect(page.getByRole('button', { name: /2-ci günə keç/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Bu günü yenidən oyna', exact: true }).click()
  await page.getByRole('button', { name: 'Postu aç', exact: true }).click()
  await expect(page.getByRole('img', { name: '3 qalxan qalıb' })).toBeVisible()
  await expect(page.locator('.jun-id').getByText('GamerAli', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('oyu-junior-v1')!).state.decisions.length)).toBe(0)
})


for (const [width, height] of [[1024, 600], [1366, 635], [1366, 768], [1920, 1080]]) {
  test('documents and reply challenge fit without scroll at ' + width + 'x' + height, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/?app=junior')
    // Resume the longest case through the same persisted-save boundary used by the game.
    await page.evaluate(() => localStorage.setItem('oyu-junior-v1', JSON.stringify({ version: 1, state: {
      phase: 'playing', day: 2, index: 3, decisions: [], pending: null, clueFound: false,
    } })))
    await page.reload()
    const entry = visitors[2][3]
    await expect(page.getByRole('blockquote', { name: entry.message })).toBeVisible()
    await expect(page.getByRole('button', { name: /Karta bax|Mesajı aç/ })).toHaveCount(0)
    const layout = await page.evaluate(() => {
      const hero = document.querySelector('.jun-booth')!.getBoundingClientRect()
      const documents = document.querySelector('.jun-documents')!.getBoundingClientRect()
      const actions = document.querySelector('.jun-actions')!.getBoundingClientRect()
      const card = document.querySelector('.jun-id')!.getBoundingClientRect()
      const message = document.querySelector('.jun-message')!.getBoundingClientRect()
      return { heroBottom: hero.bottom, documentsTop: documents.top, documentsBottom: documents.bottom,
        actionsTop: actions.top, cardRight: card.right, messageLeft: message.left }
    })
    expect(layout.heroBottom).toBeLessThan(layout.documentsTop)
    expect(layout.documentsBottom).toBeLessThan(layout.actionsTop)
    expect(layout.cardRight).toBeLessThan(layout.messageLeft)
    await page.getByRole('button', { name: /^Blokla/ }).click()
    await page.getByRole('button', { name: entry.replies![0], exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    const bounds = await page.locator('.junior-game,.jun-workspace,.jun-documents,.jun-feedback').evaluateAll(elements => elements.map(element => ({
      width: element.clientWidth, scrollWidth: element.scrollWidth, height: element.clientHeight, scrollHeight: element.scrollHeight,
    })))
    for (const bound of bounds) {
      expect(bound.scrollWidth).toBeLessThanOrEqual(bound.width + 1)
      expect(bound.scrollHeight).toBeLessThanOrEqual(bound.height + 1)
    }
    await expect(page.getByRole('button', { name: 'Günün hesabatı', exact: true })).toBeInViewport({ ratio: 1 })
    await page.getByRole('button', { name: entry.replies![entry.reply!], exact: true }).click()
    await page.reload()
    await expect(page.getByText('✓ Təhlükəsiz cavabı seçdin.', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Günün hesabatı', exact: true })).toBeEnabled()
  })
}


test('mute preference survives reload and starting a new run', async ({ page }) => {
  await page.goto('/?app=junior')
  await page.getByLabel('Junior ayarları', { exact: true }).click()
  await page.getByRole('button', { name: 'Səsi söndür', exact: true }).click()
  await page.reload()
  await page.getByLabel('Junior ayarları', { exact: true }).click()
  await expect(page.getByRole('button', { name: 'Səsi aç', exact: true })).toBeVisible()
  await page.getByLabel('Junior ayarları', { exact: true }).click()
  await page.getByRole('button', { name: 'Növbəyə başla', exact: true }).click()
  await page.getByLabel('Junior ayarları', { exact: true }).click()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Yenidən başla', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Növbəyə başla', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Səsi aç', exact: true })).toBeVisible()
})

test('wrong approvals are marked as mistakes and a later-day retry preserves completed days', async ({ page }) => {
  await page.goto('/?app=junior')
  await page.getByRole('button', { name: 'Növbəyə başla', exact: true }).click()
  await page.getByRole('button', { name: 'Postu aç', exact: true }).click()
  for (const [index, visitor] of visitors[0].entries()) {
    await page.getByRole('button', { name: index === 1 ? 'Təhlükəsiz' : visitor.safe ? 'Təhlükəsiz' : 'Blokla', exact: true }).click()
    if (index === 1) {
      await expect(page.locator('.jun-stamp')).toHaveText('YENİDƏN BAX')
      await expect(page.getByRole('img', { name: '2 qalxan qalıb', exact: true })).toBeVisible()
    }
    if (visitor.replies) await page.getByRole('button', { name: visitor.replies[visitor.reply!], exact: true }).click()
    await page.getByRole('button', { name: index === 3 ? 'Günün hesabatı' : 'Növbəti qonaq', exact: true }).click()
  }
  await expect(page.locator('.jun-result-grid').getByText('30/40', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '2-ci günə keç', exact: true }).click()
  await page.getByRole('button', { name: 'Postu aç', exact: true }).click()
  for (const [index, visitor] of visitors[1].slice(0, 2).entries()) {
    await page.getByRole('button', { name: visitor.safe ? 'Blokla' : 'Təhlükəsiz', exact: true }).click()
    await page.getByRole('button', { name: index === 1 ? 'Növbənin nəticəsi' : 'Növbəti qonaq', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: 'Qalxanı birlikdə bərpa edək.', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: /3-cü günə keç/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Bu günü yenidən oyna', exact: true }).click()
  await page.getByRole('button', { name: 'Postu aç', exact: true }).click()
  await expect(page.locator('.jun-id-person strong')).toHaveText('SwordMaster')
  await expect(page.locator('.jun-score b')).toHaveText('30')
  await expect(page.getByRole('img', { name: '2 qalxan qalıb', exact: true })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('oyu-junior-v1')!).state.decisions.length)).toBe(4)
})
