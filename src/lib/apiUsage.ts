const DAILY_LIMIT = 14400
const STORAGE_KEY = 'englishup_api_usage'

type UsageData = { date: string; count: number }

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getUsage(): UsageData {
  if (typeof window === 'undefined') return { date: getToday(), count: 0 }
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return { date: getToday(), count: 0 }
  const data: UsageData = JSON.parse(raw)
  if (data.date !== getToday()) return { date: getToday(), count: 0 }
  return data
}

export function trackAPICall() {
  const usage = getUsage()
  usage.count++
  usage.date = getToday()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage))
}

export function getAPIUsage(): { count: number; limit: number; percentage: number } {
  const usage = getUsage()
  return {
    count: usage.count,
    limit: DAILY_LIMIT,
    percentage: Math.round((usage.count / DAILY_LIMIT) * 100),
  }
}
