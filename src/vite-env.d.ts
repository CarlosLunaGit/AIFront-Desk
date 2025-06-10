/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;

  // Feature Flags
  readonly VITE_ENABLE_MOCK_API: string;
  readonly VITE_ENABLE_WHATSAPP: string;
  readonly VITE_ENABLE_EMAIL: string;
  readonly VITE_ENABLE_SMS: string;

  // AI Provider
  readonly VITE_AI_PROVIDER: string;

  // Stripe Configuration
  readonly VITE_STRIPE_PUBLIC_KEY: string;

  // Other Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
} 