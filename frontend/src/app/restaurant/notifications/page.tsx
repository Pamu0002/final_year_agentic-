import { serverFetch } from "@/lib/server/api";
import { NotificationsList } from "@/components/customer/NotificationsList";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  total: number;
  unreadCount: number;
}

export default async function RestaurantNotificationsPage() {
  const result = await serverFetch<NotificationsResponse>("users/me/notifications?limit=50")
    .catch(() => ({ data: [], total: 0, unreadCount: 0 }));

  return (
    <div className="mx-auto max-w-5xl p-5 sm:p-8">
      <NotificationsList initial={result.data} unreadCount={result.unreadCount} audience="restaurant" />
    </div>
  );
}
