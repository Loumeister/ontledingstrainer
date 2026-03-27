/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPS_SCRIPT_URL?: string
  readonly VITE_API_KEY?: string
  readonly VITE_DOCENT_HASH?: string
  readonly VITE_EIGENAAR_HASH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
