import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={["#172554", "#1e40af", "#2563eb"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingTop: insets.top + 12 }}
      className="px-5 pb-8"
    >
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="rounded-full bg-white/15 p-2"
        >
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
        </TouchableOpacity>
        <View className="ml-4">
          <Text className="text-2xl font-bold text-white">{title}</Text>
          {subtitle ? (
            <Text className="mt-0.5 text-sm text-white/70">{subtitle}</Text>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}
