export type Id = number | string

export interface Organisation {
  id: Id
  name: string
  address?: string
  postcode?: string
  city?: string
  email?: string
  telephone?: string
  created_at?: string
}

export interface ContactPerson {
  id: Id
  organisation_id: Id
  first_name: string
  last_name: string
  email: string
  telephone?: string
  function?: string
}

export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface Article {
  id: Id
  article_number: string
  name: string
  description?: string
  price: number
  stock: number
  active: boolean
  status: ArticleStatus
}

/** Briefing statussen — gebruik als waarden richting Xano */
export type OrderStatus =
  | 'concept'
  | 'bevestigd'
  | 'in_behandeling'
  | 'gereed'
  | 'geannuleerd'

export interface SalesOrder {
  id: Id
  order_number?: string
  organisation_id: Id
  contact_person_id: Id
  order_date: string
  delivery_date: string
  status: OrderStatus
  notes?: string
  total_amount?: number
  organisation?: Organisation
  contact_person?: ContactPerson
}

export interface SalesOrderLine {
  id?: Id
  sales_order_id?: Id
  article_id: Id
  quantity: number
  unit_price: number
  line_amount: number
  article?: Article
}

export interface AuthUser {
  id?: Id
  name?: string
  email?: string
  [key: string]: unknown
}

export const ORDER_STATUSES: OrderStatus[] = [
  'concept',
  'bevestigd',
  'in_behandeling',
  'gereed',
  'geannuleerd',
]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  concept: 'Concept',
  bevestigd: 'Bevestigd',
  in_behandeling: 'In behandeling',
  gereed: 'Gereed',
  geannuleerd: 'Geannuleerd',
}

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status
}

export const ARTICLE_STATUSES: ArticleStatus[] = ['draft', 'published', 'archived']

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: 'Concept',
  published: 'Gepubliceerd',
  archived: 'Gearchiveerd',
}
