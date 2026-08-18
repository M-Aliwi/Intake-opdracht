import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { ErrorBanner } from '../components/ErrorBanner'
import { Field, TextInput } from '../components/FormField'
import { validateLogin } from '../utils/validation'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const validation = validateLogin({ email, password })
    if (validation) {
      setError(validation)
      return
    }
    setSubmitting(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Inloggen mislukt. Controleer e-mail en wachtwoord.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>Inloggen</h2>
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      <form onSubmit={onSubmit} className="form">
        <Field label="E-mail">
          <TextInput
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </Field>
        <Field label="Wachtwoord">
          <TextInput
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </Field>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Bezig…' : 'Inloggen'}
        </button>
      </form>
      <p className="auth-footer">
        Nog geen account? <Link to="/register">Registreren</Link>
      </p>
    </div>
  )
}
