/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_XANO_BASE_URL: string
  readonly VITE_XANO_AUTH_API: string
  readonly VITE_XANO_ORGANISATIONS_API: string
  readonly VITE_XANO_CONTACTS_API: string
  readonly VITE_XANO_ARTICLES_API: string
  readonly VITE_XANO_ORDERS_API: string
  readonly VITE_XANO_LINES_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
