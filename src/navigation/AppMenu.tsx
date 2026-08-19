import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { logout } from "../services/auth";
import { useAuth } from "../hooks/useAuth";
import { TabParamList } from "./types";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

type MenuItem =
  | { key: string; label: string; icon: IconName; type: "tab"; screen: keyof TabParamList }
  | { key: string; label: string; icon: IconName; type: "stack"; screen: "Schedule" | "Events" };

const MENU_SECTIONS: Array<{ label: string; items: MenuItem[] }> = [
  {
    label: "Main",
    items: [
      { key: "home", label: "Home", icon: "home-outline", type: "tab", screen: "Home" },
      { key: "notes", label: "Notes", icon: "document-text-outline", type: "tab", screen: "Notes" },
      { key: "journal", label: "Journal", icon: "journal-outline", type: "tab", screen: "Journal" },
      { key: "chats", label: "Chats", icon: "chatbubbles-outline", type: "tab", screen: "Chats" },
    ],
  },
  {
    label: "More",
    items: [
      { key: "schedule", label: "Schedule", icon: "calendar-outline", type: "stack", screen: "Schedule" },
      { key: "events", label: "Events", icon: "sparkles-outline", type: "stack", screen: "Events" },
    ],
  },
];

interface MenuContextValue {
  open: (navigation: NavigationProp<ParamListBase>) => void;
}

const MenuContext = createContext<MenuContextValue>({ open: () => {} });

export const useMenu = () => useContext(MenuContext);

interface AppMenuProps {
  navigation: NavigationProp<ParamListBase> | null;
  visible: boolean;
  onClose: () => void;
}

function getInitials(name?: string | null, email?: string | null): string {
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

function AppMenu({ navigation, visible, onClose }: AppMenuProps) {
  const { user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const { width } = useWindowDimensions();
  const panelWidth = width * 0.78;
  const translateX = useRef(new Animated.Value(-panelWidth)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      translateX.setValue(-panelWidth);
      backdropOpacity.setValue(0);
    }
  }, [visible, translateX, backdropOpacity, panelWidth]);

  const handleItem = (item: MenuItem) => {
    onClose();
    if (!navigation) return;
    if (item.type === "tab") {
      navigation.navigate("MainTabs", { screen: item.screen });
    } else {
      navigation.navigate(item.screen);
    }
  };

  const handleLogout = async () => {
    // Close first — the auth gate switches to the sign-in screen on its own.
    onClose();
    setSigningOut(true);
    try {
      await logout();
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    } finally {
      setSigningOut(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: handleLogout },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1">
        <Animated.View
          style={{ opacity: backdropOpacity }}
          className="absolute inset-0 bg-black/40"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={onClose}
            className="flex-1"
          />
        </Animated.View>

        <Animated.View
          style={{
            width: panelWidth,
            transform: [{ translateX }],
            shadowColor: "#0f172a",
            shadowOffset: { width: 4, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 16,
          }}
          className="absolute left-0 top-0 bottom-0 bg-white"
        >
          {/* Panel header */}
          <View className="border-b border-gray-100 px-5 pb-4 pt-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
                  <Ionicons name="library" size={20} color="#ffffff" />
                </View>
                <Text className="text-lg font-bold text-gray-900">Berean AG</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                className="rounded-full bg-gray-100 p-2"
              >
                <Ionicons name="close" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Signed-in user */}
            <View className="mt-4 flex-row items-center gap-3 rounded-xl bg-gray-50 p-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-600">
                <Text className="text-sm font-bold text-white">
                  {getInitials(user?.displayName, user?.email)}
                </Text>
              </View>
              <View className="flex-1">
                <Text
                  className="text-[15px] font-semibold text-gray-900"
                  numberOfLines={1}
                >
                  {user?.displayName ?? "Guest"}
                </Text>
                <Text className="text-xs text-gray-500" numberOfLines={1}>
                  {user?.email ?? "Not signed in"}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu items */}
          <View className="flex-1 px-3 py-2">
            {MENU_SECTIONS.map((section) => (
              <View key={section.label} className="mb-2">
                <Text className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {section.label}
                </Text>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => handleItem(item)}
                    activeOpacity={0.7}
                    className="flex-row items-center gap-3 rounded-xl px-3 py-3.5"
                  >
                    <Ionicons name={item.icon} size={22} color="#374151" />
                    <Text className="text-[15px] font-semibold text-gray-800">
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {/* Logout */}
          <View className="border-t border-gray-100 px-3 py-3">
            <TouchableOpacity
              onPress={confirmLogout}
              disabled={signingOut}
              activeOpacity={0.7}
              className="flex-row items-center gap-3 rounded-xl px-3 py-3.5"
            >
              {signingOut ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Ionicons name="log-out-outline" size={22} color="#dc2626" />
              )}
              <Text className="text-[15px] font-semibold text-red-600">
                {signingOut ? "Signing out..." : "Logout"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [navigation, setNavigation] = useState<NavigationProp<ParamListBase> | null>(null);
  const [visible, setVisible] = useState(false);

  const open = useCallback((nav: NavigationProp<ParamListBase>) => {
    setNavigation(nav);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  return (
    <MenuContext.Provider value={{ open }}>
      {children}
      <AppMenu navigation={navigation} visible={visible} onClose={close} />
    </MenuContext.Provider>
  );
}
