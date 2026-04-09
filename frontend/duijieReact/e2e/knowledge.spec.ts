import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const AUTH_FILE = path.join(__dirname, '.auth', 'user.json')
const BASE_URL = 'http://160.202.253.143:8080'

test.describe('登录后 - 知识库', () => {
  test.use({ storageState: AUTH_FILE })

  test('导航到知识库页面', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.getByText('知识库').click()
    await expect(page).toHaveURL(/knowledge/)
    await expect(page.getByRole('button', { name: '新建文章' })).toBeVisible({ timeout: 10000 })
  })

  test('新建文章编辑器流程', async ({ page }) => {
    await page.goto(`${BASE_URL}/knowledge`)
    await page.getByRole('button', { name: '新建文章' }).click()
    await expect(page.getByPlaceholder('文章标题')).toBeVisible()
    await page.getByPlaceholder('文章标题').fill('E2E测试文章')
    await expect(page.getByPlaceholder(/在此输入文章内容/)).toBeVisible()
    await page.getByPlaceholder(/在此输入文章内容/).fill('Playwright 自动测试创建的文章')
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible()
    await page.getByText('← 返回').click()
    await expect(page.getByRole('button', { name: '新建文章' })).toBeVisible({ timeout: 5000 })
  })

  test('搜索文章', async ({ page }) => {
    await page.goto(`${BASE_URL}/knowledge`)
    await page.getByPlaceholder('搜索文章').fill('E2E测试')
    await page.getByRole('button', { name: '搜索' }).click()
    await page.waitForTimeout(1000)
  })
})
