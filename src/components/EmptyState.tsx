import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 pb-16">
      <View className="h-20 w-20 items-center justify-center rounded-3xl bg-teal-50">
        <Ionicons name={icon} size={36} color="#0d9488" />
      </View>
      <Text className="mt-5 text-lg font-bold text-gray-900">{title}</Text>
      <Text className="mt-1.5 text-center text-sm leading-5 text-gray-500">{message}</Text>
    </View>
  );
}
