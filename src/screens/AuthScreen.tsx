import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
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

const logoShadow = {
  shadowColor: "#042f2e",
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.35,
  shadowRadius: 14,
  elevation: 6,
};

const buttonShadow = {
  shadowColor: "#042f2e",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 10,
  elevation: 5,
};

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "Incorrect email or password.";
  if (/email not confirmed/i.test(message)) return "Please verify your email first.";
  if (/already registered/i.test(message)) return "An account with this email already exists.";
  if (/password should be at least/i.test(message)) return "Password must be at least 6 characters.";
  return message;
}

const inputBase =
  "flex-row items-center rounded-xl border border-white/20 bg-white/10 px-4";

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
    <View className="flex-1 bg-teal-900">
      <LinearGradient
        colors={["#042f2e", "#134e4a", "#0f766e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ paddingTop: insets.top }}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View className="items-center">
            <View
              style={logoShadow}
              className="h-20 w-20 overflow-hidden rounded-3xl border border-white/30 bg-white"
            >
              <Image
                source={require("../../assets/berean.jpg")}
                className="h-full w-full"
                resizeMode="contain"
              />
            </View>
            <Text className="mt-4 text-3xl font-bold text-white">Berean AG</Text>
            <Text className="mt-1.5 text-sm text-white/70">
              Welcome to your church community
            </Text>
          </View>

          {/* Form (glass, no card) */}
          <View className="mt-8">
            {/* Mode toggle */}
            <View className="flex-row rounded-xl bg-white/10 p-1">
              {(["signIn", "signUp"] as const).map((m) => {
                const active = mode === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => switchMode(m)}
                    activeOpacity={0.7}
                    className={`flex-1 rounded-lg py-2.5 ${active ? "bg-white" : ""}`}
                  >
                    <Text
                      className={`text-center text-sm font-semibold ${
                        active ? "text-teal-700" : "text-white/70"
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
                <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.6)" />
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Full name"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  autoCapitalize="words"
                  textContentType="name"
                  className="ml-3 flex-1 py-3.5 text-[15px] text-white"
                />
              </View>
            )}

            <View className={`${inputBase} mt-5`}>
              <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.6)" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                className="ml-3 flex-1 py-3.5 text-[15px] text-white"
              />
            </View>

            <View className={`${inputBase} mt-3`}>
              <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.6)" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor="rgba(255,255,255,0.5)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={mode === "signUp" ? "newPassword" : "password"}
                className="ml-3 flex-1 py-3.5 text-[15px] text-white"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((visible) => !visible)}
                activeOpacity={0.7}
                className="p-1"
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="rgba(255,255,255,0.6)"
                />
              </TouchableOpacity>
            </View>

            {mode === "signIn" && (
              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.7}
                className="mt-3 self-end"
              >
                <Text className="text-sm font-semibold text-white/80">
                  {sendingReset ? "Sending link..." : "Forgot password?"}
                </Text>
              </TouchableOpacity>
            )}

            {error ? <Text className="mt-3 text-sm text-red-300">{error}</Text> : null}
            {message ? <Text className="mt-3 text-sm text-green-300">{message}</Text> : null}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
              style={buttonShadow}
              className="mt-5 items-center justify-center rounded-xl bg-white py-4"
            >
              {loading ? (
                <ActivityIndicator color="#0f766e" />
              ) : (
                <Text className="text-[15px] font-semibold text-teal-700">
                  {mode === "signIn" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </TouchableOpacity>

            <View className="mt-5 flex-row items-center gap-3">
              <View className="h-px flex-1 bg-white/30" />
              <Text className="text-xs text-white/50">Secured by Supabase</Text>
              <View className="h-px flex-1 bg-white/30" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
