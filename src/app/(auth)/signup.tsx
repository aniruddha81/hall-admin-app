import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";

import { Screen } from "@/components/screen";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { getApiErrorMessage } from "@/lib/api";
import { adminRegister } from "@/lib/services/auth.service";
import {
  ACADEMIC_DEPARTMENTS,
  HALLS,
  STAFF_ROLES,
  type AcademicDepartment,
  type Hall,
  type StaffRole,
} from "@/lib/types";
import { useTheme } from "@/theme";

const SIGNUP_ROLES = STAFF_ROLES.filter((r) => r !== "PROVOST" && r !== "DSW");

export default function SignupScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors, spacing, radius } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState<AcademicDepartment | "">("");
  const [hall, setHall] = useState<Hall | "">("");
  const [designation, setDesignation] = useState<StaffRole | "">("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) return null;
  if (isAuthenticated) return <Redirect href="/(app)/(tabs)" />;

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!hall || !designation) {
      setError("Please select hall and designation");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await adminRegister({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        confirmPassword,
        hall,
        designation,
        academicDepartment: department || undefined,
      });
      Alert.alert(
        "Request submitted",
        "Your admin access request was submitted for review.",
        [{ text: "OK", onPress: () => router.replace("/login") }],
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const gradientColors = [
    colors.primary,
    colors.secondary,
    colors.tertiary,
  ] as const;

  return (
    <Screen scroll={false}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            { paddingTop: spacing.xl, paddingBottom: spacing.md },
          ]}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.badge, { borderRadius: radius.xl + 6 }]}
          >
            <MaterialIcons name="shield" size={28} color="#FFFFFF" />
          </LinearGradient>
          <ThemedText type="title" style={styles.heroTitle}>
            Request admin access
          </ThemedText>
          <ThemedText
            type="small"
            themeColor="textMuted"
            style={styles.heroSub}
          >
            Provost approval required before activation
          </ThemedText>
        </View>

        {error ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: `${colors.error}14`,
                borderColor: `${colors.error}40`,
              },
            ]}
          >
            <ThemedText type="small" style={{ color: colors.error }}>
              {error}
            </ThemedText>
          </View>
        ) : null}

        <View style={{ gap: spacing.md }}>
          <Input
            label="Full name"
            icon="person"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />
          <Input
            label="Email"
            icon="mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="admin@ruet.ac.bd"
          />
          <Input
            label="Phone"
            icon="phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder="01XXXXXXXXX"
          />
          <Input
            label="Password"
            icon="lock"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="Create password"
          />
          <Input
            label="Confirm password"
            icon="lock"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat password"
          />

          <ThemedText type="smallBold">Department (optional)</ThemedText>
          <View style={styles.chipRow}>
            {ACADEMIC_DEPARTMENTS.map((d) => (
              <Chip
                key={d}
                label={d}
                selected={department === d}
                onPress={() => setDepartment(department === d ? "" : d)}
              />
            ))}
          </View>

          <ThemedText type="smallBold">Hall</ThemedText>
          <View style={styles.chipRow}>
            {HALLS.map((h) => (
              <Chip
                key={h}
                label={h.replace(/_/g, " ")}
                selected={hall === h}
                onPress={() => setHall(h)}
              />
            ))}
          </View>

          <ThemedText type="smallBold">Designation</ThemedText>
          <View style={styles.chipRow}>
            {SIGNUP_ROLES.map((r) => (
              <Chip
                key={r}
                label={r.replace(/_/g, " ")}
                selected={designation === r}
                onPress={() => setDesignation(r)}
              />
            ))}
          </View>

          <Button
            title="Submit request"
            loading={loading}
            onPress={handleSignup}
          />
        </View>

        <ThemedText
          type="small"
          themeColor="textMuted"
          style={[styles.footer, { marginTop: spacing.lg }]}
        >
          Already have access?{" "}
          <Link href="/login">
            <ThemedText type="link" themeColor="primary">
              Sign in
            </ThemedText>
          </Link>
        </ThemedText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", gap: 6 },
  badge: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  heroTitle: { textAlign: "center" },
  heroSub: { textAlign: "center" },
  errorBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  footer: { textAlign: "center" },
});
