import { Badge, type Tone } from './ui'
import type { JobStatus, NodeStatus, ReviewDecision } from '../api/types'

const JOB: Record<JobStatus, [string, Tone]> = {
  PENDING: ['대기', 'gray'],
  RUNNING: ['진행 중', 'blue'],
  DONE: ['완료', 'green'],
  STOPPED: ['중단 (예산 소진)', 'yellow'],
  FAILED: ['실패', 'red'],
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const [label, tone] = JOB[status] ?? [status, 'gray']
  return <Badge tone={tone}>{label}</Badge>
}

const INTENTION: Partial<Record<NodeStatus, [string, Tone]>> = {
  OPEN: ['대기', 'gray'],
  CLAIMED: ['조사 중', 'blue'],
  DONE: ['완료', 'green'],
  FAILED: ['실패', 'red'],
}

export function IntentionStatusBadge({ status }: { status: NodeStatus }) {
  const [label, tone] = INTENTION[status] ?? [status, 'gray']
  return <Badge tone={tone}>{label}</Badge>
}

/** 발견의 검증 담당 판정 */
const VERDICT: Partial<Record<NodeStatus, [string, Tone]>> = {
  OPEN: ['검증 대기', 'gray'],
  CONFIRMED: ['확정', 'red'],
  REJECTED: ['기각 (오탐)', 'green'],
  UNCERTAIN: ['판단 불가', 'yellow'],
}

export function VerdictBadge({ status }: { status: NodeStatus }) {
  const [label, tone] = VERDICT[status] ?? [status, 'gray']
  return <Badge tone={tone}>{label}</Badge>
}

const SEVERITY: Record<string, [string, Tone]> = {
  critical: ['치명', 'red'],
  high: ['높음', 'orange'],
  medium: ['중간', 'yellow'],
  low: ['낮음', 'blue'],
  info: ['정보', 'gray'],
}

export const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info']

export function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return null
  const [label, tone] = SEVERITY[severity] ?? [severity, 'gray']
  return <Badge tone={tone}>심각도 {label}</Badge>
}

export const REVIEW_LABELS: Record<ReviewDecision, string> = {
  ACCEPTED: '취약점 인정',
  FALSE_POSITIVE: '오탐',
  FIXED: '조치 완료',
  WONT_FIX: '위험 수용',
}

const REVIEW_TONES: Record<ReviewDecision, Tone> = {
  ACCEPTED: 'red',
  FALSE_POSITIVE: 'green',
  FIXED: 'green',
  WONT_FIX: 'yellow',
}

export function ReviewBadge({ decision }: { decision?: ReviewDecision }) {
  if (!decision) return <Badge>사람 검토 전</Badge>
  return <Badge tone={REVIEW_TONES[decision]}>검토: {REVIEW_LABELS[decision]}</Badge>
}

const CATEGORY_TONES: Record<string, Tone> = {
  SQL: 'red',
  COMMAND: 'red',
  DESERIALIZATION: 'red',
  CODE_INJECTION: 'red',
  EXPRESSION_INJECTION: 'orange',
  PATH: 'orange',
  SSRF: 'orange',
  JNDI: 'orange',
  OPEN_REDIRECT: 'yellow',
}

export function CategoryBadge({ category, cwe }: { category: string; cwe?: string }) {
  return (
    <Badge tone={CATEGORY_TONES[category] ?? 'gray'}>
      {category}
      {cwe && <span className="ml-1 opacity-70">{cwe}</span>}
    </Badge>
  )
}
