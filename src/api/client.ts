import {
  clearStoredToken,
  getStoredToken,
  parseApiError,
} from '../utils/helpers'

const baseUrl = import.meta.env.VITE_XANO_BASE_URL?.replace(/\/$/, '') ?? ''
const authApi = import.meta.env.VITE_XANO_AUTH_API ?? 'fZ6YL3Gi'

export const apiGroups = {
  organisations: import.meta.env.VITE_XANO_ORGANISATIONS_API?.trim() ?? 'organisations',
  contacts: import.meta.env.VITE_XANO_CONTACTS_API?.trim() ?? 'mvWpTZBG',
  articles: import.meta.env.VITE_XANO_ARTICLES_API?.trim() ?? 'rl8ZfRw1',
  orders: import.meta.env.VITE_XANO_ORDERS_API?.trim() ?? '3YeASv8x',
  lines: import.meta.env.VITE_XANO_LINES_API?.trim() ?? 'lines',
} as const

export type ApiGroup = keyof typeof apiGroups

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

function authUrl(path: string): string {
  return `${baseUrl}/api:${authApi}${path}`
}

export function groupUrl(group: ApiGroup, path: string): string {
  const slug = apiGroups[group]
  if (!slug) {
    throw new ApiError(`API-groep "${group}" is niet geconfigureerd in .env.`, 0)
  }
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}/api:${slug}${normalized}`
}

type RequestOptions = {
  method?: string
  body?: unknown
  auth?: boolean
  group?: ApiGroup
  path: string
}

async function request<T>(options: RequestOptions): Promise<T> {
  const { method = 'GET', body, auth = true, group, path } = options
  const url = group ? groupUrl(group, path) : authUrl(path)

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (auth) {
    const token = getStoredToken()
    if (!token) {
      throw new ApiError('Je bent niet ingelogd.', 401)
    }
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let payload: unknown = null
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text) as unknown
    } catch {
      payload = text
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearStoredToken()
    }
    throw new ApiError(parseApiError(payload, res.status), res.status)
  }

  return payload as T
}

export function isDataApiConfigured(): boolean {
  return Boolean(apiGroups.organisations && apiGroups.contacts && apiGroups.articles)
}

export const api = {
  get: <T>(group: ApiGroup, path: string, opts?: { auth?: boolean }) =>
    request<T>({ group, path, auth: opts?.auth ?? true }),
  post: <T>(group: ApiGroup, path: string, body: unknown, opts?: { auth?: boolean }) =>
    request<T>({ group, path, method: 'POST', body, auth: opts?.auth ?? true }),
  patch: <T>(group: ApiGroup, path: string, body: unknown, opts?: { auth?: boolean }) =>
    request<T>({ group, path, method: 'PATCH', body, auth: opts?.auth ?? true }),
  delete: <T>(group: ApiGroup, path: string, opts?: { auth?: boolean }) =>
    request<T>({ group, path, method: 'DELETE', auth: opts?.auth ?? true }),
}

export interface AuthResponse {
  authToken: string
  user_id: string | number
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>({
    path: '/auth/login',
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>({
    path: '/auth/signup',
    method: 'POST',
    body: { name, email, password },
    auth: false,
  })
}

export async function fetchMe<T = Record<string, unknown>>(): Promise<T> {
  return request<T>({ path: '/auth/me' })
}

/** Normalise Xano list responses (array, paginated object, etc.) */
export function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    for (const key of ['items', 'records', 'data', 'results']) {
      if (Array.isArray(o[key])) return o[key] as T[]
    }
  }
  return []
}
