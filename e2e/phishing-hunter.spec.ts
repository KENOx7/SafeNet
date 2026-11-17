import { expect, test } from '@playwright/test'

test('opens from the desktop, teaches two lessons and finishes all ten letters with coaching', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  let mailRequests = 0
  await page.route('**/api/ai/shield-mail', async route => {
    expect(route.request().postDataJSON()).toEqual({})
    const greeting = ++mailRequests === 1 ? 'Hamınıza salam!' : 'Yenidən xoş gördük!'
    await route.fulfill({ json: { greetings: Array.from({ length: 10 }, () => greeting) } })
  })
  await page.route('**/api/ai/shield', async route => {
    expect(route.request().postDataJSON()).toEqual({ round: 0, correct: true })
    await route.fulfill({ json: { tip: 'Şübhəli məktubu etibar etdiyin böyüyə göstər.' } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Fişinq Ovçusu aç', exact: true }).click()
  const game = page.frameLocator('iframe[title="Fişinq Ovçusu"]')
  await game.locator('#soundBtn').click()
  await expect(game.locator('#soundBtn')).toHaveAttribute('aria-pressed', 'true')
  await game.locator('#startBtn').click()
  for (let i = 0; i < 2; i++) {
    await expect(game.locator('#tNext')).toBeDisabled()
    for (const clue of await game.locator('#tMail .hot').all()) await clue.click()
    await game.locator('#tNext').click()
  }
  for (const choice of ['#qPhish', '#qPhish', '#qPhish']) {
    await game.locator(choice).click()
    await expect(game.locator('#qFb')).toBeVisible()
    await game.locator('#qNext').click()
  }
  await expect(game.locator('#qFb')).toContainText('2/3')
  await game.locator('#qNext').click()
  await expect(game.locator('#mailSource')).toHaveText('AI variantı')
  await expect(game.locator('#mail .gm-body p').first()).toHaveText('Hamınıza salam!')
  const phishing = [true, false, false, true, false, true, true, false, true, false]
  for (const [index, isPhishing] of phishing.entries()) {
    await expect(game.locator('#lvlText')).toContainText((index + 1) + '/10')
    await expect(game.locator('#mail a')).toHaveCount(0)
    if (index === 0) {
      await game.locator('#hintBtn').click()
      await expect(game.locator('#hintBox')).toBeVisible()
      await expect(game.locator('#hintBtn')).toBeDisabled()
    }
    const decision = game.locator(isPhishing ? '#phishBtn' : '#safeBtn')
    await decision.click()
    await decision.dispatchEvent('click')
    await expect(game.locator('#score')).toHaveText(String((index + 1) * 100))
    if (index === 0) {
      await game.locator('#liveCoachBtn').click()
      await expect(game.locator('#liveCoachTip')).toContainText('Grok:')
      await expect(game.locator('#liveCoachBtn')).toBeDisabled()
    }
    await game.locator('#nextBtn').click()
  }
  await expect(game.locator('#finalScore')).toHaveText('1000')
  await expect(game.locator('#finalCorrect')).toHaveText('10 / 10')
  await game.locator('#againBtn').click()
  await expect(game.locator('#score')).toHaveText('0')
  await expect(game.locator('#mail .gm-body p').first()).toHaveText('Yenidən xoş gördük!')
  expect(mailRequests).toBe(2)
  expect(errors).toEqual([])
})

test('lesson skip and offline coaching work, and losing all three hearts ends the run', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/api/ai/shield', route => route.abort())
  await page.route('**/api/ai/shield-mail', route => route.abort())
  await page.goto('/?app=phishing-hunter')
  const game = page.frameLocator('iframe[title="Fişinq Ovçusu"]')
  await game.locator('#startBtn').click()
  await game.locator('#tSkip').click()
  await expect(game.locator('#mailSource')).toHaveText('Hazır variant')
  expect(await game.locator('body').evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(390)
  for (const [index, choice] of ['#safeBtn', '#phishBtn', '#phishBtn'].entries()) {
    await game.locator(choice).click()
    await expect(game.locator('#modal .pill')).toHaveText('−1 can')
    if (index === 0) {
      await game.locator('#liveCoachBtn').click()
      await expect(game.locator('#liveCoachTip')).toContainText('Oyundakı ipucu')
    }
    await game.locator('#nextBtn').click()
  }
  await expect(game.locator('#endTitle')).toHaveText('Canların bitdi!')
  await expect(game.locator('#finalCorrect')).toHaveText('0 / 3')
})
