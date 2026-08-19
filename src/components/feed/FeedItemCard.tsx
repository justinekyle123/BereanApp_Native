import React from "react";
import { FeedItem } from "../../data/feed";
import { AuthUser } from "../../services/auth";
import { FadeIn } from "../FadeIn";
import { AnnouncementCard } from "./AnnouncementCard";
import { EventCard } from "./EventCard";
import { VerseCard } from "./VerseCard";

export function FeedItemCard({
  item,
  index,
  user,
}: {
  item: FeedItem;
  index: number;
  user: AuthUser | null;
}) {
  return (
    <FadeIn delay={Math.min(index * 60, 300)}>
      {item.type === "announcement" ? (
        <AnnouncementCard post={item} user={user} />
      ) : null}
      {item.type === "event" ? <EventCard event={item} /> : null}
      {item.type === "verse" ? <VerseCard verse={item} /> : null}
    </FadeIn>
  );
}
