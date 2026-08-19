import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../config/supabase";
import { AnnouncementPost, Category } from "../data/feed";
import { AuthUser } from "./auth";

type IconName = ComponentProps<typeof Ionicons>["name"];

// Shape of a row in the Supabase `announcements` table
export interface AnnouncementRow {
  id: string;
  author: string;
  avatar_color: string;
  title: string | null;
  body: string;
  category: string;
  banner: { icon: string; label: string; from: string; to: string } | null;
  image_url: string | null;
  likes: number;
  comments: number;
  published_at: string;
}

export interface AnnouncementInput {
  title?: string;
  body: string;
  category: Category;
  imageUrl?: string | null;
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function mapAnnouncement(row: AnnouncementRow): AnnouncementPost {
  return {
    type: "announcement",
    id: row.id,
    author: row.author,
    avatarColor: row.avatar_color,
    time: timeAgo(row.published_at),
    category: row.category as Category,
    title: row.title ?? undefined,
    body: row.body,
    likes: row.likes,
    comments: row.comments,
    banner: row.banner
      ? {
          icon: row.banner.icon as IconName,
          label: row.banner.label,
          from: row.banner.from,
          to: row.banner.to,
        }
      : undefined,
    imageUrl: row.image_url ?? undefined,
  };
}

// Fetch announcements, tagging each with whether the current user liked it.
export async function getAnnouncements(user: AuthUser | null): Promise<AnnouncementPost[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  const rows = (data ?? []) as AnnouncementRow[];

  let likedIds = new Set<string>();
  if (user) {
    const { data: likes, error: likeError } = await supabase
      .from("announcement_likes")
      .select("announcement_id")
      .eq("user_id", user.uid);
    if (!likeError) {
      likedIds = new Set((likes ?? []).map((like) => like.announcement_id));
    }
  }

  return rows.map((row) => ({
    ...mapAnnouncement(row),
    likedByMe: likedIds.has(row.id),
  }));
}

// Toggle the current user's like on an announcement and return the new state.
export async function toggleLike(
  announcementId: string,
  user: AuthUser
): Promise<{ liked: boolean; count: number }> {
  const { data: existing } = await supabase
    .from("announcement_likes")
    .select("announcement_id")
    .eq("announcement_id", announcementId)
    .eq("user_id", user.uid)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("announcement_likes")
      .delete()
      .eq("announcement_id", announcementId)
      .eq("user_id", user.uid);
  } else {
    await supabase
      .from("announcement_likes")
      .insert({ announcement_id: announcementId, user_id: user.uid });
  }

  const { count } = await supabase
    .from("announcement_likes")
    .select("announcement_id", { count: "exact", head: true })
    .eq("announcement_id", announcementId);

  return { liked: !existing, count: count ?? 0 };
}

// ---------- Admin permissions ----------

let adminCache: { uid: string; value: boolean } | null = null;

export async function isAdmin(user: AuthUser): Promise<boolean> {
  if (adminCache && adminCache.uid === user.uid) return adminCache.value;

  const { data, error } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.uid)
    .single();

  const value = !error && data?.is_admin === true;
  adminCache = { uid: user.uid, value };
  return value;
}

export function clearAdminCache(): void {
  adminCache = null;
}

// ---------- Writes (admin only — enforced server-side by RLS) ----------

function payload(input: AnnouncementInput) {
  return {
    title: input.title?.trim() || null,
    body: input.body.trim(),
    category: input.category,
    image_url: input.imageUrl || null,
  };
}

export async function createAnnouncement(
  user: AuthUser,
  input: AnnouncementInput
): Promise<void> {
  const { error } = await supabase.from("announcements").insert({
    ...payload(input),
    author: user.displayName || "Berean AG",
  });
  if (error) throw error;
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput
): Promise<void> {
  const { error } = await supabase
    .from("announcements")
    .update(payload(input))
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Images ----------

export async function uploadAnnouncementImage(
  user: AuthUser,
  uri: string
): Promise<string> {
  const file = await fetch(uri).then((response) => response.blob());
  const extension = uri.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.uid}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage
    .from("announcements")
    .upload(path, file, { contentType: `image/${extension === "jpg" ? "jpeg" : extension}` });

  if (error) throw error;

  const { data } = supabase.storage.from("announcements").getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Comments ----------

export interface AnnouncementComment {
  id: string;
  announcementId: string;
  userId: string;
  author: string;
  content: string;
  createdAt: string;
}

interface CommentRow {
  id: string;
  announcement_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { display_name: string | null; email: string | null } | null;
}

export async function getComments(
  announcementId: string
): Promise<AnnouncementComment[]> {
  const { data, error } = await supabase
    .from("announcement_comments")
    .select("*, profiles(display_name, email)")
    .eq("announcement_id", announcementId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as CommentRow[]).map((row) => ({
    id: row.id,
    announcementId: row.announcement_id,
    userId: row.user_id,
    author: row.profiles?.display_name ?? row.profiles?.email ?? "Member",
    content: row.content,
    createdAt: row.created_at,
  }));
}

export async function addComment(
  announcementId: string,
  user: AuthUser,
  content: string
): Promise<void> {
  const { error } = await supabase
    .from("announcement_comments")
    .insert({ announcement_id: announcementId, user_id: user.uid, content });
  if (error) throw error;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from("announcement_comments").delete().eq("id", commentId);
  if (error) throw error;
}

export async function getCommentCount(announcementId: string): Promise<number> {
  const { count } = await supabase
    .from("announcement_comments")
    .select("id", { count: "exact", head: true })
    .eq("announcement_id", announcementId);
  return count ?? 0;
}
