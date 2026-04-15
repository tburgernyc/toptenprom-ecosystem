export type DashboardRole =
  | "super_admin"
  | "brand_admin"
  | "tenant_manager"
  | "tenant_staff"
  | "customer";

export interface DashboardSession {
  readonly userId: string;
  readonly email: string;
  readonly role: DashboardRole;
  readonly tenantId: string | null;
  readonly displayName: string | null;
}
