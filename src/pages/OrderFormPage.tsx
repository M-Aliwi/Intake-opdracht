import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { listActiveArticles } from '../api/articles'
import { listContactsForOrganisation } from '../api/contacts'
import { listOrganisations } from '../api/organisations'
import { createOrderWithLines } from '../api/orders'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { Field, SelectInput, TextArea, TextInput } from '../components/FormField'
import { LoadingBlock } from '../components/LoadingBlock'
import {
  formatCurrency,
  lineAmount,
  orderTotal,
  todayIsoDate,
} from '../utils/helpers'
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type Article,
  type ContactPerson,
  type OrderStatus,
  type Organisation,
} from '../types'
import {
  validateOrderHeader,
  validateOrderLines,
} from '../utils/validation'

type DraftLine = {
  key: string
  article_id: string
  quantity: number
  unit_price: number
}

function newLineKey(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export function OrderFormPage() {
  const [search] = useSearchParams()
  const presetOrgId = search.get('organisation_id') ?? ''
  const navigate = useNavigate()

  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [contacts, setContacts] = useState<ContactPerson[]>([])
  const [articles, setArticles] = useState<Article[]>([])

  const [organisationId, setOrganisationId] = useState(presetOrgId)
  const [contactId, setContactId] = useState('')
  const [orderDate, setOrderDate] = useState(todayIsoDate())
  const [deliveryDate, setDeliveryDate] = useState(todayIsoDate())
  const [status, setStatus] = useState<OrderStatus>('concept')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<DraftLine[]>([
    { key: newLineKey(), article_id: '', quantity: 1, unit_price: 0 },
  ])

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const orgs = await listOrganisations()
        if (cancelled) return
        setOrganisations(orgs)
        if (presetOrgId) setOrganisationId(presetOrgId)

        try {
          const activeArticles = await listActiveArticles()
          if (!cancelled) setArticles(activeArticles)
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof ApiError
                ? `Artikelen laden mislukt: ${err.message}`
                : 'Artikelen laden mislukt.',
            )
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Formulier laden mislukt.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [presetOrgId])

  useEffect(() => {
    if (!organisationId) {
      setContacts([])
      setContactId('')
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingContacts(true)
      setContactId('')
      try {
        const list = await listContactsForOrganisation(organisationId)
        if (!cancelled) setContacts(list)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Contactpersonen laden mislukt.')
        }
      } finally {
        if (!cancelled) setLoadingContacts(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [organisationId])

  const linesWithAmounts = useMemo(
    () =>
      lines.map((l) => ({
        ...l,
        line_amount: lineAmount(l.quantity, l.unit_price),
      })),
    [lines],
  )

  const total = useMemo(
    () => orderTotal(linesWithAmounts.map((l) => ({ line_amount: l.line_amount }))),
    [linesWithAmounts],
  )

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function onArticlePick(key: string, articleId: string) {
    const article = articles.find((a) => String(a.id) === articleId)
    updateLine(key, {
      article_id: articleId,
      unit_price: article ? Number(article.price) : 0,
    })
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      { key: newLineKey(), article_id: '', quantity: 1, unit_price: 0 },
    ])
  }

  function removeLine(key: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const headerError = validateOrderHeader({
      organisation_id: organisationId || null,
      contact_person_id: contactId || null,
      order_date: orderDate,
      delivery_date: deliveryDate,
      status,
    })
    if (headerError) {
      setError(headerError)
      return
    }
    const linesError = validateOrderLines(
      lines.map((l) => ({
        article_id: l.article_id || null,
        quantity: l.quantity,
        unit_price: l.unit_price,
      })),
    )
    if (linesError) {
      setError(linesError)
      return
    }

    setSubmitting(true)
    try {
      const order = await createOrderWithLines({
        order: {
          organisation_id: organisationId,
          contact_person_id: contactId,
          order_date: orderDate,
          delivery_date: deliveryDate,
          status,
          notes: notes.trim() || undefined,
        },
        lines: linesWithAmounts.map((l) => ({
          article_id: l.article_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
        })),
      })
      navigate(`/orders/${order.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Order opslaan mislukt.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Nieuwe verkooporder</h1>
          <p className="muted">Kies eerst een organisatie, daarna een contactpersoon van die klant.</p>
        </div>
        <Link to="/orders" className="btn btn-ghost">
          Annuleren
        </Link>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <form onSubmit={onSubmit} className="form-stack">
        <section className="panel form">
          <h2>Klant</h2>
          <Field label="Organisatie *">
            <SelectInput
              value={organisationId}
              onChange={(e) => setOrganisationId(e.target.value)}
              disabled={submitting}
            >
              <option value="">— Selecteer organisatie —</option>
              {organisations.map((o) => (
                <option key={String(o.id)} value={String(o.id)}>
                  {o.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Contactpersoon *">
            <SelectInput
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              disabled={!organisationId || loadingContacts || submitting}
            >
              <option value="">
                {!organisationId
                  ? '— Eerst organisatie kiezen —'
                  : loadingContacts
                    ? 'Contactpersonen laden…'
                    : '— Selecteer contact —'}
              </option>
              {contacts.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>
                  {c.first_name} {c.last_name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </section>

        <section className="panel form">
          <h2>Order</h2>
          <div className="form-row">
            <Field label="Orderdatum *">
              <TextInput
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                disabled={submitting}
              />
            </Field>
            <Field label="Leverdatum *">
              <TextInput
                type="date"
                value={deliveryDate}
                min={orderDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                disabled={submitting}
              />
            </Field>
            <Field label="Status">
              <SelectInput
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                disabled={submitting}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <Field label="Opmerkingen">
            <TextArea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={submitting}
              placeholder="Optionele opmerkingen bij deze order"
            />
          </Field>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Orderregels</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addLine} disabled={submitting}>
              + Regel toevoegen
            </button>
          </div>

          {linesWithAmounts.map((line, index) => (
            <div key={line.key} className="order-line-row">
              <span className="line-label">Regel {index + 1}</span>
              <Field label="Artikel">
                <SelectInput
                  value={line.article_id}
                  onChange={(e) => onArticlePick(line.key, e.target.value)}
                  disabled={submitting}
                >
                  <option value="">— Artikel —</option>
                  {articles.map((a) => (
                    <option key={String(a.id)} value={String(a.id)}>
                      {a.article_number} — {a.name} ({formatCurrency(Number(a.price))})
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Aantal">
                <TextInput
                  type="number"
                  min="1"
                  step="1"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(line.key, { quantity: Number(e.target.value) || 0 })
                  }
                  disabled={submitting}
                />
              </Field>
              <Field label="Prijs">
                <TextInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unit_price}
                  onChange={(e) =>
                    updateLine(line.key, { unit_price: Number(e.target.value) || 0 })
                  }
                  disabled={submitting}
                />
              </Field>
              <div className="line-total">
                <span className="muted">Regelbedrag</span>
                <strong>{formatCurrency(line.line_amount)}</strong>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => removeLine(line.key)}
                disabled={submitting || lines.length <= 1}
              >
                Verwijderen
              </button>
            </div>
          ))}

          <div className="order-total-bar">
            <span>Totaal order</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </section>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Order opslaan…' : 'Order opslaan'}
        </button>
      </form>
    </div>
  )
}
