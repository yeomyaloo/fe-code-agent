import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCreateProject, useProjects } from '../api/hooks'
import { Badge, Button, Card, Empty, ErrorBox, Field, inputClass, Loading, Tabs } from '../components/ui'
import { formatDateTime } from '../lib/format'

type SourceKind = 'git' | 'local'

export default function ProjectsPage() {
  const projects = useProjects()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">프로젝트</h1>
        <p className="mt-1 text-sm text-zinc-500">
          분석할 저장소를 등록하고, 코드 그래프를 만든 뒤 에이전트 분석을 시작해요.
        </p>
      </div>

      <RegisterForm />

      <Card title={`등록된 저장소 ${projects.data ? projects.data.length : ''}`}>
        {projects.isPending && <Loading />}
        <ErrorBox error={projects.error} />
        {projects.data?.length === 0 && <Empty>아직 등록된 저장소가 없어요.</Empty>}
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {[...(projects.data ?? [])].sort((a, b) => b.id - a.id).map((project) => (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                className="-mx-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-2 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <span className="font-medium">{project.name}</span>
                <Badge>{project.language}</Badge>
                {project.gitUrl ? (
                  <span className="min-w-0 truncate text-sm text-zinc-500">
                    {project.gitUrl}
                    {project.gitBranch && ` · ${project.gitBranch}`}
                    {project.commitSha && ` · ${project.commitSha.slice(0, 7)}`}
                  </span>
                ) : (
                  <span className="min-w-0 truncate text-sm text-zinc-500">{project.repoPath}</span>
                )}
                <span className="ml-auto text-xs text-zinc-500">{formatDateTime(project.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function RegisterForm() {
  const navigate = useNavigate()
  const create = useCreateProject()
  const [kind, setKind] = useState<SourceKind>('git')
  const [name, setName] = useState('')
  const [gitUrl, setGitUrl] = useState('')
  const [branch, setBranch] = useState('')
  const [repoPath, setRepoPath] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate(
      kind === 'git'
        ? { name: name.trim() || undefined, gitUrl: gitUrl.trim(), branch: branch.trim() || undefined }
        : { name: name.trim() || undefined, repoPath: repoPath.trim() },
      { onSuccess: (project) => navigate(`/projects/${project.id}`) },
    )
  }

  const canSubmit = kind === 'git' ? gitUrl.trim() !== '' : repoPath.trim() !== '' && name.trim() !== ''

  return (
    <Card title="저장소 등록">
      <Tabs<SourceKind>
        tabs={[
          { id: 'git', label: 'Git 주소' },
          { id: 'local', label: '서버 폴더 경로' },
        ]}
        value={kind}
        onChange={setKind}
      />
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
        {kind === 'git' ? (
          <>
            <div className="sm:col-span-2">
              <Field label="Git 주소" hint="공개 저장소의 https 주소. 서버가 얕은 클론(--depth 1)으로 받아요.">
                <input
                  className={inputClass}
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo.git"
                  required
                />
              </Field>
            </div>
            <Field label="브랜치 (선택)" hint="비우면 기본 브랜치">
              <input className={inputClass} value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="main" />
            </Field>
            <Field label="이름 (선택)" hint="비우면 저장소 이름">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          </>
        ) : (
          <>
            <Field label="이름">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="폴더 경로" hint="백엔드 서버 디스크 기준. 슬래시(/)로 적어요.">
              <input
                className={inputClass}
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                placeholder="C:/work/my-repo"
                required
              />
            </Field>
          </>
        )}
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button type="submit" variant="primary" loading={create.isPending} disabled={!canSubmit}>
            {kind === 'git' ? '클론하고 등록' : '등록'}
          </Button>
          {create.isPending && kind === 'git' && <span className="text-sm text-zinc-500">저장소를 받는 중이에요…</span>}
        </div>
        <div className="sm:col-span-2">
          <ErrorBox error={create.error} />
        </div>
      </form>
    </Card>
  )
}
