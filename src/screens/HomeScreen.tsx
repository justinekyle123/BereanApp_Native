import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { logout } from "../services/auth";
import { UPCOMING_EVENTS } from "../data/events";
import { RootStackParamList } from "../navigation/types";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

// ---------- Data ----------

const QUICK_ACTIONS: Array<{
  id: string;
  label: string;
  icon: IconName;
  iconColor: string;
  iconBg: string;
}> = [
  {
    id: "notes",
    label: "Notes",
    icon: "document-text-outline",
    iconColor: "#2563eb",
    iconBg: "#dbeafe",
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: "calendar-outline",
    iconColor: "#059669",
    iconBg: "#d1fae5",
  },
  {
    id: "events",
    label: "Events",
    icon: "sparkles-outline",
    iconColor: "#7c3aed",
    iconBg: "#ede9fe",
  },
  {
    id: "connect",
    label: "Connect",
    icon: "heart-outline",
    iconColor: "#d97706",
    iconBg: "#fef3c7",
  },
];

const VERSE = {
  text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
  reference: "Jeremiah 29:11",
};

// ---------- Helpers ----------

const cardShadow = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
): string {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return "B";
}

// Fade + slide-in wrapper for smooth section entrances
function FadeIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 450, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ---------- Screen ----------

export function HomeScreen() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  const handleQuickAction = (id: string) => {
    switch (id) {
      case "notes":
        navigation.navigate("Notes");
        break;
      case "schedule":
        navigation.navigate("Schedule");
        break;
      case "events":
        navigation.navigate("Events");
        break;
      default:
        Alert.alert("Coming soon", "Connect is on its way.");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-3 text-base text-gray-500">Loading...</Text>
      </View>
    );
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header */}
        <LinearGradient
          colors={["#172554", "#1e40af", "#2563eb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 16 }}
          className="px-5 pb-16"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="library-outline" size={18} color="rgba(255,255,255,0.9)" />
              <Text className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                Berean AG
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              className="rounded-full bg-white/15 p-2.5"
            >
              <Ionicons name="log-out-outline" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View className="mt-8 flex-row items-center">
            <View className="flex-1">
              <Text className="text-3xl font-bold text-white/90">{getGreeting()}</Text>
              <Text className="text-3xl font-bold text-white">
                {user?.displayName ?? "Welcome back"}
              </Text>
              <Text className="mt-2 text-sm text-white/70">{today}</Text>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-full border-2 border-white/30 bg-white/20">
              <Text className="text-lg font-bold text-white">
                {getInitials(user?.displayName, user?.email)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Verse of the day */}
        <FadeIn delay={0}>
          <View className="-mt-9 px-5">
            <View style={cardShadow} className="rounded-2xl bg-white p-5">
              <View className="flex-row items-center gap-2">
                <Ionicons name="book-outline" size={16} color="#2563eb" />
                <Text className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Verse of the Day
                </Text>
              </View>
              <Text className="mt-3 text-[15px] leading-6 text-gray-700">
                &ldquo;{VERSE.text}&rdquo;
              </Text>
              <Text className="mt-3 text-right text-sm font-semibold text-gray-500">
                — {VERSE.reference}
              </Text>
            </View>
          </View>
        </FadeIn>

        {/* Quick actions */}
        <FadeIn delay={100}>
          <View className="mt-7 px-5">
            <Text className="text-lg font-bold text-gray-900">Quick Actions</Text>
            <View className="mt-3 flex-row flex-wrap justify-between">
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  onPress={() => handleQuickAction(action.id)}
                  activeOpacity={0.7}
                  style={cardShadow}
                  className="mb-3 w-[48%] flex-row items-center rounded-2xl bg-white p-4"
                >
                  <View
                    style={{ backgroundColor: action.iconBg }}
                    className="h-10 w-10 items-center justify-center rounded-xl"
                  >
                    <Ionicons name={action.icon} size={20} color={action.iconColor} />
                  </View>
                  <Text className="ml-3 text-[15px] font-semibold text-gray-800">
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeIn>

        {/* Upcoming events */}
        <FadeIn delay={200}>
          <View className="mt-4 px-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900">Upcoming Events</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Events")}
                activeOpacity={0.7}
              >
                <Text className="text-sm font-semibold text-blue-600">See all</Text>
              </TouchableOpacity>
            </View>
            <View className="mt-3">
              {UPCOMING_EVENTS.map((event) => (
                <TouchableOpacity
                  key={event.id}
                  activeOpacity={0.7}
                  style={cardShadow}
                  className="mb-3 flex-row items-center rounded-2xl bg-white p-4"
                >
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
                    <Text className="text-[10px] font-bold text-white">{event.day}</Text>
                    <Text className="mt-0.5 text-[9px] font-semibold text-white/80">
                      {event.date}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[15px] font-semibold text-gray-900">
                      {event.title}
                    </Text>
                    <Text className="mt-0.5 text-sm text-gray-500">
                      {event.time} · {event.location}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </FadeIn>

        {/* Footer */}
        <FadeIn delay={300}>
          <View className="mt-6 items-center">
            <Text className="text-xs text-gray-400">Berean AG · v1.0.0</Text>
          </View>
        </FadeIn>
      </ScrollView>
    </View>
  );
}
