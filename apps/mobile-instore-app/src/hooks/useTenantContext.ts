import { createContext, useContext } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TenantContext — provides tenant/staff identity to mobile screens
//
// Populated at app launch from SecureStore (set during staff login flow).
// tenantId and staffUserId are never derived from user-supplied input;
// they come from the authenticated session established via the sync API.
// ─────────────────────────────────────────────────────────────────────────────

export interface TenantContextValue {
  readonly tenantId: string;
  readonly staffUserId: string;
  readonly locationId: string;
  readonly staffRole: "tenant_manager" | "tenant_staff";
}

const TenantContext = createContext<TenantContextValue | null>(null);

export const TenantContextProvider = TenantContext.Provider;

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error(
      "useTenantContext must be used inside <TenantContextProvider>. " +
        "Ensure the root layout wraps children with the provider."
    );
  }
  return ctx;
}
