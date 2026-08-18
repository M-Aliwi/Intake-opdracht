import { asList, api } from './client'
import { mapArticle, toXanoArticle } from './mappers'
import type { Article } from '../types'

export async function listArticles(): Promise<Article[]> {
  const data = await api.get<unknown>('articles', '/v1/articles/list')
  return asList<Record<string, unknown>>(data).map((row) =>
    mapArticle(row as Parameters<typeof mapArticle>[0]),
  )
}

export async function listActiveArticles(): Promise<Article[]> {
  try {
    const data = await api.get<unknown>('articles', '/v1/articles/active')
    const items = asList<Record<string, unknown>>(data)
    if (items.length > 0) {
      return items.map((row) => mapArticle(row as Parameters<typeof mapArticle>[0]))
    }
  } catch {
    // fall back to full list
  }
  const all = await listArticles()
  return all.filter((a) => a.active)
}

export async function getArticle(id: string | number): Promise<Article> {
  const data = await api.get<Record<string, unknown>>(
    'articles',
    `/v1/articles/id/${id}`,
  )
  return mapArticle(data)
}

export async function createArticle(payload: Omit<Article, 'id'>): Promise<Article> {
  const body = toXanoArticle({
    ...payload,
    status: payload.status ?? (payload.active ? 'published' : 'draft'),
  })
  const data = await api.post<Record<string, unknown>>(
    'articles',
    '/v1/articles/create',
    body,
  )
  return mapArticle(data)
}

export async function updateArticle(
  id: string | number,
  payload: Partial<Article>,
): Promise<Article> {
  const body = toXanoArticle(payload)
  const data = await api.patch<Record<string, unknown>>(
    'articles',
    `/v1/articles/id/${id}`,
    body,
  )
  return mapArticle(data)
}

export async function deleteArticle(id: string | number): Promise<void> {
  await api.delete('articles', `/v1/articles/id/${id}`)
}
