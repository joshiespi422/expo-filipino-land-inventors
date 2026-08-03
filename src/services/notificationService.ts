import api from "./api";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  actionType: string;
  route?: string;
  extraData?: Record<string, any>;
  timestamp: string;
  isRead: boolean;
}

export const getNotifications = async (): Promise<NotificationItem[]> => {
  const res = await api.get("/notifications");
  return res.data.data;
};

export const markNotificationAsRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.post("/notifications/read-all");
};
