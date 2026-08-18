const TOKEN_KEY = 'soepfabriek_auth_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function lineAmount(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100
}

export function orderTotal(lines: { line_amount: number }[]): number {
  return Math.round(lines.reduce((sum, l) => sum + l.line_amount, 0) * 100) / 100
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export function formatDate(value: string | number | undefined | null): string {
  if (value == null || value === '') return '—'

  if (typeof value === 'number') {
    const ms = value > 1_000_000_000_000 ? value : value * 1000
    const d = new Date(ms)
    if (Number.isNaN(d.getTime())) return '—'
    const day = String(d.getDate()).padStart(2, '0')
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const y = d.getFullYear()
    return `${day}-${m}-${y}`
  }

  const text = String(value)
  const d = text.slice(0, 10)
  const [y, m, day] = d.split('-')
  if (!y || !m || !day) return text
  return `${day}-${m}-${y}`
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function parseApiError(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const o = body as Record<string, unknown>
    if (typeof o.message === 'string') return o.message
    if (typeof o.error === 'string') return o.error
    if (o.payload && typeof o.payload === 'object') {
      const p = o.payload as Record<string, unknown>
      if (typeof p.message === 'string') return p.message
    }
  }
  if (status === 401) return 'Je bent niet ingelogd of je sessie is verlopen.'
  if (status === 403) return 'Je hebt geen toegang tot deze actie.'
  if (status === 404) return 'De gevraagde gegevens zijn niet gevonden.'
  if (status >= 500) return 'Er ging iets mis op de server. Probeer het later opnieuw.'
  return 'Er is een fout opgetreden. Controleer je invoer en probeer opnieuw.'
}
