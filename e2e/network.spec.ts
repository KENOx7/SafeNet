import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const control = (page: Page, name: string) => page.getByRole('button', { name, exact: true })

test('opens the fullscreen scene and deploys a tool by clicking a Phaser sprite', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/?app=network')
  await expect(page.getByRole('heading', { name: 'NETWORK DEFENSE' })).toBeVisible()
  const canvas = page.locator('.net-field canvas')
  await expect(canvas).toBeVisible({ timeout: 20_000 })
  await page.getByRole('group', { name: 'Müdafiə alətləri' }).getByRole('button', { name: /Trafik filtri/ }).click()
  const rect = (await canvas.boundingBox())!
  const point = { x: rect.x + rect.width * 333 / 940, y: rect.y + rect.height * 220 / 440 }
  await expect.poll(async () => {
    await page.mouse.move(point.x - 100, point.y - 20)
    await page.mouse.move(point.x, point.y)
    return canvas.evaluate(element => (element as HTMLCanvasElement).style.cursor)
  }, { timeout: 20_000 }).toBe('pointer')
  await page.mouse.click(point.x, point.y)
  await expect(page.getByRole('status')).toContainText('Trafik filtri yerləşdirildi · Giriş')
  await expect(page.locator('.net-budget strong')).toHaveText('50')
  await control(page, 'Tam ekran').click()
  await expect(control(page, 'Tam ekrandan çıx')).toBeVisible()
  await control(page, 'Tam ekrandan çıx').click()
  await expect(control(page, 'Tam ekran')).toBeVisible()
  await expect(page.getByRole('link', { name: 'TRUST, PLEASE oyununa keç' })).toHaveCount(0)
  await control(page, 'PC masaüstünə qayıt').click()
  await expect(control(page, 'Network Defense aç')).toBeVisible()
})

test('wins all three network waves through placements and keeps the result after reload', async ({ page }) => {
  await page.clock.install()
  await page.goto('/?app=network')
  const place = async (tool: RegExp, node: string) => {
    await page.getByRole('group', { name: 'Müdafiə alətləri' }).getByRole('button', { name: tool }).click()
    await control(page, node).click()
    await expect(page.getByRole('status')).toContainText('yerləşdirildi')
  }
  const budget = page.locator('.net-budget strong')
  await place(/Trafik filtri/, 'Giriş')
  await expect(budget).toHaveText('50')
  await page.getByRole('group', { name: 'Müdafiə alətləri' }).getByRole('button', { name: /Poçt sipəri/ }).click()
  await control(page, 'Poçt serveri').click()
  await expect(page.getByRole('status')).toContainText('büdcən çatmır')
  await expect(budget).toHaveText('50')

  await control(page, 'Dalğanı başlat').click()
  await page.clock.runFor(1300)
  await expect(page.locator('.net-field canvas')).toBeVisible()
  await control(page, 'Fasilə ver').click()
  await page.clock.runFor(10_000)
  await expect(control(page, 'Davam et')).toBeVisible()
  await control(page, 'Davam et').click()
  await page.clock.runFor(10_000)
  await expect(page.getByText('3 blok')).toBeVisible()
  await control(page, 'Növbəti dalğa').click()
  await expect(budget).toHaveText('145')

  await place(/Poçt sipəri/, 'Poçt serveri')
  await control(page, 'Dalğanı başlat').click()
  await page.clock.runFor(11_000)
  await expect(page.getByText('8 blok')).toBeVisible()
  await control(page, 'Növbəti dalğa').click()

  await place(/Giriş kilidi/, 'Arxiv')
  await control(page, 'Dalğanı başlat').click()
  await page.clock.runFor(11_000)
  await expect(page.getByRole('heading', { name: 'Şəbəkə qorundu' })).toBeVisible()
  await expect(page.getByRole('img', { name: '6 / 6' })).toBeVisible()
  await expect(page.getByText('15 blok')).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Şəbəkə qorundu' })).toBeVisible()
  await control(page, 'Yenidən oyna').click()
  await expect(budget).toHaveText('110')
})

test('one leaked packet stops the wave and retry preserves the previous completed waves', async ({ page }) => {
  await page.clock.install()
  await page.goto('/?app=network')
  await control(page, 'Veb server').click()
  const pauseAt = await page.evaluate(() => Date.now() + 500)
  await page.clock.pauseAt(new Date(pauseAt))
  await control(page, 'Dalğanı başlat').dispatchEvent('click')
  await page.clock.runFor(2100)
  await control(page, '3 saniyəlik qalxan').dispatchEvent('click')
  await expect(control(page, 'Qalxan aktivdir')).toBeDisabled()
  await page.clock.runFor(10_000)
  await expect(page.getByRole('heading', { name: 'Dalğa keçilmədi' })).toBeVisible()
  await expect(control(page, 'Növbəti dalğa')).toHaveCount(0)
  await expect(page.getByText('2 blok', { exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: '5 / 6' })).toBeVisible()

  await page.clock.resume()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Dalğa keçilmədi' })).toBeVisible({ timeout: 15_000 })
  const retryAt = await page.evaluate(() => Date.now() + 500)
  await page.clock.pauseAt(new Date(retryAt))
  await control(page, 'Dalğanı yenidən oyna').dispatchEvent('click')
  await expect(page.getByText('DALĞA 01 / 03')).toBeVisible()
  await expect(page.getByText('0 blok', { exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: '6 / 6' })).toBeVisible()
  await page.getByRole('button', { name: /^Trafik filtri/ }).dispatchEvent('click')
  await control(page, 'Giriş').dispatchEvent('click')
  await control(page, 'Dalğanı başlat').dispatchEvent('click')
  await page.clock.runFor(10_000)
  await control(page, 'Növbəti dalğa').dispatchEvent('click')
  await expect(page.getByText('DALĞA 02 / 03')).toBeVisible()
  await control(page, 'Dalğanı başlat').dispatchEvent('click')
  await page.clock.runFor(11_000)
  await expect(page.getByRole('heading', { name: 'Dalğa keçilmədi' })).toBeVisible()
  await expect(control(page, 'Növbəti dalğa')).toHaveCount(0)
  await control(page, 'Dalğanı yenidən oyna').dispatchEvent('click')
  await expect(page.getByRole('heading', { name: 'Saxta poçt' })).toBeVisible()
  await expect(page.locator('.net-budget strong')).toHaveText('145')
  await expect(page.getByText('3 blok', { exact: true })).toBeVisible()
  await expect(control(page, 'Giriş')).toHaveAttribute('aria-description', 'Trafik filtri')
})

test('keeps mission copy, tool names, and prices inside their panels', async ({ page }) => {
  await page.goto('/?app=network')
  await expect(page.locator('.net-mission .net-inset')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  for (const [width, height] of [[1920, 1080], [1366, 768], [1366, 635], [1024, 600]]) {
    await page.setViewportSize({ width, height })
    const clipping = await page.evaluate(() => {
      const scene = document.querySelector<HTMLElement>('.network-game')!
      const mission = scene.querySelector<HTMLElement>('.net-mission .net-inset')!
      const modules = Array.from(scene.querySelectorAll('.net-module'))
      const spills = modules.some(module => {
        const limit = module.getBoundingClientRect()
        return Array.from(module.querySelectorAll('.defense-title strong, .defense-text small, .defense-cost')).some(label => {
          const bounds = label.getBoundingClientRect()
          return bounds.bottom > limit.bottom || bounds.right > limit.right || bounds.top < limit.top
        })
      })
      return scene.scrollWidth > scene.clientWidth || scene.scrollHeight > scene.clientHeight ||
        mission.scrollHeight > mission.clientHeight + 1 || spills
    })
    expect(clipping, `layout at ${width} × ${height}`).toBe(false)
  }
  await page.setViewportSize({ width: 1024, height: 600 })
  await page.evaluate(() => localStorage.setItem('oyu-network-v1', JSON.stringify({
    state: { wave: 2, installed: { gateway: 'load' }, credits: 90 },
    version: 0,
  })))
  await page.reload()
  await control(page, 'Giriş').click()
  await expect(control(page, 'Geri götür')).toBeVisible()
  expect(await page.locator('.net-inspector').evaluate(panel => panel.scrollHeight - panel.clientHeight)).toBeLessThanOrEqual(1)
})
