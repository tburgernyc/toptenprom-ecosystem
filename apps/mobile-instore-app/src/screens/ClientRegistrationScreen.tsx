import React, { useState, useCallback } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { database } from "@/watermelondb/database";
import type { Customer } from "@/watermelondb/models/Customer";
import type { SyncQueueItem } from "@/watermelondb/models/SyncQueueItem";
import { useTenantContext } from "@/hooks/useTenantContext";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

const registrationSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255),
  lastName: z.string().min(1, "Last name is required").max(255),
  email: z.string().email("Enter a valid email address").max(320),
  phoneNumber: z.string().max(30).optional(),
});

type RegistrationForm = z.infer<typeof registrationSchema>;

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  general?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ClientRegistrationScreen
//
// Writes the new customer record locally first (offline-first).
// Enqueues a sync_queue insert entry so the SyncEngine pushes it when
// connectivity is available.
// ─────────────────────────────────────────────────────────────────────────────

export function ClientRegistrationScreen() {
  const router = useRouter();
  const { tenantId } = useTenantContext();

  const [form, setForm] = useState<RegistrationForm>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback(
    <K extends keyof RegistrationForm>(key: K, value: string) => {
      setForm((prev: RegistrationForm) => ({ ...prev, [key]: value }));
      if (errors[key]) {
        setErrors((prev: FormErrors) => ({ ...prev, [key]: undefined }));
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(async () => {
    const result = registrationSchema.safeParse({
      ...form,
      phoneNumber: form.phoneNumber?.trim() || undefined,
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

    setSubmitting(true);
    setErrors({});

    try {
      const now = Date.now();
      let createdCustomerId = "";

      // ── Local-first write inside a WatermelonDB batch ──────────────────
      await database.write(async () => {
        const customersCollection =
          database.get<Customer>("customers");
        const syncQueueCollection =
          database.get<SyncQueueItem>("sync_queue");

        const newCustomer = await customersCollection.create((record) => {
          record.serverId = null;
          record.tenantId = tenantId;
          record.firstName = result.data.firstName;
          record.lastName = result.data.lastName;
          record.email = result.data.email;
          record.phoneNumber = result.data.phoneNumber ?? null;
          record.pushStatus = "pending";
          record.versionTimestamp = now;
          // WatermelonDB sets created_at / updated_at via @readonly @date
          // We write directly to the raw column so it's available immediately
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (record as any)._raw.created_at = now;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (record as any)._raw.updated_at = now;
        });

        createdCustomerId = newCustomer.id;

        const payload: Record<string, unknown> = {
          tenant_id: tenantId,
          first_name: result.data.firstName,
          last_name: result.data.lastName,
          email: result.data.email,
          phone_number: result.data.phoneNumber ?? null,
          version_timestamp: new Date(now).toISOString(),
        };

        await syncQueueCollection.create((record) => {
          record.tableName = "customers";
          record.localId = newCustomer.id;
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

      // Navigate to walk-in booking with the new customer pre-selected
      router.push({
        pathname: "/walk-in-booking",
        params: { customerId: createdCustomerId },
      });
    } catch (err) {
      console.error("[ClientRegistration] Write failed:", err);
      setErrors({
        general: "Failed to save client. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [form, tenantId, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Register Walk-In Client</Text>
        <Text style={styles.subtitle}>
          Details are saved locally and synced when online.
        </Text>

        {/* First Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={[styles.input, errors.firstName ? styles.inputError : null]}
            value={form.firstName}
            onChangeText={(v: string) => setField("firstName", v)}
            placeholder="Jane"
            autoCapitalize="words"
            autoComplete="given-name"
            returnKeyType="next"
            editable={!submitting}
          />
          {errors.firstName ? (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          ) : null}
        </View>

        {/* Last Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={[styles.input, errors.lastName ? styles.inputError : null]}
            value={form.lastName}
            onChangeText={(v: string) => setField("lastName", v)}
            placeholder="Smith"
            autoCapitalize="words"
            autoComplete="family-name"
            returnKeyType="next"
            editable={!submitting}
          />
          {errors.lastName ? (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          ) : null}
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : null]}
            value={form.email}
            onChangeText={(v: string) => setField("email", v)}
            placeholder="jane@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            editable={!submitting}
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}
        </View>

        {/* Phone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone (optional)</Text>
          <TextInput
            style={styles.input}
            value={form.phoneNumber}
            onChangeText={(v: string) => setField("phoneNumber", v)}
            placeholder="+1 555 000 0000"
            keyboardType="phone-pad"
            autoComplete="tel"
            returnKeyType="done"
            editable={!submitting}
          />
        </View>

        {errors.general ? (
          <Text style={styles.generalError}>{errors.general}</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.submitButton, submitting ? styles.submitDisabled : null]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Register client"
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitText}>Register &amp; Book</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
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
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 28,
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
  inputError: {
    borderColor: "#dc3545",
  },
  errorText: {
    fontSize: 12,
    color: "#dc3545",
    marginTop: 4,
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

