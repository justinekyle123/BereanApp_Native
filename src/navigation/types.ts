import { NavigatorScreenParams } from "@react-navigation/native";
import { EventPost } from "../data/feed";

export type TabParamList = {
  Home: undefined;
  Announcements: undefined;
  Journal: undefined;
  Chats: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  Events: undefined;
  Schedule: undefined;
  EventDetails: { event: EventPost };
};
