import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "react-native-paper";

export default function TabsLayout() {
  const { colors } = useTheme();

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
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
