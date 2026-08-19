import "./global.css";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "./src/screens/HomeScreen";
import { NotesScreen } from "./src/screens/NotesScreen";
import { JournalScreen } from "./src/screens/JournalScreen";
import { ChatsScreen } from "./src/screens/ChatsScreen";
import { EventsScreen } from "./src/screens/EventsScreen";
import { ScheduleScreen } from "./src/screens/ScheduleScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { MenuProvider } from "./src/navigation/AppMenu";
import { useAuth } from "./src/hooks/useAuth";
import { RootStackParamList, TabParamList } from "./src/navigation/types";

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(focused: IconName, unfocused: IconName) {
  return ({ focused: isFocused, color, size }: {
    focused: boolean;
    color: string;
    size: number;
  }) => (
    <Ionicons name={isFocused ? focused : unfocused} size={size} color={color} />
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarStyle: { backgroundColor: "#ffffff", borderTopColor: "#e5e7eb" },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: tabIcon("home", "home-outline"),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{
          tabBarLabel: "Notes",
          tabBarIcon: tabIcon("document-text", "document-text-outline"),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={JournalScreen}
        options={{
          tabBarLabel: "Journal",
          tabBarIcon: tabIcon("journal", "journal-outline"),
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
        options={{
          tabBarLabel: "Chats",
          tabBarIcon: tabIcon("chatbubbles", "chatbubbles-outline"),
        }}
      />
    </Tab.Navigator>
  );
}

function MainNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f9fafb" },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Events" component={EventsScreen} />
      <Stack.Screen name="Schedule" component={ScheduleScreen} />
    </Stack.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <AuthScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <MainNavigator />
      <StatusBar style="light" />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <MenuProvider>
          <Root />
        </MenuProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
