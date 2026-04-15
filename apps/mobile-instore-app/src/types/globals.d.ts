// ─────────────────────────────────────────────────────────────────────────────
// Global type declarations for the Expo React Native environment.
//
// These supplement the base TypeScript lib until @types/node and
// @types/react-native are installed via `pnpm install`.
// ─────────────────────────────────────────────────────────────────────────────

/** Expo replaces EXPO_PUBLIC_* vars at build time via Babel. */
declare const process: {
  readonly env: Record<string, string | undefined>;
};
