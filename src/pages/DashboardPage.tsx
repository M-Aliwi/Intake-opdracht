import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { isDataApiConfigured } from '../api/client'

export function DashboardPage() {
  const { user } = useAuth()
  const dataReady = isDataApiConfigured()

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            Welkom{user?.name ? `, ${user.name}` : ''}. Beheer klanten, artikelen en verkooporders.
          </p>
        </div>
      </header>

      <div className="tile-grid">
        <Link to="/organisations" className={`tile ${dataReady ? '' : 'tile-disabled'}`}>
          <h3>Organisaties</h3>
          <p>Klanten bekijken, contactpersonen en orders per organisatie.</p>
        </Link>
        <Link to="/articles" className={`tile ${dataReady ? '' : 'tile-disabled'}`}>
          <h3>Artikelen</h3>
          <p>Soepproducten met prijs, voorraad en actief/inactief.</p>
        </Link>
        <Link to="/orders" className={`tile ${dataReady ? '' : 'tile-disabled'}`}>
          <h3>Verkooporders</h3>
          <p>Nieuwe orders met regels, statusfilter en totalen.</p>
        </Link>
      </div>

      {!dataReady && (
        <section className="panel">
          <h2>Xano API-groepen</h2>
          <p>
            Kopieer <code>.env.example</code> naar <code>.env</code>. Standaard slugs uit je
            OpenAPI-spec staan al ingevuld (organisations, mvWpTZBG, rl8ZfRw1, 3YeASv8x, lines).
            Authenticatie gebruikt <code>fZ6YL3Gi</code>.
          </p>
        </section>
      )}
    </div>
  )
}
