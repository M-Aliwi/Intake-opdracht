import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listArticles } from '../api/articles'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { LoadingBlock } from '../components/LoadingBlock'
import { formatCurrency } from '../utils/helpers'
import { ARTICLE_STATUS_LABELS, type Article } from '../types'

export function ArticlesPage() {
  const [items, setItems] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await listArticles()
        if (!cancelled) setItems(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Artikelen laden mislukt.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Artikelen</h1>
          <p className="muted">Alleen beschikbare artikelen zijn selecteerbaar bij orders.</p>
        </div>
        <Link to="/articles/new" className="btn btn-primary">
          Nieuw artikel
        </Link>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nummer</th>
                <th>Naam</th>
                <th>Prijs</th>
                <th>Voorraad</th>
                <th>Beschikbaar</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={String(a.id)}>
                  <td>{a.article_number}</td>
                  <td>{a.name}</td>
                  <td>{formatCurrency(Number(a.price))}</td>
                  <td>{a.stock}</td>
                  <td>
                    <span className={`badge ${a.active ? 'badge-ok' : 'badge-muted'}`}>
                      {a.active ? 'Ja' : 'Nee'}
                    </span>
                  </td>
                  <td>{ARTICLE_STATUS_LABELS[a.status]}</td>
                  <td>
                    <Link to={`/articles/${a.id}/edit`} className="btn btn-ghost btn-sm">
                      Bewerken
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
