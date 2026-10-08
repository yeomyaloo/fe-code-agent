# fe-code-agent

be-code-agent(AI 코드 보안 분석 에이전트, `../code-agent`)의 웹 프론트. React 19 + TypeScript + Vite 6 + React Router 7 + TanStack Query 5 + Tailwind CSS 4.

## 명령

```bash
npm run dev        # localhost:5173, /api 는 VITE_API_TARGET(기본 localhost:8080)으로 프록시
npm run build      # tsc -b 타입 검사 + vite build
npm run typecheck  # 타입 검사만
npm run test:e2e   # Playwright 화면 테스트 (백엔드 불필요, 예시 데이터)
npm run screenshots  # docs/screenshots/*.png 다시 만들기
```

- Node 20.12에서도 돌아야 한다. Vite 7 이상, Node 20.19+를 요구하는 패키지로 올리지 않는다.
- 백엔드가 떠 있어야 화면이 채워진다. 백엔드 실행은 `../code-agent`에서 `./gradlew bootRun`.

## 구조

- `src/api/types.ts`는 백엔드 record(`ProjectController`, `AnalysisController`, `CodeGraphQuery`)와 필드 이름을 맞춘다. 백엔드 API가 바뀌면 여기부터 고친다.
- API 호출은 `src/api/hooks.ts`의 React Query 훅으로만 한다. 컴포넌트에서 fetch 를 직접 부르지 않는다.
- 진행 중인 분석(PENDING/RUNNING)은 2초 폴링(`refetchInterval`).
- 공통 UI는 `components/ui.tsx`, 상태 배지는 `components/status.tsx`에 모은다.
- 발견(FINDING)의 세부 내용은 `props`(JSON)에 있다. 타입은 `FindingProps`.
- 화면 테스트의 가짜 API는 `e2e/mockApi.ts`. 백엔드 API를 새로 쓰면 여기에도 응답을 추가한다. 가로채기는 `isApi`(경로가 `/api/`로 시작)로만 한다. `'**/api/**'` 패턴은 프론트 소스(`/src/api/*.ts`)까지 가로채서 앱이 안 뜬다.
- 화면 확인은 `.mcp.json`의 Playwright MCP를 쓸 수 있다.

## 규칙

- 화면 문구, 주석은 한국어. 문구는 "~해요" 체.
- 스타일은 Tailwind 유틸리티만 쓴다. 라이트·다크 모드 둘 다 `dark:` 로 맞춘다.
- localStorage 접근은 try/catch로 감싼다(저장이 안 되는 환경에서도 화면이 떠야 함).
- 작업이 끝나고 `npm run build`와 `npm run test:e2e`가 통과하면 커밋하고 푸시해도 된다. 기능을 바꾸면 README의 화면 표를 갱신하고, 화면이 바뀌면 `npm run screenshots`로 스크린샷도 다시 만든다.
- 사용자에게 설명과 요약은 한국어로 한다.
