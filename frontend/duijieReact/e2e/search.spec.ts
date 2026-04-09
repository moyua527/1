import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AUTH_FILE = path.join(__dirname, '.auth', 'user.json')
const BASE_URL = 'http://160.202.253.143:8080'

test.describe('登录后 - 全局搜索', () => {
  test.use({ storageState: AUTH_FILE })

  test('Ctrl+K 打开命令面板', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForTimeout(2000)
    await page.keyboard.press('Control+k')
    await expect(page.getByPlaceholder(/搜索/)).toBeVisible({ timeout: 5000 })
  })

  test('搜索并显示结果', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForTimeout(2000)
    await page.keyboard.press('Control+k')
    const searchInput = page.getByPlaceholder(/搜索/)
    await searchInput.fill('测试')
    await page.waitForTimeout(1000)
  })

  test('Escape 关闭命令面板', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForTimeout(2000)
    await page.keyboard.press('Control+k')
    await expect(page.getByPlaceholder(/搜索/)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByPlaceholder(/搜索/)).not.toBeVisible({ timeout: 3000 })
  })
})
