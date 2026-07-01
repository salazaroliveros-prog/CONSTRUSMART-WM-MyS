/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly VITE_GOOGLE_OAUTH_HD?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_VAPID_PUBLIC_KEY?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_ADMIN_EMAIL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __FETCH_RETRY?: number;
}
