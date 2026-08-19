import React from "react";
import { Text, View } from "react-native";
import { TopBar } from "../components/TopBar";
import { EmptyState } from "../components/EmptyState";

export function JournalScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <TopBar />
      <View className="px-5 pb-3 pt-6">
        <Text className="text-2xl font-bold text-gray-900">Journal</Text>
        <Text className="mt-0.5 text-sm text-gray-500">Your personal reflections</Text>
      </View>
      <EmptyState
        icon="journal-outline"
        title="No journal entries yet"
        message="Your reflections and prayer notes will appear here."
      />
    </View>
  );
}
