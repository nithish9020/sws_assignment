import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from "react-native";
import {
  Text,
  useTheme,
  Card,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

// Placeholder: will be connected to backend notifications API in Phase 3
type NotificationItem = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    // Phase 3: will call GET /api/notifications
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "upload_complete":
        return "check-circle-outline";
      case "upload_failed":
        return "alert-circle-outline";
      case "bulk_upload_complete":
        return "cloud-check-outline";
      default:
        return "bell-outline";
    }
  };

  const colorForType = (type: string) => {
    switch (type) {
      case "upload_complete":
      case "bulk_upload_complete":
        return "#22C55E";
      case "upload_failed":
        return "#EF4444";
      default:
        return colors.primary;
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <Card
      style={[
        styles.notifCard,
        !item.read && { borderLeftWidth: 3, borderLeftColor: colors.primary },
      ]}
      mode="elevated"
    >
      <Card.Content style={styles.notifContent}>
        <View
          style={[
            styles.notifIcon,
            { backgroundColor: colorForType(item.type) + "1A" },
          ]}
        >
          <MaterialCommunityIcons
            name={iconForType(item.type) as any}
            size={22}
            color={colorForType(item.type)}
          />
        </View>
        <View style={styles.notifInfo}>
          <Text
            variant="bodyMedium"
            style={{ fontWeight: item.read ? "400" : "600" }}
          >
            {item.message}
          </Text>
          <Text variant="bodySmall" style={{ color: "#9AABBA", marginTop: 2 }}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {notifications.length > 0 && (
        <View style={styles.headerRow}>
          <Text variant="bodySmall" style={{ color: "#6B7B8D" }}>
            {notifications.filter((n) => !n.read).length} unread
          </Text>
          <Button
            mode="text"
            compact
            onPress={() => {
              // Phase 3: PATCH /api/notifications/read-all
            }}
            textColor={colors.primary}
          >
            Mark all read
          </Button>
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: colors.primaryContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={48}
              color="#CBD5E1"
            />
          </View>
          <Text
            variant="titleSmall"
            style={{ color: "#6B7B8D", marginTop: 16 }}
          >
            No notifications yet
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: "#9AABBA", marginTop: 4, textAlign: "center" }}
          >
            Upload 4+ files to trigger one
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  notifCard: {
    marginBottom: 10,
    borderRadius: 12,
  },
  notifContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  notifInfo: {
    flex: 1,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
