import React from "react";
import { View } from "react-native";
import { ScreenHeader } from "../components/ScreenHeader";
import { EmptyState } from "../components/EmptyState";

export function NotesScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="Notes" subtitle="Your study notes" />
      <EmptyState
        icon="document-text-outline"
        title="No notes yet"
        message="Your sermon and study notes will appear here. Start taking notes during the next service."
      />
    </View>
  );
}
