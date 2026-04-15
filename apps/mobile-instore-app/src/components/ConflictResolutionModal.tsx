import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { database } from "@/watermelondb/database";
import type { SyncQueueItem } from "@/watermelondb/models/SyncQueueItem";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** A single conflict returned from the sync API or detected locally. */
export interface SyncConflict {
  /** WatermelonDB ID of the sync_queue row */
  syncQueueItemId: string;
  tableName: string;
  /** Human-readable label for the record (e.g. customer name or booking time) */
  recordLabel: string;
  /** The payload the device tried to push */
  localState: Record<string, unknown>;
  /** The server's current state at time of conflict */
  serverState: Record<string, unknown>;
}

interface Props {
  /** List of conflicts to resolve */
  conflicts: SyncConflict[];
  /** Called when all conflicts have been resolved */
  onAllResolved: () => void;
}

type Resolution = "keep_server" | "keep_local";

// ─────────────────────────────────────────────────────────────────────────────
// ConflictResolutionModal
//
// Presented whenever the SyncEngine encounters OCC conflicts. Staff must
// explicitly choose "Accept Server Version" or "Keep My Version" for each
// conflicting record. Choosing "Keep My Version" re-queues the record with a
// fresh version_timestamp (last-write-wins override).
// ─────────────────────────────────────────────────────────────────────────────

export function ConflictResolutionModal({ conflicts, onAllResolved }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolving, setResolving] = useState(false);

  const current = conflicts[currentIndex];

  const handleResolve = useCallback(
    async (resolution: Resolution) => {
      if (!current || resolving) return;

      setResolving(true);
      try {
        await database.write(async () => {
          const item = await database
            .get<SyncQueueItem>("sync_queue")
            .find(current.syncQueueItemId);

          if (resolution === "keep_server") {
            // Server wins: delete the local pending push entirely.
            // The server state is already authoritative; next pull will
            // overwrite the local record.
            await item.destroyPermanently();
          } else {
            // Local wins: re-queue with a fresh version_timestamp so the
            // server accepts it as the new authoritative version.
            const freshTimestamp = Date.now();
            const freshPayload: Record<string, unknown> = {
              ...item.parsedPayload,
              version_timestamp: new Date(freshTimestamp).toISOString(),
            };

            await item.update((record) => {
              record.payload = JSON.stringify(freshPayload);
              record.pushStatus = "pending";
              record.syncError = null;
              record.retryCount = 0;
              record.conflictData = null;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (record as any)._raw.client_timestamp = freshTimestamp;
            });
          }
        });

        const next = currentIndex + 1;
        if (next >= conflicts.length) {
          onAllResolved();
        } else {
          setCurrentIndex(next);
        }
      } catch (err) {
        console.error("[ConflictResolution] Failed to resolve conflict:", err);
      } finally {
        setResolving(false);
      }
    },
    [current, currentIndex, conflicts.length, resolving, onAllResolved]
  );

  if (!current) return null;

  const progress = `${currentIndex + 1} of ${conflicts.length}`;

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      accessibilityViewIsModal
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sync Conflict</Text>
            <Text style={styles.headerProgress}>{progress}</Text>
          </View>

          <Text style={styles.recordLabel}>{current.recordLabel}</Text>
          <Text style={styles.description}>
            Your offline changes conflict with a newer server version. Choose
            which version to keep.
          </Text>

          <ScrollView
            style={styles.statesContainer}
            contentContainerStyle={styles.statesContent}
          >
            {/* Server state */}
            <View style={styles.stateCard}>
              <Text style={styles.stateHeading}>Server Version</Text>
              {renderStateFields(current.serverState)}
            </View>

            {/* Local state */}
            <View style={[styles.stateCard, styles.localCard]}>
              <Text style={[styles.stateHeading, styles.localHeading]}>
                Your Version (offline)
              </Text>
              {renderStateFields(current.localState)}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.serverButton]}
              onPress={() => void handleResolve("keep_server")}
              disabled={resolving}
              accessibilityRole="button"
              accessibilityLabel="Accept server version"
            >
              {resolving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>
                  Accept Server Version
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.localButton]}
              onPress={() => void handleResolve("keep_local")}
              disabled={resolving}
              accessibilityRole="button"
              accessibilityLabel="Keep my version"
            >
              {resolving ? (
                <ActivityIndicator color="#4f46e5" />
              ) : (
                <Text style={[styles.actionButtonText, styles.localButtonText]}>
                  Keep My Version
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Renders key/value pairs from a state object, skipping internal fields. */
function renderStateFields(state: Record<string, unknown>) {
  const SKIP_KEYS = new Set([
    "version_timestamp",
    "tenant_id",
    "created_at",
    "updated_at",
  ]);

  return Object.entries(state)
    .filter(([key]) => !SKIP_KEYS.has(key))
    .map(([key, value]) => (
      <View key={key} style={stateFieldStyles.row}>
        <Text style={stateFieldStyles.key}>
          {key.replace(/_/g, " ")}
        </Text>
        <Text style={stateFieldStyles.value} numberOfLines={2}>
          {formatValue(value)}
        </Text>
      </View>
    ));
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    // Format ISO timestamps
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }
    return value;
  }
  return String(value);
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 36,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#dc3545",
  },
  headerProgress: {
    fontSize: 13,
    color: "#6c757d",
  },
  recordLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: "#6c757d",
    marginBottom: 16,
    lineHeight: 18,
  },
  statesContainer: {
    maxHeight: 300,
  },
  statesContent: {
    gap: 12,
    paddingBottom: 8,
  },
  stateCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  localCard: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
  },
  stateHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#495057",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  localHeading: {
    color: "#4338ca",
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  serverButton: {
    backgroundColor: "#495057",
  },
  localButton: {
    backgroundColor: "#eef2ff",
    borderWidth: 1.5,
    borderColor: "#4f46e5",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  localButtonText: {
    color: "#4f46e5",
  },
});

const stateFieldStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  key: {
    fontSize: 13,
    color: "#6c757d",
    textTransform: "capitalize",
    flex: 1,
  },
  value: {
    fontSize: 13,
    fontWeight: "500",
    color: "#212529",
    flex: 1,
    textAlign: "right",
  },
});
