import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { TopBar } from "../components/TopBar";
import { CategoryChips } from "../components/feed/CategoryChips";
import { FeedItemCard } from "../components/feed/FeedItemCard";
import { useAuth } from "../hooks/useAuth";
import { FeedResult, getFeed } from "../services/feed";
import { Category, FEED_ITEMS, FeedItem } from "../data/feed";

export function HomeScreen() {
  const { user, loading } = useAuth();
  const [category, setCategory] = useState<Category | "All">("All");
  const [feed, setFeed] = useState<FeedResult | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    getFeed(user).then((result) => {
      if (active) setFeed(result);
    });
    return () => {
      active = false;
    };
  }, [user]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setFeed(await getFeed(user));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || feed === null) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#0d9488" />
        <Text className="mt-3 text-base text-gray-500">Loading...</Text>
      </View>
    );
  }

  const { items, isFallback } = feed;
  const filtered =
    category === "All"
      ? items
      : items.filter((item) => item.category === category);

  return (
    <View className="flex-1 bg-gray-50">
      <TopBar />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0d9488"
            colors={["#0d9488"]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Greeting hero — name only, no greeting text */}
            {user?.displayName ? (
              <LinearGradient
                colors={["#134e4a", "#0f766e", "#14b8a6"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-5 pb-8 pt-5"
              >
                <Text className="text-2xl font-bold text-white">
                  {user.displayName}
                </Text>
              </LinearGradient>
            ) : null}

            <CategoryChips selected={category} onSelect={setCategory} />

            {isFallback ? (
              <View className="mx-4 mt-1 flex-row items-center gap-2 rounded-lg bg-amber-50 px-3 py-2">
                <Ionicons name="cloud-offline-outline" size={14} color="#b45309" />
                <Text className="text-xs font-medium text-amber-700">
                  Offline — showing sample feed
                </Text>
              </View>
            ) : null}

            {filtered.length === 0 ? (
              <Text className="px-5 py-6 text-center text-sm text-gray-500">
                No posts in this category yet.
              </Text>
            ) : null}
          </View>
        }
        renderItem={({ item, index }) => (
          <FeedItemCard item={item} index={index} user={user} />
        )}
      />
    </View>
  );
}
