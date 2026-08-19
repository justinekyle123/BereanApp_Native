import { supabase } from "../../config/supabase";
import { EventPost, FEED_ITEMS, FeedItem, VersePost } from "../data/feed";
import { getAnnouncements } from "./announcements";
import { AuthUser } from "./auth";

// Shape of a row in the Supabase `events` table
interface EventRow {
  id: string;
  title: string;
  description: string | null;
  location: string;
  starts_at: string;
  ends_at: string | null;
}

function mapEvent(row: EventRow): EventPost {
  const start = new Date(row.starts_at);
  return {
    type: "event",
    id: row.id,
    day: start.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
    date: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    title: row.title,
    time: start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    location: row.location || "TBD",
    category: "Events",
    description: row.description ?? undefined,
    endsAt: row.ends_at ?? undefined,
  };
}

const VERSE: VersePost = {
  type: "verse",
  id: "verse-of-the-day",
  text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.",
  reference: "Jeremiah 29:11",
  category: "Verse",
};

export interface FeedResult {
  items: FeedItem[];
  isFallback: boolean;
}

// Build the home feed from Supabase (announcements + upcoming events),
// falling back to the bundled sample data when the cloud is unreachable.
export async function getFeed(user: AuthUser | null): Promise<FeedResult> {
  try {
    const [announcements, eventsRes] = await Promise.all([
      getAnnouncements(user),
      supabase
        .from("events")
        .select("*")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(10),
    ]);

    if (eventsRes.error) throw eventsRes.error;
    const events = (eventsRes.data ?? []).map(mapEvent);

    return { items: [VERSE, ...announcements, ...events], isFallback: false };
  } catch {
    return { items: FEED_ITEMS, isFallback: true };
  }
}
