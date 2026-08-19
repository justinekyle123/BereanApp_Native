import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenHeader } from "../components/ScreenHeader";
import { EmptyState } from "../components/EmptyState";
import { UPCOMING_EVENTS } from "../data/events";

const cardShadow = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

export function EventsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="Events" subtitle="What's happening at Berean AG" />
      {UPCOMING_EVENTS.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No upcoming events"
          message="Check back soon for new events."
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          {UPCOMING_EVENTS.map((event) => (
            <TouchableOpacity
              key={event.id}
              activeOpacity={0.7}
              style={cardShadow}
              className="mb-4 flex-row items-center rounded-2xl bg-white p-4"
            >
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-teal-600">
                <Text className="text-[10px] font-bold text-white">{event.day}</Text>
                <Text className="mt-0.5 text-[9px] font-semibold text-white/80">
                  {event.date}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[15px] font-semibold text-gray-900">{event.title}</Text>
                <Text className="mt-0.5 text-sm text-gray-500">
                  {event.time} · {event.location}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
