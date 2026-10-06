export type DataberryNavId =
  | "dashboard"
  | "email"
  | "projects"
  | "tasks"
  | "teams"
  | "payments"
  | "upcoming"
  | "done";

export interface Transaction {
  id: string;
  name: string;
  category: string;
  amount: string;
  type: "positive" | "negative" | "neutral";
  brand: "starbucks" | "instagram" | "bunch";
}

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  due: string;
  completed: boolean;
}
