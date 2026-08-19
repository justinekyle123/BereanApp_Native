import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORIES, Category } from "../../data/feed";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const CHIP_ICONS: Record<Category, IconName> = {
  Announcements: "megaphone-outline",
  Events: "calendar-outline",
  Worship: "sparkles-outline",
  Youth: "people-outline",
  Prayer: "heart-outline",
  Verse: "book-outline",
};

interface CategoryChipsProps {
  selected: Category | "All";
  onSelect: (category: Category | "All") => void;
}

const ALL_CATEGORIES: Array<Category | "All"> = ["All", ...CATEGORIES];

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
      className="flex-grow-0"
    >
      {ALL_CATEGORIES.map((category) => {
        const active = selected === category;
        return (
          <TouchableOpacity
            key={category}
            onPress={() => onSelect(category)}
            activeOpacity={0.7}
            className={`flex-row items-center gap-1.5 rounded-full border px-3.5 py-2 ${
              active ? "border-teal-600 bg-teal-600" : "border-gray-200 bg-white"
            }`}
          >
            <Ionicons
              name={category === "All" ? "apps-outline" : CHIP_ICONS[category]}
              size={14}
              color={active ? "#ffffff" : "#6b7280"}
            />
            <Text
              className={`text-[13px] font-semibold ${
                active ? "text-white" : "text-gray-600"
              }`}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
