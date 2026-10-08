import { expect, test } from '@playwright/test'
import { mockApi } from './mockApi'

// README 용 스크린샷. `npm run screenshots` 로만 돈다 (예시 데이터)
const DIR = 'docs/screenshots'

test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' })

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('@screenshot 프로젝트 목록', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await page.screenshot({ path: `${DIR}/projects.png` })
})

test('@screenshot 프로젝트 상세', async ({ page }) => {
  await page.goto('/projects/1')
  await page.getByRole('button', { name: '코드 그래프 만들기' }).click()
  await expect(page.getByText('0.8초')).toBeVisible()
  await expect(page.getByRole('row')).toHaveCount(4)
  await page.screenshot({ path: `${DIR}/project.png`, fullPage: true })
})

test('@screenshot 분석 발견', async ({ page }) => {
  await page.goto('/analyses/7')
  await expect(page.getByRole('article').first()).toBeVisible()
  await page.screenshot({ path: `${DIR}/analysis-findings.png`, fullPage: true })
})

test('@screenshot 에이전트 기록', async ({ page }) => {
  await page.goto('/analyses/7')
  await page.getByRole('tab', { name: /에이전트 기록/ }).click()
  await expect(page.locator('ol > li').first()).toBeVisible()
  // 할 일 전달 프롬프트와 도구 결과 하나를 펼쳐서 보여준다
  await page.locator('ol > li').first().locator('summary').click()
  await page.screenshot({ path: `${DIR}/analysis-traces.png`, fullPage: true })
})
