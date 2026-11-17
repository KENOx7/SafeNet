import { expect, test } from '@playwright/test'
import { makeRounds, subjects } from '../src/real-ai/rounds.ts'
import type { Round, Variant } from '../src/real-ai/rounds.ts'

test('builds six unique topics with three variants of each kind', () => {
  for (let i = 0; i < 30; i++) {
    const deck = makeRounds()
    expect(new Set(deck.map(round => round.subject)).size).toBe(6)
    expect(deck.filter(round => round.variant === 'ai')).toHaveLength(3)
    expect(deck.filter(round => round.variant === 'normal')).toHaveLength(3)
  }
})

test('plays all six rounds from SafeNet, including drag, keyboard, wrong answers and replay', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:4173/') ? route.continue() : route.abort())
  await page.goto('/')
  await page.getByRole('button', { name: 'Real yoxsa AI? aç', exact: true }).click()
  await page.getByRole('button', { name: 'Səsi aç', exact: true }).click()
  await page.getByRole('button', { name: 'Oyuna başla', exact: true }).click()

  const art = page.locator('.rai-art img')
  const filenames = Object.keys(subjects).flatMap(key => ['normal', 'ai'].map(variant => key + '_' + variant + '.png'))
  expect(await page.evaluate(async files => Promise.all(files.map(async file => {
    const img = new Image()
    img.src = '/real-ai/cases/' + file
    await img.decode()
    return img.naturalWidth
  })), filenames)).toEqual(Array(12).fill(1024))

  const rounds: Round[] = await page.evaluate(() => JSON.parse(localStorage.getItem('oyu-real-ai-v1')!).state.rounds)
  let score = 0
  const missedVariants = new Set<Variant>()
  for (const [index, round] of rounds.entries()) {
    const subject = subjects[round.subject]
    await expect(art).toHaveAttribute('src', '/real-ai/cases/' + round.subject + '_' + round.variant + '.png')
    await expect(art).toHaveJSProperty('naturalWidth', 1024)
    await expect(page.locator('.rai-detail-focus')).toHaveCount(0)
    if (index === 0) {
      const rules = page.getByRole('button', { name: 'Qaydalar', exact: true })
      await rules.click()
      await page.keyboard.press('ArrowLeft')
      await expect(page.getByRole('dialog')).toBeVisible()
      await expect(page.locator('.rai-feedback')).toHaveCount(0)
      await page.keyboard.press('Escape')
      await page.getByRole('button', { name: 'İpucu göstər', exact: true }).click()
      await expect(page.getByText(subject.hint, { exact: true })).toBeVisible()
    }
    const guess: Variant = missedVariants.has(round.variant) ? round.variant : round.variant === 'ai' ? 'normal' : 'ai'
    if (index === 0) {
      const rect = (await art.boundingBox())!
      const x = rect.x + rect.width / 2
      const y = rect.y + rect.height / 2
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x + 15, y)
      await page.mouse.up()
      await expect(page.locator('.rai-feedback')).toHaveCount(0)
      await page.mouse.move(x, y)
      await page.mouse.down()
      await page.mouse.move(x + (guess === 'ai' ? -90 : 90), y, { steps: 6 })
      await page.mouse.up()
    } else if (index === 1) {
      await page.keyboard.press(guess === 'ai' ? 'ArrowLeft' : 'ArrowRight')
    } else {
      await page.getByRole('button', { name: guess === 'ai' ? /AI Uyğunsuz/ : /Real Normal/ }).click()
    }
    if (guess === round.variant) score++
    else {
      missedVariants.add(round.variant)
      await expect(page.getByRole('status')).toContainText('Sənin seçimin')
      await expect(page.getByRole('status')).toContainText(subject.lesson)
    }
    await expect(page.locator('.rai-detail-focus')).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Düzgün seçim')
    await expect(page.getByRole('status')).toContainText(subject[round.variant])
    await expect(page.getByRole('status')).toContainText(guess === round.variant ? 'Düzgün bildin!' : 'Gəl, birlikdə baxaq')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.rai-score')).toHaveAttribute('aria-label', score + ' xal')
    if (index === 0) {
      await page.getByRole('button', { name: 'PC masaüstünə qayıt' }).click()
      await page.getByRole('button', { name: 'Real yoxsa AI?', exact: true }).click()
      await page.reload()
      await expect(page.locator('.rai-feedback')).toContainText(subject[round.variant])
      await expect(page.getByRole('button', { name: 'Səsi söndür', exact: true })).toBeVisible()
    }
    await page.getByRole('button', { name: index === 5 ? 'Nəticəyə bax' : 'Növbəti raund', exact: true }).click()
  }
  await expect(page.getByRole('heading', { name: '4/6 düzgün', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Yenidən oyna', exact: true }).click()
  await expect(page.getByText('Raund 1/6', { exact: true })).toBeVisible()
  await expect(page.locator('.rai-score')).toHaveAttribute('aria-label', '0 xal')
  await page.getByRole('button', { name: 'Qaydalar', exact: true }).click()
  await page.getByRole('button', { name: 'Yeni oyun başlat', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.rai-score')).toHaveAttribute('aria-label', '0 xal')
  expect(errors).toEqual([])
})

test('swipes on a touch screen', async ({ browser }, testInfo) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  try {
    await page.goto(new URL('/?app=real-ai', testInfo.project.use.baseURL).href)
    await page.getByRole('button', { name: 'Oyuna başla', exact: true }).tap()
    const rect = (await page.locator('.rai-art img').boundingBox())!
    const session = await page.context().newCDPSession(page)
    const x = Math.round(rect.x + rect.width / 2)
    const y = Math.round(rect.y + rect.height / 2)
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
    for (let step = 1; step <= 6; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + step * 14, y }] })
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect(page.getByRole('button', { name: 'Növbəti raund', exact: true })).toBeVisible()
    const answers = await page.evaluate(() => JSON.parse(localStorage.getItem('oyu-real-ai-v1')!).state.answers)
    expect(answers).toEqual(['normal'])
  } finally {
    await page.close()
  }
})

for (const [width, height] of [[1920, 1080], [1440, 900], [1366, 768], [390, 844]]) {
  test('fits the game at ' + width + '×' + height, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/?app=real-ai')
    await page.getByRole('button', { name: 'Oyuna başla', exact: true }).click()
    await expect(page.locator('.rai-photo')).toBeInViewport({ ratio: 1 })
    await expect(page.getByRole('button', { name: /Real Normal/ })).toBeInViewport({ ratio: 1 })
    const variant: Variant = await page.evaluate(() => JSON.parse(localStorage.getItem('oyu-real-ai-v1')!).state.rounds[0].variant)
    await page.getByRole('button', { name: variant === 'ai' ? /Real Normal/ : /AI Uyğunsuz/ }).click()
    await expect(page.locator('.rai-lesson')).toBeInViewport({ ratio: 1 })
    await expect(page.getByRole('button', { name: 'Növbəti raund', exact: true })).toBeInViewport({ ratio: 1 })
    const overflow = await page.locator('.rai-game').evaluate(element => ({
      x: element.scrollWidth - element.clientWidth,
      y: element.scrollHeight - element.clientHeight,
    }))
    expect(overflow.x).toBeLessThanOrEqual(1)
    if (width > 760) expect(overflow.y).toBeLessThanOrEqual(1)
  })
}
