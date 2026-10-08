// 백엔드에 "프로젝트별 분석 작업 목록" API가 아직 없어서, 이 브라우저에서 시작한 작업 id를 기억해 둔다.
// 저장이 안 되는 환경(시크릿 창 등)에서도 화면은 동작해야 하므로 모든 접근을 try/catch 로 감싼다.

const KEY = 'fe-code-agent:recent-jobs'
const MAX_PER_PROJECT = 20

type Store = Record<string, number[]>

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}

export function recentJobs(projectId: number): number[] {
  return read()[projectId] ?? []
}

export function rememberJob(projectId: number, jobId: number) {
  try {
    const store = read()
    const ids = [jobId, ...(store[projectId] ?? []).filter((id) => id !== jobId)].slice(0, MAX_PER_PROJECT)
    localStorage.setItem(KEY, JSON.stringify({ ...store, [projectId]: ids }))
  } catch {
    // 저장 실패는 무시한다
  }
}
