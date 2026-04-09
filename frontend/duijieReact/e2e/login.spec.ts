import { test, expect, Page, BrowserContext } from '@playwright/test'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = 'http://160.202.253.143:8080'
const TEST_PHONE = '15911111111'
const TEST_PASSWORD = '123456'
const AUTH_FILE = path.join(__dirname, '.auth', 'user.json')

function hasValidAuth(): boolean {
  try {
    if (!fs.existsSync(AUTH_FILE)) return false
    const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'))
    return data?.origins?.length > 0 || data?.cookies?.length > 0
  } catch { return false }
}

const loginSubmit = (page: Page) => page.locator('button[type="submit"]')

// ===== 第一组：不需要登录的测试 =====
test.describe('登录页面', () => {
  test('页面加载 - 显示登录表单', async ({ page }) => {
    await page.goto(BASE_URL)
    await expect(page.getByPlaceholder('用户名 / 手机号 / ID')).toBeVisible()
    await expect(page.getByPlaceholder('输入密码')).toBeVisible()
    await expect(loginSubmit(page)).toBeVisible()
  })
})

// ===== 第二组：登录并保存状态（只登录一次） =====
test.describe('登录并保存认证状态', () => {
  test('账号密码登录 - 成功进入系统', async ({ page, context }) => {
    if (hasValidAuth()) {
      test.skip(true, '已有有效认证状态，跳过登录')
      return
    }
    test.setTimeout(60000)
    for (let attempt = 0; attempt < 3; attempt++) {
      await page.goto(BASE_URL)
      const checkbox = page.getByRole('checkbox')
      if (!(await checkbox.isChecked())) await checkbox.check()
      await page.getByPlaceholder('用户名 / 手机号 / ID').fill(TEST_PHONE)
      await page.getByPlaceholder('输入密码').fill(TEST_PASSWORD)
      await loginSubmit(page).click()
      const rateLimited = page.getByText('请求过于频繁')
      const dashboard = page.getByRole('heading', { name: '仪表盘' })
      const which = await Promise.race([
        rateLimited.waitFor({ timeout: 10000 }).then(() => 'rate-limited' as const),
        dashboard.waitFor({ timeout: 15000 }).then(() => 'ok' as const),
      ]).catch(() => 'timeout' as const)
      if (which === 'ok') {
        await context.storageState({ path: AUTH_FILE })
        return
      }
      await page.waitForTimeout(10000)
    }
    throw new Error('登录失败：多次尝试后仍被限流')
  })
})

// ===== 第三组：使用已保存的认证状态, 不再重复登录 =====
test.describe('登录后 - 页面导航', () => {
  test.use({ storageState: AUTH_FILE })

  test('导航到企业管理页', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.getByText('企业管理').click()
    await expect(page).toHaveURL(/enterprise/)
    await expect(page.getByRole('heading', { name: '企业管理' })).toBeVisible({ timeout: 10000 })
  })

  test('企业管理页正常加载', async ({ page }) => {
    await page.goto(`${BASE_URL}/enterprise`)
    await expect(page.getByRole('heading', { name: '企业管理' })).toBeVisible({ timeout: 10000 })
  })

  test('导航到项目管理页', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.getByText('项目管理', { exact: true }).click()
    await expect(page).toHaveURL(/projects/)
  })

  test('导航到客户管理页', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.getByText('客户管理', { exact: true }).click()
    await expect(page).toHaveURL(/clients/)
  })

  test('导航到需求看板', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.getByText('需求看板', { exact: true }).click()
    await expect(page).toHaveURL(/tasks/)
  })
})
