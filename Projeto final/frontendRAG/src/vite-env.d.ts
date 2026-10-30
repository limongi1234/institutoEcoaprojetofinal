/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço do backend FastAPI (ex.: http://localhost:8000). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
