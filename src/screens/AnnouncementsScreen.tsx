import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { TopBar } from "../components/TopBar";
import { EmptyState } from "../components/EmptyState";
import { useAuth } from "../hooks/useAuth";
import {
  AnnouncementInput,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  isAdmin,
  updateAnnouncement,
  uploadAnnouncementImage,
} from "../services/announcements";
import { AnnouncementPost, Category } from "../data/feed";

const CATEGORY_OPTIONS: Category[] = ["Announcements", "Worship", "Youth", "Prayer"];

interface ComposerState {
  id?: string;
  title: string;
  body: string;
  category: Category;
  imageUrl?: string; // existing uploaded image
  pickedUri?: string; // new local image not yet uploaded
}

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

export function AnnouncementsScreen() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementPost[]>([]);
  const [admin, setAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setAnnouncements(await getAnnouncements(user));
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    if (user) {
      isAdmin(user)
        .then(setAdmin)
        .catch(() => setAdmin(false));
    }
  }, [user, load]);

  const openNew = () => setComposer({ title: "", body: "", category: "Announcements" });

  const openEdit = (post: AnnouncementPost) =>
    setComposer({
      id: post.id,
      title: post.title ?? "",
      body: post.body,
      category: post.category as Category,
      imageUrl: post.imageUrl,
    });

  const applyPickedUri = (uri: string) =>
    setComposer((current) => (current ? { ...current, pickedUri: uri } : current));

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        applyPickedUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Could not open the photo library.");
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Camera access is needed to take a photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        applyPickedUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Could not open the camera.");
    }
  };

  const handleSave = async () => {
    if (!composer || saving || !user) return;
    const body = composer.body.trim();
    if (!body) return;

    setSaving(true);
    try {
      let imageUrl = composer.imageUrl;
      if (composer.pickedUri) {
        imageUrl = await uploadAnnouncementImage(user, composer.pickedUri);
      }

      const input: AnnouncementInput = {
        title: composer.title,
        body,
        category: composer.category,
        imageUrl,
      };

      if (composer.id) {
        await updateAnnouncement(composer.id, input);
      } else {
        await createAnnouncement(user, input);
      }

      setComposer(null);
      setAnnouncements(await getAnnouncements(user));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      Alert.alert(
        "Could not save",
        /row-level security/i.test(message)
          ? "You don't have permission to post announcements."
          : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!composer?.id || saving) return;
    Alert.alert("Delete announcement", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setSaving(true);
          try {
            await deleteAnnouncement(composer.id!);
            setComposer(null);
            setAnnouncements(await getAnnouncements(user));
          } catch {
            Alert.alert("Error", "Could not delete the announcement.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <TopBar />
      <View className="px-5 pb-3 pt-6">
        <Text className="text-2xl font-bold text-gray-900">Announcements</Text>
        <Text className="mt-0.5 text-sm text-gray-500">
          {admin ? "Post updates for the whole church" : "Latest updates from Berean AG"}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0d9488" />
        </View>
      ) : announcements.length === 0 ? (
        <EmptyState
          icon="megaphone-outline"
          title="No announcements yet"
          message={
            admin
              ? "Tap the + button to post your first announcement."
              : "Check back soon for updates."
          }
        />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={admin ? () => openEdit(item) : undefined}
              activeOpacity={admin ? 0.7 : 1}
              style={cardShadow}
              className="mb-3 rounded-2xl bg-white p-4"
            >
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: item.avatarColor }}
                  className="h-9 w-9 items-center justify-center rounded-full"
                >
                  <Text className="text-xs font-bold text-white">
                    {getInitials(item.author)}
                  </Text>
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-semibold text-gray-900" numberOfLines={1}>
                    {item.title || item.body}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {item.author} · {item.time}
                  </Text>
                </View>
                {admin ? (
                  <TouchableOpacity
                    onPress={() => openEdit(item)}
                    activeOpacity={0.7}
                    className="p-2"
                  >
                    <Ionicons name="pencil" size={18} color="#6b7280" />
                  </TouchableOpacity>
                ) : null}
              </View>
              {item.title ? (
                <Text className="mt-2 text-sm leading-5 text-gray-600" numberOfLines={2}>
                  {item.body}
                </Text>
              ) : null}
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="mt-3 h-36 w-full rounded-xl"
                  resizeMode="cover"
                />
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Compose (admins only) */}
      {admin ? (
        <TouchableOpacity
          onPress={openNew}
          activeOpacity={0.85}
          style={{
            shadowColor: "#0d9488",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
          className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-teal-600"
        >
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      ) : null}

      {/* Composer modal */}
      <Modal
        visible={composer !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setComposer(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setComposer(null)}
            className="flex-1 bg-black/40"
          />
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-200" />
            <Text className="text-lg font-bold text-gray-900">
              {composer?.id ? "Edit Announcement" : "New Announcement"}
            </Text>

            <TextInput
              value={composer?.title}
              onChangeText={(text) =>
                setComposer((current) => (current ? { ...current, title: text } : current))
              }
              placeholder="Title (optional)"
              placeholderTextColor="#9ca3af"
              className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900"
            />

            <TextInput
              value={composer?.body}
              onChangeText={(text) =>
                setComposer((current) => (current ? { ...current, body: text } : current))
              }
              placeholder="What would you like to announce?"
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              className="mt-3 min-h-[110px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] leading-5 text-gray-900"
            />

            {/* Category */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
              className="mt-3"
            >
              {CATEGORY_OPTIONS.map((category) => {
                const active = composer?.category === category;
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() =>
                      setComposer((current) =>
                        current ? { ...current, category } : current
                      )
                    }
                    activeOpacity={0.7}
                    className={`rounded-full border px-3 py-1.5 ${
                      active ? "border-teal-600 bg-teal-600" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Image preview */}
            {composer?.pickedUri || composer?.imageUrl ? (
              <View className="mt-3">
                <Image
                  source={{ uri: composer.pickedUri || composer.imageUrl }}
                  className="h-40 w-full rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() =>
                    setComposer((current) =>
                      current
                        ? { ...current, pickedUri: undefined, imageUrl: undefined }
                        : current
                    )
                  }
                  activeOpacity={0.8}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5"
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : null}

            <View className="mt-3 flex-row gap-2">
              <TouchableOpacity
                onPress={pickImage}
                activeOpacity={0.7}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-50 py-3"
              >
                <Ionicons name="images-outline" size={18} color="#374151" />
                <Text className="text-sm font-semibold text-gray-700">Library</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={takePhoto}
                activeOpacity={0.7}
                className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-50 py-3"
              >
                <Ionicons name="camera-outline" size={18} color="#374151" />
                <Text className="text-sm font-semibold text-gray-700">Camera</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-5 flex-row gap-3">
              {composer?.id ? (
                <TouchableOpacity
                  onPress={handleDelete}
                  activeOpacity={0.7}
                  className="h-12 w-12 items-center justify-center rounded-xl bg-red-50"
                >
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => setComposer(null)}
                activeOpacity={0.7}
                className="flex-1 items-center justify-center rounded-xl bg-gray-100 py-3.5"
              >
                <Text className="text-[15px] font-semibold text-gray-700">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || !composer?.body.trim()}
                activeOpacity={0.7}
                className="flex-1 items-center justify-center rounded-xl bg-teal-600 py-3.5"
              >
                <Text className="text-[15px] font-semibold text-white">
                  {saving ? "Saving..." : "Post"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
