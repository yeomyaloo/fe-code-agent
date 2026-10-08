import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  useEntryPoints,
  useIndexProject,
  useProject,
  useProjectAnalyses,
  useSinkPaths,
  useSinks,
  useStartAnalysis,
  useSyncProject,
} from '../api/hooks'
import type { IndexResult, SinkPathView } from '../api/types'
import { Badge, Button, Card, Code, Empty, ErrorBox, Field, inputClass, Loading, Stat, Tabs } from '../components/ui'
import { CategoryBadge, JobStatusBadge } from '../components/status'
import { formatDateTime, formatNumber, formatTokens, location, shortName } from '../lib/format'

type GraphTab = 'paths' | 'entry-points' | 'sinks'

export default function ProjectPage() {
  const projectId = Number(useParams().projectId)
  const project = useProject(projectId)
  const sync = useSyncProject(projectId)
  const index = useIndexProject(projectId)

  if (project.isPending) return <Loading />
  if (project.error) return <ErrorBox error={project.error} />
  if (!project.data) return <Empty>프로젝트 #{projectId}가 없어요.</Empty>
  const p = project.data

  return (
    <div className="space-y-6">
      <div>
        <Link to="/" className="text-sm text-zinc-500 hover:underline">← 프로젝트</Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold">{p.name}</h1>
          <Badge>{p.language}</Badge>
          <span className="text-sm text-zinc-500">#{p.id}</span>
        </div>
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-zinc-600 sm:grid-cols-[auto_1fr] dark:text-zinc-400">
          {p.gitUrl ? (
            <>
              <dt className="text-zinc-500">Git</dt>
              <dd className="break-all">
                {p.gitUrl}
                {p.gitBranch && ` · ${p.gitBranch}`}
              </dd>
              <dt className="text-zinc-500">커밋</dt>
              <dd>
                <Code>{p.commitSha?.slice(0, 12) ?? '-'}</Code> · {formatDateTime(p.syncedAt)}에 받음
              </dd>
            </>
          ) : (
            <>
              <dt className="text-zinc-500">경로</dt>
              <dd className="break-all">{p.repoPath}</dd>
            </>
          )}
        </dl>
      </div>

      <Card
        title="① 코드 그래프"
        actions={
          <>
            {p.gitUrl && (
              <Button onClick={() => sync.mutate()} loading={sync.isPending}>
                최신 커밋 받기
              </Button>
            )}
            <Button variant="primary" onClick={() => index.mutate()} loading={index.isPending}>
              코드 그래프 만들기
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-500">
          LLM 없이 소스를 파싱해서 진입점, 위험 지점, 호출 경로를 찾아요. 코드가 바뀌면 다시 만들어 주세요.
        </p>
        <div className="mt-3 space-y-3">
          <ErrorBox error={sync.error ?? index.error} />
          {sync.isSuccess && !index.data && (
            <p className="text-sm text-green-700 dark:text-green-400">최신 커밋을 받았어요. 코드 그래프를 다시 만들어 주세요.</p>
          )}
          {index.data && <IndexSummary result={index.data} />}
        </div>
        <div className="mt-4">
          <CodeGraphTabs projectId={projectId} />
        </div>
      </Card>

      <StartAnalysisCard projectId={projectId} />
      <AnalysisList projectId={projectId} />
    </div>
  )
}

function IndexSummary({ result }: { result: IndexResult }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <Stat label="파일" value={formatNumber(result.files)} />
        <Stat label="클래스" value={formatNumber(result.classes)} />
        <Stat label="메서드" value={formatNumber(result.methods)} />
        <Stat label="진입점" value={formatNumber(result.entryPoints)} />
        <Stat label="위험 지점" value={formatNumber(result.sinks)} />
        <Stat label="걸린 시간" value={`${(result.elapsedMs / 1000).toFixed(1)}초`} />
      </div>
      <p className="text-xs text-zinc-500">
        호출 {formatNumber(result.callEdges)}개 · 상속 연결 {formatNumber(result.overrideEdges)}개 · 타입을 알 수 없는 호출{' '}
        {formatNumber(result.unresolvedCalls)}개
      </p>
      {result.parseErrors.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-yellow-700 dark:text-yellow-400">파싱 오류 {result.parseErrors.length}개</summary>
          <ul className="mt-1 space-y-0.5 font-mono text-xs text-zinc-500">
            {result.parseErrors.map((e) => <li key={e}>{e}</li>)}
          </ul>
        </details>
      )}
    </div>
  )
}

function CodeGraphTabs({ projectId }: { projectId: number }) {
  const [tab, setTab] = useState<GraphTab>('paths')
  const paths = useSinkPaths(projectId)
  const entryPoints = useEntryPoints(projectId)
  const sinks = useSinks(projectId)

  return (
    <div>
      <Tabs<GraphTab>
        tabs={[
          { id: 'paths', label: `진입점 → 위험 지점 경로 ${paths.data ? pairCount(paths.data) : ''}` },
          { id: 'entry-points', label: `진입점 ${entryPoints.data?.length ?? ''}` },
          { id: 'sinks', label: `위험 지점 ${sinks.data?.length ?? ''}` },
        ]}
        value={tab}
        onChange={setTab}
      />
      <div className="mt-3">
        {tab === 'paths' && (
          <QueryView query={paths} empty="경로가 없어요. 코드 그래프를 먼저 만들어 주세요.">
            {(data) => <PathList paths={data} />}
          </QueryView>
        )}
        {tab === 'entry-points' && (
          <QueryView query={entryPoints} empty="진입점이 없어요.">
            {(data) => (
              <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                {data.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 py-2">
                    <Badge tone="blue">{e.httpMethod}</Badge>
                    <Code className="font-medium">{e.path}</Code>
                    <span className="text-xs text-zinc-500">{shortName(e.handler)}</span>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        )}
        {tab === 'sinks' && (
          <QueryView query={sinks} empty="위험 지점이 없어요.">
            {(data) => (
              <ul className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                {data.map((s) => (
                  <li key={s.id} className="py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <CategoryBadge category={s.category} cwe={s.cwe} />
                      <Code>{s.api}</Code>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {shortName(s.method)} · {location(s.filePath, s.line)}
                    </div>
                    <pre className="mt-1 overflow-x-auto rounded bg-zinc-100 px-2 py-1 font-mono text-xs dark:bg-zinc-800">{s.snippet}</pre>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        )}
      </div>
    </div>
  )
}

/** 같은 (진입점, 위험 지점) 쌍은 가장 짧은 경로 하나만 보여준다. 백엔드가 할 일을 만들 때와 같은 기준 */
function shortestPerPair(paths: SinkPathView[]) {
  const byPair = new Map<string, SinkPathView>()
  for (const path of paths) {
    const key = `${path.entryPoint.id}->${path.sink.id}`
    if (!byPair.has(key)) byPair.set(key, path)
  }
  return [...byPair.values()]
}

const pairCount = (paths: SinkPathView[]) => shortestPerPair(paths).length

function PathList({ paths }: { paths: SinkPathView[] }) {
  return (
    <ul className="space-y-2">
      {shortestPerPair(paths).map((path) => (
        <li key={`${path.entryPoint.id}-${path.sink.id}`} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone="blue">{path.entryPoint.httpMethod}</Badge>
            <Code className="font-medium">{path.entryPoint.path}</Code>
            <span className="text-zinc-400">→</span>
            <CategoryBadge category={path.sink.category} cwe={path.sink.cwe} />
            <Code>{path.sink.api.slice(path.sink.api.lastIndexOf('.', path.sink.api.lastIndexOf('.') - 1) + 1)}</Code>
          </div>
          <ol className="mt-2 flex flex-wrap items-center gap-1 text-xs text-zinc-500">
            {path.path
              .filter((n) => n.kind === 'METHOD')
              .map((n, i) => (
                <li key={n.id} className="flex items-center gap-1">
                  {i > 0 && <span className="text-zinc-400">›</span>}
                  <Code>{shortName(n.qualifiedName)}</Code>
                </li>
              ))}
          </ol>
        </li>
      ))}
    </ul>
  )
}

function QueryView<T extends unknown[]>({ query, empty, children }: {
  query: { isPending: boolean; error: unknown; data?: T }
  empty: string
  children: (data: T) => ReactNode
}) {
  if (query.isPending) return <Loading />
  if (query.error) return <ErrorBox error={query.error} />
  if (!query.data || query.data.length === 0) return <Empty>{empty}</Empty>
  return <>{children(query.data)}</>
}

function StartAnalysisCard({ projectId }: { projectId: number }) {
  const navigate = useNavigate()
  const start = useStartAnalysis(projectId)
  const [maxIntentions, setMaxIntentions] = useState(5)
  const [budgetTokens, setBudgetTokens] = useState(2_000_000)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    start.mutate({ maxIntentions, budgetTokens }, { onSuccess: (job) => navigate(`/analyses/${job.id}`) })
  }

  return (
    <Card title="② 에이전트 분석 시작">
      <p className="text-sm text-zinc-500">
        경로마다 할 일을 만들고, Worker(Sonnet)가 코드를 조사한 뒤 Verifier(Opus)가 발견을 다시 검증해요. Anthropic API 사용량만큼 비용이 들어요.
      </p>
      <form onSubmit={submit} className="mt-3 grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Field label="조사할 경로 수 (할 일)" hint="1 ~ 100">
          <input
            type="number"
            min={1}
            max={100}
            className={inputClass}
            value={maxIntentions}
            onChange={(e) => setMaxIntentions(Number(e.target.value))}
          />
        </Field>
        <Field label="토큰 예산" hint={`약 ${formatNumber(Math.round(budgetTokens / 10_000))}만 토큰. 다 쓰면 멈춰요`}>
          <input
            type="number"
            min={10_000}
            step={10_000}
            className={inputClass}
            value={budgetTokens}
            onChange={(e) => setBudgetTokens(Number(e.target.value))}
          />
        </Field>
        <Button type="submit" variant="primary" loading={start.isPending}>
          분석 시작
        </Button>
      </form>
      <div className="mt-3">
        <ErrorBox error={start.error} />
      </div>
    </Card>
  )
}

function AnalysisList({ projectId }: { projectId: number }) {
  const analyses = useProjectAnalyses(projectId)

  return (
    <Card title={`③ 분석 결과 ${analyses.data ? analyses.data.length : ''}`}>
      {analyses.isPending && <Loading />}
      <ErrorBox error={analyses.error} />
      {analyses.data?.length === 0 && <Empty>아직 분석한 적이 없어요.</Empty>}
      {analyses.data && analyses.data.length > 0 && (
        <div className="-mx-4 -mb-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-y border-zinc-200 bg-zinc-50 text-left text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40">
              <tr>
                <th className="px-4 py-2 font-medium">분석</th>
                <th className="px-4 py-2 font-medium">상태</th>
                <th className="px-4 py-2 font-medium">시작</th>
                <th className="px-4 py-2 text-right font-medium">할 일</th>
                <th className="px-4 py-2 font-medium">발견</th>
                <th className="px-4 py-2 text-right font-medium">토큰</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {analyses.data.map(({ job, intentions, intentionsFinished, findings }) => (
                <tr key={job.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                  <td className="px-4 py-2">
                    <Link to={`/analyses/${job.id}`} className="font-medium text-orange-700 hover:underline dark:text-orange-400">
                      #{job.id}
                    </Link>
                  </td>
                  <td className="px-4 py-2"><JobStatusBadge status={job.status} /></td>
                  <td className="px-4 py-2 text-zinc-500">{formatDateTime(job.startedAt)}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{intentionsFinished} / {intentions}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {findings.CONFIRMED > 0 && <Badge tone="red">확정 {findings.CONFIRMED}</Badge>}
                      {findings.OPEN > 0 && <Badge>검증 대기 {findings.OPEN}</Badge>}
                      {findings.UNCERTAIN > 0 && <Badge tone="yellow">판단 불가 {findings.UNCERTAIN}</Badge>}
                      {findings.REJECTED > 0 && <Badge tone="green">기각 {findings.REJECTED}</Badge>}
                      {Object.values(findings).every((n) => n === 0) && <span className="text-zinc-400">-</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right text-zinc-500 tabular-nums">{formatTokens(job.usedTokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
