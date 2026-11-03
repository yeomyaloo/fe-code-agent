import { expect, test } from '@playwright/test'
import { isApi, mockApi } from './mockApi'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test.describe('프로젝트 목록', () => {
  test('등록된 저장소를 최신순으로 보여준다', async ({ page }) => {
    await page.goto('/')
    const items = page.getByRole('listitem')
    await expect(items).toHaveCount(2)
    await expect(items.first()).toContainText('spring-petclinic')
    await expect(items.nth(1)).toContainText('vulnerable-app')
  })

  test('Git 주소로 등록하면 프로젝트 화면으로 이동한다', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('https://github.com/owner/repo.git').fill('https://github.com/example/new-repo.git')
    await page.getByRole('button', { name: '클론하고 등록' }).click()
    await expect(page).toHaveURL(/\/projects\/3$/)
  })

  test('백엔드 오류 메시지를 보여준다', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('https://github.com/owner/repo.git').fill('http://github.com/example/repo.git')
    await page.getByRole('button', { name: '클론하고 등록' }).click()
    await expect(page.getByText('https 주소만 허용함')).toBeVisible()
  })

  test('서버 폴더 경로는 이름이 있어야 등록할 수 있다', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('tab', { name: '서버 폴더 경로' }).click()
    await page.getByPlaceholder('C:/work/my-repo').fill('C:/work/repo')
    await expect(page.getByRole('button', { name: '등록', exact: true })).toBeDisabled()
  })
})

test.describe('프로젝트 상세', () => {
  test('인터페이스를 거치는 진입점 → 위험 지점 경로를 보여준다', async ({ page }) => {
    await page.goto('/projects/1')
    await expect(page.getByRole('tab', { name: /진입점 → 위험 지점 경로 3/ })).toBeVisible()
    const sqlPath = page.getByRole('listitem').filter({ hasText: '/api/users/search' })
    await expect(sqlPath).toContainText('JdbcTemplate.queryForList')
    await expect(sqlPath).toContainText('UserService#search(String)')
    await expect(sqlPath).toContainText('UserServiceImpl#findByName(String)')
  })

  test('진입점과 위험 지점 탭', async ({ page }) => {
    await page.goto('/projects/1')
    await page.getByRole('tab', { name: /^진입점 5/ }).click()
    await expect(page.getByText('/api/users/health')).toBeVisible()
    await page.getByRole('tab', { name: /위험 지점 7/ }).click()
    await expect(page.getByText('java.io.ObjectInputStream.readObject')).toBeVisible()
    await expect(page.getByText('CWE-502')).toBeVisible()
  })

  test('코드 그래프를 만들면 통계를 보여준다', async ({ page }) => {
    await page.goto('/projects/1')
    await page.getByRole('button', { name: '코드 그래프 만들기' }).click()
    await expect(page.getByText('메서드', { exact: true })).toBeVisible()
    await expect(page.getByText('0.8초')).toBeVisible()
  })

  test('분석 목록을 백엔드에서 받아 보여준다', async ({ page }) => {
    await page.goto('/projects/1')
    const rows = page.getByRole('row')
    await expect(rows).toHaveCount(4) // 머리글 + 3개
    await expect(rows.nth(1)).toContainText('#8')
    await expect(rows.nth(1)).toContainText('진행 중')
    await expect(rows.nth(2)).toContainText('확정 2')
    await expect(rows.nth(2)).toContainText('기각 1')
    await expect(rows.nth(3)).toContainText('중단 (예산 소진)')
    await rows.nth(2).getByRole('link', { name: '#7' }).click()
    await expect(page).toHaveURL(/\/analyses\/7$/)
  })

  test('분석을 시작하면 분석 화면으로 이동한다', async ({ page }) => {
    await page.goto('/projects/1')
    const request = page.waitForRequest((r) => r.url().endsWith('/api/projects/1/analyses') && r.method() === 'POST')
    await page.getByRole('button', { name: '분석 시작' }).click()
    expect((await request).postDataJSON()).toEqual({ planner: 'llm', maxIntentions: 10, budgetTokens: 2_000_000 })
    await expect(page).toHaveURL(/\/analyses\/7$/)
  })

  test('경로 계획을 고르면 할 일 상한 기본값이 바뀐다', async ({ page }) => {
    await page.goto('/projects/1')
    await page.getByLabel(/계획 방식/).selectOption('paths')
    await expect(page.getByLabel(/조사할 경로 수/)).toHaveValue('5')
    const request = page.waitForRequest((r) => r.url().endsWith('/api/projects/1/analyses') && r.method() === 'POST')
    await page.getByRole('button', { name: '분석 시작' }).click()
    expect((await request).postDataJSON()).toMatchObject({ planner: 'paths', maxIntentions: 5 })
  })
})

test.describe('분석 화면', () => {
  test('요약과 확정된 취약점을 심각도 순으로 보여준다', async ({ page }) => {
    await page.goto('/analyses/7')
    await expect(page.getByRole('heading', { name: '분석 #7' })).toBeVisible()
    await expect(page.getByText('212,480')).toBeVisible()
    const findings = page.getByRole('article')
    await expect(findings).toHaveCount(3) // 기각된 1건은 숨김
    await expect(findings.first()).toContainText('사용자 검색 API의 SQL 인젝션')
    await expect(findings.first()).toContainText('심각도 치명') // Verifier 가 올린 심각도
    await expect(findings.first()).toContainText('UserServiceImpl.java:24')
  })

  test('기각된 발견은 선택했을 때만 보인다', async ({ page }) => {
    await page.goto('/analyses/7')
    await expect(page.getByText('헬스 체크 API의 정보 노출')).toHaveCount(0)
    await page.getByLabel(/오탐으로 기각된 발견 1건도 보기/).check()
    await expect(page.getByText('헬스 체크 API의 정보 노출')).toBeVisible()
  })

  test('사람 검토를 저장하면 배지가 바뀐다', async ({ page }) => {
    await page.goto('/analyses/7')
    const finding = page.getByRole('article').filter({ hasText: 'ping API의 명령 인자 주입' })
    await expect(finding).toContainText('사람 검토 전')
    await finding.getByRole('combobox').selectOption('WONT_FIX')
    await finding.getByPlaceholder('메모 (선택)').fill('내부망 전용 API')
    await finding.getByRole('button', { name: '검토 저장' }).click()
    await expect(finding).toContainText('검토: 위험 수용')
  })

  test('할 일마다 Worker 결론과 토큰 사용량을 보여준다', async ({ page }) => {
    await page.goto('/analyses/7')
    await page.getByRole('tab', { name: '할 일 4' }).click()
    const sql = page.getByRole('listitem').filter({ hasText: '사용자 검색 API의 SQL 인젝션 경로' })
    await expect(sql).toContainText('판정: 취약')
    await expect(sql).toContainText('7단계')
    await expect(sql).toContainText('계획 1회차')
    await expect(sql).toContainText('지시: GET /api/users/search 의 name')
  })

  test('LLM 계획이면 Planner 회차별 결론과 후속 할 일을 보여준다', async ({ page }) => {
    await page.goto('/analyses/7')
    await expect(page.getByText('LLM 계획 2회차')).toBeVisible()
    await page.getByRole('tab', { name: '할 일 4' }).click()
    await expect(page.getByText('계획 종료')).toBeVisible()
    await expect(page.getByText(/끝낸 이유: 위험 경로 3개를 모두 조사했고/)).toBeVisible()
    await expect(page.getByText('1회차', { exact: true })).toBeVisible()
    await expect(page.getByText(/후속 조사를 하나 더했고/)).toBeVisible()
    const followUp = page.getByRole('listitem').filter({ hasText: '명령 실행 코드가 다른 곳에서 호출되는지' })
    await expect(followUp).toContainText('계획 2회차')
    await expect(followUp).toContainText('선행 #402')

    await page.getByRole('button', { name: '계획 기록 보기' }).click()
    await expect(page.getByRole('combobox')).toHaveValue('400')
    await expect(page.locator('ol > li')).toHaveCount(6)
    await expect(page.locator('ol > li').nth(3)).toContainText('add_intention')
  })

  test('에이전트 기록 타임라인에서 생각과 도구 호출을 순서대로 보여준다', async ({ page }) => {
    await page.goto('/analyses/7')
    await page.getByRole('tab', { name: '할 일 4' }).click()
    await page.getByRole('listitem').filter({ hasText: '사용자 검색 API의 SQL 인젝션 경로' }).getByRole('button', { name: '기록 보기', exact: true }).click()

    await expect(page.getByRole('combobox')).toHaveValue('401')
    const items = page.locator('ol > li')
    await expect(items).toHaveCount(14)
    await expect(items.first()).toContainText('할 일 전달')
    await expect(items.nth(1)).toContainText('Claude 생각')
    await expect(items.nth(4)).toContainText('read_file')
    await expect(items.nth(5)).toContainText('jdbcTemplate.queryForList(sql)')
    await expect(items.last()).toContainText('판정: 취약')
  })

  test('진행 중인 분석은 자동으로 다시 불러온다', async ({ page }) => {
    let calls = 0
    page.on('request', (r) => {
      if (new URL(r.url()).pathname === '/api/analyses/8') calls++
    })
    await page.goto('/analyses/8')
    await expect(page.getByText('진행 중')).toBeVisible()
    await page.waitForTimeout(4500)
    expect(calls).toBeGreaterThanOrEqual(3)
  })

  test('보고서 링크', async ({ page }) => {
    await page.goto('/analyses/7')
    await expect(page.getByRole('link', { name: 'HTML 보고서' })).toHaveAttribute('href', '/api/analyses/7/report.html')
    await expect(page.getByRole('link', { name: 'SARIF 내려받기' })).toHaveAttribute('href', '/api/analyses/7/report.sarif')
  })
})

test('백엔드가 꺼져 있으면 안내 문구를 보여준다', async ({ page }) => {
  await page.unroute(isApi)
  await page.route(isApi, (route) => route.fulfill({ status: 502, body: '' }))
  await page.goto('/')
  await expect(page.getByText('백엔드에 연결할 수 없음')).toBeVisible({ timeout: 10_000 })
})
