import { lineAmount } from '../utils/helpers'
import {
  ORDER_STATUS_LABELS,
  type Article,
  type ArticleStatus,
  type ContactPerson,
  type Organisation,
  type OrderStatus,
  type SalesOrder,
  type SalesOrderLine,
} from '../types'

type XanoOrganisation = {
  id?: number | string
  name?: string
  address?: string
  postcode?: string
  city?: string
  email?: string
  phone_number?: string
  created_at?: string | number
}

type XanoContact = {
  id?: number | string
  first_name?: string
  last_name?: string
  function?: string
  email?: string
  phone_number?: string
  organization_id?: number | string
}

type XanoArticle = {
  id?: number | string
  article_number?: string
  article_name?: string
  description?: string
  sales_price?: number
  stock?: number
  availability?: boolean
  status?: ArticleStatus
}

/** Xano enum values (title case, spaces) ↔ frontend slugs */
export const UI_TO_XANO_ORDER_STATUS: Record<OrderStatus, string> = {
  concept: 'Concept',
  bevestigd: 'Bevestigd',
  in_behandeling: 'In behandeling',
  gereed: 'Gereed',
  geannuleerd: 'Geannuleerd',
}

const LEGACY_ORDER_STATUS: Record<string, OrderStatus> = {
  pending: 'in_behandeling',
  confirmed: 'bevestigd',
  delivered: 'gereed',
  cancelled: 'geannuleerd',
}

const XANO_TO_UI_ORDER_STATUS: Record<string, OrderStatus> = {
  ...Object.fromEntries(
    Object.entries(UI_TO_XANO_ORDER_STATUS).map(([ui, xano]) => [xano, ui as OrderStatus]),
  ),
  ...LEGACY_ORDER_STATUS,
}

export function toXanoOrderStatus(status: OrderStatus): string {
  return UI_TO_XANO_ORDER_STATUS[status]
}

export function normalizeOrderStatus(status?: string): OrderStatus {
  if (!status) return 'concept'
  if (status in ORDER_STATUS_LABELS) return status as OrderStatus
  if (status in XANO_TO_UI_ORDER_STATUS) return XANO_TO_UI_ORDER_STATUS[status]
  const slug = status.toLowerCase().replace(/\s+/g, '_')
  if (slug in ORDER_STATUS_LABELS) return slug as OrderStatus
  return LEGACY_ORDER_STATUS[status] ?? 'concept'
}

type XanoOrder = {
  id?: number | string
  order_number?: string
  organization?: number | string
  contact_person?: number | string
  order_date?: string
  delivery_date?: string
  status?: string
  notes?: string
  total_amount?: number
}

type XanoOrderLine = {
  id?: number | string
  order?: number | string
  article?: number | string
  quantity?: number
  unit_price?: number
  line_amount?: number
  amount?: number
}

export function mapOrganisation(raw: XanoOrganisation): Organisation {
  return {
    id: raw.id ?? '',
    name: raw.name ?? '',
    address: raw.address,
    postcode: raw.postcode,
    city: raw.city,
    email: raw.email,
    telephone: raw.phone_number,
    created_at:
      raw.created_at != null
        ? typeof raw.created_at === 'number'
          ? String(raw.created_at)
          : raw.created_at
        : undefined,
  }
}

export function toXanoOrganisation(org: Partial<Organisation>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (org.name !== undefined) payload.name = org.name
  if (org.address !== undefined) payload.address = org.address
  if (org.postcode !== undefined) payload.postcode = org.postcode
  if (org.city !== undefined) payload.city = org.city
  if (org.email !== undefined) payload.email = org.email
  if (org.telephone !== undefined) payload.phone_number = org.telephone
  return payload
}

export function mapContact(raw: XanoContact): ContactPerson {
  return {
    id: raw.id ?? '',
    organisation_id: raw.organization_id ?? '',
    first_name: raw.first_name ?? '',
    last_name: raw.last_name ?? '',
    email: raw.email ?? '',
    telephone: raw.phone_number,
    function: raw.function,
  }
}

export function toXanoContact(contact: Partial<ContactPerson>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (contact.first_name !== undefined) payload.first_name = contact.first_name
  if (contact.last_name !== undefined) payload.last_name = contact.last_name
  if (contact.email !== undefined) payload.email = contact.email
  if (contact.telephone !== undefined) payload.phone_number = contact.telephone
  if (contact.function !== undefined) payload.function = contact.function
  if (contact.organisation_id !== undefined) payload.organization_id = contact.organisation_id
  return payload
}

export function mapArticle(raw: XanoArticle): Article {
  const active =
    raw.availability === true ||
    raw.status === 'published' ||
    (raw.availability === undefined && raw.status === undefined)

  return {
    id: raw.id ?? '',
    article_number: raw.article_number ?? '',
    name: raw.article_name ?? '',
    description: raw.description,
    price: Number(raw.sales_price ?? 0),
    stock: Number(raw.stock ?? 0),
    active,
    status: raw.status ?? (active ? 'published' : 'draft'),
  }
}

export function toXanoArticle(article: Partial<Article>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (article.article_number !== undefined) payload.article_number = article.article_number
  if (article.name !== undefined) payload.article_name = article.name
  if (article.description !== undefined) payload.description = article.description
  if (article.price !== undefined) payload.sales_price = article.price
  if (article.stock !== undefined) payload.stock = article.stock
  if (article.active !== undefined) payload.availability = article.active
  if (article.status !== undefined) payload.status = article.status
  return payload
}

export function mapOrder(raw: XanoOrder): SalesOrder {
  return {
    id: raw.id ?? '',
    order_number: raw.order_number,
    organisation_id: raw.organization ?? '',
    contact_person_id: raw.contact_person ?? '',
    order_date: raw.order_date ?? '',
    delivery_date: raw.delivery_date ?? '',
    status: normalizeOrderStatus(raw.status),
    notes: raw.notes,
    total_amount: raw.total_amount != null ? Number(raw.total_amount) : undefined,
  }
}

export function toXanoOrderUpdate(order: Partial<SalesOrder>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  if (order.order_number !== undefined) payload.order_number = order.order_number
  if (order.organisation_id !== undefined) payload.organization = order.organisation_id
  if (order.contact_person_id !== undefined) payload.contact_person = order.contact_person_id
  if (order.order_date !== undefined) payload.order_date = order.order_date
  if (order.delivery_date !== undefined) payload.delivery_date = order.delivery_date
  if (order.status !== undefined) payload.status = toXanoOrderStatus(order.status)
  if (order.notes !== undefined) payload.notes = order.notes
  return payload
}

export function toXanoOrder(order: {
  order_number: string
  organisation_id: string | number
  contact_person_id: string | number
  order_date: string
  delivery_date: string
  status: OrderStatus
  notes?: string
}): Record<string, unknown> {
  return {
    order_number: order.order_number,
    organization: order.organisation_id,
    contact_person: order.contact_person_id,
    order_date: order.order_date,
    delivery_date: order.delivery_date,
    status: toXanoOrderStatus(order.status),
    notes: order.notes,
  }
}

export function mapOrderLine(raw: XanoOrderLine): SalesOrderLine {
  const quantity = Number(raw.quantity ?? 0)
  const unitPrice = Number(raw.unit_price ?? 0)
  const lineAmountValue =
    raw.line_amount != null
      ? Number(raw.line_amount)
      : raw.amount != null
        ? Number(raw.amount)
        : lineAmount(quantity, unitPrice)

  return {
    id: raw.id,
    sales_order_id: raw.order,
    article_id: raw.article ?? '',
    quantity,
    unit_price: unitPrice,
    line_amount: lineAmountValue,
  }
}

export function toXanoOrderLine(line: {
  sales_order_id: string | number
  article_id: string | number
  quantity: number
  unit_price: number
}): Record<string, unknown> {
  return {
    order: line.sales_order_id,
    article: line.article_id,
    quantity: line.quantity,
    unit_price: line.unit_price,
  }
}

export function generateOrderNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = Math.floor(Math.random() * 9000 + 1000)
  return `SO-${stamp}-${suffix}`
}
