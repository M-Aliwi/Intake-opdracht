import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { listContactsForOrganisation } from '../api/contacts'
import {
  getOrganisation,
  listOrdersForOrganisation,
} from '../api/organisations'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { LoadingBlock } from '../components/LoadingBlock'
import { formatCurrency, formatDate } from '../utils/helpers'
import { getOrderStatusLabel, type ContactPerson, type Organisation, type SalesOrder } from '../types'

export function OrganisationDetailPage() {
  const { id } = useParams()
  const [org, setOrg] = useState<Organisation | null>(null)
  const [contacts, setContacts] = useState<ContactPerson[]>([])
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const [organisation, contactList, orderList] = await Promise.all([
          getOrganisation(id),
          listContactsForOrganisation(id),
          listOrdersForOrganisation(id),
        ])
        if (cancelled) return
        setOrg(organisation)
        setContacts(contactList)
        setOrders(orderList)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Gegevens laden mislukt.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <LoadingBlock />
  if (!org) {
    return (
      <div className="page">
        <ErrorBanner message={error || 'Organisatie niet gevonden.'} />
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/organisations">Organisaties</Link> / {org.name}
          </p>
          <h1>{org.name}</h1>
          <p className="muted">
            {[org.address, org.postcode, org.city].filter(Boolean).join(', ') || 'Geen adres'}
          </p>
        </div>
        <div className="header-actions">
          <Link to={`/organisations/${org.id}/edit`} className="btn btn-ghost">
            Bewerken
          </Link>
          <Link to={`/contacts/new?organisation_id=${org.id}`} className="btn btn-primary">
            Contact toevoegen
          </Link>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="detail-grid">
        <section className="panel">
          <h2>Contactgegevens</h2>
          <dl className="detail-list">
            <div>
              <dt>E-mail</dt>
              <dd>{org.email ?? '—'}</dd>
            </div>
            <div>
              <dt>Telefoon</dt>
              <dd>{org.telephone ?? '—'}</dd>
            </div>
            <div>
              <dt>Aangemaakt</dt>
              <dd>{formatDate(org.created_at ?? '')}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Contactpersonen</h2>
            <Link to={`/contacts/new?organisation_id=${org.id}`} className="btn btn-ghost btn-sm">
              Toevoegen
            </Link>
          </div>
          {contacts.length === 0 ? (
            <p className="muted">Nog geen contactpersonen.</p>
          ) : (
            <ul className="item-list">
              {contacts.map((c) => (
                <li key={String(c.id)}>
                  <div>
                    <strong>
                      {c.first_name} {c.last_name}
                    </strong>
                    <span className="muted block">{c.email}</span>
                  </div>
                  <Link to={`/contacts/${c.id}/edit`} className="btn btn-ghost btn-sm">
                    Bewerken
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel-wide">
          <div className="panel-head">
            <h2>Verkooporders</h2>
            <Link to={`/orders/new?organisation_id=${org.id}`} className="btn btn-ghost btn-sm">
              Nieuwe order
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="muted">Nog geen orders voor deze organisatie.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Orderdatum</th>
                    <th>Leverdatum</th>
                    <th>Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={String(o.id)}>
                      <td>
                        <Link to={`/orders/${o.id}`} className="link">
                          #{o.id}
                        </Link>
                      </td>
                      <td>{getOrderStatusLabel(o.status)}</td>
                      <td>{formatDate(o.order_date)}</td>
                      <td>{formatDate(o.delivery_date)}</td>
                      <td>{o.total_amount != null ? formatCurrency(o.total_amount) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
