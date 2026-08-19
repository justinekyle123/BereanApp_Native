import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AnnouncementPost } from "../../data/feed";
import { AuthUser } from "../../services/auth";
import { toggleLike } from "../../services/announcements";
import { CommentsModal } from "./CommentsModal";

const cardShadow = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function AnnouncementCard({
  post,
  user,
}: {
  post: AnnouncementPost;
  user: AuthUser | null;
}) {
  const [liked, setLiked] = useState(post.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [likeBusy, setLikeBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  const handleLike = async () => {
    if (!user || likeBusy) return;
    setLikeBusy(true);
    try {
      const result = await toggleLike(post.id, user);
      setLiked(result.liked);
      setLikeCount(result.count);
    } catch {
      // Keep the previous state if the request fails.
    } finally {
      setLikeBusy(false);
    }
  };

  return (
    <View style={cardShadow} className="mx-4 mb-3 overflow-hidden rounded-2xl bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4">
        <View
          style={{ backgroundColor: post.avatarColor }}
          className="h-10 w-10 items-center justify-center rounded-full"
        >
          <Text className="text-sm font-bold text-white">{getInitials(post.author)}</Text>
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[15px] font-semibold text-gray-900">{post.author}</Text>
          <Text className="text-xs text-gray-400">{post.time} · Announcement</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} className="p-1">
          <Ionicons name="ellipsis-horizontal" size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View className="px-4 pt-3">
        {post.title ? (
          <Text className="text-[15px] font-bold text-gray-900">{post.title}</Text>
        ) : null}
        <Text className="mt-1 text-[15px] leading-6 text-gray-700">{post.body}</Text>
      </View>

      {/* Image / banner */}
      {post.imageUrl ? (
        <View className="px-4 pt-3">
          <Image
            source={{ uri: post.imageUrl }}
            className="h-48 w-full rounded-xl"
            resizeMode="cover"
          />
        </View>
      ) : post.banner ? (
        <View className="px-4 pt-3">
          <LinearGradient
            colors={[post.banner.from, post.banner.to]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-32 items-center justify-center rounded-xl"
          >
            <Ionicons name={post.banner.icon} size={28} color="rgba(255,255,255,0.9)" />
            <Text className="mt-2 text-sm font-semibold text-white">{post.banner.label}</Text>
          </LinearGradient>
        </View>
      ) : null}

      {/* Actions */}
      <View className="mt-3 flex-row items-center border-t border-gray-100 px-2 py-1.5">
        <TouchableOpacity
          onPress={handleLike}
          disabled={!user || likeBusy}
          activeOpacity={0.7}
          className="flex-row items-center gap-1.5 rounded-lg px-2 py-1.5"
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={20}
            color={liked ? "#ef4444" : "#6b7280"}
          />
          <Text className={`text-sm font-semibold ${liked ? "text-red-500" : "text-gray-500"}`}>
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setCommentsOpen(true)}
          activeOpacity={0.7}
          className="flex-row items-center gap-1.5 rounded-lg px-2 py-1.5"
        >
          <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
          <Text className="text-sm font-semibold text-gray-500">{commentCount}</Text>
        </TouchableOpacity>

        <View className="flex-1" />

        <TouchableOpacity activeOpacity={0.7} className="rounded-lg p-2">
          <Ionicons name="share-social-outline" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <CommentsModal
        visible={commentsOpen}
        announcementId={post.id}
        user={user}
        onClose={() => setCommentsOpen(false)}
        onCountChange={setCommentCount}
      />
    </View>
  );
}
