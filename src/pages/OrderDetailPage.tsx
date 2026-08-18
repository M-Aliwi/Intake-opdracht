import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getSalesOrder, listOrderLines } from '../api/orders'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { LoadingBlock } from '../components/LoadingBlock'
import { formatCurrency, formatDate, orderTotal } from '../utils/helpers'
import { getOrderStatusLabel, type SalesOrder, type SalesOrderLine } from '../types'

export function OrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<SalesOrder | null>(null)
  const [lines, setLines] = useState<SalesOrderLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const [o, l] = await Promise.all([getSalesOrder(id), listOrderLines(id)])
        if (cancelled) return
        setOrder(o)
        setLines(l)
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

  if (loading) return <LoadingBlock />
  if (!order) {
    return (
      <div className="page">
        <ErrorBanner message={error || 'Order niet gevonden.'} />
      </div>
    )
  }

  const computedTotal =
    order.total_amount ?? orderTotal(lines.map((l) => ({ line_amount: l.line_amount })))

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/orders">Orders</Link> / #{order.id}
          </p>
          <h1>{order.order_number ?? `Order #${order.id}`}</h1>
          <p className="muted">
            {getOrderStatusLabel(order.status)} · organisatie{' '}
            <Link to={`/organisations/${order.organisation_id}`} className="link">
              {order.organisation?.name ?? order.organisation_id}
            </Link>
          </p>
        </div>
        <Link to={`/orders/${order.id}/edit`} className="btn btn-primary">
          Bewerken
        </Link>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="detail-grid">
        <section className="panel">
          <h2>Ordergegevens</h2>
          <dl className="detail-list">
            <div>
              <dt>Orderdatum</dt>
              <dd>{formatDate(order.order_date)}</dd>
            </div>
            <div>
              <dt>Leverdatum</dt>
              <dd>{formatDate(order.delivery_date)}</dd>
            </div>
            <div>
              <dt>Contactpersoon</dt>
              <dd>
                {order.contact_person
                  ? `${order.contact_person.first_name} ${order.contact_person.last_name}`
                  : order.contact_person_id}
              </dd>
            </div>
            {order.notes && (
              <div>
                <dt>Opmerkingen</dt>
                <dd>{order.notes}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="panel panel-wide">
          <h2>Orderregels</h2>
          {lines.length === 0 ? (
            <p className="muted">Geen regels gevonden.</p>
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
                  {lines.map((line) => (
                    <tr key={String(line.id ?? `${line.article_id}-${line.quantity}`)}>
                      <td>{line.article?.name ?? line.article_id}</td>
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
                      <strong>{formatCurrency(computedTotal)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
