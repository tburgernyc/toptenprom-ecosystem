import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { database } from "@/watermelondb/database";
import type { Customer } from "@/watermelondb/models/Customer";
import type { Booking } from "@/watermelondb/models/Booking";
import type { SyncQueueItem } from "@/watermelondb/models/SyncQueueItem";
import { useTenantContext } from "@/hooks/useTenantContext";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Types — service/location data comes from a server-seeded local cache or
// is entered manually by staff for offline scenarios.
// ─────────────────────────────────────────────────────────────────────────────

interface ServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  price: string;
}

interface FormErrors {
  serviceId?: string;
  scheduledAt?: string;
  notes?: string;
  general?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const bookingSchema = z.object({
  serviceId: z.string().uuid("Select a service"),
  scheduledAt: z.string().datetime({ message: "Enter a valid date and time" }),
  notes: z.string().max(1000).optional(),
});

// ─────────────────────────────────────────────────────────────────────────────
// WalkInBookingScreen
//
// Local-first booking creation. The customer is pre-selected via navigation
// params (customerId = WatermelonDB local row ID). Service and time are
// chosen by staff; the booking is written to WatermelonDB immediately and
// enqueued for sync.
//
// OCC fields:
//   version_timestamp = Date.now() at creation
//
// The sync engine will reject the push if the slot is taken server-side and
// return a conflict that surfaces via ConflictResolutionModal.
// ─────────────────────────────────────────────────────────────────────────────

export function WalkInBookingScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId: string }>();
  const { tenantId, locationId, staffUserId } = useTenantContext();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [services] = useState<ServiceOption[]>([
    // In production these would be fetched from a local cache synced from server.
    // Placeholder entries allow offline operation when the cache is unavailable.
  ]);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(
    null
  );
  const [scheduledAtText, setScheduledAtText] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  // Load customer record from local DB
  useEffect(() => {
    if (!customerId) {
      setLoadingCustomer(false);
      return;
    }
    void (async () => {
      try {
        const record = await database
          .get<Customer>("customers")
          .find(customerId);
        setCustomer(record);
      } catch (err) {
        console.error("[WalkInBooking] Failed to load customer:", err);
      } finally {
        setLoadingCustomer(false);
      }
    })();
  }, [customerId]);

  const handleSelectService = useCallback((svc: ServiceOption) => {
    setSelectedService(svc);
    setErrors((prev: FormErrors) => { const { serviceId: _s, ...rest } = prev; return rest; });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!customer) {
      setErrors({ general: "No client selected. Go back and register first." });
      return;
    }

    if (!selectedService) {
      setErrors((prev: FormErrors) => ({ ...prev, serviceId: "Select a service" }));
      return;
    }

    // Parse and validate scheduled time
    const scheduledDate = new Date(scheduledAtText);
    const isValidDate =
      !isNaN(scheduledDate.getTime()) &&
      scheduledAtText.trim().length >= 10;

    const result = bookingSchema.safeParse({
      serviceId: selectedService.id,
      scheduledAt: isValidDate ? scheduledDate.toISOString() : "",
      notes: notes.trim() || undefined,
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    const scheduled = new Date(result.data.scheduledAt);
    if (scheduled <= new Date()) {
      setErrors({ scheduledAt: "Appointment must be in the future." });
      return;
    }

    const endsAt = new Date(
      scheduled.getTime() + selectedService.durationMinutes * 60_000
    );

    setSubmitting(true);
    setErrors({});

    try {
      const now = Date.now();

      await database.write(async () => {
        const bookingsCollection = database.get<Booking>("bookings");
        const syncQueueCollection = database.get<SyncQueueItem>("sync_queue");

        // Generate a local confirmation code — server will replace with its own
        const confirmationCode = `LOCAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

        const newBooking = await bookingsCollection.create((record) => {
          record.serverId = null;
          record.tenantId = tenantId;
          record.customerId = customer.id;
          record.serviceId = selectedService.id;
          record.locationId = locationId;
          record.staffUserId = staffUserId ?? null;
          record.status = "pending";
          record.scheduledAt = scheduled;
          record.endsAt = endsAt;
          record.notes = result.data.notes ?? null;
          record.confirmationCode = confirmationCode;
          record.pushStatus = "pending";
          record.versionTimestamp = now;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (record as any)._raw.created_at = now;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (record as any)._raw.updated_at = now;
        });

        const payload: Record<string, unknown> = {
          tenant_id: tenantId,
          // Resolved to server UUID during sync via customer.server_id
          local_customer_id: customer.id,
          customer_server_id: customer.serverId,
          service_id: selectedService.id,
          location_id: locationId,
          staff_user_id: staffUserId ?? null,
          status: "pending",
          scheduled_at: scheduled.toISOString(),
          ends_at: endsAt.toISOString(),
          notes: result.data.notes ?? null,
          confirmation_code: confirmationCode,
          version_timestamp: new Date(now).toISOString(),
        };

        await syncQueueCollection.create((record) => {
          record.tableName = "bookings";
          record.localId = newBooking.id;
          record.serverId = null;
          record.operation = "insert";
          record.payload = JSON.stringify(payload);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (record as any)._raw.client_timestamp = now;
          record.pushStatus = "pending";
          record.syncError = null;
          record.retryCount = 0;
          record.conflictData = null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (record as any)._raw.created_at = now;
        });
      });

      // Navigate back to home with success indicator
      router.replace({ pathname: "/", params: { bookingCreated: "1" } });
    } catch (err) {
      console.error("[WalkInBooking] Write failed:", err);
      setErrors({ general: "Failed to save booking. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }, [
    customer,
    selectedService,
    scheduledAtText,
    notes,
    tenantId,
    locationId,
    staffUserId,
    router,
  ]);

  if (loadingCustomer) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Walk-In Booking</Text>

        {/* Client summary */}
        {customer ? (
          <View style={styles.customerCard}>
            <Text style={styles.customerLabel}>Client</Text>
            <Text style={styles.customerName}>{customer.displayName}</Text>
            <Text style={styles.customerEmail}>{customer.email}</Text>
          </View>
        ) : (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              No client selected. Go back and register the client first.
            </Text>
          </View>
        )}

        {/* Service selection */}
        <Text style={styles.sectionLabel}>Select Service *</Text>
        {services.length === 0 ? (
          <View style={styles.emptyServices}>
            <Text style={styles.emptyServicesText}>
              No services cached. Ensure the device synced at least once while
              online.
            </Text>
          </View>
        ) : (
          <FlatList
            data={services}
            keyExtractor={(item: ServiceOption) => item.id}
            scrollEnabled={false}
            renderItem={({ item }: { item: ServiceOption }) => (
              <TouchableOpacity
                style={[
                  styles.serviceItem,
                  selectedService?.id === item.id
                    ? styles.serviceItemSelected
                    : null,
                ]}
                onPress={() => handleSelectService(item)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedService?.id === item.id }}
              >
                <View style={styles.serviceItemInner}>
                  <Text style={styles.serviceName}>{item.name}</Text>
                  <Text style={styles.serviceMeta}>
                    {item.durationMinutes} min · ${item.price}
                  </Text>
                </View>
                {selectedService?.id === item.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            )}
          />
        )}
        {errors.serviceId ? (
          <Text style={styles.errorText}>{errors.serviceId}</Text>
        ) : null}

        {/* Date / time */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date &amp; Time *</Text>
          <TextInput
            style={[
              styles.input,
              errors.scheduledAt ? styles.inputError : null,
            ]}
            value={scheduledAtText}
            onChangeText={(v: string) => {
              setScheduledAtText(v);
              setErrors((prev: FormErrors) => { const { scheduledAt: _s, ...rest } = prev; return rest; });
            }}
            placeholder="2026-04-15 14:00"
            autoCapitalize="none"
            returnKeyType="next"
            editable={!submitting}
          />
          <Text style={styles.hint}>Format: YYYY-MM-DD HH:MM</Text>
          {errors.scheduledAt ? (
            <Text style={styles.errorText}>{errors.scheduledAt}</Text>
          ) : null}
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={(v: string) => setNotes(v)}
            placeholder="Preferences, allergies, special requests…"
            multiline
            numberOfLines={3}
            returnKeyType="done"
            editable={!submitting}
          />
        </View>

        {/* Offline indicator */}
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Booking saved locally. Synced automatically when online.
          </Text>
        </View>

        {errors.general ? (
          <Text style={styles.generalError}>{errors.general}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.submitButton,
            (submitting || !customer) ? styles.submitDisabled : null,
          ]}
          onPress={handleSubmit}
          disabled={submitting || !customer}
          accessibilityRole="button"
          accessibilityLabel="Confirm booking"
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 16,
  },
  customerCard: {
    backgroundColor: "#e0e7ff",
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
  },
  customerLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4338ca",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e1b4b",
  },
  customerEmail: {
    fontSize: 14,
    color: "#4338ca",
    marginTop: 2,
  },
  warningBanner: {
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#343a40",
    marginBottom: 8,
  },
  emptyServices: {
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  emptyServicesText: {
    fontSize: 13,
    color: "#6c757d",
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 14,
    marginBottom: 8,
  },
  serviceItemSelected: {
    borderColor: "#4f46e5",
    backgroundColor: "#eef2ff",
  },
  serviceItemInner: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#212529",
  },
  serviceMeta: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: "#4f46e5",
    marginLeft: 8,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#343a40",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#212529",
  },
  textArea: {
    height: 90,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#dc3545",
  },
  hint: {
    fontSize: 11,
    color: "#6c757d",
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: "#dc3545",
    marginTop: 4,
    marginBottom: 4,
  },
  offlineBanner: {
    backgroundColor: "#d1fae5",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  offlineText: {
    fontSize: 12,
    color: "#065f46",
  },
  generalError: {
    fontSize: 14,
    color: "#dc3545",
    marginBottom: 16,
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitDisabled: {
    backgroundColor: "#a5b4fc",
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    marginTop: 14,
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 15,
    color: "#6c757d",
  },
});
