import React from "react";
import { View } from "react-native";
import { ScreenHeader } from "../components/ScreenHeader";
import { EmptyState } from "../components/EmptyState";

export function ScheduleScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <ScreenHeader title="Schedule" subtitle="Service times & events" />
      <EmptyState
        icon="calendar-outline"
        title="No schedule yet"
        message="Your upcoming services and commitments will show up here."
      />
    </View>
  );
}
