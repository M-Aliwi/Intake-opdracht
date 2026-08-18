import { asList, api } from './client'
import { mapOrganisation, toXanoOrganisation } from './mappers'
import { listSalesOrders } from './orders'
import type { Organisation } from '../types'

export async function listOrganisations(): Promise<Organisation[]> {
  const data = await api.get<unknown>('organisations', '/organisations')
  return asList<Record<string, unknown>>(data).map((row) =>
    mapOrganisation(row as Parameters<typeof mapOrganisation>[0]),
  )
}

export async function getOrganisation(id: string | number): Promise<Organisation> {
  const data = await api.get<Record<string, unknown>>(
    'organisations',
    `/organisation/${id}`,
  )
  return mapOrganisation(data)
}

export async function createOrganisation(
  payload: Omit<Organisation, 'id'>,
): Promise<Organisation> {
  const data = await api.post<Record<string, unknown>>(
    'organisations',
    '/organisations',
    toXanoOrganisation(payload),
  )
  return mapOrganisation(data)
}

export async function updateOrganisation(
  id: string | number,
  payload: Partial<Organisation>,
): Promise<Organisation> {
  const data = await api.patch<Record<string, unknown>>(
    'organisations',
    `/organisation/${id}`,
    toXanoOrganisation(payload),
  )
  return mapOrganisation(data)
}

export async function listOrdersForOrganisation(
  organisationId: string | number,
): Promise<import('../types').SalesOrder[]> {
  const orders = await listSalesOrders()
  return orders.filter((o) => String(o.organisation_id) === String(organisationId))
}
