import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createOrganisation,
  getOrganisation,
  updateOrganisation,
} from '../api/organisations'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { Field, TextInput } from '../components/FormField'
import { LoadingBlock } from '../components/LoadingBlock'
import { validateOrganisation } from '../utils/validation'

export function OrganisationFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [postcode, setPostcode] = useState('')
  const [city, setCity] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const org = await getOrganisation(id)
        if (cancelled) return
        setName(org.name ?? '')
        setAddress(org.address ?? '')
        setPostcode(org.postcode ?? '')
        setCity(org.city ?? '')
        setEmail(org.email ?? '')
        setTelephone(org.telephone ?? '')
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Organisatie laden mislukt.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const validation = validateOrganisation({ name, email, postcode, city })
    if (validation) {
      setError(validation)
      return
    }
    const payload = {
      name: name.trim(),
      address: address.trim() || undefined,
      postcode: postcode.trim() || undefined,
      city: city.trim() || undefined,
      email: email.trim() || undefined,
      telephone: telephone.trim() || undefined,
    }
    setSubmitting(true)
    try {
      if (isEdit && id) {
        await updateOrganisation(id, payload)
        navigate(`/organisations/${id}`)
      } else {
        const created = await createOrganisation(payload)
        navigate(`/organisations/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Opslaan mislukt.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingBlock />

  return (
    <div className="page narrow">
      <header className="page-header">
        <div>
          <h1>{isEdit ? 'Organisatie bewerken' : 'Nieuwe organisatie'}</h1>
        </div>
        <Link to={isEdit && id ? `/organisations/${id}` : '/organisations'} className="btn btn-ghost">
          Annuleren
        </Link>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <form onSubmit={onSubmit} className="panel form">
        <Field label="Organisatienaam *">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
        </Field>
        <Field label="Adres">
          <TextInput value={address} onChange={(e) => setAddress(e.target.value)} disabled={submitting} />
        </Field>
        <div className="form-row">
          <Field label="Postcode">
            <TextInput value={postcode} onChange={(e) => setPostcode(e.target.value)} disabled={submitting} />
          </Field>
          <Field label="Plaats">
            <TextInput value={city} onChange={(e) => setCity(e.target.value)} disabled={submitting} />
          </Field>
        </div>
        <Field label="Algemeen e-mail">
          <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={submitting} />
        </Field>
        <Field label="Telefoon">
          <TextInput value={telephone} onChange={(e) => setTelephone(e.target.value)} disabled={submitting} />
        </Field>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Opslaan…' : 'Opslaan'}
        </button>
      </form>
    </div>
  )
}
