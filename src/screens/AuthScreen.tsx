import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { signIn, signUp } from "../services/auth";

type Mode = "signIn" | "signUp";

const cardShadow = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 4,
};

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please verify your email first.";
  if (/already registered/i.test(message)) return "An account with this email already exists.";
  if (/password should be at least/i.test(message)) return "Password must be at least 6 characters.";
  return message;
}

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);
    setMessage(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signUp") {
        const { session } = await signUp(
          email.trim(),
          password,
          displayName.trim() || undefined
        );
        if (!session) {
          setMessage(
            "Account created! Check your inbox to verify your email, then sign in."
          );
          setMode("signIn");
        }
        // With a session, the app switches to the main screens automatically.
      } else {
        await signIn(email.trim(), password);
        // Success — the app switches to the main screens automatically.
      }
    } catch (err) {
      setError(
        friendlyAuthError(err instanceof Error ? err.message : "Something went wrong.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top }}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View className="items-center">
          <View
            className="h-16 w-16 items-center justify-center rounded-2xl bg-blue-600"
            style={{
              shadowColor: "#2563eb",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Ionicons name="library" size={30} color="#ffffff" />
          </View>
          <Text className="mt-4 text-2xl font-bold text-gray-900">Berean AG</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Welcome to your church community
          </Text>
        </View>

        {/* Card */}
        <View style={cardShadow} className="mt-8 rounded-3xl bg-white p-6">
          <Text className="text-2xl font-bold text-gray-900">
            {mode === "signIn" ? "Welcome back" : "Create account"}
          </Text>
          <Text className="mt-1.5 text-sm leading-5 text-gray-500">
            {mode === "signIn"
              ? "Sign in to access your notes, journal and chats."
              : "Your notes and journal will sync to your account."}
          </Text>

          {mode === "signUp" && (
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Full name"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              textContentType="name"
              className="mt-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-900"
            />
          )}

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="emailAddress"
            className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-900"
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType={mode === "signUp" ? "newPassword" : "password"}
            className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-900"
          />

          {error ? <Text className="mt-3 text-sm text-red-600">{error}</Text> : null}
          {message ? <Text className="mt-3 text-sm text-green-600">{message}</Text> : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
            className="mt-5 items-center justify-center rounded-xl bg-blue-600 py-4"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-[15px] font-semibold text-white">
                {mode === "signIn" ? "Sign In" : "Create Account"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => switchMode(mode === "signIn" ? "signUp" : "signIn")}
            activeOpacity={0.7}
            className="mt-4 py-2"
          >
            <Text className="text-center text-sm text-gray-600">
              {mode === "signIn" ? "New here? " : "Already have an account? "}
              <Text className="font-semibold text-blue-600">
                {mode === "signIn" ? "Create an account" : "Sign in"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
