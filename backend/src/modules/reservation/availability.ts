export const ACTIVE_CAPACITY_STATUSES = ["CONFIRMED", "MODIFIED", "CHECKED_IN"] as const;

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const pad = (value: number) => String(value).padStart(2, "0");
const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export interface ClosureWindow {
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
}

export const getMatchingClosure = <T extends ClosureWindow>(closures: T[], time: string): T | undefined => {
  const timeMinutes = toMinutes(time);
  return closures.find((closure) => {
    if (closure.allDay || !closure.startTime || !closure.endTime) return true;
    return timeMinutes >= toMinutes(closure.startTime) && timeMinutes < toMinutes(closure.endTime);
  });
};

export const DEFAULT_TIME_SLOTS = Array.from({ length: 26 }, (_, index) => {
  const minutes = 9 * 60 + index * 30;
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
});

export const getOpeningTimeSlots = (openingHours: unknown, date: string): string[] => {
  if (!openingHours || typeof openingHours !== "object") return DEFAULT_TIME_SLOTS;
  const day = DAY_KEYS[new Date(`${date}T12:00:00.000Z`).getUTCDay()];
  const value = (openingHours as Record<string, unknown>)[day];
  if (typeof value !== "string") return DEFAULT_TIME_SLOTS;
  if (value.trim().toLowerCase() === "closed") return [];

  const slots = new Set<string>();
  for (const range of value.split(",")) {
    const [start, end] = range.trim().split("-");
    if (!/^\d{2}:\d{2}$/.test(start ?? "") || !/^\d{2}:\d{2}$/.test(end ?? "")) continue;
    for (let minutes = toMinutes(start); minutes < toMinutes(end); minutes += 30) {
      slots.add(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
    }
  }
  return slots.size ? [...slots].sort() : DEFAULT_TIME_SLOTS;
};
