import { asList, api } from './client'
import {
  generateOrderNumber,
  mapOrder,
  mapOrderLine,
  toXanoOrder,
  toXanoOrderLine,
  toXanoOrderStatus,
  toXanoOrderUpdate,
} from './mappers'
import type { OrderStatus, SalesOrder, SalesOrderLine } from '../types'

export async function listSalesOrders(status?: OrderStatus | ''): Promise<SalesOrder[]> {
  const query = status
    ? `?status=${encodeURIComponent(toXanoOrderStatus(status))}`
    : ''
  const data = await api.get<unknown>('orders', `/sales_orders${query}`)
  return asList<Record<string, unknown>>(data).map((row) =>
    mapOrder(row as Parameters<typeof mapOrder>[0]),
  )
}
export async function getSalesOrder(id: string | number): Promise<SalesOrder> {
  const data = await api.get<Record<string, unknown>>('orders', `/sales_order/${id}`)
  return mapOrder(data)
}

export async function createSalesOrder(
  payload: Omit<SalesOrder, 'id' | 'total_amount'> & { order_number?: string },
): Promise<SalesOrder> {
  const body = toXanoOrder({
    order_number: payload.order_number ?? generateOrderNumber(),
    organisation_id: payload.organisation_id,
    contact_person_id: payload.contact_person_id,
    order_date: payload.order_date,
    delivery_date: payload.delivery_date,
    status: payload.status,
    notes: payload.notes,
  })
  const data = await api.post<Record<string, unknown>>('orders', '/sales_order', body)
  return mapOrder(data)
}

export async function updateSalesOrder(
  id: string | number,
  payload: Partial<SalesOrder>,
): Promise<SalesOrder> {
  const body = toXanoOrderUpdate(payload)
  const data = await api.patch<Record<string, unknown>>('orders', `/sales_order/${id}`, body)
  return mapOrder(data)
}

export async function listOrderLines(orderId: string | number): Promise<SalesOrderLine[]> {
  const data = await api.get<unknown>(
    'lines',
    `/sales_order_lines?sales_order_id=${orderId}`,
  )
  return asList<Record<string, unknown>>(data).map((row) =>
    mapOrderLine(row as Parameters<typeof mapOrderLine>[0]),
  )
}

export async function createOrderLine(payload: {
  sales_order_id: string | number
  article_id: string | number
  quantity: number
  unit_price: number
}): Promise<SalesOrderLine> {
  const data = await api.post<Record<string, unknown>>(
    'lines',
    '/sales_order_line',
    toXanoOrderLine(payload),
  )
  return mapOrderLine(data)
}

export interface CreateOrderPayload {
  order: Omit<SalesOrder, 'id' | 'total_amount' | 'order_number'> & {
    order_number?: string
  }
  lines: { article_id: string | number; quantity: number; unit_price: number }[]
}

export async function createOrderWithLines(payload: CreateOrderPayload): Promise<SalesOrder> {
  const order = await createSalesOrder(payload.order)
  for (const line of payload.lines) {
    await createOrderLine({
      sales_order_id: order.id,
      article_id: line.article_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
    })
  }
  return getSalesOrder(order.id)
}
