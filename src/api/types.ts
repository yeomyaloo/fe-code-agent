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

export type JobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'STOPPED' | 'FAILED'

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

export type NodeKind = 'GOAL' | 'INTENTION' | 'FACT' | 'FINDING' | 'HINT'
export type NodeStatus = 'OPEN' | 'CLAIMED' | 'DONE' | 'FAILED' | 'CONFIRMED' | 'REJECTED' | 'UNCERTAIN'

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

export interface StartAnalysisRequest {
  maxIntentions: number
  budgetTokens: number
}
