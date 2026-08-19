import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { logout } from "../services/auth";

export function HomeScreen() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert("Error", "Failed to logout");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-500">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-600 px-6 pt-12 pb-6">
        <Text className="text-3xl font-bold text-white">Berean AG</Text>
        <Text className="mt-2 text-blue-100">Welcome back!</Text>
      </View>

      {/* User Info */}
      {user && (
        <View className="mx-4 mt-4 rounded-lg bg-gray-50 p-4">
          <Text className="text-lg font-semibold text-gray-800">
            {user.displayName || "User"}
          </Text>
          <Text className="mt-1 text-gray-500">{user.email}</Text>
        </View>
      )}

      {/* Quick Actions */}
      <View className="mx-4 mt-6 flex-row justify-between">
        <TouchableOpacity className="flex-1 mr-2 rounded-lg bg-blue-500 py-4">
          <Text className="text-center text-lg font-semibold text-white">Notes</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-1 ml-2 rounded-lg bg-green-500 py-4">
          <Text className="text-center text-lg font-semibold text-white">Schedule</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View className="mx-4 mt-6">
        <Text className="mb-3 text-xl font-bold text-gray-800">Recent Activity</Text>
        <View className="rounded-lg bg-gray-50 p-4">
          <Text className="text-gray-500">No recent activity</Text>
        </View>
      </View>

      {/* Logout Button */}
      <View className="mt-auto mx-4 mb-8">
        <TouchableOpacity
          onPress={handleLogout}
          className="rounded-lg bg-red-500 py-3"
        >
          <Text className="text-center text-lg font-semibold text-white">Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
