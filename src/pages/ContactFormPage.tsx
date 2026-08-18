import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createContact, getContact, updateContact } from '../api/contacts'
import { listOrganisations } from '../api/organisations'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { Field, SelectInput, TextInput } from '../components/FormField'
import { LoadingBlock } from '../components/LoadingBlock'
import { validateContact } from '../utils/validation'
import type { Organisation } from '../types'

export function ContactFormPage() {
  const { id } = useParams()
  const [search] = useSearchParams()
  const presetOrgId = search.get('organisation_id')
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [organisationId, setOrganisationId] = useState<string>(presetOrgId ?? '')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [functionTitle, setFunctionTitle] = useState('')
  const [telephone, setTelephone] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const orgs = await listOrganisations()
        if (cancelled) return
        setOrganisations(orgs)
        if (isEdit && id) {
          const contact = await getContact(id)
          if (cancelled) return
          setOrganisationId(String(contact.organisation_id))
          setFirstName(contact.first_name)
          setLastName(contact.last_name)
          setEmail(contact.email)
          setTelephone(contact.telephone ?? '')
          setFunctionTitle(contact.function ?? '')
        } else if (presetOrgId) {
          setOrganisationId(presetOrgId)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Laden mislukt.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isEdit, presetOrgId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const validation = validateContact({
      first_name: firstName,
      last_name: lastName,
      email,
      organisation_id: organisationId || null,
    })
    if (validation) {
      setError(validation)
      return
    }
    const payload = {
      organisation_id: organisationId,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      telephone: telephone.trim() || undefined,
      function: functionTitle.trim() || undefined,
    }
    setSubmitting(true)
    try {
      if (isEdit && id) {
        await updateContact(id, payload)
      } else {
        await createContact(payload)
      }
      navigate(`/organisations/${organisationId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Opslaan mislukt.')
    } finally {
      setSubmitting(false)
    }
  }

  const orgLocked = Boolean(presetOrgId && !isEdit)

  if (loading) return <LoadingBlock />

  return (
    <div className="page narrow">
      <header className="page-header">
        <h1>{isEdit ? 'Contactpersoon bewerken' : 'Nieuwe contactpersoon'}</h1>
        <Link
          to={organisationId ? `/organisations/${organisationId}` : '/organisations'}
          className="btn btn-ghost"
        >
          Annuleren
        </Link>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <form onSubmit={onSubmit} className="panel form">
        <Field label="Organisatie *">
          <SelectInput
            value={organisationId}
            onChange={(e) => setOrganisationId(e.target.value)}
            disabled={submitting || orgLocked}
          >
            <option value="">— Kies organisatie —</option>
            {organisations.map((o) => (
              <option key={String(o.id)} value={String(o.id)}>
                {o.name}
              </option>
            ))}
          </SelectInput>
        </Field>
        <div className="form-row">
          <Field label="Voornaam *">
            <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={submitting} />
          </Field>
          <Field label="Achternaam *">
            <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={submitting} />
          </Field>
        </div>
        <Field label="Functie">
          <TextInput value={functionTitle} onChange={(e) => setFunctionTitle(e.target.value)} disabled={submitting} />
        </Field>
        <Field label="E-mail *">
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
