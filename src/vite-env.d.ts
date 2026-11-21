/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Site key z Firebase konzole pro App Check; když chybí, App Check se nezapíná. */
  readonly VITE_APPCHECK_SITE_KEY?: string;
  /** "true", když je site key z reCAPTCHA Enterprise místo klasické reCAPTCHA v3. */
  readonly VITE_APPCHECK_ENTERPRISE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
