// Profile.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, useNavigation } from "@react-navigation/native"; // + useNavigation

const STORAGE_KEY = "@profile";

export default function Profile({ onRestartOnboarding }) {
  const route = useRoute();
  const navigation = useNavigation(); // navigation instance

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [prefs, setPrefs]         = useState({
    productUpdates: false,
    companyNews: false,
    securityAlerts: true,
  });
  const [loading, setLoading]     = useState(true);

  // --- Utils ---
  const initials = useMemo(() => {
    const a = (firstName || "").trim()[0] || "";
    const b = (lastName || "").trim()[0] || "";
    return (a + b).toUpperCase() || "👤";
  }, [firstName, lastName]);

  const digits = (s) => (s || "").replace(/\D/g, "");
  const isValidUSPhone = (s) => {
    const d = digits(s);
    if (d.length === 10) return true;
    if (d.length === 11 && d.startsWith("1")) return true;
    return false;
  };
  const formatUSPhone = (s) => {
    let d = digits(s);
    if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
    if (d.length < 4) return d;
    if (d.length < 7) return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
  };

  const errors = useMemo(() => {
    const e = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) e.email = "Email is required";
    else if (!re.test(email.trim())) e.email = "Enter a valid email";
    if (phone.trim() && !isValidUSPhone(phone)) e.phone = "Enter a valid US phone";
    return e;
  }, [firstName, email, phone]);

  const canSave = Object.keys(errors).length === 0;

  // --- Load saved profile; prefill from AsyncStorage or route params ---
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data = JSON.parse(raw);

          // Accept either shape: { firstName, lastName, email } or { name, email }
          if (data?.name && (!data.firstName || typeof data.firstName !== "string")) {
            const parts = String(data.name).trim().split(/\s+/);
            setFirstName(parts[0] || "");
            setLastName(parts.slice(1).join(" ") || "");
          } else {
            setFirstName(data.firstName ?? "");
            setLastName(data.lastName ?? "");
          }
          if (data?.email) setEmail(String(data.email));

          setPhone(data.phone ?? "");
          setAvatarUri(data.avatarUri ?? "");
          setPrefs({
            productUpdates: !!data.productUpdates,
            companyNews: !!data.companyNews,
            securityAlerts: data.securityAlerts !== undefined ? !!data.securityAlerts : true,
          });
        } else {
          // Prefill from onboarding params if provided
          const fromOnboarding = route?.params || {};
          if (fromOnboarding.name) {
            const nameParts = String(fromOnboarding.name).trim().split(/\s+/);
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
          }
          if (fromOnboarding.email) setEmail(String(fromOnboarding.email));
        }
      } catch (err) {
        console.warn("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [route?.params]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "We need access to your photos to pick an avatar.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) setAvatarUri(uri);
    }
  }, []);

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatarUri,
        productUpdates: prefs.productUpdates,
        companyNews: prefs.companyNews,
        securityAlerts: prefs.securityAlerts,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      Alert.alert("Saved", "Your changes have been saved.");
    } catch (err) {
      Alert.alert("Error", "Failed to save changes.");
    }
  }, [canSave, firstName, lastName, email, phone, avatarUri, prefs]);

  const handleLogout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      navigation.navigate("Onboarding");
  
    } finally {
      onRestartOnboarding?.();
    }
  }, [onRestartOnboarding]);

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Profile</Text>
        {/* Back → Home */}
        <Pressable
          onPress={() => navigation.navigate("Home")}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Go to Home"
        >
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
      </View>

      {/* Avatar */}
      <Pressable onPress={pickImage} accessibilityRole="button" style={styles.avatarWrap}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <Text style={styles.avatarHint}>Change photo</Text>
      </Pressable>

      {/* Fields */}
      <View style={styles.field}>
        <Text style={styles.label}>First name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Ada"
          style={[styles.input, errors.firstName && styles.inputError]}
          autoCapitalize="words"
          returnKeyType="next"
        />
        {errors.firstName ? <Text style={styles.error}>{errors.firstName}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Last name</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Lovelace"
          style={styles.input}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="ada@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          style={[styles.input, errors.email && styles.inputError]}
          returnKeyType="next"
        />
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone (US)</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          onBlur={() => phone && setPhone(formatUSPhone(phone))}
          placeholder="(555) 555-1234"
          keyboardType="phone-pad"
          style={[styles.input, errors.phone && styles.inputError]}
          returnKeyType="done"
        />
        {errors.phone ? <Text style={styles.error}>{errors.phone}</Text> : null}
      </View>

      {/* Email notifications (cosmetic) */}
      <Text style={[styles.label, { marginTop: 8 }]}>Email notifications</Text>
      <View style={styles.checkboxRow}>
        <Checkbox
          label="Order statuses"
          value={prefs.productUpdates}
          onToggle={() => toggle("productUpdates")}
        />
        <Checkbox
          label="password changes"
          value={prefs.companyNews}
          onToggle={() => toggle("companyNews")}
        />
        <Checkbox
          label="Special offers"
          value={prefs.securityAlerts}
          onToggle={() => toggle("securityAlerts")}
        />
          <Checkbox
          label="Newsletter"
          onToggle={() => toggle("securityAlerts")}
        />
      </View>

      {/* Actions */}
      <Pressable
        onPress={handleSave}
        disabled={!canSave}
        style={({ pressed }) => [
          styles.primaryBtn,
          (!canSave || pressed) && styles.primaryBtnPressed,
          !canSave && styles.primaryBtnDisabled,
        ]}
      >
        <Text style={styles.primaryBtnText}>Save Changes</Text>
      </Pressable>

      <Pressable onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

/** Simple checkbox without external deps */
function Checkbox({ label, value, onToggle }) {
  return (
    <Pressable onPress={onToggle} style={styles.cbRow} accessibilityRole="checkbox" accessibilityState={{ checked: value }}>
      <View style={[styles.cbBox, value && styles.cbBoxChecked]}>
        {value ? <Text style={styles.cbCheck}>✓</Text> : null}
      </View>
      <Text style={styles.cbLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { fontSize: 24, fontWeight: "700" },
  backBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 8 },
  backBtnText: { color: "#6B7280" },

  avatarWrap: { alignItems: "center", marginTop: 8, marginBottom: 8 },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: "#E5E7EB" },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 28, fontWeight: "700", color: "#111827" },
  avatarHint: { marginTop: 8, color: "#2563EB" },

  field: { marginTop: 4 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: "#fff",
  },
  inputError: { borderColor: "#EF4444" },
  error: { color: "#EF4444", fontSize: 12, marginTop: 6 },

  checkboxRow: { gap: 10, marginTop: 4 },
  cbRow: { flexDirection: "row", alignItems: "center" },
  cbBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: "#9CA3AF", alignItems: "center", justifyContent: "center" },
  cbBoxChecked: { backgroundColor: "#111827", borderColor: "#111827" },
  cbCheck: { color: "#fff", fontSize: 14, lineHeight: 14 },
  cbLabel: { marginLeft: 8, fontSize: 14, color: "#111827" },

  primaryBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: "center", backgroundColor: "#111827" },
  primaryBtnPressed: { opacity: 0.9 },
  primaryBtnDisabled: { backgroundColor: "#9CA3AF" },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  logoutBtn: { marginTop: 8, alignItems: "center" },
  logoutText: { color: "#DC2626", fontWeight: "600" },
});
