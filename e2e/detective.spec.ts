import { expect, test } from '@playwright/test'
import { levels } from '../src/detective/levels.ts'

test('launches from PC, protects all eight clues, saves progress and replays without duplicate scoring', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: 'Şəkil Detektivi aç', exact: true }).click()
  await page.getByRole('button', { name: 'Macəraya başla', exact: true }).click()
  for (const [index, level] of levels.entries()) {
    await expect(page.locator('.det-post-heading').getByText(level.title, { exact: true })).toBeVisible()
    await expect(page.locator('.det-scene > img')).toHaveJSProperty('naturalWidth', 768)
    await page.getByRole('button', { name: 'Paylaş', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('İki məlumatı da gizlət')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: 'Şəkildəki digər əşyaları yoxla', exact: true }).click({ position: { x: 25, y: 25 } })
    await expect(page.locator('.det-score b')).toHaveText(String(index * 20))
    const first = page.getByRole('button', { name: 'Araşdır: ' + level.clues[0].label, exact: true })
    await first.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Gizlədildi: ' + level.clues[0].label, exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Gizlədildi: ' + level.clues[0].label, exact: true }).dispatchEvent('click')
    await expect(page.locator('.det-score b')).toHaveText(String(index * 20 + 10))
    if (index === 0) {
      await page.reload()
      await expect(page.locator('.det-score b')).toHaveText('10')
      await expect(page.locator('.det-checklist .found')).toHaveCount(1)
      await page.getByRole('button', { name: 'Qaydalar', exact: true }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }
    await page.getByRole('button', { name: 'İpucu göstər', exact: true }).click()
    await expect(page.locator('.det-hint p')).toHaveText(level.hint)
    await page.getByRole('button', { name: 'Araşdır: ' + level.clues[1].label, exact: true }).click()
    await expect(page.locator('.det-checklist .found')).toHaveCount(2)
    await expect(page.locator('.det-score b')).toHaveText(String((index + 1) * 20))
    await page.getByRole('button', { name: 'Paylaş', exact: true }).click()
    await expect(page.getByRole('dialog')).toContainText('Əla iş, detektiv!')
    await page.getByRole('button', { name: index === 3 ? 'Nəticəyə bax' : 'Növbəti səviyyə', exact: true }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  await expect(page.getByRole('heading', { name: 'Bütün sirləri qorudun!', exact: true })).toBeVisible()
  await expect(page.locator('.det-result')).toContainText('80 xal')
  await page.getByRole('button', { name: 'Yenidən oyna', exact: true }).click()
  await expect(page.locator('.det-score b')).toHaveText('0')
  await expect(page.locator('.det-checklist .found')).toHaveCount(0)
  expect(errors).toEqual([])
})

for (const [width, height] of [[1366, 768], [1440, 900], [768, 1024]]) {
  test('scene, targets and controls fit at ' + width + 'x' + height, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/?app=detective')
    await page.getByRole('button', { name: 'Macəraya başla', exact: true }).click()
    for (const [index, level] of levels.entries()) {
      await expect(page.locator('.det-scene > img')).toHaveJSProperty('naturalWidth', 768)
      const bounds = await page.locator('.detective-game,.det-play,.det-post,.det-mission').evaluateAll(elements => elements.map(element => ({
        width: element.clientWidth, scrollWidth: element.scrollWidth, height: element.clientHeight, scrollHeight: element.scrollHeight,
      })))
      for (const bound of bounds) {
        expect(bound.scrollWidth).toBeLessThanOrEqual(bound.width + 1)
        if (width > 849) expect(bound.scrollHeight).toBeLessThanOrEqual(bound.height + 1)
      }
      for (const clue of level.clues) {
        const target = page.getByRole('button', { name: 'Araşdır: ' + clue.label, exact: true })
        await expect(target).toBeVisible()
        await target.click()
      }
      await page.getByRole('button', { name: 'Paylaş', exact: true }).click()
      await page.getByRole('button', { name: index === 3 ? 'Nəticəyə bax' : 'Növbəti səviyyə', exact: true }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
    }
  })
}
