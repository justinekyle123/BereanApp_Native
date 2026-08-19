import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NavigationProp, ParamListBase, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMenu } from "../navigation/AppMenu";

export function TopBar() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const { open } = useMenu();

  return (
    <LinearGradient
      colors={["#172554", "#1e40af", "#2563eb"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={() => open(navigation)}
          activeOpacity={0.7}
          className="rounded-full bg-white/15 p-2.5"
        >
          <Ionicons name="menu" size={20} color="#ffffff" />
        </TouchableOpacity>

        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-lg bg-white/20">
            <Ionicons name="library" size={18} color="#ffffff" />
          </View>
          <Text className="text-base font-bold text-white">Berean AG</Text>
        </View>

        {/* Spacer to balance the hamburger button */}
        <View className="w-10" />
      </View>
    </LinearGradient>
  );
}
