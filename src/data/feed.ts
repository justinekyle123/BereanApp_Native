import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type IconName = ComponentProps<typeof Ionicons>["name"];

export const CATEGORIES = [
  "Announcements",
  "Events",
  "Worship",
  "Youth",
  "Prayer",
  "Verse",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface AnnouncementPost {
  type: "announcement";
  id: string;
  author: string;
  avatarColor: string;
  time: string;
  category: Category;
  title?: string;
  body: string;
  likes: number;
  comments: number;
  likedByMe?: boolean;
  banner?: { icon: IconName; label: string; from: string; to: string };
  imageUrl?: string;
}

export interface EventPost {
  type: "event";
  id: string;
  day: string;
  date: string;
  title: string;
  time: string;
  location: string;
  category: "Events";
  description?: string;
  endsAt?: string;
}

export interface VersePost {
  type: "verse";
  id: string;
  text: string;
  reference: string;
  category: "Verse";
}

export type FeedItem = AnnouncementPost | EventPost | VersePost;

// Bundled sample feed — used as the offline fallback when Supabase is
// unreachable (see src/services/feed.ts).
export const FEED_ITEMS: FeedItem[] = [
  {
    type: "announcement",
    id: "a-welcome",
    author: "Berean AG",
    avatarColor: "#0d9488",
    time: "2h ago",
    category: "Announcements",
    title: "Welcome to our new app! 🎉",
    body: "We're excited to launch the new Berean AG app — announcements, events, notes and more, all in one place. Let us know what you think!",
    likes: 24,
    comments: 6,
    banner: {
      icon: "megaphone",
      label: "New app launch",
      from: "#0d9488",
      to: "#115e59",
    },
  },
  {
    type: "event",
    id: "e-sunday",
    day: "SUN",
    date: "Aug 23",
    title: "Sunday Worship Service",
    time: "10:00 AM",
    location: "Main Sanctuary",
    category: "Events",
    description:
      "Join us for a powerful time of worship and the Word. Children's church and youth service run alongside the main service — everyone is welcome!",
  },
  {
    type: "verse",
    id: "v-1",
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11",
    category: "Verse",
  },
  {
    type: "announcement",
    id: "a-sunday",
    author: "Pastor David",
    avatarColor: "#7c3aed",
    time: "6h ago",
    category: "Worship",
    title: "This Sunday: \u201cRooted\u201d",
    body: "Join us this Sunday at 10 AM as we continue our series \u201cRooted\u201d — finding our foundation in Christ. Bring a friend!",
    likes: 18,
    comments: 4,
  },
  {
    type: "announcement",
    id: "a-youth",
    author: "Youth Ministry",
    avatarColor: "#f59e0b",
    time: "1d ago",
    category: "Youth",
    title: "Youth night this Friday",
    body: "Games, worship and fellowship — Friday at 6:30 PM in the Youth Hall. All students are welcome!",
    likes: 12,
    comments: 3,
    banner: {
      icon: "people",
      label: "Youth Night · Fri 6:30 PM",
      from: "#f59e0b",
      to: "#ef4444",
    },
  },
  {
    type: "event",
    id: "e-bible",
    day: "WED",
    date: "Aug 26",
    title: "Midweek Bible Study",
    time: "7:00 PM",
    location: "Fellowship Hall",
    category: "Events",
    description:
      "Dive deeper into Scripture together. This week: practical faith in everyday life. Coffee and fellowship from 6:30 PM.",
  },
  {
    type: "announcement",
    id: "a-prayer",
    author: "Prayer Team",
    avatarColor: "#059669",
    time: "1d ago",
    category: "Prayer",
    body: "Join us Wednesday at 6 AM in the prayer room as we lift up our community in prayer. All are welcome.",
    likes: 9,
    comments: 2,
  },
];
