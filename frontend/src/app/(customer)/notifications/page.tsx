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

export default async function NotificationsPage() {
  const result = await serverFetch<NotificationsResponse>(
    "users/me/notifications?limit=50"
  ).catch(() => ({ data: [], total: 0, unreadCount: 0 }));

  return (
    <main className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.06),transparent_32%)]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <NotificationsList
          initial={result.data}
          unreadCount={result.unreadCount}
        />
      </div>
    </main>
  );
}
