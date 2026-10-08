import type { Page, Route } from '@playwright/test'
import type {
  AnalysisView,
  EntryPointView,
  IndexResult,
  JobSummaryView,
  NodeView,
  Project,
  SinkPathView,
  SinkView,
  TraceView,
} from '../src/api/types'

// be-code-agent 테스트 픽스처(vulnerable-app)를 분석했다고 가정한 예시 데이터.
// 코드 위치와 내용은 실제 픽스처 소스와 맞췄다.

const PKG = 'com.example.vuln'

export const project: Project = {
  id: 1,
  name: 'vulnerable-app',
  repoPath: '/workspace/vulnerable-app',
  language: 'java',
  gitUrl: 'https://github.com/example/vulnerable-app.git',
  gitBranch: 'main',
  commitSha: '3f5ba4a9c81e2d7b6a0f4c1e9d8b7a6f5e4d3c2b',
  syncedAt: '2026-10-09T01:12:40Z',
  createdAt: '2026-10-09T01:12:31Z',
}

const otherProject: Project = {
  id: 2,
  name: 'spring-petclinic',
  repoPath: '/workspace/spring-petclinic',
  language: 'java',
  gitUrl: 'https://github.com/spring-projects/spring-petclinic.git',
  gitBranch: 'main',
  commitSha: '500158f1d2c3b4a59687f0e1d2c3b4a596870f1e',
  syncedAt: '2026-10-08T13:21:40Z',
  createdAt: '2026-10-08T13:21:30Z',
}

export const indexResult: IndexResult = {
  projectId: 1,
  files: 5,
  classes: 5,
  methods: 14,
  entryPoints: 5,
  sinks: 7,
  callEdges: 16,
  overrideEdges: 1,
  unresolvedCalls: 2,
  removedNodes: 0,
  retainedNodes: 0,
  parseErrors: [],
  elapsedMs: 842,
}

const entryPoints: EntryPointView[] = [
  { id: 101, httpMethod: 'GET', path: '/api/users/search', handler: `${PKG}.web.UserController#search(String)`, filePath: 'src/main/java/com/example/vuln/web/UserController.java', line: 30 },
  { id: 102, httpMethod: 'POST', path: '/api/users/ping', handler: `${PKG}.web.UserController#ping(String)`, filePath: 'src/main/java/com/example/vuln/web/UserController.java', line: 35 },
  { id: 103, httpMethod: 'GET', path: '/api/users/files/{name}', handler: `${PKG}.web.UserController#download(String)`, filePath: 'src/main/java/com/example/vuln/web/UserController.java', line: 40 },
  { id: 104, httpMethod: 'HEAD', path: '/api/users/files/{name}', handler: `${PKG}.web.UserController#download(String)`, filePath: 'src/main/java/com/example/vuln/web/UserController.java', line: 40 },
  { id: 105, httpMethod: 'GET', path: '/api/users/health', handler: `${PKG}.web.UserController#health()`, filePath: 'src/main/java/com/example/vuln/web/UserController.java', line: 45 },
]

const SERVICE_DIR = 'src/main/java/com/example/vuln/service'

const sinks: SinkView[] = [
  { id: 201, category: 'SQL', cwe: 'CWE-89', api: 'org.springframework.jdbc.core.JdbcTemplate.queryForList', method: `${PKG}.service.UserServiceImpl#findByName(String)`, snippet: 'jdbcTemplate.queryForList(sql)', filePath: `${SERVICE_DIR}/UserServiceImpl.java`, line: 25 },
  { id: 202, category: 'COMMAND', cwe: 'CWE-78', api: 'java.lang.Runtime.exec', method: `${PKG}.service.CommandService#ping(String)`, snippet: 'Runtime.getRuntime().exec("ping -c 1 " + host)', filePath: `${SERVICE_DIR}/CommandService.java`, line: 11 },
  { id: 203, category: 'COMMAND', cwe: 'CWE-78', api: 'java.lang.ProcessBuilder.<init>', method: `${PKG}.service.CommandService#shell(String)`, snippet: 'new ProcessBuilder("sh", "-c", command)', filePath: `${SERVICE_DIR}/CommandService.java`, line: 16 },
  { id: 204, category: 'PATH', cwe: 'CWE-22', api: 'java.nio.file.Files.readAllBytes', method: `${PKG}.service.FileService#read(String)`, snippet: 'Files.readAllBytes(Paths.get(BASE_DIR, name))', filePath: `${SERVICE_DIR}/FileService.java`, line: 17 },
  { id: 205, category: 'PATH', cwe: 'CWE-22', api: 'java.nio.file.Paths.get', method: `${PKG}.service.FileService#read(String)`, snippet: 'Paths.get(BASE_DIR, name)', filePath: `${SERVICE_DIR}/FileService.java`, line: 17 },
  { id: 206, category: 'PATH', cwe: 'CWE-22', api: 'java.io.FileInputStream.<init>', method: `${PKG}.service.FileService#load(String)`, snippet: 'new FileInputStream(BASE_DIR + "/" + name)', filePath: `${SERVICE_DIR}/FileService.java`, line: 21 },
  { id: 207, category: 'DESERIALIZATION', cwe: 'CWE-502', api: 'java.io.ObjectInputStream.readObject', method: `${PKG}.service.FileService#load(String)`, snippet: 'in.readObject()', filePath: `${SERVICE_DIR}/FileService.java`, line: 22 },
]

const method = (id: number, qualifiedName: string) => ({ id, kind: 'METHOD', qualifiedName, filePath: null, line: null })
const node = (e: EntryPointView) => ({ id: e.id, kind: 'ENTRY_POINT', qualifiedName: e.path, filePath: e.filePath, line: e.line })
const sinkNode = (s: SinkView) => ({ id: s.id, kind: 'SINK', qualifiedName: s.api, filePath: s.filePath, line: s.line })

const sinkPaths: SinkPathView[] = [
  {
    entryPoint: entryPoints[1], sink: sinks[1],
    path: [node(entryPoints[1]), method(301, `${PKG}.web.UserController#ping(String)`), method(302, `${PKG}.service.CommandService#ping(String)`), sinkNode(sinks[1])],
  },
  {
    entryPoint: entryPoints[2], sink: sinks[3],
    path: [node(entryPoints[2]), method(303, `${PKG}.web.UserController#download(String)`), method(304, `${PKG}.service.FileService#read(String)`), sinkNode(sinks[3])],
  },
  {
    entryPoint: entryPoints[0], sink: sinks[0],
    path: [
      node(entryPoints[0]),
      method(305, `${PKG}.web.UserController#search(String)`),
      method(306, `${PKG}.service.UserService#search(String)`),
      method(307, `${PKG}.service.UserServiceImpl#search(String)`),
      method(308, `${PKG}.service.UserServiceImpl#findByName(String)`),
      sinkNode(sinks[0]),
    ],
  },
]

// ---- 분석 작업 #7 (완료) ----

const goal: NodeView = { id: 400, kind: 'GOAL', status: 'DONE', title: 'vulnerable-app 보안 취약점 분석', body: '진입점 → 위험 지점 경로 3개 조사', props: {}, workerId: null }

const intentions: NodeView[] = [
  { id: 401, kind: 'INTENTION', status: 'DONE', title: 'GET /api/users/search → org.springframework.jdbc.core.JdbcTemplate.queryForList', body: '', props: { category: 'SQL', cwe: 'CWE-89' }, workerId: 'worker-1' },
  { id: 402, kind: 'INTENTION', status: 'DONE', title: 'POST /api/users/ping → java.lang.Runtime.exec', body: '', props: { category: 'COMMAND', cwe: 'CWE-78' }, workerId: 'worker-2' },
  { id: 403, kind: 'INTENTION', status: 'DONE', title: 'GET /api/users/files/{name} → java.nio.file.Files.readAllBytes', body: '', props: { category: 'PATH', cwe: 'CWE-22' }, workerId: 'worker-3' },
]

const conclusion = (intentionId: number, id: number, body: string, steps: number, input: number, output: number, cache: number): NodeView => ({
  id, kind: 'FACT', status: 'DONE', title: `할 일 #${intentionId} 결론`, body,
  props: { outcome: 'COMPLETED', steps, inputTokens: input, outputTokens: output, cacheReadTokens: cache, error: null },
  workerId: null,
})

const facts: NodeView[] = [
  { id: 410, kind: 'FACT', status: 'OPEN', title: 'findByName이 name을 SQL 문자열에 그대로 이어 붙임', body: 'UserServiceImpl.java:24 에서 "select * from users where name = \'" + name + "\'" 로 쿼리를 만든다. 파라미터 바인딩(?)을 쓰지 않는다.', props: {}, workerId: 'worker-1' },
  conclusion(401, 411, '판정: 취약\n근거: GET /api/users/search 의 name 파라미터가 검증 없이 UserServiceImpl.java:24 에서 SQL 문자열에 이어 붙여지고, :25 의 jdbcTemplate.queryForList 로 실행된다. 컨트롤러와 서비스 어디에도 @Valid, 허용 목록, 이스케이프가 없다.', 7, 18_420, 2_310, 12_800),
  conclusion(402, 412, '판정: 취약\n근거: POST /api/users/ping 의 host 가 CommandService.java:11 에서 "ping -c 1 " 뒤에 그대로 붙어 Runtime.exec 로 실행된다. 단일 문자열 exec 는 공백으로 인자를 나누므로 셸 메타문자 자체는 해석되지 않지만, 인자 주입(-f, -s 등)으로 서비스 거부가 가능하다.', 6, 15_970, 2_040, 11_200),
  conclusion(403, 413, '판정: 판단 불가\n근거: name 이 Paths.get(BASE_DIR, name) 로 합쳐져 ../ 를 막지 않는다. 다만 /var/data 밖의 어떤 파일이 운영 환경에서 읽을 수 있는지는 저장소만으로 확인할 수 없다.', 8, 21_100, 2_620, 14_400),
]

const findings: NodeView[] = [
  {
    id: 420, kind: 'FINDING', status: 'CONFIRMED', title: '사용자 검색 API의 SQL 인젝션',
    body: 'GET /api/users/search 의 name 파라미터가 UserController#search → UserService#search → UserServiceImpl#findByName 을 거쳐 SQL 문자열에 그대로 이어 붙여진 뒤 실행된다.',
    props: {
      cwe: 'CWE-89', severity: 'high', confidence: 'high',
      exploitScenario: "GET /api/users/search?name=' OR '1'='1\n→ select * from users where name = '' OR '1'='1'  (전체 사용자 조회)",
      evidence: [
        { file: `${SERVICE_DIR}/UserServiceImpl.java`, line: 24, note: '입력을 SQL 문자열에 이어 붙임' },
        { file: `${SERVICE_DIR}/UserServiceImpl.java`, line: 25, note: 'queryForList 로 그대로 실행' },
      ],
      sourceNodeId: 101, sinkNodeId: 201, workerId: 'worker-1',
      verification: {
        verdict: 'confirmed', confidence: 'high', severity: 'critical', verifier: 'verifier-1',
        reasoning: 'UserController.java:30 의 @RequestParam name 이 변환 없이 UserServiceImpl.java:24 까지 전달된다. 프로젝트에 Spring Security 설정이나 입력 검증 필터가 없고, 쿼리는 PreparedStatement 가 아닌 문자열 결합이다. 인증 없이 호출 가능한 진입점이라 심각도를 critical 로 올린다.',
        blockingControls: '없음. @Valid·@Pattern 없음, 파라미터 바인딩 없음, 필터·인터셉터 없음',
      },
      review: { decision: 'ACCEPTED', comment: 'PreparedStatement 로 바꾸기로 함', reviewedAt: '2026-10-09T01:30:12Z' },
    },
    workerId: 'worker-1',
  },
  {
    id: 421, kind: 'FINDING', status: 'CONFIRMED', title: 'ping API의 명령 인자 주입',
    body: 'POST /api/users/ping 의 host 가 Runtime.exec("ping -c 1 " + host) 로 실행된다.',
    props: {
      cwe: 'CWE-78', severity: 'high', confidence: 'medium',
      exploitScenario: 'POST /api/users/ping  host=-s 65000 -c 100000 10.0.0.1\n→ ping 인자를 조작해 대량 패킷 전송',
      evidence: [{ file: `${SERVICE_DIR}/CommandService.java`, line: 11, note: 'host 를 명령 문자열에 이어 붙여 exec' }],
      sourceNodeId: 102, sinkNodeId: 202, workerId: 'worker-2',
      verification: {
        verdict: 'confirmed', confidence: 'medium', severity: 'medium', verifier: 'verifier-1',
        reasoning: 'Runtime.exec(String) 은 셸을 거치지 않아 ; 나 | 로 다른 명령을 붙이는 공격은 안 된다. 하지만 공백으로 인자가 나뉘므로 ping 옵션 주입은 가능하다. 임의 명령 실행이 아니므로 심각도는 medium 으로 낮춘다.',
        blockingControls: '셸 미사용으로 명령 연결은 막힘. 인자 주입은 막지 못함',
      },
    },
    workerId: 'worker-2',
  },
  {
    id: 422, kind: 'FINDING', status: 'UNCERTAIN', title: '파일 다운로드 API의 경로 조작',
    body: 'GET /api/users/files/{name} 의 name 이 Paths.get(BASE_DIR, name) 으로 합쳐져 Files.readAllBytes 로 읽힌다.',
    props: {
      cwe: 'CWE-22', severity: 'medium', confidence: 'medium',
      exploitScenario: 'GET /api/users/files/..%2F..%2Fetc%2Fpasswd',
      evidence: [{ file: `${SERVICE_DIR}/FileService.java`, line: 17, note: '정규화·기준 경로 확인 없이 읽음' }],
      sourceNodeId: 103, sinkNodeId: 204, workerId: 'worker-3',
      verification: {
        verdict: 'uncertain', confidence: 'low', verifier: 'verifier-1',
        reasoning: '코드만 보면 ../ 를 막는 장치가 없다. 하지만 @PathVariable 은 기본적으로 / 를 포함한 값을 받지 않고, 인코딩된 %2F 를 허용하는지는 서버 설정(저장소 밖)에 달려 있어 확인할 수 없다.',
        blockingControls: 'Spring 의 경로 변수 매칭이 / 를 막을 수 있음 (설정 의존)',
      },
    },
    workerId: 'worker-3',
  },
  {
    id: 423, kind: 'FINDING', status: 'REJECTED', title: '헬스 체크 API의 정보 노출',
    body: 'GET /api/users/health 가 내부 상태를 노출할 수 있음.',
    props: {
      cwe: 'CWE-200', severity: 'low', confidence: 'low',
      evidence: [{ file: 'src/main/java/com/example/vuln/web/UserController.java', line: 46, note: '"ok" 반환' }],
      workerId: 'worker-1',
      verification: { verdict: 'rejected', confidence: 'high', verifier: 'verifier-1', reasoning: '상수 문자열 "ok" 만 반환한다. 외부 입력도, 노출되는 정보도 없다.', blockingControls: '해당 없음' },
    },
    workerId: 'worker-1',
  },
]

export const analysis: AnalysisView = {
  job: {
    id: 7, projectId: 1, status: 'DONE', budgetTokens: 2_000_000, usedTokens: 212_480, inputTokens: 190_310, outputTokens: 22_170,
    error: null, startedAt: '2026-10-09T01:14:02Z', finishedAt: '2026-10-09T01:17:48Z',
  },
  nodes: [goal, ...intentions, ...facts, ...findings],
}

/** 진행 중인 작업 #8 (실시간 화면 확인용) */
export const runningAnalysis: AnalysisView = {
  job: { ...analysis.job, id: 8, status: 'RUNNING', usedTokens: 64_200, inputTokens: 58_900, outputTokens: 5_300, finishedAt: null },
  nodes: [
    goal,
    { ...intentions[0], status: 'CLAIMED' },
    { ...intentions[1], status: 'CLAIMED' },
    { ...intentions[2], status: 'OPEN', workerId: null },
  ],
}

export const analysisList: JobSummaryView[] = [
  { job: runningAnalysis.job, intentions: 3, intentionsFinished: 0, findings: { OPEN: 0, CONFIRMED: 0, REJECTED: 0, UNCERTAIN: 0 } },
  { job: analysis.job, intentions: 3, intentionsFinished: 3, findings: { OPEN: 0, CONFIRMED: 2, REJECTED: 1, UNCERTAIN: 1 } },
  {
    job: { ...analysis.job, id: 5, status: 'STOPPED', budgetTokens: 100_000, usedTokens: 100_412, inputTokens: 91_002, outputTokens: 9_410, error: '토큰 예산 소진', startedAt: '2026-10-08T14:02:10Z', finishedAt: '2026-10-08T14:03:31Z' },
    intentions: 3, intentionsFinished: 1, findings: { OPEN: 1, CONFIRMED: 0, REJECTED: 0, UNCERTAIN: 0 },
  },
]

const t = (id: number, intentionId: number, workerId: string, step: number, role: string, toolName: string | null, content: string, sec: number): TraceView => ({
  id, intentionId, workerId, step, role, toolName, content, createdAt: new Date(Date.UTC(2026, 9, 9, 1, 14, 5 + sec)).toISOString(),
})

export const traces: TraceView[] = [
  t(1, 401, 'worker-1', 0, 'USER', null, '할 일: 아래 진입점의 외부 입력이 위험 지점까지 도달해 악용될 수 있는지 조사하세요.\n\n진입점: GET /api/users/search  (노드 id 101)\n처리 메서드: com.example.vuln.web.UserController#search(String)\n\n위험 지점: [SQL CWE-89] org.springframework.jdbc.core.JdbcTemplate.queryForList  (노드 id 201)', 0),
  t(2, 401, 'worker-1', 1, 'ASSISTANT', null, '경로가 인터페이스 UserService 를 거쳐 UserServiceImpl 로 이어집니다. 먼저 다른 실행 담당이 같은 코드를 봤는지 확인하고, 구현 클래스를 읽겠습니다.', 3),
  t(3, 401, 'worker-1', 2, 'TOOL_CALL', 'search_worker_traces', '{"query":"UserServiceImpl findByName"}', 3),
  t(4, 401, 'worker-1', 3, 'TOOL_RESULT', 'search_worker_traces', '관련 기록 없음', 4),
  t(5, 401, 'worker-1', 4, 'TOOL_CALL', 'read_file', '{"path":"src/main/java/com/example/vuln/service/UserServiceImpl.java","start_line":18,"end_line":27}', 4),
  t(6, 401, 'worker-1', 5, 'TOOL_RESULT', 'read_file', '18    @Override\n19    public List<Map<String, Object>> search(String name) {\n20        return findByName(name);\n21    }\n22\n23    private List<Map<String, Object>> findByName(String name) {\n24        String sql = "select * from users where name = \'" + name + "\'";\n25        return jdbcTemplate.queryForList(sql);\n26    }', 5),
  t(7, 401, 'worker-1', 6, 'ASSISTANT', null, '24줄에서 name 을 SQL 문자열에 그대로 이어 붙입니다. 파라미터 바인딩이 없습니다. 입력 검증이 다른 곳에 있는지 확인하겠습니다.', 9),
  t(8, 401, 'worker-1', 7, 'TOOL_CALL', 'grep_code', '{"pattern":"@Valid|@Pattern|SecurityFilterChain|HandlerInterceptor"}', 9),
  t(9, 401, 'worker-1', 8, 'TOOL_RESULT', 'grep_code', '일치하는 줄 없음', 10),
  t(10, 401, 'worker-1', 9, 'TOOL_CALL', 'record_fact', '{"title":"findByName이 name을 SQL 문자열에 그대로 이어 붙임","code_node_ids":[308]}', 12),
  t(11, 401, 'worker-1', 10, 'TOOL_RESULT', 'record_fact', 'fact #410 기록함', 12),
  t(12, 401, 'worker-1', 11, 'TOOL_CALL', 'record_finding', '{"title":"사용자 검색 API의 SQL 인젝션","cwe":"CWE-89","severity":"high","confidence":"high","fact_ids":[410]}', 16),
  t(13, 401, 'worker-1', 12, 'TOOL_RESULT', 'record_finding', 'finding #420 기록함 (검증 대기)', 16),
  t(14, 401, 'worker-1', 13, 'ASSISTANT', null, '판정: 취약\n근거: name 이 검증 없이 UserServiceImpl.java:24 에서 SQL 문자열에 이어 붙여지고 :25 에서 실행됩니다.', 19),
]

export const isApi = (url: URL) => url.pathname.startsWith('/api/')

/** 모든 /api 요청을 예시 데이터로 응답한다. 기록한 검토 결과는 다음 조회에 반영한다 */
export async function mockApi(page: Page) {
  const reviews = new Map<number, unknown>()
  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

  // 경로가 /api/ 로 시작하는 요청만. '**/api/**' 는 프론트 소스(/src/api/*.ts)까지 가로챈다
  await page.route(isApi, async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const method = route.request().method()

    if (path === '/api/projects' && method === 'GET') return json(route, [project, otherProject])
    if (path === '/api/projects' && method === 'POST') {
      const body = route.request().postDataJSON()
      if (body.gitUrl?.startsWith('http://')) return json(route, { title: 'Bad Request', status: 400, detail: 'https 주소만 허용함' }, 400)
      return json(route, { ...project, id: 3, name: body.name || 'new-repo', gitUrl: body.gitUrl ?? null }, 201)
    }
    if (path === '/api/projects/1/index') return json(route, indexResult)
    if (path === '/api/projects/1/sync') return json(route, project)
    if (path === '/api/projects/1/code-graph/entry-points') return json(route, entryPoints)
    if (path === '/api/projects/1/code-graph/sinks') return json(route, sinks)
    if (path === '/api/projects/1/code-graph/sink-paths') return json(route, sinkPaths)
    if (path === '/api/projects/1/analyses' && method === 'GET') return json(route, analysisList)
    if (path === '/api/projects/1/analyses' && method === 'POST') return json(route, analysis.job, 202)

    if (path === '/api/analyses/7') {
      const nodes = analysis.nodes.map((n) => (reviews.has(n.id) ? { ...n, props: { ...n.props, review: reviews.get(n.id) } } : n))
      return json(route, { ...analysis, nodes })
    }
    if (path === '/api/analyses/7/traces' || path === '/api/analyses/8/traces') return json(route, traces)
    if (path === '/api/analyses/8') return json(route, runningAnalysis)

    const review = path.match(/^\/api\/analyses\/7\/findings\/(\d+)\/review$/)
    if (review) {
      const body = route.request().postDataJSON()
      reviews.set(Number(review[1]), { ...body, reviewedAt: new Date().toISOString() })
      return json(route, findings.find((f) => f.id === Number(review[1])))
    }

    return json(route, { title: 'Not Found', status: 404, detail: `예시 데이터 없음: ${method} ${path}` }, 404)
  })
}
