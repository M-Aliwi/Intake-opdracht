import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listOrganisations } from '../api/organisations'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { LoadingBlock } from '../components/LoadingBlock'
import { formatDate } from '../utils/helpers'
import type { Organisation } from '../types'

export function OrganisationsPage() {
  const [items, setItems] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const data = await listOrganisations()
        if (!cancelled) setItems(data)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Organisaties laden mislukt.')
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
          <h1>Organisaties</h1>
          <p className="muted">Klanten van de Soepfabriek</p>
        </div>
        <Link to="/organisations/new" className="btn btn-primary">
          Nieuwe organisatie
        </Link>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {loading ? (
        <LoadingBlock label="Organisaties laden…" />
      ) : items.length === 0 ? (
        <div className="panel empty-state">
          <p>Nog geen organisaties. Voeg je eerste klant toe.</p>
          <Link to="/organisations/new" className="btn btn-primary">
            Organisatie toevoegen
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Naam</th>
                <th>Plaats</th>
                <th>E-mail</th>
                <th>Aangemaakt</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((org) => (
                <tr key={String(org.id)}>
                  <td>
                    <Link to={`/organisations/${org.id}`} className="link">
                      {org.name}
                    </Link>
                  </td>
                  <td>{org.city ?? '—'}</td>
                  <td>{org.email ?? '—'}</td>
                  <td>{formatDate(org.created_at ?? '')}</td>
                  <td className="actions">
                    <Link to={`/organisations/${org.id}/edit`} className="btn btn-ghost btn-sm">
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
