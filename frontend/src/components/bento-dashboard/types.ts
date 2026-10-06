export type NavItemId =
  | "dashboard"
  | "email"
  | "projects"
  | "tasks"
  | "teams"
  | "payments"
  | "upcoming"
  | "done";

export interface NavItem {
  id: NavItemId;
  label: string;
  badge?: string | number;
}

export interface TransactionItem {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: "positive" | "negative" | "pending";
  brand: string;
  iconBg: string;
  iconColor: string;
}

export interface UpcomingTask {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

export interface ProjectSummary {
  activeCount: number;
  completedTasks: number;
  totalTasks: number;
}

export interface UploadSummary {
  fileCount: number;
  totalSize: string;
  recentType: string;
}

export interface MediaSummary {
  videoCount: number;
  audioCount: number;
  lastPlayed: string;
}
