import {
  isValidEmail,
  lineAmount,
  todayIsoDate,
} from './helpers'
import type { OrderStatus } from '../types'

const MIN_PASSWORD_LENGTH = 8

export function validateRegister(input: {
  name: string
  email: string
  password: string
}): string | null {
  if (!input.name.trim()) return 'Naam is verplicht.'
  if (!input.email.trim()) return 'E-mail is verplicht.'
  if (!isValidEmail(input.email)) return 'Voer een geldig e-mailadres in.'
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens bevatten.`
  }
  return null
}

export function validateLogin(input: {
  email: string
  password: string
}): string | null {
  if (!input.email.trim()) return 'E-mail is verplicht.'
  if (!input.password) return 'Wachtwoord is verplicht.'
  return null
}

export function validateOrganisation(input: {
  name: string
  email?: string
  postcode?: string
  city?: string
}): string | null {
  if (!input.name.trim()) return 'Organisatienaam is verplicht.'
  if (input.email?.trim() && !isValidEmail(input.email)) {
    return 'Algemeen e-mailadres is ongeldig.'
  }
  if (input.postcode?.trim() === '' && input.city?.trim()) {
    return 'Postcode mag niet leeg zijn als plaats is ingevuld.'
  }
  return null
}

export function validateContact(input: {
  first_name: string
  last_name: string
  email: string
  organisation_id: string | number | null
}): string | null {
  if (!input.organisation_id) return 'Kies een organisatie.'
  if (!input.first_name.trim()) return 'Voornaam is verplicht.'
  if (!input.last_name.trim()) return 'Achternaam is verplicht.'
  if (!input.email.trim()) return 'E-mail is verplicht.'
  if (!isValidEmail(input.email)) return 'Voer een geldig e-mailadres in.'
  return null
}

export function validateArticle(input: {
  article_number: string
  name: string
  price: string
  stock: string
}): string | null {
  if (!input.article_number.trim()) return 'Artikelnummer is verplicht.'
  if (!input.name.trim()) return 'Artikelnaam is verplicht.'
  const price = Number(input.price)
  if (!Number.isFinite(price) || price <= 0) return 'Prijs moet groter dan 0 zijn.'
  const stock = Number(input.stock)
  if (!Number.isFinite(stock) || stock < 0) return 'Voorraad mag niet negatief zijn.'
  return null
}

export function validateOrderHeader(input: {
  organisation_id: string | number | null
  contact_person_id: string | number | null
  order_date: string
  delivery_date: string
  status: OrderStatus
}): string | null {
  if (!input.organisation_id) return 'Selecteer eerst een organisatie.'
  if (!input.contact_person_id) return 'Selecteer een contactpersoon.'
  if (!input.order_date) return 'Orderdatum is verplicht.'
  if (!input.delivery_date) return 'Leverdatum is verplicht.'
  if (input.delivery_date < input.order_date) {
    return 'Leverdatum mag niet vóór de orderdatum liggen.'
  }
  return null
}

export function validateOrderLines(
  lines: { article_id: number | string | null; quantity: number; unit_price: number }[],
): string | null {
  if (lines.length === 0) return 'Voeg minimaal één orderregel toe.'
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.article_id) return `Regel ${i + 1}: kies een artikel.`
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      return `Regel ${i + 1}: aantal moet groter dan 0 zijn.`
    }
    if (!Number.isFinite(line.unit_price) || line.unit_price <= 0) {
      return `Regel ${i + 1}: prijs moet groter dan 0 zijn.`
    }
    const expected = lineAmount(line.quantity, line.unit_price)
    // frontend recalculates line_amount on save
    void expected
  }
  return null
}

export { MIN_PASSWORD_LENGTH, todayIsoDate }
