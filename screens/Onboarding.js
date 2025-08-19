// src/screens/Onboarding.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // why: persist + prefill on mount
import PropTypes from "prop-types";

/**
 * Onboarding (React Native)
 * Prefills from AsyncStorage on mount; saves { name, email } on submit, then onComplete(payload).
 */
export default function Onboarding({ onComplete = () => {} }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Prefill from storage
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("@profile");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (!mounted) return;
        if (parsed?.name) setName(String(parsed.name));
        if (parsed?.email) setEmail(String(parsed.email));
      } catch (err) {
        console.warn("Prefill failed:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  const errors = useMemo(() => {
    const e = {};
    if (!trimmedName) e.name = "Name is required";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) e.email = "Email is required";
    else if (!emailPattern.test(trimmedEmail)) e.email = "Enter a valid email";
    return e;
  }, [trimmedName, trimmedEmail]);

  const canSubmit = Object.keys(errors).length === 0;

  async function handleSubmit() {
    if (!canSubmit) return; // why: avoid invalid writes
    const payload = { name: trimmedName, email: trimmedEmail };
    try {
      await AsyncStorage.setItem("@profile", JSON.stringify(payload));
    } catch (err) {
      console.warn("Failed to save onboarding info:", err);
      // continue anyway
    }
    onComplete(payload);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.container}
    >
      <View style={styles.header}>
        <Image
          source={require("../images/Logo.png")}
          style={styles.hero}
          resizeMode="cover"
          accessible
          accessibilityRole="image"
          accessibilityLabel="Welcome illustration"
        />
      </View>

      <View style={styles.form}>
        <View>
          <Text style={styles.intro}>Let us get to know you</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ada Lovelace"
            autoCapitalize="words"
            returnKeyType="next"
            style={[styles.input, errors.name && styles.inputError]}
            accessibilityLabel="Your name"
          />
          {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="ada@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            style={[styles.input, errors.email && styles.inputError]}
            accessibilityLabel="Your email"
          />
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSubmit }}
          style={({ pressed }) => [
            styles.button,
            !canSubmit && styles.buttonDisabled,
            pressed && canSubmit && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Next</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

Onboarding.propTypes = {
  onComplete: PropTypes.func,
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 0, paddingTop: 0, backgroundColor: "#fff" },
  header: { padding: 20, marginBottom: 24, backgroundColor: "#eeee" },
  title: { fontSize: 28, fontWeight: "700", color: "#111827" },
  subtitle: { marginTop: 4, fontSize: 14, color: "#6B7280" },
  intro: { marginTop: 20, fontSize: 30, color: "#6B7280", marginBottom: 50 },
  form: { gap: 16, paddingHorizontal: 24 },
  field: { marginBottom: 12 },
  label: { marginBottom: 6, fontSize: 14, fontWeight: "600", color: "#374151" },
  input: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: "#111827", backgroundColor: "#fff",
  },
  inputError: { borderColor: "#EF4444" },
  error: { marginTop: 6, fontSize: 12, color: "#EF4444" },
  button: { marginTop: 12, borderRadius: 16, paddingVertical: 14, alignItems: "center", backgroundColor: "#F4CE14" },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { backgroundColor: "#111827" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
