import type { NodeView } from '../../api/types'
import { Badge, Button, Empty, cx } from '../../components/ui'
import { CategoryBadge, IntentionStatusBadge } from '../../components/status'
import { formatNumber } from '../../lib/format'

/**
 * 할 일 목록. 할 일마다 실행 담당이 남긴 결론 FACT("할 일 #{id} 결론")를 붙여 보여준다.
 * LLM 계획이면 위에 계획 담당의 회차별 결론("계획 N회차 결론")도 보여준다.
 * (NodeView에 연결선이 없어서 백엔드의 제목 규칙으로 찾는다)
 */
export default function IntentionList({ nodes, intentions, onShowTraces }: {
  nodes: NodeView[]
  intentions: NodeView[]
  onShowTraces: (nodeId: number) => void
}) {
  const goal = nodes.find((n) => n.kind === 'GOAL')
  const plans = nodes
    .filter((n) => n.kind === 'FACT' && /^계획 \d+회차 결론$/.test(n.title))
    .sort((a, b) => (a.props.round ?? 0) - (b.props.round ?? 0))
  const conclusions = new Map(
    nodes
      .filter((n) => n.kind === 'FACT')
      .map((n) => [n.title.match(/^할 일 #(\d+) 결론$/)?.[1], n] as const)
      .filter(([id]) => id != null),
  )

  return (
    <div className="space-y-4">
      {goal?.props.planner === 'LLM' && <PlannerSummary goal={goal} plans={plans} onShowTraces={onShowTraces} />}
      {intentions.length === 0 ? (
        <Empty>할 일이 없어요.</Empty>
      ) : (
        <ul className="space-y-3">
          {intentions.map((intention) => {
            const conclusion = conclusions.get(String(intention.id))
            const props = conclusion?.props ?? {}
            const dependsOn: number[] = intention.props.dependsOn ?? []
            return (
              <li key={intention.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-zinc-500">#{intention.id}</span>
                  <IntentionStatusBadge status={intention.status} />
                  {intention.props.plannedRound != null && <Badge tone="purple">계획 {intention.props.plannedRound}회차</Badge>}
                  {intention.props.category && <CategoryBadge category={intention.props.category} cwe={intention.props.cwe} />}
                  {dependsOn.length > 0 && <Badge>선행 {dependsOn.map((id) => `#${id}`).join(', ')}</Badge>}
                  {intention.workerId && <Badge>{intention.workerId}</Badge>}
                  <Button variant="ghost" className="ml-auto" onClick={() => onShowTraces(intention.id)}>
                    기록 보기
                  </Button>
                </div>
                <h3 className={cx('mt-1 text-sm font-medium break-all', intention.title.includes('→') && 'font-mono')}>
                  {intention.title}
                </h3>
                {intention.props.instructions && (
                  <p className="mt-1 text-sm whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
                    <span className="font-medium">지시:</span> {intention.props.instructions}
                  </p>
                )}
                {conclusion?.body && (
                  <pre className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 font-sans text-sm whitespace-pre-wrap dark:bg-zinc-800/60">
                    {conclusion.body}
                  </pre>
                )}
                {conclusion && <RunStats props={props} />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function PlannerSummary({ goal, plans, onShowTraces }: {
  goal: NodeView
  plans: NodeView[]
  onShowTraces: (nodeId: number) => void
}) {
  return (
    <section className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900 dark:bg-purple-950/20">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">Planner</h3>
        <span className="text-xs text-zinc-500">{goal.body}</span>
        {goal.props.planningFinished && <Badge tone="green">계획 종료</Badge>}
        <Button variant="ghost" className="ml-auto" onClick={() => onShowTraces(goal.id)}>
          계획 기록 보기
        </Button>
      </div>
      {goal.props.finishReason && (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium">끝낸 이유:</span> {goal.props.finishReason}
        </p>
      )}
      {plans.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">계획 중이에요…</p>
      ) : (
        <ol className="mt-2 space-y-2">
          {plans.map((plan) => (
            <li key={plan.id} className="rounded-lg bg-white px-3 py-2 dark:bg-zinc-900">
              <div className="text-xs font-semibold text-purple-700 dark:text-purple-300">{plan.props.round}회차</div>
              <p className="mt-0.5 text-sm whitespace-pre-wrap">{plan.body || '(요약 없음)'}</p>
              <RunStats props={plan.props} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/** 백엔드가 결론 FACT 의 props 에 남긴 실행 통계 */
function RunStats({ props }: { props: Record<string, any> }) {
  return (
    <p className="mt-1 text-xs text-zinc-500">
      {props.outcome} · {props.steps}단계 · 입력 {formatNumber(props.inputTokens)} / 출력 {formatNumber(props.outputTokens)} 토큰
      {props.cacheReadTokens > 0 && ` (캐시 ${formatNumber(props.cacheReadTokens)})`}
      {props.error && <span className="text-red-600"> · {props.error}</span>}
    </p>
  )
}
