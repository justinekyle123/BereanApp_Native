import React from "react";
import { Text, View } from "react-native";
import { TopBar } from "../components/TopBar";
import { EmptyState } from "../components/EmptyState";

export function ChatsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <TopBar />
      <View className="px-5 pb-3 pt-6">
        <Text className="text-2xl font-bold text-gray-900">Chats</Text>
        <Text className="mt-0.5 text-sm text-gray-500">Conversations with your community</Text>
      </View>
      <EmptyState
        icon="chatbubbles-outline"
        title="No conversations yet"
        message="Start a conversation with your community."
      />
    </View>
  );
}
