import { useEffect, useRef } from 'react'
import type { TraceView } from '../../api/types'
import { Badge, cx, type Tone } from '../../components/ui'
import { formatDateTime } from '../../lib/format'

/** worker_trace 의 role 을 사람이 읽을 이름으로 */
const ROLES: Record<string, [string, Tone]> = {
  USER: ['할 일 전달', 'gray'],
  ASSISTANT: ['Claude 생각', 'orange'],
  TOOL_CALL: ['도구 호출', 'purple'],
  TOOL_RESULT: ['도구 결과', 'gray'],
  TOOL_ERROR: ['도구 오류', 'red'],
  REFUSAL: ['거절', 'red'],
}

const COLLAPSE_AT = 400

export default function TraceTimeline({ traces, live }: { traces: TraceView[]; live: boolean }) {
  const bottom = useRef<HTMLDivElement>(null)
  const lastId = traces.at(-1)?.id

  // 진행 중이면 새 기록이 올 때마다 아래로 따라간다
  useEffect(() => {
    if (live) bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [live, lastId])

  return (
    <ol className="relative space-y-3 border-l border-zinc-200 pl-4 dark:border-zinc-800">
      {traces.map((trace) => (
        <TraceItem key={trace.id} trace={trace} />
      ))}
      <div ref={bottom} />
    </ol>
  )
}

function TraceItem({ trace }: { trace: TraceView }) {
  const [label, tone] = ROLES[trace.role] ?? [trace.role, 'gray']
  const content = trace.content ?? ''
  const isTool = trace.role === 'TOOL_CALL' || trace.role === 'TOOL_RESULT' || trace.role === 'TOOL_ERROR'

  return (
    <li className="relative">
      <span
        className={cx(
          'absolute top-1.5 -left-[21px] size-2.5 rounded-full ring-4 ring-white dark:ring-zinc-900',
          trace.role === 'ASSISTANT' ? 'bg-orange-600' : trace.role === 'TOOL_CALL' ? 'bg-purple-600' : 'bg-zinc-400',
        )}
      />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge tone={tone}>{label}</Badge>
        {trace.toolName && <code className="font-mono font-medium">{trace.toolName}</code>}
        <span className="text-zinc-500">
          {trace.workerId} · {trace.intentionId != null && `#${trace.intentionId} · `}
          {formatDateTime(trace.createdAt)}
        </span>
      </div>
      {content && (
        content.length > COLLAPSE_AT || trace.role === 'USER' ? (
          <details className="mt-1">
            <summary className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
              {preview(content)}
            </summary>
            <Body content={content} mono={isTool} />
          </details>
        ) : (
          <Body content={content} mono={isTool} />
        )
      )}
    </li>
  )
}

function Body({ content, mono }: { content: string; mono: boolean }) {
  return (
    <pre
      className={cx(
        'mt-1 overflow-x-auto rounded-lg px-3 py-2 text-xs whitespace-pre-wrap break-words',
        mono ? 'bg-zinc-100 font-mono dark:bg-zinc-800' : 'bg-orange-50/60 font-sans text-sm dark:bg-orange-950/30',
      )}
    >
      {content}
    </pre>
  )
}

function preview(content: string) {
  const firstLine = content.split('\n').find((l) => l.trim()) ?? ''
  return firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine
}
