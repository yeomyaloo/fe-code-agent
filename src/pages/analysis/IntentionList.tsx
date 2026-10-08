import type { NodeView } from '../../api/types'
import { Badge, Button, Empty } from '../../components/ui'
import { CategoryBadge, IntentionStatusBadge } from '../../components/status'
import { formatNumber } from '../../lib/format'

/**
 * 할 일 목록. 할 일마다 실행 담당이 남긴 결론 FACT("할 일 #{id} 결론")를 붙여 보여준다.
 * (NodeView에 연결선이 없어서 백엔드의 제목 규칙으로 찾는다)
 */
export default function IntentionList({ nodes, intentions, onShowTraces }: {
  nodes: NodeView[]
  intentions: NodeView[]
  onShowTraces: (nodeId: number) => void
}) {
  if (intentions.length === 0) return <Empty>할 일이 없어요.</Empty>
  const conclusions = new Map(
    nodes
      .filter((n) => n.kind === 'FACT')
      .map((n) => [n.title.match(/^할 일 #(\d+) 결론$/)?.[1], n] as const)
      .filter(([id]) => id != null),
  )

  return (
    <ul className="space-y-3">
      {intentions.map((intention) => {
        const conclusion = conclusions.get(String(intention.id))
        const props = conclusion?.props ?? {}
        return (
          <li key={intention.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-zinc-500">#{intention.id}</span>
              <IntentionStatusBadge status={intention.status} />
              {intention.props.category && <CategoryBadge category={intention.props.category} cwe={intention.props.cwe} />}
              {intention.workerId && <Badge>{intention.workerId}</Badge>}
              <Button variant="ghost" className="ml-auto" onClick={() => onShowTraces(intention.id)}>
                기록 보기
              </Button>
            </div>
            <h3 className="mt-1 font-mono text-sm font-medium break-all">{intention.title}</h3>
            {conclusion?.body && (
              <pre className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 font-sans text-sm whitespace-pre-wrap dark:bg-zinc-800/60">
                {conclusion.body}
              </pre>
            )}
            {conclusion && (
              <p className="mt-2 text-xs text-zinc-500">
                {props.outcome} · {props.steps}단계 · 입력 {formatNumber(props.inputTokens)} / 출력{' '}
                {formatNumber(props.outputTokens)} 토큰
                {props.cacheReadTokens > 0 && ` (캐시 ${formatNumber(props.cacheReadTokens)})`}
                {props.error && <span className="text-red-600"> · {props.error}</span>}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
