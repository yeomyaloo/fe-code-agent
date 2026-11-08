// be-code-agent REST API 응답 타입. 백엔드의 record 와 이름을 맞춘다

export interface Project {
  id: number
  name: string
  repoPath: string
  language: string
  gitUrl: string | null
  gitBranch: string | null
  commitSha: string | null
  syncedAt: string | null
  createdAt: string
}

export interface CreateProjectRequest {
  name?: string
  gitUrl?: string
  branch?: string
  repoPath?: string
}

export interface IndexResult {
  projectId: number
  files: number
  classes: number
  methods: number
  entryPoints: number
  sinks: number
  callEdges: number
  overrideEdges: number
  unresolvedCalls: number
  removedNodes: number
  retainedNodes: number
  parseErrors: string[]
  elapsedMs: number
}

export interface CodeNodeView {
  id: number
  kind: string
  qualifiedName: string
  filePath: string | null
  line: number | null
}

export interface EntryPointView {
  id: number
  httpMethod: string
  path: string
  handler: string
  filePath: string | null
  line: number | null
}

export interface SinkView {
  id: number
  category: string
  cwe: string
  api: string
  method: string
  snippet: string
  filePath: string | null
  line: number | null
}

export interface SinkPathView {
  entryPoint: EntryPointView
  sink: SinkView
  path: CodeNodeView[]
}

/** WAITING_APPROVAL: 계획이 나와서 사람 승인을 기다림 (Worker 를 돌리기 전) */
export type JobStatus = 'PENDING' | 'RUNNING' | 'WAITING_APPROVAL' | 'DONE' | 'STOPPED' | 'FAILED'

export interface JobView {
  id: number
  projectId: number
  status: JobStatus
  budgetTokens: number | null
  usedTokens: number
  inputTokens: number
  outputTokens: number
  error: string | null
  startedAt: string | null
  finishedAt: string | null
}

/** 프로젝트별 분석 목록의 한 줄 */
export interface JobSummaryView {
  job: JobView
  intentions: number
  /** 끝난(DONE / FAILED) 할 일 수 */
  intentionsFinished: number
  /** 발견 상태별 개수 */
  findings: Record<'OPEN' | 'CONFIRMED' | 'REJECTED' | 'UNCERTAIN', number>
}

export type NodeKind = 'GOAL' | 'INTENTION' | 'FACT' | 'FINDING' | 'HINT'
/** SKIPPED: 사람이 승인 단계에서 뺀 할 일 */
export type NodeStatus = 'OPEN' | 'CLAIMED' | 'DONE' | 'FAILED' | 'SKIPPED' | 'CONFIRMED' | 'REJECTED' | 'UNCERTAIN'

export interface Evidence {
  file: string
  line: number
  note: string
}

export interface Verification {
  verdict: 'confirmed' | 'rejected' | 'uncertain'
  reasoning: string
  blockingControls?: string | null
  severity?: string | null
  confidence?: string
  verifier?: string
  outcome?: string
  error?: string | null
}

export type ReviewDecision = 'ACCEPTED' | 'FALSE_POSITIVE' | 'FIXED' | 'WONT_FIX'

export interface Review {
  decision: ReviewDecision
  comment: string | null
  reviewedAt: string
}

/** FINDING 노드의 props */
export interface FindingProps {
  cwe?: string
  severity?: string
  confidence?: string
  exploitScenario?: string | null
  evidence?: Evidence[]
  sourceNodeId?: number | null
  sinkNodeId?: number | null
  workerId?: string
  verification?: Verification
  review?: Review
}

export interface NodeView {
  id: number
  kind: NodeKind
  status: NodeStatus
  title: string
  body: string | null
  /** 노드 종류마다 다름. FINDING 이면 FindingProps */
  props: Record<string, any>
  workerId: string | null
}

export interface AnalysisView {
  job: JobView
  nodes: NodeView[]
}

export interface TraceView {
  id: number
  intentionId: number | null
  workerId: string | null
  step: number
  role: string
  toolName: string | null
  content: string | null
  createdAt: string
}

/** llm: 계획 담당(Opus)이 할 일을 정함, paths: 진입점 → 위험 지점 경로마다 기계적으로 */
export type PlannerMode = 'llm' | 'paths'

export interface StartAnalysisRequest {
  planner: PlannerMode
  maxIntentions: number
  budgetTokens: number
  /** true 면 계획이 나올 때마다 Worker 를 돌리기 전에 사람 승인을 기다린다 */
  requireApproval: boolean
}

/** 목표(GOAL) 노드 props.approvals 의 한 항목 */
export interface ApprovalRecord {
  round: number
  decision: 'APPROVED' | 'REJECTED'
  skipped: number[]
  comment: string | null
  at: string
}

export interface ApproveRequest {
  skipIntentionIds: number[]
  comment: string | null
}
