import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createArticle, getArticle, updateArticle } from '../api/articles'
import { ApiError } from '../api/client'
import { ErrorBanner } from '../components/ErrorBanner'
import { Field, SelectInput, TextInput } from '../components/FormField'
import { LoadingBlock } from '../components/LoadingBlock'
import { validateArticle } from '../utils/validation'
import { ARTICLE_STATUSES, ARTICLE_STATUS_LABELS, type ArticleStatus } from '../types'

export function ArticleFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [articleNumber, setArticleNumber] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('0')
  const [active, setActive] = useState(true)
  const [status, setStatus] = useState<ArticleStatus>('published')
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const a = await getArticle(id)
        if (cancelled) return
        setArticleNumber(a.article_number)
        setName(a.name)
        setDescription(a.description ?? '')
        setPrice(String(a.price))
        setStock(String(a.stock))
        setActive(a.active)
        setStatus(a.status)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Artikel laden mislukt.')
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
    const validation = validateArticle({
      article_number: articleNumber,
      name,
      price,
      stock,
    })
    if (validation) {
      setError(validation)
      return
    }
    const payload = {
      article_number: articleNumber.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      stock: Number(stock),
      active,
      status,
    }
    setSubmitting(true)
    try {
      if (isEdit && id) {
        await updateArticle(id, payload)
      } else {
        await createArticle(payload)
      }
      navigate('/articles')
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
        <h1>{isEdit ? 'Artikel bewerken' : 'Nieuw artikel'}</h1>
        <Link to="/articles" className="btn btn-ghost">
          Annuleren
        </Link>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <form onSubmit={onSubmit} className="panel form">
        <Field label="Artikelnummer *">
          <TextInput value={articleNumber} onChange={(e) => setArticleNumber(e.target.value)} disabled={submitting} />
        </Field>
        <Field label="Artikelnaam *">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} disabled={submitting} />
        </Field>
        <Field label="Omschrijving">
          <TextInput value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} />
        </Field>
        <div className="form-row">
          <Field label="Prijs (€) *">
            <TextInput
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={submitting}
            />
          </Field>
          <Field label="Voorraad">
            <TextInput
              type="number"
              min="0"
              step="1"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              disabled={submitting}
            />
          </Field>
        </div>
        <Field label="Beschikbaar">
          <SelectInput
            value={active ? '1' : '0'}
            onChange={(e) => setActive(e.target.value === '1')}
            disabled={submitting}
          >
            <option value="1">Ja</option>
            <option value="0">Nee</option>
          </SelectInput>
        </Field>
        <Field label="Status">
          <SelectInput
            value={status}
            onChange={(e) => setStatus(e.target.value as ArticleStatus)}
            disabled={submitting}
          >
            {ARTICLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ARTICLE_STATUS_LABELS[s]}
              </option>
            ))}
          </SelectInput>
        </Field>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Opslaan…' : 'Opslaan'}
        </button>
      </form>
    </div>
  )
}
