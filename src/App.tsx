import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AuthLayout, Layout } from './components/Layout'
import { useAuth } from './auth/AuthContext'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { OrganisationsPage } from './pages/OrganisationsPage'
import { OrganisationDetailPage } from './pages/OrganisationDetailPage'
import { OrganisationFormPage } from './pages/OrganisationFormPage'
import { ContactFormPage } from './pages/ContactFormPage'
import { ArticlesPage } from './pages/ArticlesPage'
import { ArticleFormPage } from './pages/ArticleFormPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrderEditPage } from './pages/OrderEditPage'
import { OrderFormPage } from './pages/OrderFormPage'

function GuestOnly({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) {
    return (
      <div className="page-center">
        <p className="muted">Laden…</p>
      </div>
    )
  }
  if (token) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={
                <GuestOnly>
                  <LoginPage />
                </GuestOnly>
              }
            />
            <Route
              path="/register"
              element={
                <GuestOnly>
                  <RegisterPage />
                </GuestOnly>
              }
            />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="organisations" element={<OrganisationsPage />} />
              <Route path="organisations/new" element={<OrganisationFormPage />} />
              <Route path="organisations/:id" element={<OrganisationDetailPage />} />
              <Route path="organisations/:id/edit" element={<OrganisationFormPage />} />
              <Route path="contacts/new" element={<ContactFormPage />} />
              <Route path="contacts/:id/edit" element={<ContactFormPage />} />
              <Route path="articles" element={<ArticlesPage />} />
              <Route path="articles/new" element={<ArticleFormPage />} />
              <Route path="articles/:id/edit" element={<ArticleFormPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/new" element={<OrderFormPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="orders/:id/edit" element={<OrderEditPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
