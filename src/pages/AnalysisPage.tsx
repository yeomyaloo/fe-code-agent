import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { isActive, useAnalysis, useProjects, useTraces, useVerify } from '../api/hooks'
import type { AnalysisView, NodeView } from '../api/types'
import { Button, Card, Empty, ErrorBox, Loading, Spinner, Stat, Tabs } from '../components/ui'
import { JobStatusBadge } from '../components/status'
import { formatDateTime, formatDuration, formatNumber, formatTokens } from '../lib/format'
import FindingList from './analysis/FindingList'
import IntentionList from './analysis/IntentionList'
import TraceTimeline from './analysis/TraceTimeline'

type Tab = 'findings' | 'intentions' | 'traces'

export default function AnalysisPage() {
  const jobId = Number(useParams().jobId)
  const analysis = useAnalysis(jobId)
  const [tab, setTab] = useState<Tab>('findings')
  const [traceFilter, setTraceFilter] = useState<number | null>(null)

  if (analysis.isPending) return <Loading />
  if (analysis.error) return <ErrorBox error={analysis.error} />
  const { job, nodes } = analysis.data
  const active = isActive(job.status)

  const findings = nodes.filter((n) => n.kind === 'FINDING')
  const intentions = nodes.filter((n) => n.kind === 'INTENTION')

  const showTraces = (nodeId: number) => {
    setTraceFilter(nodeId)
    setTab('traces')
  }

  return (
    <div className="space-y-6">
      <Header data={analysis.data} />
      <Summary data={analysis.data} findings={findings} intentions={intentions} />

      <div>
        <Tabs<Tab>
          tabs={[
            { id: 'findings', label: `발견 ${findings.length}` },
            { id: 'intentions', label: `할 일 ${intentions.length}` },
            {
              id: 'traces',
              label: (
                <span className="inline-flex items-center gap-1.5">
                  에이전트 기록 {active && <span className="size-2 animate-pulse rounded-full bg-blue-500" />}
                </span>
              ),
            },
          ]}
          value={tab}
          onChange={setTab}
        />
        <div className="mt-4">
          {tab === 'findings' && <FindingList jobId={jobId} findings={findings} onShowTraces={showTraces} />}
          {tab === 'intentions' && <IntentionList nodes={nodes} intentions={intentions} onShowTraces={showTraces} />}
          {tab === 'traces' && (
            <TracesTab jobId={jobId} active={active} nodes={nodes} filter={traceFilter} onFilter={setTraceFilter} />
          )}
        </div>
      </div>
    </div>
  )
}

function Header({ data }: { data: AnalysisView }) {
  const { job } = data
  const projects = useProjects()
  const verify = useVerify(job.id)
  const project = projects.data?.find((p) => p.id === job.projectId)
  const openFindings = data.nodes.filter((n) => n.kind === 'FINDING' && n.status === 'OPEN').length

  return (
    <div>
      <Link to={`/projects/${job.projectId}`} className="text-sm text-zinc-500 hover:underline">
        ← {project?.name ?? `프로젝트 #${job.projectId}`}
      </Link>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">분석 #{job.id}</h1>
        <JobStatusBadge status={job.status} />
        {isActive(job.status) && <Spinner className="text-blue-500" />}
        <div className="ml-auto flex flex-wrap gap-2">
          {!isActive(job.status) && openFindings > 0 && (
            <Button onClick={() => verify.mutate()} loading={verify.isPending}>
              검증 대기 {openFindings}건 다시 검증
            </Button>
          )}
          <a
            className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            href={`/api/analyses/${job.id}/report.html`}
            target="_blank"
            rel="noreferrer"
          >
            HTML 보고서
          </a>
          <a
            className="inline-flex items-center rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            href={`/api/analyses/${job.id}/report.sarif`}
            download
          >
            SARIF 내려받기
          </a>
        </div>
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        시작 {formatDateTime(job.startedAt)} · 걸린 시간 {formatDuration(job.startedAt, job.finishedAt)}
      </p>
      {job.error && (
        <div className="mt-2">
          <ErrorBox error={job.error} />
        </div>
      )}
      <div className="mt-2">
        <ErrorBox error={verify.error} />
      </div>
    </div>
  )
}

function Summary({ data, findings, intentions }: { data: AnalysisView; findings: NodeView[]; intentions: NodeView[] }) {
  const { job } = data
  const count = (list: NodeView[], status: string) => list.filter((n) => n.status === status).length
  const budget = job.budgetTokens ?? 0
  const ratio = budget > 0 ? Math.min(1, job.usedTokens / budget) : 0

  return (
    <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr]">
      <div className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <div className="flex items-baseline justify-between text-xs text-zinc-500">
          <span>토큰 사용량</span>
          <span>
            입력 {formatTokens(job.inputTokens)} · 출력 {formatTokens(job.outputTokens)}
          </span>
        </div>
        <div className="mt-0.5 text-lg font-semibold tabular-nums">
          {formatNumber(job.usedTokens)}
          <span className="text-sm font-normal text-zinc-500"> / {formatNumber(budget)}</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className={ratio > 0.9 ? 'h-full bg-red-500' : 'h-full bg-orange-600'}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>
      <Stat
        label="할 일"
        value={`${count(intentions, 'DONE') + count(intentions, 'FAILED')} / ${intentions.length}`}
        hint={`조사 중 ${count(intentions, 'CLAIMED')} · 실패 ${count(intentions, 'FAILED')}`}
      />
      <Stat label="확정된 취약점" value={<span className="text-red-600 dark:text-red-400">{count(findings, 'CONFIRMED')}</span>} hint={`검증 대기 ${count(findings, 'OPEN')}`} />
      <Stat label="오탐으로 기각" value={count(findings, 'REJECTED')} hint={`판단 불가 ${count(findings, 'UNCERTAIN')}`} />
    </div>
  )
}

function TracesTab({ jobId, active, nodes, filter, onFilter }: {
  jobId: number
  active: boolean
  nodes: NodeView[]
  filter: number | null
  onFilter: (id: number | null) => void
}) {
  const traces = useTraces(jobId, active)
  const titles = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  if (traces.isPending) return <Loading />
  if (traces.error) return <ErrorBox error={traces.error} />
  if (traces.data.length === 0) return <Empty>아직 기록이 없어요.</Empty>

  const groupIds = [...new Set(traces.data.map((t) => t.intentionId).filter((id): id is number => id != null))]

  return (
    <Card
      title="에이전트가 한 일"
      actions={
        <select
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          value={filter ?? ''}
          onChange={(e) => onFilter(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">전체 ({traces.data.length})</option>
          {groupIds.map((id) => {
            const node = titles.get(id)
            const prefix = node?.kind === 'FINDING' ? '검증' : '할 일'
            return (
              <option key={id} value={id}>
                {prefix} #{id} {node ? `· ${node.title.slice(0, 40)}` : ''}
              </option>
            )
          })}
        </select>
      }
    >
      <TraceTimeline traces={filter == null ? traces.data : traces.data.filter((t) => t.intentionId === filter)} live={active} />
    </Card>
  )
}
