import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { listActiveArticles } from '../api/articles'
import { listContactsForOrganisation } from '../api/contacts'
import { listOrganisations } from '../api/organisations'
import {
  createOrderLine,
  getSalesOrder,
  listOrderLines,
  updateSalesOrder,
} from '../api/orders'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { Field, SelectInput, TextArea, TextInput } from '../components/FormField'
import { LoadingBlock } from '../components/LoadingBlock'
import { formatCurrency, lineAmount, orderTotal } from '../utils/helpers'
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type Article,
  type ContactPerson,
  type OrderStatus,
  type Organisation,
  type SalesOrderLine,
} from '../types'
import { validateOrderHeader } from '../utils/validation'

export function OrderEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [contacts, setContacts] = useState<ContactPerson[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [existingLines, setExistingLines] = useState<SalesOrderLine[]>([])

  const [orderNumber, setOrderNumber] = useState('')
  const [organisationId, setOrganisationId] = useState('')
  const [contactId, setContactId] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [status, setStatus] = useState<OrderStatus>('concept')
  const [notes, setNotes] = useState('')

  const [newArticleId, setNewArticleId] = useState('')
  const [newQuantity, setNewQuantity] = useState(1)
  const [newUnitPrice, setNewUnitPrice] = useState(0)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [addingLine, setAddingLine] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const [order, lines, orgs, activeArticles] = await Promise.all([
          getSalesOrder(id),
          listOrderLines(id),
          listOrganisations(),
          listActiveArticles(),
        ])
        if (cancelled) return
        setOrganisations(orgs)
        setArticles(activeArticles)
        setExistingLines(lines)
        setOrderNumber(order.order_number ?? '')
        setOrganisationId(String(order.organisation_id))
        setContactId(String(order.contact_person_id))
        setOrderDate(order.order_date.slice(0, 10))
        setDeliveryDate(order.delivery_date.slice(0, 10))
        setStatus(order.status)
        setNotes(order.notes ?? '')
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Order laden mislukt.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (!organisationId) {
      setContacts([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoadingContacts(true)
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

  const total = orderTotal(existingLines.map((l) => ({ line_amount: l.line_amount })))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!id) return
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
    setSubmitting(true)
    try {
      await updateSalesOrder(id, {
        order_number: orderNumber,
        organisation_id: organisationId,
        contact_person_id: contactId,
        order_date: orderDate,
        delivery_date: deliveryDate,
        status,
        notes: notes.trim() || undefined,
      })
      navigate(`/orders/${id}`)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Order opslaan mislukt. Controleer of PATCH /sales_order/{id} bestaat in Xano.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function onAddLine() {
    if (!id) return
    setError('')
    if (!newArticleId) {
      setError('Kies een artikel voor de nieuwe regel.')
      return
    }
    if (newQuantity <= 0) {
      setError('Aantal moet groter dan 0 zijn.')
      return
    }
    if (newUnitPrice <= 0) {
      setError('Prijs moet groter dan 0 zijn.')
      return
    }
    setAddingLine(true)
    try {
      const line = await createOrderLine({
        sales_order_id: id,
        article_id: newArticleId,
        quantity: newQuantity,
        unit_price: newUnitPrice,
      })
      setExistingLines((prev) => [...prev, line])
      setNewArticleId('')
      setNewQuantity(1)
      setNewUnitPrice(0)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Orderregel toevoegen mislukt.')
    } finally {
      setAddingLine(false)
    }
  }

  function onArticlePick(articleId: string) {
    const article = articles.find((a) => String(a.id) === articleId)
    setNewArticleId(articleId)
    setNewUnitPrice(article ? Number(article.price) : 0)
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to={`/orders/${id}`}>{orderNumber || `Order #${id}`}</Link> / Bewerken
          </p>
          <h1>Order bewerken</h1>
        </div>
        <Link to={`/orders/${id}`} className="btn btn-ghost">
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
              onChange={(e) => {
                setOrganisationId(e.target.value)
                setContactId('')
              }}
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
                {loadingContacts ? 'Contactpersonen laden…' : '— Selecteer contact —'}
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
          <Field label="Ordernummer">
            <TextInput value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} disabled={submitting} />
          </Field>
          <div className="form-row">
            <Field label="Orderdatum *">
              <TextInput type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} disabled={submitting} />
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
            <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={submitting} />
          </Field>
        </section>

        <section className="panel">
          <h2>Bestaande orderregels</h2>
          {existingLines.length === 0 ? (
            <p className="muted">Nog geen regels — voeg er minimaal één toe.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Artikel</th>
                    <th>Aantal</th>
                    <th>Prijs</th>
                    <th>Regelbedrag</th>
                  </tr>
                </thead>
                <tbody>
                  {existingLines.map((line) => (
                    <tr key={String(line.id ?? `${line.article_id}-${line.quantity}`)}>
                      <td>{line.article_id}</td>
                      <td>{line.quantity}</td>
                      <td>{formatCurrency(line.unit_price)}</td>
                      <td>{formatCurrency(line.line_amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right">
                      <strong>Totaal</strong>
                    </td>
                    <td>
                      <strong>{formatCurrency(total)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        <section className="panel form">
          <h2>Nieuwe orderregel toevoegen</h2>
          <div className="form-row">
            <Field label="Artikel">
              <SelectInput
                value={newArticleId}
                onChange={(e) => onArticlePick(e.target.value)}
                disabled={addingLine}
              >
                <option value="">— Artikel —</option>
                {articles.map((a) => (
                  <option key={String(a.id)} value={String(a.id)}>
                    {a.article_number} — {a.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Aantal">
              <TextInput
                type="number"
                min="1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value) || 0)}
                disabled={addingLine}
              />
            </Field>
            <Field label="Prijs">
              <TextInput
                type="number"
                min="0"
                step="0.01"
                value={newUnitPrice}
                onChange={(e) => setNewUnitPrice(Number(e.target.value) || 0)}
                disabled={addingLine}
              />
            </Field>
          </div>
          {newArticleId && (
            <p className="muted">
              Regelbedrag: {formatCurrency(lineAmount(newQuantity, newUnitPrice))}
            </p>
          )}
          <button type="button" className="btn btn-ghost" onClick={onAddLine} disabled={addingLine}>
            {addingLine ? 'Toevoegen…' : '+ Regel toevoegen'}
          </button>
        </section>

        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Opslaan…' : 'Wijzigingen opslaan'}
        </button>
      </form>
    </div>
  )
}
