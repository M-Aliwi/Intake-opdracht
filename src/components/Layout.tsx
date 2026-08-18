import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { isDataApiConfigured } from '../api/client'

export function Layout() {
  const { user, logout } = useAuth()
  const dataReady = isDataApiConfigured()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <Link to="/">Soepfabriek</Link>
          <span className="brand-sub">Verkoop</span>
        </div>
        <nav className="nav">
          <NavLink to="/organisations">Organisaties</NavLink>
          <NavLink to="/articles">Artikelen</NavLink>
          <NavLink to="/orders">Orders</NavLink>
        </nav>
        <div className="user-menu">
          <span className="user-name">{user?.name ?? user?.email ?? 'Gebruiker'}</span>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Uitloggen
          </button>
        </div>
      </header>

      {!dataReady && (
        <div className="banner banner-warn">
          Xano API-groepen controleren: zet de <code>VITE_XANO_*</code> variabelen in <code>.env</code>.
          Inloggen werkt al via <code>fZ6YL3Gi</code>.
        </div>
      )}

      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}

export function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-card-wrap">
        <div className="auth-brand">
          <h1>Soepfabriek</h1>
          <p>Verkoopapplicatie</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
