import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  AnalysisView,
  CreateProjectRequest,
  EntryPointView,
  IndexResult,
  JobStatus,
  JobSummaryView,
  JobView,
  NodeView,
  Project,
  ReviewDecision,
  SinkPathView,
  SinkView,
  StartAnalysisRequest,
  TraceView,
} from './types'

/** 진행 중인 작업은 2초마다 다시 불러온다 */
const POLL_MS = 2000
const isActive = (status?: JobStatus) => status === 'PENDING' || status === 'RUNNING'

export const keys = {
  projects: ['projects'] as const,
  entryPoints: (projectId: number) => ['projects', projectId, 'entry-points'] as const,
  sinks: (projectId: number) => ['projects', projectId, 'sinks'] as const,
  sinkPaths: (projectId: number, maxDepth: number) => ['projects', projectId, 'sink-paths', maxDepth] as const,
  projectAnalyses: (projectId: number) => ['projects', projectId, 'analyses'] as const,
  analysis: (jobId: number) => ['analyses', jobId] as const,
  traces: (jobId: number) => ['analyses', jobId, 'traces'] as const,
}

// ---- 프로젝트 ----

export function useProjects() {
  return useQuery({ queryKey: keys.projects, queryFn: () => api.get<Project[]>('/api/projects') })
}

export function useProject(projectId: number) {
  const projects = useProjects()
  return { ...projects, data: projects.data?.find((p) => p.id === projectId) }
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateProjectRequest) => api.post<Project>('/api/projects', request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.projects }),
  })
}

export function useSyncProject(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<Project>(`/api/projects/${projectId}/sync`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.projects }),
  })
}

export function useIndexProject(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<IndexResult>(`/api/projects/${projectId}/index`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects', projectId] }),
  })
}

// ---- 코드 그래프 ----

export function useEntryPoints(projectId: number) {
  return useQuery({
    queryKey: keys.entryPoints(projectId),
    queryFn: () => api.get<EntryPointView[]>(`/api/projects/${projectId}/code-graph/entry-points`),
  })
}

export function useSinks(projectId: number) {
  return useQuery({
    queryKey: keys.sinks(projectId),
    queryFn: () => api.get<SinkView[]>(`/api/projects/${projectId}/code-graph/sinks`),
  })
}

export function useSinkPaths(projectId: number, maxDepth = 12) {
  return useQuery({
    queryKey: keys.sinkPaths(projectId, maxDepth),
    queryFn: () => api.get<SinkPathView[]>(`/api/projects/${projectId}/code-graph/sink-paths?maxDepth=${maxDepth}`),
  })
}

// ---- 분석 ----

export function useProjectAnalyses(projectId: number) {
  return useQuery({
    queryKey: keys.projectAnalyses(projectId),
    queryFn: () => api.get<JobSummaryView[]>(`/api/projects/${projectId}/analyses`),
    // 진행 중인 작업이 있으면 목록도 갱신한다
    refetchInterval: (query) => (query.state.data?.some((s) => isActive(s.job.status)) ? POLL_MS : false),
  })
}

export function useStartAnalysis(projectId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: StartAnalysisRequest) => api.post<JobView>(`/api/projects/${projectId}/analyses`, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.projectAnalyses(projectId) }),
  })
}

export function useAnalysis(jobId: number) {
  return useQuery({
    queryKey: keys.analysis(jobId),
    queryFn: () => api.get<AnalysisView>(`/api/analyses/${jobId}`),
    refetchInterval: (query) => (isActive(query.state.data?.job.status) ? POLL_MS : false),
  })
}

export function useTraces(jobId: number, active: boolean) {
  return useQuery({
    queryKey: keys.traces(jobId),
    queryFn: () => api.get<TraceView[]>(`/api/analyses/${jobId}/traces`),
    refetchInterval: active ? POLL_MS : false,
  })
}

export function useVerify(jobId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<JobView>(`/api/analyses/${jobId}/verify`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.analysis(jobId) }),
  })
}

export function useReview(jobId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ findingId, decision, comment }: { findingId: number; decision: ReviewDecision; comment: string }) =>
      api.post<NodeView>(`/api/analyses/${jobId}/findings/${findingId}/review`, {
        decision,
        comment: comment.trim() || null,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.analysis(jobId) }),
  })
}

export { isActive }
