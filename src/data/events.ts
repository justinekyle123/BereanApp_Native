export interface UpcomingEvent {
  id: string;
  day: string;
  date: string;
  title: string;
  time: string;
  location: string;
}

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: "1",
    day: "SUN",
    date: "Aug 23",
    title: "Sunday Worship Service",
    time: "10:00 AM",
    location: "Main Sanctuary",
  },
  {
    id: "2",
    day: "WED",
    date: "Aug 26",
    title: "Midweek Bible Study",
    time: "7:00 PM",
    location: "Fellowship Hall",
  },
];
