/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEOCODER_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
