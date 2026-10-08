import { Link, Route, Routes } from 'react-router'
import ProjectsPage from './pages/ProjectsPage'
import ProjectPage from './pages/ProjectPage'
import AnalysisPage from './pages/AnalysisPage'
import { Empty } from './components/ui'

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-7 place-items-center rounded-lg bg-orange-700 font-mono text-xs text-white">&lt;/&gt;</span>
            code-agent
          </Link>
          <span className="hidden text-sm text-zinc-500 sm:inline">AI 코드 보안 분석 에이전트</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route path="/analyses/:jobId" element={<AnalysisPage />} />
          <Route path="*" element={<Empty>없는 페이지예요. <Link className="underline" to="/">처음으로</Link></Empty>} />
        </Routes>
      </main>
    </div>
  )
}
