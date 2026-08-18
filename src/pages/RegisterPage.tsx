import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { ErrorBanner } from '../components/ErrorBanner'
import { Field, TextInput } from '../components/FormField'
import { MIN_PASSWORD_LENGTH, validateRegister } from '../utils/validation'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const validation = validateRegister({ name, email, password })
    if (validation) {
      setError(validation)
      return
    }
    setSubmitting(true)
    try {
      await register(name.trim(), email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'Registratie mislukt. Controleer of dit e-mailadres al in gebruik is.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-card">
      <h2>Registreren</h2>
      <ErrorBanner message={error} onDismiss={() => setError('')} />
      <form onSubmit={onSubmit} className="form">
        <Field label="Naam">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            autoComplete="name"
          />
        </Field>
        <Field label="E-mail">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            autoComplete="email"
          />
        </Field>
        <Field label="Wachtwoord" hint={`Minimaal ${MIN_PASSWORD_LENGTH} tekens`}>
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            autoComplete="new-password"
          />
        </Field>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Account aanmaken…' : 'Registreren'}
        </button>
      </form>
      <p className="auth-footer">
        Al een account? <Link to="/login">Inloggen</Link>
      </p>
    </div>
  )
}
