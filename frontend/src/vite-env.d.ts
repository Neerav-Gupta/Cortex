/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Browser key for the Google Maps JS API (Search page basemap). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  google?: typeof google;
}
