import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { TopBar } from "../components/TopBar";
import { EmptyState } from "../components/EmptyState";
import { useAuth } from "../hooks/useAuth";
import {
  Note,
  createNote,
  deleteNote,
  ensureUserRow,
  getNotes,
  updateNote,
} from "../services/notes";

interface EditorState {
  id?: string;
  title: string;
  content: string;
}

const cardShadow = {
  shadowColor: "#0f172a",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 2,
};

// SQLite timestamps are "YYYY-MM-DD HH:MM:SS" in UTC
function formatDate(value: string): string {
  const date = new Date(value.replace(" ", "T") + "Z");
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function NotesScreen() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    const userId = await ensureUserRow(user);
    setNotes(await getNotes(userId));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const openNewNote = () => setEditor({ title: "", content: "" });

  const openEditNote = (note: Note) =>
    setEditor({ id: note.id, title: note.title, content: note.content });

  const handleSave = async () => {
    if (!editor || saving) return;
    const title = editor.title.trim();
    if (!title) return;

    setSaving(true);
    try {
      const userId = await ensureUserRow(user);
      if (editor.id) {
        await updateNote(editor.id, title, editor.content.trim());
      } else {
        await createNote(userId, title, editor.content.trim());
      }
      setEditor(null);
      setNotes(await getNotes(userId));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editor?.id || saving) return;

    setSaving(true);
    try {
      await deleteNote(editor.id);
      setEditor(null);
      const userId = await ensureUserRow(user);
      setNotes(await getNotes(userId));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <TopBar />
      <View className="px-5 pb-3 pt-6">
        <Text className="text-2xl font-bold text-gray-900">Notes</Text>
        <Text className="mt-0.5 text-sm text-gray-500">Your study notes</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : notes.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No notes yet"
          message="Tap the + button to write your first note."
        />
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 96 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => openEditNote(item)}
              activeOpacity={0.7}
              style={cardShadow}
              className="mb-3 rounded-2xl bg-white p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-[15px] font-semibold text-gray-900">
                  {item.title}
                </Text>
                <Text className="ml-2 text-xs text-gray-400">
                  {formatDate(item.updatedAt || item.createdAt)}
                </Text>
              </View>
              {item.content ? (
                <Text
                  className="mt-1 text-sm leading-5 text-gray-500"
                  numberOfLines={2}
                >
                  {item.content}
                </Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add note button */}
      <TouchableOpacity
        onPress={openNewNote}
        activeOpacity={0.85}
        style={{
          shadowColor: "#2563eb",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-600"
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Note editor modal */}
      <Modal
        visible={editor !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEditor(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setEditor(null)}
            className="flex-1 bg-black/40"
          />
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="mb-4 h-1 w-10 self-center rounded-full bg-gray-200" />
            <Text className="text-lg font-bold text-gray-900">
              {editor?.id ? "Edit Note" : "New Note"}
            </Text>

            <TextInput
              value={editor?.title}
              onChangeText={(text) =>
                setEditor((current) =>
                  current ? { ...current, title: text } : current
                )
              }
              placeholder="Title"
              placeholderTextColor="#9ca3af"
              className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-900"
            />

            <TextInput
              value={editor?.content}
              onChangeText={(text) =>
                setEditor((current) =>
                  current ? { ...current, content: text } : current
                )
              }
              placeholder="Write your note..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              className="mt-3 min-h-[120px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] leading-5 text-gray-900"
            />

            <View className="mt-5 flex-row gap-3">
              {editor?.id ? (
                <TouchableOpacity
                  onPress={handleDelete}
                  activeOpacity={0.7}
                  className="h-12 w-12 items-center justify-center rounded-xl bg-red-50"
                >
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                onPress={() => setEditor(null)}
                activeOpacity={0.7}
                className="flex-1 items-center justify-center rounded-xl bg-gray-100 py-3.5"
              >
                <Text className="text-[15px] font-semibold text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving || !editor?.title.trim()}
                activeOpacity={0.7}
                className="flex-1 items-center justify-center rounded-xl bg-blue-600 py-3.5"
              >
                <Text className="text-[15px] font-semibold text-white">
                  {saving ? "Saving..." : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
