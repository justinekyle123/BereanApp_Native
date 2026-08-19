import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthUser } from "../../services/auth";
import {
  AnnouncementComment,
  addComment,
  deleteComment,
  getCommentCount,
  getComments,
  timeAgo,
} from "../../services/announcements";

interface CommentsModalProps {
  visible: boolean;
  announcementId: string;
  user: AuthUser | null;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function CommentsModal({
  visible,
  announcementId,
  user,
  onClose,
  onCountChange,
}: CommentsModalProps) {
  const [comments, setComments] = useState<AnnouncementComment[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setComments(await getComments(announcementId));
      onCountChange(await getCommentCount(announcementId));
    } catch {
      // Ignore — keep whatever we have.
    }
  }, [announcementId, onCountChange]);

  useEffect(() => {
    if (visible) {
      setDraft("");
      setLoading(true);
      refresh().finally(() => setLoading(false));
    }
  }, [visible, refresh]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content || sending || !user) return;

    setSending(true);
    try {
      await addComment(announcementId, user, content);
      setDraft("");
      await refresh();
    } catch {
      Alert.alert("Error", "Could not post your comment.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = (comment: AnnouncementComment) => {
    Alert.alert("Delete comment", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteComment(comment.id);
            await refresh();
          } catch {
            Alert.alert("Error", "Could not delete the comment.");
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="flex-1 bg-black/40"
        />
        <View className="h-[70%] rounded-t-3xl bg-white">
          <View className="mb-1 mt-4 h-1 w-10 self-center rounded-full bg-gray-200" />
          <Text className="px-5 pb-2 text-lg font-bold text-gray-900">
            Comments ({comments.length})
          </Text>

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#0d9488" />
            </View>
          ) : comments.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <Ionicons name="chatbubble-ellipses-outline" size={36} color="#9ca3af" />
              <Text className="mt-3 text-center text-sm text-gray-500">
                No comments yet. Be the first to respond!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
              renderItem={({ item }) => (
                <View className="mb-4 flex-row">
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-teal-600">
                    <Text className="text-xs font-bold text-white">
                      {getInitials(item.author)}
                    </Text>
                  </View>
                  <View className="ml-3 flex-1 rounded-2xl bg-gray-50 px-4 py-2.5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[13px] font-semibold text-gray-900">
                        {item.author}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[11px] text-gray-400">
                          {timeAgo(item.createdAt)}
                        </Text>
                        {user && item.userId === user.uid ? (
                          <TouchableOpacity
                            onPress={() => handleDelete(item)}
                            activeOpacity={0.7}
                            className="p-0.5"
                          >
                            <Ionicons name="trash-outline" size={14} color="#9ca3af" />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                    <Text className="mt-0.5 text-[15px] leading-5 text-gray-700">
                      {item.content}
                    </Text>
                  </View>
                </View>
              )}
            />
          )}

          {/* Composer */}
          <View className="flex-row items-center gap-2 border-t border-gray-100 px-4 py-3 pb-6">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={user ? "Write a comment..." : "Sign in to comment"}
              placeholderTextColor="#9ca3af"
              editable={Boolean(user)}
              multiline
              className="flex-1 max-h-24 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[15px] text-gray-900"
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!user || sending || !draft.trim()}
              activeOpacity={0.8}
              className="h-10 w-10 items-center justify-center rounded-full bg-teal-600"
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={16} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
