/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_OPENWEATHER_API_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __FETCH_RETRY?: number;
}
