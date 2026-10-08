/** 백엔드 오류 응답(ProblemDetail)의 detail 을 메시지로 담는다 */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, '백엔드에 연결할 수 없음. be-code-agent가 실행 중인지 확인할 것')
  }

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`
    try {
      const problem = await response.json()
      message = problem.detail || problem.title || message
    } catch {
      // 본문이 JSON이 아니면 상태 코드만 보여준다
    }
    if (response.status === 502 || response.status === 504) {
      message = '백엔드에 연결할 수 없음. be-code-agent가 실행 중인지 확인할 것'
    }
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
}
