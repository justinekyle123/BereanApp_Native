import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EventPost } from "../../data/feed";

const cardShadow = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

export function EventCard({ event }: { event: EventPost }) {
  const [reminded, setReminded] = useState(false);

  return (
    <View style={cardShadow} className="mx-4 mb-3 rounded-2xl bg-white p-4">
      <View className="flex-row items-center">
        <View className="h-14 w-14 items-center justify-center rounded-xl bg-teal-600">
          <Text className="text-[11px] font-bold text-white">{event.day}</Text>
          <Text className="mt-0.5 text-[10px] font-semibold text-white/80">{event.date}</Text>
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[15px] font-bold text-gray-900">{event.title}</Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={14} color="#6b7280" />
              <Text className="text-sm text-gray-500">{event.time}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={14} color="#6b7280" />
              <Text className="text-sm text-gray-500">{event.location}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-3 border-t border-gray-100 pt-3">
        <TouchableOpacity
          onPress={() => setReminded((value) => !value)}
          activeOpacity={0.8}
          className={`items-center justify-center rounded-xl py-2.5 ${
            reminded ? "border border-green-200 bg-green-50" : "bg-teal-600"
          }`}
        >
          {reminded ? (
            <Text className="text-sm font-semibold text-green-700">✓ Reminded</Text>
          ) : (
            <Text className="text-sm font-semibold text-white">Remind me</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
