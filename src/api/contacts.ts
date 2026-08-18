import { ApiError, asList, api } from './client'
import { mapContact, toXanoContact } from './mappers'
import type { ContactPerson } from '../types'

export async function listContactsForOrganisation(
  organisationId: string | number,
): Promise<ContactPerson[]> {
  const data = await api.get<unknown>(
    'contacts',
    `/contact_persons?organisation_id=${organisationId}`,
  )
  return asList<Record<string, unknown>>(data).map((row) =>
    mapContact(row as Parameters<typeof mapContact>[0]),
  )
}

async function listAllContacts(): Promise<ContactPerson[]> {
  const data = await api.get<unknown>('contacts', '/contact_persons')
  return asList<Record<string, unknown>>(data).map((row) =>
    mapContact(row as Parameters<typeof mapContact>[0]),
  )
}

export async function getContact(id: string | number): Promise<ContactPerson> {
  try {
    const data = await api.get<Record<string, unknown>>(
      'contacts',
      `/contact_person/${id}`,
    )
    return mapContact(data)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const all = await listAllContacts()
      const found = all.find((c) => String(c.id) === String(id))
      if (found) return found
      throw new ApiError('Contactpersoon niet gevonden.', 404)
    }
    throw err
  }
}

export async function createContact(
  payload: Omit<ContactPerson, 'id'>,
): Promise<ContactPerson> {
  const data = await api.post<Record<string, unknown>>(
    'contacts',
    '/contact_person',
    toXanoContact(payload),
  )
  return mapContact(data)
}

export async function updateContact(
  id: string | number,
  payload: Partial<ContactPerson>,
): Promise<ContactPerson> {
  const data = await api.patch<Record<string, unknown>>(
    'contacts',
    `/contact_person/${id}`,
    toXanoContact(payload),
  )
  return mapContact(data)
}
