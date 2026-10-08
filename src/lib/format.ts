const numberFormat = new Intl.NumberFormat('ko-KR')

export const formatNumber = (n: number | null | undefined) => (n == null ? '-' : numberFormat.format(n))

/** 1,234,567 → 123만 */
export function formatTokens(n: number | null | undefined) {
  if (n == null) return '-'
  if (n >= 10_000) return `${numberFormat.format(Math.round(n / 10_000))}만`
  return numberFormat.format(n)
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function formatDuration(startIso: string | null, endIso: string | null) {
  if (!startIso) return '-'
  const ms = (endIso ? new Date(endIso).getTime() : Date.now()) - new Date(startIso).getTime()
  const sec = Math.max(0, Math.round(ms / 1000))
  if (sec < 60) return `${sec}초`
  const min = Math.floor(sec / 60)
  return min < 60 ? `${min}분 ${sec % 60}초` : `${Math.floor(min / 60)}시간 ${min % 60}분`
}

/** com.example.vuln.service.UserServiceImpl#search(String) → UserServiceImpl#search(String) */
export function shortName(qualifiedName: string) {
  const hash = qualifiedName.indexOf('#')
  const owner = hash < 0 ? qualifiedName : qualifiedName.slice(0, hash)
  const simple = owner.slice(owner.lastIndexOf('.') + 1)
  return hash < 0 ? simple : simple + qualifiedName.slice(hash)
}

export function location(filePath: string | null | undefined, line: number | null | undefined) {
  if (!filePath) return ''
  return line ? `${filePath}:${line}` : filePath
}
