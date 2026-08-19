import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VersePost } from "../../data/feed";

export function VerseCard({ verse }: { verse: VersePost }) {
  return (
    <View className="mx-4 mb-3 rounded-2xl bg-teal-50 p-5">
      <View className="flex-row items-center gap-2">
        <Ionicons name="book-outline" size={16} color="#0d9488" />
        <Text className="text-xs font-semibold uppercase tracking-wider text-teal-600">
          Verse of the Day
        </Text>
      </View>
      <Text className="mt-3 text-[15px] italic leading-6 text-gray-700">
        &ldquo;{verse.text}&rdquo;
      </Text>
      <Text className="mt-3 text-right text-sm font-semibold text-teal-600">
        — {verse.reference}
      </Text>
    </View>
  );
}
