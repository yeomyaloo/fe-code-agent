import { useState } from 'react'
import { useReview } from '../../api/hooks'
import type { FindingProps, NodeView, ReviewDecision } from '../../api/types'
import { Badge, Button, Code, Empty, ErrorBox, inputClass } from '../../components/ui'
import { REVIEW_LABELS, ReviewBadge, SEVERITY_ORDER, SeverityBadge, VerdictBadge } from '../../components/status'

/** 확정 → 검증 대기 → 판단 불가 → 기각 순, 같은 판정 안에서는 심각도 순 */
const VERDICT_ORDER = ['CONFIRMED', 'OPEN', 'UNCERTAIN', 'REJECTED']

const severityOf = (p: FindingProps) => p.verification?.severity || p.severity

export default function FindingList({ jobId, findings, onShowTraces }: {
  jobId: number
  findings: NodeView[]
  onShowTraces: (nodeId: number) => void
}) {
  const [showRejected, setShowRejected] = useState(false)
  if (findings.length === 0) {
    return <Empty>아직 발견이 없어요. 에이전트가 취약점을 찾으면 여기에 나타나요.</Empty>
  }

  const sorted = [...findings].sort((a, b) => {
    const byVerdict = VERDICT_ORDER.indexOf(a.status) - VERDICT_ORDER.indexOf(b.status)
    if (byVerdict !== 0) return byVerdict
    return SEVERITY_ORDER.indexOf(severityOf(a.props) ?? 'info') - SEVERITY_ORDER.indexOf(severityOf(b.props) ?? 'info')
  })
  const rejected = sorted.filter((f) => f.status === 'REJECTED').length
  const visible = showRejected ? sorted : sorted.filter((f) => f.status !== 'REJECTED')

  return (
    <div className="space-y-3">
      {rejected > 0 && (
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" checked={showRejected} onChange={(e) => setShowRejected(e.target.checked)} />
          오탐으로 기각된 발견 {rejected}건도 보기
        </label>
      )}
      {visible.map((finding) => (
        <FindingCard key={finding.id} jobId={jobId} finding={finding} onShowTraces={onShowTraces} />
      ))}
    </div>
  )
}

function FindingCard({ jobId, finding, onShowTraces }: {
  jobId: number
  finding: NodeView
  onShowTraces: (nodeId: number) => void
}) {
  const p = finding.props as FindingProps
  const v = p.verification

  return (
    <article className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictBadge status={finding.status} />
          <SeverityBadge severity={severityOf(p)} />
          {p.cwe && <Badge tone="purple">{p.cwe}</Badge>}
          {p.confidence && <Badge>Worker 확신 {p.confidence}</Badge>}
          <ReviewBadge decision={p.review?.decision} />
          <span className="ml-auto text-xs text-zinc-500">발견 #{finding.id}</span>
        </div>
        <h3 className="text-base font-semibold">{finding.title}</h3>
        {finding.body && <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{finding.body}</p>}

        {p.exploitScenario && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-500">공격 예시</h4>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-zinc-100 px-3 py-2 font-mono text-xs whitespace-pre-wrap dark:bg-zinc-800">
              {p.exploitScenario}
            </pre>
          </div>
        )}

        {p.evidence && p.evidence.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-500">근거 코드</h4>
            <ul className="mt-1 space-y-1 text-sm">
              {p.evidence.map((e, i) => (
                <li key={i} className="flex flex-wrap gap-x-2">
                  <Code className="text-orange-700 dark:text-orange-400">{e.file}:{e.line}</Code>
                  <span className="text-zinc-600 dark:text-zinc-400">{e.note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {v && (
        <div className="space-y-1 border-t border-zinc-200 bg-zinc-50/70 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-800/30">
          <h4 className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
            Verifier 판정
            {v.confidence && <Badge>확신 {v.confidence}</Badge>}
          </h4>
          <p className="whitespace-pre-wrap">{v.reasoning}</p>
          {v.blockingControls && (
            <p className="text-zinc-600 dark:text-zinc-400">
              <span className="font-medium">확인한 방어 장치:</span> {v.blockingControls}
            </p>
          )}
          {v.error && <p className="text-red-600">{v.error}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <ReviewForm jobId={jobId} finding={finding} />
        <Button variant="ghost" className="ml-auto" onClick={() => onShowTraces(finding.id)}>
          검증 기록 보기
        </Button>
      </div>
    </article>
  )
}

function ReviewForm({ jobId, finding }: { jobId: number; finding: NodeView }) {
  const current = (finding.props as FindingProps).review
  const review = useReview(jobId)
  const [decision, setDecision] = useState<ReviewDecision>(current?.decision ?? 'ACCEPTED')
  const [comment, setComment] = useState(current?.comment ?? '')

  return (
    <form
      className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        review.mutate({ findingId: finding.id, decision, comment })
      }}
    >
      <span className="text-xs font-semibold text-zinc-500">사람 검토</span>
      <select
        className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        value={decision}
        onChange={(e) => setDecision(e.target.value as ReviewDecision)}
      >
        {(Object.keys(REVIEW_LABELS) as ReviewDecision[]).map((d) => (
          <option key={d} value={d}>{REVIEW_LABELS[d]}</option>
        ))}
      </select>
      <input
        className={`${inputClass} min-w-40 flex-1`}
        placeholder="메모 (선택)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button type="submit" loading={review.isPending}>{current ? '검토 수정' : '검토 저장'}</Button>
      {review.isSuccess && <span className="text-xs text-green-700 dark:text-green-400">저장됨</span>}
      <div className="w-full">
        <ErrorBox error={review.error} />
      </div>
    </form>
  )
}
