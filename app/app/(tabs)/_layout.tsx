import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";
import { useState, useEffect } from "react";
import { fetchUnreadCount } from "../../src/api/notifications";
import { wsClient } from "../../src/api/ws";

export default function TabsLayout() {
  const { colors } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread count and keep it in sync
    const refreshCount = () => {
      fetchUnreadCount().then(setUnreadCount).catch(console.error);
    };

    // Initial fetch
    refreshCount();

    // Poll every 5s to stay in sync (e.g. after mark-all-read)
    const interval = setInterval(refreshCount, 5000);

    // Also bump immediately on new WS notifications
    const unsubscribe = wsClient.subscribe((event) => {
      if (event.event === "notification") {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#9AABBA",
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.outline,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomColor: colors.outline,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.onBackground,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Upload",
          tabBarLabel: "Upload",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="upload" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: "Library",
          tabBarLabel: "Library",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="folder-open" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarLabel: "Alerts",
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
