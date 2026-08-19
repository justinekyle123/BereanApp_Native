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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resetPassword, signIn, signUp } from "../services/auth";

type Mode = "signIn" | "signUp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cardShadow = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.25,
  shadowRadius: 20,
  elevation: 8,
};

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please verify your email first.";
  if (/already registered/i.test(message)) return "An account with this email already exists.";
  if (/password should be at least/i.test(message)) return "Password must be at least 6 characters.";
  return message;
}

const inputBase =
  "flex-row items-center rounded-xl border border-gray-200 bg-gray-50 px-4";

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
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

    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signUp") {
        const { session } = await signUp(trimmedEmail, password, displayName.trim() || undefined);
        if (!session) {
          setMessage("Account created! Check your inbox to verify your email, then sign in.");
          setMode("signIn");
        }
        // With a session, the app switches to the main screens automatically.
      } else {
        await signIn(trimmedEmail, password);
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

  const handleForgotPassword = async () => {
    if (sendingReset) return;
    setError(null);
    setMessage(null);

    const trimmedEmail = email.trim();
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError("Enter your email to receive a reset link.");
      return;
    }

    setSendingReset(true);
    try {
      await resetPassword(trimmedEmail);
      setMessage("If an account exists for that email, we've sent a password reset link.");
    } catch (err) {
      setError(
        friendlyAuthError(err instanceof Error ? err.message : "Something went wrong.")
      );
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0f2557", "#1e3a8a", "#1d4ed8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top }}
      className="flex-1"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View className="items-center">
            <View className="h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/15">
              <Ionicons name="library" size={38} color="#ffffff" />
            </View>
            <Text className="mt-4 text-3xl font-bold text-white">Berean AG</Text>
            <Text className="mt-1.5 text-sm text-white/70">
              Welcome to your church community
            </Text>
          </View>

          {/* Card */}
          <View style={cardShadow} className="mt-8 rounded-3xl bg-white p-6">
            {/* Mode toggle */}
            <View className="flex-row rounded-xl bg-gray-100 p-1">
              {(["signIn", "signUp"] as const).map((m) => {
                const active = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => switchMode(m)}
                    activeOpacity={0.7}
                    className={`flex-1 rounded-lg py-2.5 ${active ? "bg-white" : ""}`}
                    style={active ? cardShadow : undefined}
                  >
                    <Text
                      className={`text-center text-sm font-semibold ${
                        active ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {m === "signIn" ? "Sign In" : "Create Account"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {mode === "signUp" && (
              <View className={`${inputBase} mt-5`}>
                <Ionicons name="person-outline" size={18} color="#9ca3af" />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Full name"
                  placeholderTextColor="#9ca3af"
                  autoCapitalize="words"
                  textContentType="name"
                  className="ml-3 flex-1 py-3.5 text-[15px] text-gray-900"
                />
              </View>
            )}

            <View className={`${inputBase} mt-5`}>
              <Ionicons name="mail-outline" size={18} color="#9ca3af" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                className="ml-3 flex-1 py-3.5 text-[15px] text-gray-900"
              />
            </View>

            <View className={`${inputBase} mt-3`}>
              <Ionicons name="lock-closed-outline" size={18} color="#9ca3af" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={mode === "signUp" ? "newPassword" : "password"}
                className="ml-3 flex-1 py-3.5 text-[15px] text-gray-900"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((visible) => !visible)}
                activeOpacity={0.7}
                className="p-1"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9ca3af"
                />
              </TouchableOpacity>
            </View>

            {mode === "signIn" && (
              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.7}
                className="mt-3 self-end"
              >
                <Text className="text-sm font-semibold text-blue-600">
                  {sendingReset ? "Sending link..." : "Forgot password?"}
                </Text>
              </TouchableOpacity>
            )}

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

            <View className="mt-5 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-gray-200" />
              <Text className="text-xs text-gray-400">Secured by Supabase</Text>
              <View className="h-px flex-1 bg-gray-200" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
