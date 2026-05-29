import { apiClient } from "./client";
import { type NotificationItem } from "../../app/(tabs)/notifications";

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const response = await apiClient.get("/api/notifications");
  return response.data.notifications;
}

export async function fetchUnreadCount(): Promise<number> {
  const response = await apiClient.get("/api/notifications/unread-count");
  return response.data.count;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.patch(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.patch("/api/notifications/read-all");
}
