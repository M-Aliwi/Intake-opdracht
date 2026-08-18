import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listSalesOrders } from '../api/orders'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { Field, SelectInput } from '../components/FormField'
import { LoadingBlock } from '../components/LoadingBlock'
import { formatCurrency, formatDate } from '../utils/helpers'
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
  type SalesOrder,
} from '../types'

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [items, setItems] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await listSalesOrders(statusFilter)
        if (!cancelled) setItems(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Orders laden mislukt.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [statusFilter])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Verkooporders</h1>
          <p className="muted">Filter op status of open een order voor details.</p>
        </div>
        <Link to="/orders/new" className="btn btn-primary">
          Nieuwe order
        </Link>
      </header>

      <div className="filters panel inline">
        <Field label="Status">
          <SelectInput
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | '')}
          >
            <option value="">Alle statussen</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingBlock label="Orders laden…" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Organisatie</th>
                <th>Status</th>
                <th>Orderdatum</th>
                <th>Leverdatum</th>
                <th>Totaal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={String(o.id)}>
                  <td>
                    <Link to={`/orders/${o.id}`} className="link">
                      {o.order_number ?? `#${o.id}`}
                    </Link>
                  </td>
                  <td>{o.organisation?.name ?? o.organisation_id}</td>
                  <td>{ORDER_STATUS_LABELS[o.status] ?? o.status}</td>
                  <td>{formatDate(o.order_date)}</td>
                  <td>{formatDate(o.delivery_date)}</td>
                  <td>{o.total_amount != null ? formatCurrency(o.total_amount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
