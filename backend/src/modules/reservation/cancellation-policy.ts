import { CANCELLATION_REFUND_HOURS } from "../../config/payments.js";

const getReservationStart = (date: Date, time: string): Date => {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((item) => item.type === type)?.value;
  const localDate = `${part("year")}-${part("month")}-${part("day")}`;
  return new Date(`${localDate}T${time}:00+05:30`);
};

export const getCancellationEligibility = (
  date: Date,
  time: string,
  now = new Date(),
): { hoursUntilReservation: number; fullRefundEligible: boolean } => {
  const hoursUntilReservation = (getReservationStart(date, time).getTime() - now.getTime()) / 3_600_000;
  return {
    hoursUntilReservation,
    fullRefundEligible: hoursUntilReservation >= CANCELLATION_REFUND_HOURS,
  };
};
