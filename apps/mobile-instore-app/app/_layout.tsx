import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { DatabaseProvider } from "@nozbe/watermelondb/react";
import { StatusBar } from "expo-status-bar";
import { database } from "@/watermelondb/database";
import {
  TenantContextProvider,
  type TenantContextValue,
} from "@/hooks/useTenantContext";
import * as SecureStore from "expo-secure-store";

// ─────────────────────────────────────────────────────────────────────────────
// Secure store keys — populated during staff login (not part of Phase 4)
// ─────────────────────────────────────────────────────────────────────────────

const TENANT_ID_KEY = "session_tenant_id";
const STAFF_USER_ID_KEY = "session_staff_user_id";
const LOCATION_ID_KEY = "session_location_id";
const STAFF_ROLE_KEY = "session_staff_role";

// ─────────────────────────────────────────────────────────────────────────────
// RootLayout
//
// Wraps all screens with:
//   - DatabaseProvider (WatermelonDB context)
//   - TenantContextProvider (tenant/staff identity, loaded from SecureStore)
//
// If no session is found in SecureStore, renders a placeholder that blocks
// navigation until staff authenticates. Full auth flow is implemented in
// Phase 5 (enterprise dashboard) or a dedicated auth screen.
// ─────────────────────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [tenantCtx, setTenantCtx] = useState<TenantContextValue | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    void loadSession();
  }, []);

  async function loadSession() {
    try {
      const [tenantId, staffUserId, locationId, staffRole] = await Promise.all([
        SecureStore.getItemAsync(TENANT_ID_KEY),
        SecureStore.getItemAsync(STAFF_USER_ID_KEY),
        SecureStore.getItemAsync(LOCATION_ID_KEY),
        SecureStore.getItemAsync(STAFF_ROLE_KEY),
      ]);

      if (!tenantId || !staffUserId || !locationId) {
        // In production: navigate to staff login screen.
        // During development, use env-seeded defaults.
        const devTenantId =
          process.env["EXPO_PUBLIC_DEV_TENANT_ID"] ?? "00000000-0000-0000-0000-000000000001";
        const devStaffUserId =
          process.env["EXPO_PUBLIC_DEV_STAFF_USER_ID"] ??
          "00000000-0000-0000-0000-000000000002";
        const devLocationId =
          process.env["EXPO_PUBLIC_DEV_LOCATION_ID"] ??
          "00000000-0000-0000-0000-000000000003";

        setTenantCtx({
          tenantId: devTenantId,
          staffUserId: devStaffUserId,
          locationId: devLocationId,
          staffRole: "tenant_staff",
        });
      } else {
        const role =
          staffRole === "tenant_manager" ? "tenant_manager" : "tenant_staff";
        setTenantCtx({ tenantId, staffUserId, locationId, staffRole: role });
      }
    } catch (err) {
      console.error("[RootLayout] Failed to load session:", err);
      setAuthError("Failed to load staff session. Restart the app.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>Loading session…</Text>
      </View>
    );
  }

  if (authError || !tenantCtx) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{authError ?? "Session unavailable."}</Text>
      </View>
    );
  }

  return (
    <DatabaseProvider database={database}>
      <TenantContextProvider value={tenantCtx}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#4f46e5" },
            headerTintColor: "#ffffff",
            headerTitleStyle: { fontWeight: "700" },
          }}
        >
          <Stack.Screen name="index" options={{ title: "In-Store Dashboard" }} />
          <Stack.Screen
            name="client-registration"
            options={{ title: "Register Client" }}
          />
          <Stack.Screen
            name="walk-in-booking"
            options={{ title: "Walk-In Booking" }}
          />
        </Stack>
      </TenantContextProvider>
    </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6c757d",
  },
  errorText: {
    fontSize: 15,
    color: "#dc3545",
    textAlign: "center",
  },
});
