import { useState } from 'react'
import { useApprove, useReject } from '../../api/hooks'
import type { ApprovalRecord, NodeView } from '../../api/types'
import { Badge, Button, ErrorBox, inputClass } from '../../components/ui'
import { CategoryBadge } from '../../components/status'
import { formatDateTime } from '../../lib/format'

/**
 * 승인 대기(WAITING_APPROVAL) 중인 계획. Worker 가 돌기 전에 할 일을 보고 뺄 것을 고른 뒤 승인하거나 거절한다.
 * 체크를 끈 할 일은 SKIPPED 가 되고, 거기에 의존하던 할 일은 백엔드가 실패로 정리한다.
 */
export function ApprovalCard({ jobId, goal, intentions }: { jobId: number; goal?: NodeView; intentions: NodeView[] }) {
  const approve = useApprove(jobId)
  const reject = useReject(jobId)
  const pending = intentions.filter((n) => n.status === 'OPEN')
  const [skipped, setSkipped] = useState<Set<number>>(new Set())
  const [comment, setComment] = useState('')
  const round = goal?.props.plannerRound
  const busy = approve.isPending || reject.isPending
  const kept = pending.length - pending.filter((n) => skipped.has(n.id)).length

  const toggle = (id: number) =>
    setSkipped((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const submitApprove = () =>
    approve.mutate({
      skipIntentionIds: pending.filter((n) => skipped.has(n.id)).map((n) => n.id),
      comment: comment.trim() || null,
    })

  return (
    <section
      aria-label="계획 승인"
      className="rounded-xl border-2 border-purple-300 bg-purple-50/60 p-4 dark:border-purple-800 dark:bg-purple-950/30"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-semibold">계획 승인이 필요해요</h2>
        {round != null && goal?.props.planner === 'LLM' && <Badge tone="purple">계획 {round}회차</Badge>}
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        아직 Worker를 돌리지 않아서 토큰을 쓰지 않았어요. 조사할 할 일만 체크한 채로 승인하세요. 체크를 끈 할 일은
        건너뛰고, 거기에 의존하던 할 일은 실패로 정리돼요.
      </p>

      <ul className="mt-3 space-y-2">
        {pending.map((n) => (
          <li key={n.id}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
              <input
                type="checkbox"
                className="mt-1 size-4 accent-orange-700"
                checked={!skipped.has(n.id)}
                onChange={() => toggle(n.id)}
                aria-label={`#${n.id} 조사하기`}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-zinc-500">#{n.id}</span>
                  {n.props.category && <CategoryBadge category={n.props.category} cwe={n.props.cwe} />}
                  {(n.props.dependsOn ?? []).length > 0 && (
                    <Badge>선행 {(n.props.dependsOn as number[]).map((id) => `#${id}`).join(', ')}</Badge>
                  )}
                  {skipped.has(n.id) && <Badge tone="gray">뺄 예정</Badge>}
                </span>
                <span className="mt-0.5 block text-sm font-medium break-all">{n.title}</span>
                {n.props.instructions && (
                  <span className="mt-0.5 block text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                    {n.props.instructions}
                  </span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="block min-w-60 flex-1">
          <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">메모 (선택)</span>
          <input
            className={inputClass}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="예: 관리자 API는 범위 밖"
          />
        </label>
        <Button variant="primary" onClick={submitApprove} loading={approve.isPending} disabled={busy}>
          {kept === pending.length ? `${kept}건 승인하고 조사 시작` : `${kept}건만 조사 (${pending.length - kept}건 빼기)`}
        </Button>
        <Button
          onClick={() => {
            if (window.confirm('계획을 거절하고 이 분석을 멈출까요?')) reject.mutate(comment.trim() || null)
          }}
          loading={reject.isPending}
          disabled={busy}
        >
          거절하고 멈추기
        </Button>
      </div>
      <div className="mt-2 space-y-2">
        <ErrorBox error={approve.error} />
        <ErrorBox error={reject.error} />
      </div>
    </section>
  )
}

/** 지금까지의 승인·거절 기록 (목표 props.approvals) */
export function ApprovalHistory({ goal }: { goal?: NodeView }) {
  const approvals: ApprovalRecord[] = goal?.props.approvals ?? []
  if (approvals.length === 0) return null
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold">사람 승인 기록</h3>
      <ul className="mt-2 space-y-1 text-sm">
        {approvals.map((a, i) => (
          <li key={i} className="flex flex-wrap items-center gap-2">
            <Badge tone={a.decision === 'APPROVED' ? 'green' : 'red'}>{a.decision === 'APPROVED' ? '승인' : '거절'}</Badge>
            <span className="text-zinc-500">{a.round}회차 계획</span>
            {a.skipped.length > 0 && <span>뺀 할 일 {a.skipped.map((id) => `#${id}`).join(', ')}</span>}
            {a.comment && <span className="text-zinc-600 dark:text-zinc-400">“{a.comment}”</span>}
            <span className="ml-auto text-xs text-zinc-500">{formatDateTime(a.at)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
