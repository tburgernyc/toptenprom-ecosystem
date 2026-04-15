import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import withObservables from "@nozbe/with-observables";
import { Q } from "@nozbe/watermelondb";
import { database } from "@/watermelondb/database";
import type { Booking } from "@/watermelondb/models/Booking";
import type { SyncQueueItem } from "@/watermelondb/models/SyncQueueItem";
import { SyncEngine } from "@/lib/SyncEngine";
import { ConflictResolutionModal } from "@/components/ConflictResolutionModal";
import type { SyncConflict } from "@/components/ConflictResolutionModal";
import { useTenantContext } from "@/hooks/useTenantContext";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface InnerProps {
  todayBookings: Booking[];
  pendingCount: number;
  conflictCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// HomeScreen (inner — receives reactive props from withObservables)
// ─────────────────────────────────────────────────────────────────────────────

function HomeScreenInner({
  todayBookings,
  pendingCount,
  conflictCount,
}: InnerProps) {
  const router = useRouter();
  const { tenantId } = useTenantContext();
  const params = useLocalSearchParams<{ bookingCreated?: string }>();

  const [syncing, setSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const initialSyncDone = useRef(false);

  const runSync = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const deviceId = await getOrCreateDeviceId();
      const authToken =
        (await SecureStore.getItemAsync("session_auth_token")) ?? "";

      const syncUrl = `${Constants.expoConfig?.extra?.["apiBaseUrl"] ?? process.env["EXPO_PUBLIC_API_BASE_URL"] ?? ""}/api/sync`;

      const engine = new SyncEngine({
        syncUrl,
        tenantId,
        deviceId,
        authToken,
      });

      const newConflicts = await engine.sync();
      if (newConflicts.length > 0) {
        setConflicts(newConflicts);
      }
    } catch (err) {
      console.error("[HomeScreen] Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  }, [syncing, tenantId]);

  // Auto-sync exactly once on mount using a ref guard
  useEffect(() => {
    if (initialSyncDone.current) return;
    initialSyncDone.current = true;
    void runSync();
  }, [runSync]);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={syncing}
            onRefresh={() => void runSync()}
            tintColor="#4f46e5"
          />
        }
      >
        {/* Booking created banner */}
        {params.bookingCreated === "1" && (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              Booking saved locally. Will sync when online.
            </Text>
          </View>
        )}

        {/* Sync status */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              pendingCount > 0 ? styles.dotPending : styles.dotSynced,
            ]}
          />
          <Text style={styles.statusText}>
            {pendingCount > 0
              ? `${pendingCount} change${pendingCount === 1 ? "" : "s"} pending sync`
              : "All synced"}
          </Text>
          {conflictCount > 0 && (
            <Text style={styles.conflictBadge}>{conflictCount} conflict</Text>
          )}
          {syncing && (
            <ActivityIndicator
              size="small"
              color="#4f46e5"
              style={styles.syncSpinner}
            />
          )}
        </View>

        {/* Quick actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/client-registration")}
            accessibilityRole="button"
            accessibilityLabel="Register walk-in client"
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>Register Client</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/walk-in-booking")}
            accessibilityRole="button"
            accessibilityLabel="Walk-in booking"
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionLabel}>Walk-In Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => void runSync()}
            disabled={syncing}
            accessibilityRole="button"
            accessibilityLabel="Sync now"
          >
            <Text style={styles.actionIcon}>{syncing ? "⏳" : "🔄"}</Text>
            <Text style={styles.actionLabel}>Sync Now</Text>
          </TouchableOpacity>
        </View>

        {/* Today's bookings */}
        <Text style={styles.sectionTitle}>Today's Bookings</Text>
        {todayBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No bookings scheduled for today.
            </Text>
          </View>
        ) : (
          todayBookings.map((booking) => (
            <BookingRow key={String(booking.id)} booking={booking} />
          ))
        )}
      </ScrollView>

      {/* Conflict resolution modal */}
      {conflicts.length > 0 && (
        <ConflictResolutionModal
          conflicts={conflicts}
          onAllResolved={() => setConflicts([])}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BookingRow
// ─────────────────────────────────────────────────────────────────────────────

// key is passed by React list rendering — declared here because @types/react
// is not yet installed. It is never consumed by this component.
function BookingRow({ booking }: { booking: Booking; key?: string }) {
  const scheduled = booking.scheduledAt;
  const timeStr = scheduled.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const statusColor =
    booking.pushStatus === "conflict"
      ? "#dc3545"
      : booking.pushStatus === "pending"
      ? "#fd7e14"
      : "#198754";

  return (
    <View style={styles.bookingRow}>
      <View style={[styles.bookingStatusBar, { backgroundColor: statusColor }]} />
      <View style={styles.bookingContent}>
        <Text style={styles.bookingTime}>{timeStr}</Text>
        <Text style={styles.bookingConfirmation}>
          {booking.confirmationCode ?? "Pending confirmation"}
        </Text>
        <Text style={styles.bookingStatus}>{booking.status}</Text>
      </View>
      {booking.pushStatus !== "synced" && (
        <View style={[styles.syncBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.syncBadgeText}>{booking.pushStatus}</Text>
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// withObservables enhancement — reactive queries
// ─────────────────────────────────────────────────────────────────────────────

const enhance = withObservables([], () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  return {
    todayBookings: database
      .get<Booking>("bookings")
      .query(
        Q.where("scheduled_at", Q.gte(todayStart.getTime())),
        Q.where("scheduled_at", Q.lte(todayEnd.getTime())),
        Q.sortBy("scheduled_at", Q.asc)
      )
      .observe(),

    pendingCount: database
      .get<SyncQueueItem>("sync_queue")
      .query(Q.where("sync_status", Q.oneOf(["pending", "failed"])))
      .observeCount(),

    conflictCount: database
      .get<SyncQueueItem>("sync_queue")
      .query(Q.where("sync_status", "conflict"))
      .observeCount(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any; // withObservables HOC generic inference requires this cast

const HomeScreen = enhance(HomeScreenInner);

export default HomeScreen;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getOrCreateDeviceId(): Promise<string> {
  const stored = await SecureStore.getItemAsync("device_id");
  if (stored) return stored;
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync("device_id", id);
  return id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  successBanner: {
    backgroundColor: "#d1fae5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    color: "#065f46",
    fontSize: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPending: {
    backgroundColor: "#fd7e14",
  },
  dotSynced: {
    backgroundColor: "#198754",
  },
  statusText: {
    fontSize: 13,
    color: "#6c757d",
    flex: 1,
  },
  conflictBadge: {
    backgroundColor: "#dc3545",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  syncSpinner: {
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#343a40",
    textAlign: "center",
  },
  emptyState: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6c757d",
  },
  bookingRow: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 10,
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bookingStatusBar: {
    width: 4,
  },
  bookingContent: {
    flex: 1,
    padding: 12,
  },
  bookingTime: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
  },
  bookingConfirmation: {
    fontSize: 13,
    color: "#4f46e5",
    marginTop: 2,
  },
  bookingStatus: {
    fontSize: 12,
    color: "#6c757d",
    textTransform: "capitalize",
    marginTop: 2,
  },
  syncBadge: {
    alignSelf: "center",
    marginRight: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  syncBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
